/** bingo.js — 12 casillas con requisitos, jugadores van apareciendo uno a uno. */
const KEY='furbol.bingo';
const TIME_LIMIT = 120; // 2 minutos
const CELLS = 12;
const CONTINENTS = {
  'Argentina':'Sudamérica','Brasil':'Sudamérica','Uruguay':'Sudamérica','Colombia':'Sudamérica','Ecuador':'Sudamérica','Venezuela':'Sudamérica','Chile':'Sudamérica','Perú':'Sudamérica','Paraguay':'Sudamérica',
  'España':'Europa','Inglaterra':'Europa','Escocia':'Europa','Gales':'Europa','Irlanda':'Europa','Francia':'Europa','Italia':'Europa','Alemania':'Europa','Portugal':'Europa','Países Bajos':'Europa','Bélgica':'Europa','Croacia':'Europa','Serbia':'Europa','Polonia':'Europa','Suiza':'Europa','Austria':'Europa','Hungría':'Europa','Eslovenia':'Europa','Eslovaquia':'Europa','Turquía':'Europa','Georgia':'Europa','Dinamarca':'Europa','Suecia':'Europa','Noruega':'Europa','Finlandia':'Europa','Albania':'Europa','Bosnia y Herzegovina':'Europa','República Checa':'Europa','Ucrania':'Europa',
  'México':'América del Norte','Estados Unidos':'América del Norte','Canadá':'América del Norte',
  'Marruecos':'África','Senegal':'África','Nigeria':'África','Ghana':'África','Egipto':'África','Camerún':'África','Costa de Marfil':'África','Argelia':'África','Túnez':'África','Mali':'África','Burkina Faso':'África','DR Congo':'África','Liberia':'África','Gabón':'África',
  'Japón':'Asia','Corea del Sur':'Asia','Arabia Saudita':'Asia','Australia':'Oceanía',
  'Jamaica':'América del Norte',
};

let mode='easy', cells=[], lives=3, secs, timer, current, drawnPool, gameOver=false;
const boardEl=document.getElementById('board'), drawEl=document.getElementById('draw'),
  livesEl=document.getElementById('lives'), endEl=document.getElementById('end'),
  chipFilled=document.getElementById('chip-filled'), chipTotal=document.getElementById('chip-total'),
  timerEl=document.getElementById('timer');

function loadS(){return FurbolUI.loadStats(KEY,{bestEasy:0,bestHard:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function generateRequirements(){
  const MIN_PLAYERS = 4; // mínimo de jugadores válidos por casilla
  const allPlayers = FutbolDB.getAll().filter(p=>p.league!=='Leyendas');
  const reqs = [];
  const clubs = FurbolUI.shuffle([...new Set(allPlayers.map(p=>p.club))]);
  const nats = FurbolUI.shuffle([...new Set(allPlayers.map(p=>p.nationality))]);
  const conts = FurbolUI.shuffle([...new Set(Object.values(CONTINENTS))]);
  // Reqs por club — solo si al menos MIN_PLAYERS jugadores pueden cubrirla
  for(const c of clubs){
    if(reqs.filter(r=>r.kind==='club').length>=6) break;
    const chk = p => p.club===c || (p.formerClubs||[]).includes(c);
    if(allPlayers.filter(chk).length >= MIN_PLAYERS)
      reqs.push({ kind:'club', label:c, icon:'🏟️', check: chk });
  }
  // Reqs por nacionalidad
  for(const n of nats){
    if(reqs.filter(r=>r.kind==='nat').length>=4) break;
    const chk = p => p.nationality===n;
    if(allPlayers.filter(chk).length >= MIN_PLAYERS)
      reqs.push({ kind:'nat', label:n, icon:'🌍', check: chk });
  }
  // Reqs por continente
  for(const ct of conts){
    if(reqs.filter(r=>r.kind==='cont').length>=2) break;
    const chk = p => CONTINENTS[p.nationality]===ct;
    if(allPlayers.filter(chk).length >= MIN_PLAYERS)
      reqs.push({ kind:'cont', label:ct, icon:'🗺️', check: chk });
  }
  return FurbolUI.shuffle(reqs).slice(0,CELLS);
}

async function init(){
  await FutbolDB.load();
  cells = generateRequirements().map((r,i)=>({...r, idx:i, locked:false, player:null}));
  lives = 3; gameOver=false;
  drawnPool = FurbolUI.shuffle(FutbolDB.getAll().filter(p=>p.league!=='Leyendas'));
  current = null;
  secs = TIME_LIMIT;
  clearInterval(timer);
  endEl.style.display='none';
  chipTotal.textContent = CELLS;
  renderLives();
  renderBoard();
  drawNext();
  timer = setInterval(()=>{ secs--; updateTimer(); if(secs<=0) finish(false); }, 1000);
  updateTimer();
}
window.init=init;

function renderLives(){
  if(mode==='easy'){ livesEl.innerHTML=''; return; }
  livesEl.innerHTML='';
  for(let i=0;i<3;i++){
    const s=document.createElement('span');
    s.className='life'+(i<(3-lives)?' lost':'');
    s.textContent='❤️'; livesEl.appendChild(s);
  }
}

function updateTimer(){
  const m=Math.floor(secs/60), s=secs%60;
  timerEl.textContent = `${m}:${String(s).padStart(2,'0')}`;
  timerEl.classList.remove('warning','danger');
  if(secs<=15) timerEl.classList.add('danger');
  else if(secs<=45) timerEl.classList.add('warning');
}

function reqVisual(c){
  if(c.kind==='nat'){
    const flag = FurbolUI.flag(c.label, 28);
    return `${flag}<div class="req-text" style="margin-top:2px;">${c.label}</div>`;
  }
  if(c.kind==='club'){
    // Buscar escudo en la BD
    const sample = FutbolDB.getAll().find(p => p.club === c.label);
    const crestUrl = sample ? FutbolDB.crestOf(sample) : null;
    const visual = crestUrl
      ? `<img src="${crestUrl}" onerror="this.onerror=null;this.style.display='none'" style="width:32px;height:32px;object-fit:contain;">`
      : `<span style="font-size:1.4rem;">${c.icon}</span>`;
    return `${visual}<div class="req-text" style="margin-top:2px;">${c.label}</div>`;
  }
  if(c.kind==='cont'){
    return `<span style="font-size:1.6rem;">${c.icon}</span><div class="req-text" style="margin-top:2px;">${c.label}</div>`;
  }
  return `<span class="req-icon">${c.icon}</span><span class="req-text">${c.label}</span>`;
}

function renderBoard(){
  boardEl.style.gridTemplateColumns = 'repeat(4,1fr)';
  boardEl.innerHTML = cells.map(c=>{
    if(c.locked && c.player){
      return `<div class="bingo-cell locked"><img class="face" src="${FutbolDB.photoOf(c.player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(c.player)}'"><div style="font-size:0.65rem;">${c.player.name.split(' ').slice(-1)[0]}</div></div>`;
    }
    return `<div class="bingo-cell" data-idx="${c.idx}">${reqVisual(c)}</div>`;
  }).join('');
  boardEl.querySelectorAll('.bingo-cell:not(.locked)').forEach(el=>{
    el.addEventListener('click', ()=>tryPlace(parseInt(el.dataset.idx,10)));
  });
  chipFilled.textContent = cells.filter(c=>c.locked).length;
}

function drawNext(){
  if(gameOver) return;
  if(drawnPool.length===0){ drawEl.innerHTML='<p style="color:var(--text-muted);">Sin más jugadores</p>'; return; }

  // Casillas libres
  const openCells = cells.filter(c => !c.locked);

  // Selección ponderada: jugadores que cumplen alguna casilla libre tienen 2.5x peso
  let weights = drawnPool.map(p => openCells.some(c => c.check(p)) ? 2.5 : 1);
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  let idx = 0;
  for (; idx < weights.length - 1; idx++) {
    r -= weights[idx];
    if (r <= 0) break;
  }

  current = drawnPool.splice(idx, 1)[0];
  drawEl.innerHTML = `
    <img class="draw-photo" src="${FutbolDB.photoOf(current)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(current)}'" alt="${current.name}">
    <div class="draw-name">${current.name}</div>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:6px;">Pulsa una casilla que cumpla, o pasa.</p>
    <div class="draw-actions">
      <button class="btn btn--outline" id="btn-pass" style="padding:8px 18px;">Pasar</button>
    </div>`;
  document.getElementById('btn-pass').addEventListener('click', ()=>{ if(!gameOver){ drawNext(); }});
}

function tryPlace(cellIdx){
  if(gameOver || !current) return;
  const cell = cells[cellIdx];
  if(cell.locked) return;
  if(cell.check(current)){
    cell.locked = true; cell.player = current;
    renderBoard();
    if(cells.every(c=>c.locked)) { finish(true); return; }
    drawNext();
  } else {
    // Wrong
    if(mode==='hard'){
      lives--; renderLives();
      if(lives<=0) finish(false);
      else drawNext();
    } else {
      // Modo fácil: solo descarta este jugador
      drawNext();
    }
  }
}

function finish(won){
  gameOver=true; clearInterval(timer);
  const filled = cells.filter(c=>c.locked).length;
  const s=loadS();
  if(mode==='easy' && filled > (s.bestEasy||0)) s.bestEasy=filled;
  if(mode==='hard' && filled > (s.bestHard||0)) s.bestHard=filled;
  if(won && window.FurbolAlbum) FurbolAlbum.addPacks(1); saveS(s); endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Bingo completo! 🎉':(lives<=0 && mode==='hard'?'Sin vidas':'¡Tiempo!')}</h2>
    <p style="color:var(--text-secondary);">Rellenadas: <strong>${filled}</strong>/${CELLS}</p>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Volver a jugar</button>`;
  endEl.style.display='block';
}

document.querySelectorAll('.level-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.level-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  mode = b.dataset.mode;
  init();
}));
document.addEventListener('DOMContentLoaded', init);

