/** 4-companeros.js — Adivina un jugador que ha pasado por el mismo club que estos 4.
 *  Nota: NO afirmamos que jugaran a la vez (no manejamos rangos de fechas). */
const KEY='furbol.4comp';
let target, four, streak=0, gameOver=false, selectedId=null;
const quadEl=document.getElementById('quad'), inp=document.getElementById('cc-input'),
  sug=document.getElementById('sug-box'), endEl=document.getElementById('end'),
  chipWins=document.getElementById('chip-wins'), chipStreak=document.getElementById('chip-streak');

function loadS(){return FurbolUI.loadStats(KEY,{wins:0,best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){const s=loadS(); chipWins.textContent=s.wins; chipStreak.textContent=s.best;}

function clubsOf(p){ return new Set([p.club, ...(p.formerClubs||[])]); }

async function init(){
  await FutbolDB.load();
  // Buscar un jugador con suficiente carrera para tener 4 compañeros distintos
  let tries=0, mates=[];
  while(tries++<200){
    target = FutbolDB.random();
    const tClubs = clubsOf(target);
    if(tClubs.size < 2) continue;
    // Buscar 4 jugadores distintos a target que tengan AL MENOS un club en común con target
    const candidates = FutbolDB.getAll().filter(p=>{
      if(p.id===target.id) return false;
      const pClubs = clubsOf(p);
      for(const c of pClubs) if(tClubs.has(c)) return true;
      return false;
    });
    if(candidates.length<4) continue;
    mates = FurbolUI.shuffle(candidates).slice(0,4);
    break;
  }
  four = mates;
  gameOver=false; endEl.style.display='none';
  render();
  refresh();
  inp.value=''; selectedId=null; inp.disabled=false; inp.focus();
  console.log('🤫 target:', target.name, '— mates:', mates.map(p=>p.name));
}
window.init=init;

function render(){
  quadEl.innerHTML = four.map(p=>`
    <div class="player-tile">${FurbolUI.photo(p,64)}<div class="pname">${p.name}</div></div>
  `).join('');
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
  // Aceptamos cualquier jugador que comparta club con los 4 (puede haber más de uno válido)
  const tClubs = clubsOf(p);
  const ok = four.every(m=>{
    for(const c of clubsOf(m)) if(tClubs.has(c)) return true;
    return false;
  });
  if(ok) reveal(true, p);
  else { inp.value=''; selectedId=null; sug.style.display='none'; }
}

function reveal(won, p=null){
  gameOver=true; inp.disabled=true;
  const s=loadS();
  if(won){ s.wins++; streak++; if(streak>s.best)s.best=streak;  if(window.FurbolAlbum) FurbolAlbum.addPacks(1); } 
  else { streak=0; }
  saveS(s); refresh();
  const shown = won ? p : target;
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML=`<h2>${won?'¡Correcto!':'Una posible respuesta'}</h2>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin:0 0 6px;">Pasó por al menos un club en común con cada uno de los 4 (no necesariamente a la vez).</p>
    <div style="display:flex;gap:14px;align-items:center;justify-content:center;margin:10px 0;">
      ${FurbolUI.photo(shown,72)}
      <div style="text-align:left;"><div style="font-family:var(--font-main);font-weight:800;font-size:1.2rem;">${shown.name}</div></div>
    </div>
    <button class="btn btn--primary" onclick="init()">Siguiente</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);

