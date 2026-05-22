/** plantilla-diario.js */
const KEY='furbol.plantilla-diario', LIMIT=60;
let club, pool, found=[], missed=[], timer, secs, gameOver=false;
let todayKey, historyRec;
let selectedId = null;

const crest=document.getElementById('club-crest'), name=document.getElementById('club-name'),
  timerEl=document.getElementById('timer'), inp=document.getElementById('pl-input'),
  foundCnt=document.getElementById('found-count'), totalCnt=document.getElementById('total-count'),
  list=document.getElementById('found-list'), endEl=document.getElementById('end'),
  sugBox=document.getElementById('sug-box'), startOv=document.getElementById('start-overlay'),
  dayInfo=document.getElementById('day-info');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  clearInterval(timer); gameOver=false; endEl.style.display='none';
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 77 + 33);
  
  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  const clubs = [...new Set(FutbolDB.getAll().filter(p=>p.league!=='Leyendas').map(p=>p.club))].sort();
  club = clubs[Math.floor(rnd() * clubs.length)];
  pool = FutbolDB.query({club});
  
  // Deterministic sorting just in case
  pool.sort((a,b)=>a.id.localeCompare(b.id));

  const sample = pool[0];
  crest.src = FutbolDB.crestOf(sample) || '';
  crest.onerror = () => { crest.style.display='none'; };
  name.textContent = club;
  totalCnt.textContent = pool.length;

  const s = loadS();
  if (!s.history[todayKey]) {
    // Primera vez que entra hoy
    startOv.style.display = 'flex';
    document.getElementById('btn-start').addEventListener('click', startGame);
  } else {
    // Ya había empezado o terminado
    historyRec = s.history[todayKey];
    found = historyRec.found.map(id => FutbolDB.getAll().find(p=>p.id===id)).filter(Boolean);
    missed = historyRec.missed.map(id => FutbolDB.getAll().find(p=>p.id===id)).filter(Boolean);
    secs = historyRec.secs;
    gameOver = historyRec.done;
    
    startOv.style.display = 'none';
    crest.style.visibility = 'visible';
    name.style.visibility = 'visible';
    timerEl.style.visibility = 'visible';
    inp.disabled = gameOver;
    
    foundCnt.textContent = found.length;
    renderFound();
    updateTimer();
    
    if (gameOver) {
      endGame(false, true); // Ya terminó
    } else {
      timer = setInterval(()=>{ secs--; updateTimer(); saveProgress(); if(secs<=0) endGame(); }, 1000);
      inp.focus();
    }
  }
}

function startGame() {
  startOv.style.display = 'none';
  crest.style.visibility = 'visible';
  name.style.visibility = 'visible';
  timerEl.style.visibility = 'visible';
  
  found=[]; missed=[...pool]; list.innerHTML='';
  foundCnt.textContent = '0';
  inp.value=''; inp.disabled=false; inp.focus();
  secs=LIMIT; updateTimer();
  
  historyRec = {
    done: false,
    secs: secs,
    found: [],
    missed: missed.map(p=>p.id)
  };
  saveProgress();
  
  timer = setInterval(()=>{ secs--; updateTimer(); saveProgress(); if(secs<=0) endGame(); }, 1000);
}

function saveProgress() {
  if(!historyRec) return;
  historyRec.secs = secs;
  historyRec.found = found.map(p=>p.id);
  historyRec.missed = missed.map(p=>p.id);
  historyRec.done = gameOver;
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
}

function updateTimer(){
  if(secs < 0) secs = 0;
  timerEl.textContent=secs;
  timerEl.classList.remove('warning','danger');
  if(secs<=10) timerEl.classList.add('danger');
  else if(secs<=25) timerEl.classList.add('warning');
}

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
  
  secs += 3;
  updateTimer();
  saveProgress();
  
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
  
  if(missed.length===0) endGame(true, false);
}

function renderFound() {
  list.innerHTML = '';
  found.forEach(p => {
    const item = document.createElement('div'); item.className='found-item';
    item.innerHTML = `<div style="display:flex;gap:8px;align-items:center;">${FurbolUI.photo(p,28)} <strong>${p.name}</strong></div><span style="color:var(--accent-green);">✓</span>`;
    list.prepend(item);
  });
}

function endGame(perfect=false, alreadyDone=false){
  if(!alreadyDone && !gameOver) {
    gameOver=true; clearInterval(timer); inp.disabled=true;
    historyRec.done = true;
    historyRec.won = perfect;
    saveProgress();
    if(found.length>=5 && window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  
  endEl.className='end-overlay-common ' + (perfect?'win':'fail');
  endEl.innerHTML = `<h2>${perfect?'¡Perfecto! 🏆':'¡Tiempo!'}</h2>
    <p style="color:var(--text-secondary); margin-bottom:10px;">Encontrados <strong>${found.length}</strong> de <strong>${pool.length}</strong> de ${club}</p>
    ${missed.length?`<div class="missed"><div style="font-weight:700; margin-bottom:6px;">Te faltaron:</div>${missed.map(p=>`<div class="missed-item">• ${p.name}</div>`).join('')}</div>`:''}
    <textarea readonly style="width:100%;height:60px;font-family:monospace;font-size:0.85rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">Furbol Plantilla Diaria ⏱️\n${club}\nAdivinados: ${found.length}/${pool.length}</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);
