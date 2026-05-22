/** pasamela.js — Cadena multijugador local. */
let players=['Tú'], turn=0, category, pool, said, ended;
const setup=document.getElementById('setup'), game=document.getElementById('game'),
  catEl=document.getElementById('cat'), turnLine=document.getElementById('turn-line'),
  inp=document.getElementById('pa-input'), saidEl=document.getElementById('said-list'),
  endEl=document.getElementById('end');

document.getElementById('btn-add').addEventListener('click',()=>{
  const inputs=document.querySelectorAll('.p-input');
  if(inputs.length>=6) return;
  const div=document.createElement('div');
  const inp=document.createElement('input');
  inp.className='p-input'; inp.placeholder=`Nombre ${inputs.length+1}`; inp.value=`Jugador ${inputs.length+1}`;
  document.getElementById('player-inputs').appendChild(inp);
});

document.getElementById('btn-start').addEventListener('click', async ()=>{
  players = [...document.querySelectorAll('.p-input')].map(i=>i.value||'?').filter(n=>n.length);
  if(players.length<2){ alert('Necesitas al menos 2 jugadores'); return; }
  await FutbolDB.load();
  setup.style.display='none'; game.style.display='block';
  start();
});

function start(){
  ended=false; turn=0; said=[];
  // Elegir categoría: nacionalidad / club / liga / posición
  const types=[
    {label:'Jugadores de', key:'nationality', source:FutbolDB.getNationalities()},
    {label:'Jugadores de', key:'club', source:FutbolDB.getClubs()},
    {label:'Jugadores de', key:'league', source:FutbolDB.getLeagues()},
    {label:'Jugadores en posición', key:'position', source:['Portero','Defensa','Centrocampista','Delantero']},
  ];
  let cat, value, tries=0;
  while(tries++<50){
    cat = types[Math.floor(Math.random()*types.length)];
    value = cat.source[Math.floor(Math.random()*cat.source.length)];
    pool = FutbolDB.query({[cat.key]: value});
    if(pool.length>=8) break;
  }
  category = {key:cat.key, value};
  catEl.textContent = `${cat.label} ${value}`;
  render();
  endEl.style.display='none'; inp.value=''; inp.focus();
}

function render(){
  turnLine.innerHTML = `Turno de <strong style="color:var(--accent-blue);">${players[turn]}</strong>`;
  saidEl.innerHTML = said.map(p=>`<div class="said-pill">${p.name}</div>`).join('');
}

document.getElementById('btn-go').addEventListener('click', go);
inp.addEventListener('keydown', e=>{ if(e.key==='Enter') go(); });
document.getElementById('btn-pass').addEventListener('click', ()=> lose(players[turn], 'se rinde'));

function go(){
  if(ended) return;
  const v = FurbolUI.normalize(inp.value.trim()); if(!v) return;
  // Buscar en pool no repetido
  const hit = pool.find(p => !said.includes(p) && (FurbolUI.normalize(p.name)===v || FurbolUI.normalize(p.name.split(/\s+/).pop())===v));
  if(!hit){ lose(players[turn], 'falló'); return; }
  said.push(hit); inp.value='';
  if(said.length === pool.length){ winAll(); return; }
  turn = (turn+1) % players.length;
  render();
}

function lose(name, why){
  ended=true;
  endEl.className='end-overlay-common fail';
  endEl.innerHTML = `<h2>${name} ${why}</h2>
    <p style="color:var(--text-secondary);">Llevabais ${said.length} jugadores nombrados.</p>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="location.reload()">Volver a jugar</button>`;
  endEl.style.display='block';
}
function winAll(){
  ended=true;
  endEl.className='end-overlay-common win';
  endEl.innerHTML = `<h2>¡Habéis nombrado a todos! 🎉</h2>
    <p style="color:var(--text-secondary);">${said.length} jugadores acertados.</p>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="location.reload()">Nueva ronda</button>`;
  endEl.style.display='block';
}
