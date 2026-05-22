/** draft.js — 11 rondas. Cada ronda 2 jugadores, escoge uno. */
const KEY='furbol.draft';
let pairs, round, picked, value;
const duel=document.getElementById('duel'), pickedEl=document.getElementById('picked'),
  chipRound=document.getElementById('chip-round'), chipValue=document.getElementById('chip-value'),
  endEl=document.getElementById('end');

function loadS(){return FurbolUI.loadStats(KEY,{best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  const pool = FutbolDB.getAll().filter(p=>p.league!=='Leyendas' && p.marketValue>0);
  pairs = [];
  const used = new Set();
  while(pairs.length<11){
    const [a,b] = FurbolUI.shuffle(pool.filter(p=>!used.has(p.id))).slice(0,2);
    if(!a||!b) break;
    pairs.push([a,b]);
    used.add(a.id); used.add(b.id);
  }
  round=0; picked=[]; value=0; endEl.style.display='none';
  render();
}
window.init=init;

function render(){
  chipRound.textContent = `${round+1}/${pairs.length}`;
  chipValue.textContent = FutbolDB.formatValue(value);
  pickedEl.innerHTML = picked.map(p=>`
    <div class="picked-tile">${FurbolUI.photo(p,32)}<div>${p.name.split(' ').slice(-1)[0]}</div></div>
  `).join('');
  if(round>=pairs.length){ finish(); return; }
  const [a,b] = pairs[round];
  duel.innerHTML = `${card(a)}<div class="vs-badge">VS</div>${card(b)}`;
  duel.querySelectorAll('.duel-card').forEach(c=>c.addEventListener('click',()=>pick(parseInt(c.dataset.idx,10))));
}

function card(p){
  const idx = pairs[round][0].id===p.id ? 0 : 1;
  return `<div class="duel-card" data-idx="${idx}">
    ${FurbolUI.photo(p,72)}
    <div class="pname">${p.name}</div>
    <div class="pmeta">${FurbolUI.flag(p.nationality,16)} ${p.nationality}</div>
    <div class="pmeta">${FurbolUI.crest(p,16)} ${p.club}</div>
    <div class="pmeta">${p.position} · ${p.age} años</div>
    <div class="val">${FutbolDB.formatValue(p.marketValue)}</div>
  </div>`;
}

function pick(idx){
  const p = pairs[round][idx];
  picked.push(p); value += p.marketValue || 0;
  round++; render();
}

function finish(){
  const s=loadS();
  if(value>s.best){ s.best=value; saveS(s); }
  const max = FutbolDB.getAll().filter(p=>p.league!=='Leyendas').sort((a,b)=>b.marketValue-a.marketValue).slice(0,11).reduce((a,p)=>a+p.marketValue,0);
  const pct = Math.round(value/max*100);
  endEl.className='end-overlay-common win';
  endEl.innerHTML = `<h2>¡XI completo!</h2>
    <p style="color:var(--text-secondary);font-size:0.9rem;">Valor total del XI</p>
    <div style="font-family:var(--font-main);font-weight:900;font-size:2rem;color:var(--accent-blue);margin:6px 0;">${FutbolDB.formatValue(value)}</div>
    <p style="color:var(--text-secondary);">${pct}% del XI más caro posible</p>
    <p style="color:var(--text-muted); font-size:0.8rem;">Mejor histórico: ${FutbolDB.formatValue(s.best)}</p>
    <button class="btn btn--primary" onclick="init()" style="margin-top:14px;">Otro draft</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);
