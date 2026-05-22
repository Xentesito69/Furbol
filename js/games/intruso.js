/** intruso.js — 4 jugadores, 3 comparten propiedad, 1 no. */
const KEY='furbol.intruso';
let streak=0, gameOver=false, four=[], intruderIdx=-1, hintText='';
const grid=document.getElementById('grid'),hint=document.getElementById('hint'),
  verdict=document.getElementById('verdict'),endEl=document.getElementById('end'),
  chipStreak=document.getElementById('chip-streak'),chipBest=document.getElementById('chip-best');

const CAT_TYPES = [
  { id:'club',        label:v=>'Mismo CLUB: '+v,
    group: all => { const m={}; all.forEach(p=>{ if(p.club)(m[p.club]=m[p.club]||[]).push(p); }); return m; },
    check: (p,v) => p.club===v },
  { id:'nationality', label:v=>'Misma NACIONALIDAD: '+v,
    group: all => { const m={}; all.forEach(p=>{ if(p.nationality)(m[p.nationality]=m[p.nationality]||[]).push(p); }); return m; },
    check: (p,v) => p.nationality===v },
  { id:'league',      label:v=>'Misma LIGA: '+v,
    group: all => { const m={}; all.forEach(p=>{ if(p.league)(m[p.league]=m[p.league]||[]).push(p); }); return m; },
    check: (p,v) => p.league===v },
  { id:'surname',     label:v=>'Mismo APELLIDO: '+v,
    group: all => { const m={}; all.forEach(p=>{ const s=p.name.split(/\s+/).pop(); (m[s]=m[s]||[]).push(p); }); return m; },
    check: (p,v) => p.name.split(/\s+/).pop()===v },
  { id:'anyClub',     label:v=>'Jugaron en '+v,
    group: all => { const m={}; all.forEach(p=>{ const clubs=[p.club,...(p.formerClubs||[])]; clubs.forEach(c=>{ if(c)(m[c]=m[c]||[]).push(p); }); }); return m; },
    check: (p,v) => p.club===v || (p.formerClubs||[]).includes(v) },
];

function loadS(){return FurbolUI.loadStats(KEY,{best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){ chipStreak.textContent=streak; chipBest.textContent=loadS().best; }

let _chosenCat=null, _chosenValue=null;

async function init(){
  await FutbolDB.load();
  gameOver=false; verdict.style.display='none'; endEl.style.display='none';
  const all = FutbolDB.getAll();
  let group, tries=0;
  while(tries++<80){
    const catType = CAT_TYPES[Math.floor(Math.random()*CAT_TYPES.length)];
    const buckets = catType.group(all);
    const candidates = Object.keys(buckets).filter(v=>buckets[v].length>=3);
    if(candidates.length===0) continue;
    const value = candidates[Math.floor(Math.random()*candidates.length)];
    _chosenCat = catType; _chosenValue = value;
    group = FurbolUI.shuffle(buckets[value]).slice(0,3);
    break;
  }
  if(!_chosenCat) return;
  // Elegir intruso: que NO cumpla la propiedad
  let intruder, t2=0;
  do { intruder = FutbolDB.random(); t2++; }
  while(t2<80 && _chosenCat.check(intruder, _chosenValue));
  four = FurbolUI.shuffle([...group, intruder]);
  intruderIdx = four.findIndex(p=>p.id===intruder.id);
  hintText = '🔗 ' + _chosenCat.label(_chosenValue);
  hint.textContent = '🔗 ¿Quién no encaja?';
  render();
  refresh();
}
window.init=init;

function render(){
  grid.innerHTML = four.map((p,i)=>`
    <div class="player-tile" data-idx="${i}">
      ${FurbolUI.photo(p,64)}
      <div class="pname">${p.name}</div>
    </div>
  `).join('');
  grid.querySelectorAll('.player-tile').forEach(t=>{
    t.addEventListener('click',()=>pick(parseInt(t.dataset.idx,10)));
  });
}

function pick(i){
  if(gameOver)return;
  gameOver=true;
  const correct = i===intruderIdx;
  grid.querySelectorAll('.player-tile').forEach((t,j)=>{
    t.classList.add(j===intruderIdx?'right':(j===i?'wrong':'disabled'));
  });
  if(correct){ streak++; const s=loadS(); if(streak>s.best){s.best=streak;saveS(s);} if(streak%5===0 && window.FurbolAlbum) FurbolAlbum.addPacks(1); refresh();
    hint.textContent = hintText;
    verdict.className='verdict right'; verdict.textContent='✓ ¡Correcto!'; verdict.style.display='block';
    setTimeout(init,1300);
  } else {
    streak=0; refresh();
    hint.textContent = hintText;
    verdict.className='verdict wrong';
    verdict.innerHTML = `✗ El intruso era <strong>${four[intruderIdx].name}</strong>`;
    verdict.style.display='block';
    endEl.className='end-overlay-common fail';
    endEl.innerHTML = `<h2>Se rompió la racha</h2><button class="btn btn--primary" onclick="init()">Otra ronda</button>`;
    endEl.style.display='block';
  }
}

document.addEventListener('DOMContentLoaded', init);

