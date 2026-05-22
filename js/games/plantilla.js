/** plantilla.js — Nombrar plantilla de un club en 60 segundos. */
const KEY='furbol.plantilla', LIMIT=60;
let club, pool, found, missed, timer, secs, gameOver;
const crest=document.getElementById('club-crest'), name=document.getElementById('club-name'),
  timerEl=document.getElementById('timer'), inp=document.getElementById('pl-input'),
  foundCnt=document.getElementById('found-count'), totalCnt=document.getElementById('total-count'),
  list=document.getElementById('found-list'), endEl=document.getElementById('end'),
  sugBox=document.getElementById('sug-box');

function loadS(){return FurbolUI.loadStats(KEY,{})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  clearInterval(timer); gameOver=false; endEl.style.display='none';
  // Elegir club con >=4 jugadores en la BD
  const clubs = [...new Set(FutbolDB.getAll().filter(p=>p.league!=='Leyendas').map(p=>p.club))];
  let candidate;
  do { candidate = clubs[Math.floor(Math.random()*clubs.length)]; pool=FutbolDB.query({club:candidate}); }
  while(pool.length<4);
  club = candidate;
  const sample = pool[0];
  crest.src = FutbolDB.crestOf(sample) || '';
  crest.onerror = () => { crest.style.display='none'; };
  name.textContent = club;
  totalCnt.textContent = pool.length;
  foundCnt.textContent = '0';
  found=[]; missed=[...pool]; list.innerHTML='';
  endEl.style.display='none'; sugBox.style.display='none';
  inp.value=''; inp.disabled=false; inp.focus();
  secs=LIMIT; updateTimer();
  timer = setInterval(()=>{ secs--; updateTimer(); if(secs<=0) endGame(); }, 1000);
}
window.init=init;

function updateTimer(){
  timerEl.textContent=secs;
  timerEl.classList.remove('warning','danger');
  if(secs<=10) timerEl.classList.add('danger');
  else if(secs<=25) timerEl.classList.add('warning');
}

let selectedId = null;

inp.addEventListener('input', ()=>{
  if(gameOver)return;
  const v=inp.value.trim();
  selectedId = null;
  if (v.length < 2) { sugBox.style.display = 'none'; return; }
  
  const r = FutbolDB.query({ name: v, limit: 6 });
  if (!r.length) { sugBox.style.display = 'none'; return; }
  
  sugBox.innerHTML = r.map(p => `
    <div class="sug" data-id="${p.id}" data-name="${p.name}">
      ${FurbolUI.photo(p, 24)}
      <strong>${p.name}</strong>
      <span style="color:var(--text-muted);font-size:0.8rem;">(${p.club})</span>
    </div>
  `).join('');
  sugBox.style.display = 'block';
});

sugBox.addEventListener('click', e => {
  const it = e.target.closest('.sug');
  if (!it) return;
  inp.value = it.dataset.name;
  selectedId = it.dataset.id;
  sugBox.style.display = 'none';
  
  const p = missed.find(x => x.id === selectedId);
  if (p) {
    accept(p);
  } else {
    inp.value = '';
    selectedId = null;
  }
});

document.addEventListener('click', e => {
  if(!e.target.closest('.search-wrapper')) sugBox.style.display='none';
});

inp.addEventListener('keydown', e=>{
  if(e.key==='Enter'){
    if (selectedId) {
      const p = missed.find(x => x.id === selectedId);
      if (p) accept(p);
      else { inp.value = ''; selectedId = null; sugBox.style.display = 'none'; }
      return;
    }
    
    const v=FurbolUI.normalize(inp.value); if(!v) return;
    const candidates = missed.filter(p => FurbolUI.normalize(p.name).includes(v) || FurbolUI.normalize(p.name.split(/\s+/).pop()).startsWith(v));
    if(candidates.length===1) accept(candidates[0]);
    else { inp.value=''; sugBox.style.display='none'; }
  }
});

function accept(p){
  missed = missed.filter(x=>x.id!==p.id);
  found.push(p); foundCnt.textContent=found.length; 
  inp.value=''; selectedId=null; sugBox.style.display='none';
  
  // Bonus de tiempo
  secs += 3;
  updateTimer();
  
  // Feedback visual +3s
  const p3 = document.createElement('div');
  p3.textContent = '+3s';
  p3.style.cssText = 'position:absolute; color:var(--accent-green); font-weight:bold; font-size:1.2rem; top:0; right:10px; animation:floatUp 1s forwards; pointer-events:none;';
  timerEl.parentElement.appendChild(p3);
  if(!document.getElementById('plus3-anim')) {
    const s = document.createElement('style'); s.id = 'plus3-anim';
    s.innerHTML = `@keyframes floatUp { 0%{opacity:1;transform:translateY(0);} 100%{opacity:0;transform:translateY(-20px);} }`;
    document.head.appendChild(s);
  }

  const item = document.createElement('div'); item.className='found-item';
  item.innerHTML = `<div style="display:flex;gap:8px;align-items:center;">${FurbolUI.photo(p,28)} <strong>${p.name}</strong></div><span style="color:var(--accent-green);">✓</span>`;
  list.prepend(item);
  if(missed.length===0) endGame(true);
}

function endGame(perfect=false){
  if(gameOver)return; gameOver=true; clearInterval(timer); inp.disabled=true;
  const s=loadS();
  const prev=s[club]||0;
  if(found.length>prev) s[club]=found.length; if(found.length>=5 && window.FurbolAlbum) FurbolAlbum.addPacks(1);
  saveS(s);
  endEl.className='end-overlay-common ' + (perfect?'win':'fail');
  endEl.innerHTML = `<h2>${perfect?'¡Perfecto! 🏆':'¡Tiempo!'}</h2>
    <p style="color:var(--text-secondary); margin-bottom:10px;">Encontrados <strong>${found.length}</strong> de <strong>${pool.length}</strong> de ${club}</p>
    ${missed.length?`<div class="missed"><div style="font-weight:700; margin-bottom:6px;">Te faltaron:</div>${missed.map(p=>`<div class="missed-item">• ${p.name}</div>`).join('')}</div>`:''}
    <button class="btn btn--primary" onclick="init()" style="margin-top:14px;">Otro club</button>`;
  endEl.style.display='block';
}

document.getElementById('btn-skip').addEventListener('click', init);
document.addEventListener('DOMContentLoaded', init);

