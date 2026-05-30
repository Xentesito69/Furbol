/** carrera-jugador.js — Muestra clubs en orden y adivinas al jugador. */
const KEY='furbol.carrerajug';
let target, careerClubs, streak=0, gameOver=false, selectedId=null;
const careerEl=document.getElementById('career'),inp=document.getElementById('cj-input'),
  sug=document.getElementById('sug-box'),endEl=document.getElementById('end'),
  chipWins=document.getElementById('chip-wins'),chipStreak=document.getElementById('chip-streak');

function loadS(){return FurbolUI.loadStats(KEY,{wins:0,best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){const s=loadS(); chipWins.textContent=s.wins; chipStreak.textContent=s.best;}

async function init(){
  await FutbolDB.load();
  let tries=0;
  do { target = FutbolDB.random(); tries++; }
  while(tries<60 && (!target.formerClubs || target.formerClubs.length<2));
  // formerClubs viene "más reciente → más antiguo". Orden cronológico: invertido + actual.
  careerClubs = [...(target.formerClubs||[])].reverse().concat([target.club]);
  gameOver=false; endEl.style.display='none';
  render();
  refresh();
  inp.value=''; selectedId=null; inp.disabled=false; inp.focus();
  console.log('🤫', target.name, '→', careerClubs);
}
window.init=init;

function render(){
  careerEl.innerHTML = careerClubs.map((c,i)=>{
    const sample = FutbolDB.getAll().find(x=>x.club===c);
    const crestUrl = (sample && FutbolDB.crestOf(sample)) || (FutbolDB.crestByName && FutbolDB.crestByName(c)) || null;
    const crest = crestUrl ? `<img class="crest-mini" src="${crestUrl}" onerror="this.onerror=null;this.style.display='none'">` : '⚽';
    const isLast = i===careerClubs.length-1;
    return `<div class="career-item">${i+1}. ${crest} <span>${c}</span>${isLast?' <span style="color:var(--accent-blue);font-size:0.78rem;margin-left:auto;">actual</span>':''}</div>`;
  }).join('');
}

inp.addEventListener('input',()=>{
  if(gameOver)return;
  const v=inp.value.trim(); selectedId=null;
  if(v.length<2){sug.style.display='none';return;}
  const r=FutbolDB.query({name:v,limit:6});
  if(!r.length){sug.style.display='none';return;}
  sug.innerHTML = r.map(p=>`<div class="sug" data-id="${p.id}" data-name="${p.name}">${FurbolUI.flag(p.nationality,18)}<strong>${p.name}</strong></div>`).join('');
  sug.style.display='block';
});
sug.addEventListener('click',e=>{const it=e.target.closest('.sug');if(!it)return; inp.value=it.dataset.name; selectedId=it.dataset.id; sug.style.display='none';});
inp.addEventListener('keydown',e=>{if(e.key==='Enter')guess();});
document.getElementById('btn-guess').addEventListener('click',guess);
document.getElementById('btn-skip').addEventListener('click',()=>{if(!gameOver) reveal(false);});

function guess(){
  if(gameOver)return;
  let p=null;
  if(selectedId) p=FutbolDB.getAll().find(x=>x.id===selectedId);
  else {const v=inp.value.trim(); if(!v)return; const m=FutbolDB.query({name:v}); if(m.length)p=m[0];}
  if(!p)return;
  if(p.id===target.id) reveal(true);
  else { inp.value=''; selectedId=null; sug.style.display='none'; }
}

function reveal(won){
  gameOver=true; inp.disabled=true;
  const s=loadS();
  if(won){ s.wins++; streak++; if(streak>s.best)s.best=streak;  if(window.FurbolAlbum) FurbolAlbum.addPacks(1); } 
  else { streak=0; }
  saveS(s); refresh();
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML=`<h2>${won?'¡Correcto!':'Era…'}</h2>
    <div style="display:flex;gap:14px;align-items:center;justify-content:center;margin:10px 0;">
      ${FurbolUI.photo(target,72)}
      <div style="text-align:left;"><div style="font-family:var(--font-main);font-weight:800;font-size:1.2rem;">${target.name}</div></div>
    </div>
    <button class="btn btn--primary" onclick="init()">Siguiente</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);

