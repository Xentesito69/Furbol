/** bingo-diario.js */
const KEY='furbol.bingo-diario';
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

let cells=[], secs, timer, current, drawnPool=[], drawIndex=0, gameOver=false;
let todayKey, historyRec, rnd;
const boardEl=document.getElementById('board'), drawEl=document.getElementById('draw'),
  endEl=document.getElementById('end'), chipFilled=document.getElementById('chip-filled'), 
  chipTotal=document.getElementById('chip-total'), timerEl=document.getElementById('timer'),
  startOv=document.getElementById('start-overlay'), dayInfo=document.getElementById('day-info');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function seededShuffle(a, rFunc) {
  const x=[...a];
  for(let i=x.length-1;i>0;i--){
    const j=Math.floor(rFunc()*(i+1));
    [x[i],x[j]]=[x[j],x[i]];
  }
  return x;
}

function generateRequirements(allPlayers){
  const MIN_PLAYERS = 4;
  const reqs = [];
  const clubs = seededShuffle([...new Set(allPlayers.map(p=>p.club))], rnd);
  const nats = seededShuffle([...new Set(allPlayers.map(p=>p.nationality))], rnd);
  const conts = seededShuffle([...new Set(Object.values(CONTINENTS))], rnd);
  
  for(const c of clubs){
    if(reqs.filter(r=>r.kind==='club').length>=6) break;
    const chk = p => p.club===c || (p.formerClubs||[]).includes(c);
    if(allPlayers.filter(chk).length >= MIN_PLAYERS)
      reqs.push({ kind:'club', label:c, icon:'🏟️', check: chk });
  }
  for(const n of nats){
    if(reqs.filter(r=>r.kind==='nat').length>=4) break;
    const chk = p => p.nationality===n;
    if(allPlayers.filter(chk).length >= MIN_PLAYERS)
      reqs.push({ kind:'nat', label:n, icon:'🌍', check: chk });
  }
  for(const ct of conts){
    if(reqs.filter(r=>r.kind==='cont').length>=2) break;
    const chk = p => CONTINENTS[p.nationality]===ct;
    if(allPlayers.filter(chk).length >= MIN_PLAYERS)
      reqs.push({ kind:'cont', label:ct, icon:'🗺️', check: chk });
  }
  return seededShuffle(reqs, rnd).slice(0,CELLS);
}

function generateDrawnPool(allPlayers, reqs) {
  // Para que el bingo diario sea idéntico para todos y además resoluble,
  // pre-generamos una baraja fija de jugadores. Garantizamos que al principio
  // de la baraja haya jugadores que sirvan para los requisitos.
  const guaranteed = [];
  reqs.forEach(c => {
    const matches = seededShuffle(allPlayers.filter(p => c.check(p)), rnd);
    guaranteed.push(...matches.slice(0, 3)); // 3 soluciones por casilla garantizadas
  });
  guaranteed.push(...seededShuffle(allPlayers, rnd).slice(0, 50));
  
  // Barajamos el pool inicial
  const firstPart = seededShuffle([...new Set(guaranteed)], rnd);
  
  // El resto de jugadores detrás
  const rest = seededShuffle(allPlayers.filter(p => !firstPart.includes(p)), rnd);
  return [...firstPart, ...rest];
}

async function init(){
  await FutbolDB.load();
  clearInterval(timer); gameOver=false; endEl.style.display='none';
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  rnd = FurbolUI.seededRandom(seed * 22 + 44);
  
  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  const allPlayers = FutbolDB.getAll().filter(p=>p.league!=='Leyendas');
  // Sort determinístico previo a shuffle
  allPlayers.sort((a,b)=>a.id.localeCompare(b.id));
  
  const reqsDef = generateRequirements(allPlayers);
  cells = reqsDef.map((r,i)=>({...r, idx:i, locked:false, player:null}));
  drawnPool = generateDrawnPool(allPlayers, reqsDef);
  
  const s = loadS();
  if (!s.history[todayKey]) {
    startOv.style.display = 'flex';
    document.getElementById('btn-start').addEventListener('click', startGame);
  } else {
    historyRec = s.history[todayKey];
    secs = historyRec.secs;
    gameOver = historyRec.done;
    drawIndex = historyRec.drawIndex;
    
    // Restaurar estado del tablero
    historyRec.lockedCells.forEach(lc => {
      cells[lc.idx].locked = true;
      cells[lc.idx].player = FutbolDB.getAll().find(p => p.id === lc.playerId);
    });
    
    startOv.style.display = 'none';
    chipTotal.textContent = CELLS;
    renderBoard();
    
    if (gameOver) {
      finish(historyRec.won, true);
    } else {
      if (drawIndex >= drawnPool.length) drawNext();
      else {
        current = drawnPool[drawIndex];
        renderDraw();
      }
      updateTimer();
      timer = setInterval(()=>{ secs--; updateTimer(); saveProgress(); if(secs<=0) finish(false); }, 1000);
    }
  }
}

function startGame() {
  startOv.style.display = 'none';
  secs = TIME_LIMIT;
  drawIndex = 0;
  
  historyRec = {
    done: false,
    won: false,
    secs: secs,
    drawIndex: drawIndex,
    lockedCells: []
  };
  saveProgress();
  
  chipTotal.textContent = CELLS;
  renderBoard();
  drawNext();
  
  updateTimer();
  timer = setInterval(()=>{ secs--; updateTimer(); saveProgress(); if(secs<=0) finish(false); }, 1000);
}

function saveProgress() {
  if(!historyRec) return;
  historyRec.secs = secs;
  historyRec.drawIndex = drawIndex;
  historyRec.lockedCells = cells.filter(c=>c.locked).map(c=>({ idx: c.idx, playerId: c.player.id }));
  historyRec.done = gameOver;
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
}

function updateTimer(){
  if(secs < 0) secs = 0;
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

function renderDraw() {
  drawEl.innerHTML = `
    <img class="draw-photo" src="${FutbolDB.photoOf(current)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(current)}'" alt="${current.name}">
    <div class="draw-name">${current.name}</div>
    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">${current.club}</div>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:6px;">Pulsa una casilla que cumpla, o pasa.</p>
    <div class="draw-actions">
      <button class="btn btn--outline" id="btn-pass" style="padding:8px 18px;">Pasar</button>
    </div>`;
  document.getElementById('btn-pass').addEventListener('click', ()=>{ 
    if(!gameOver){ 
      drawIndex++; 
      saveProgress();
      drawNext(); 
    }
  });
}

function drawNext(){
  if(gameOver) return;
  if(drawIndex >= drawnPool.length){ drawEl.innerHTML='<p style="color:var(--text-muted);">Sin más jugadores</p>'; return; }

  current = drawnPool[drawIndex];
  renderDraw();
}

function tryPlace(idx){
  if(gameOver || !current) return;
  const c = cells[idx];
  if(c.locked) return;
  
  if(c.check(current)){
    // Acierto
    c.locked=true;
    c.player=current;
    renderBoard();
    drawIndex++;
    saveProgress();
    
    if(cells.every(x=>x.locked)) {
      finish(true);
    } else {
      drawNext();
    }
  } else {
    // Error: animación visual, sin restar vidas
    const el = document.querySelector(`.bingo-cell[data-idx="${idx}"]`);
    if(el){
      el.style.background = '#ffebeb';
      el.style.borderColor = 'var(--accent-red)';
      el.style.transform = 'scale(1.05)';
      setTimeout(()=>{ 
        el.style.background = ''; 
        el.style.borderColor = ''; 
        el.style.transform = ''; 
      }, 400);
    }
  }
}

function finish(won, alreadyDone=false){
  if(!alreadyDone && !gameOver) {
    gameOver=true;
    clearInterval(timer);
    historyRec.done = true;
    historyRec.won = won;
    saveProgress();
    if(won && window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  
  const filled = cells.filter(c=>c.locked).length;
  endEl.className='end-overlay-common '+(won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Línea! 🎉':'¡Tiempo!'}</h2>
    <p style="color:var(--text-secondary); margin-bottom:10px;">Cartón completado al <strong>${Math.floor(filled/CELLS*100)}%</strong></p>
    <textarea readonly style="width:100%;height:60px;font-family:monospace;font-size:0.85rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">Furbol Bingo Diario 🎰\n⏱️ Tiempo: ${TIME_LIMIT - secs}s\n✅ Rellenas: ${filled}/${CELLS}</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);
