/** sudoku-diario.js */
const KEY='furbol.sudoku-diario';
const lvl = { n: 6, bw: 3, bh: 2, removals: 22, cell: 56 };

let solution, board, given, selected=null, items=[];
let todayKey, historyRec, gameOver=false;

const boardEl=document.getElementById('board');
const endEl=document.getElementById('end');
const dayInfo=document.getElementById('day-info');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function seededShuffle(a, rnd) {
  const x=[...a];
  for(let i=x.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [x[i],x[j]]=[x[j],x[i]];
  }
  return x;
}

function generateSolution(n, bw, bh, rnd){
  const sol = Array.from({length:n},()=>Array(n).fill(0));
  function safe(r,c,v){
    for(let i=0;i<n;i++){ if(sol[r][i]===v) return false; if(sol[i][c]===v) return false; }
    const br = Math.floor(r/bh)*bh, bc = Math.floor(c/bw)*bw;
    for(let i=0;i<bh;i++) for(let j=0;j<bw;j++) if(sol[br+i][bc+j]===v) return false;
    return true;
  }
  function solve(r=0,c=0){
    if(r===n) return true;
    const [nr,nc] = c+1===n ? [r+1,0] : [r,c+1];
    const candidates = seededShuffle([...Array(n).keys()].map(x=>x+1), rnd);
    for(const v of candidates){
      if(safe(r,c,v)){
        sol[r][c]=v;
        if(solve(nr,nc)) return true;
        sol[r][c]=0;
      }
    }
    return false;
  }
  solve();
  return sol;
}

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 55 + 11);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  solution = generateSolution(lvl.n, lvl.bw, lvl.bh, rnd);
  board = solution.map(row=>row.slice());
  given = Array.from({length:lvl.n},()=>Array(lvl.n).fill(true));
  
  let removed = 0;
  while(removed < lvl.removals){
    const r = Math.floor(rnd()*lvl.n);
    const c = Math.floor(rnd()*lvl.n);
    if(board[r][c] !== 0){ board[r][c] = 0; given[r][c] = false; removed++; }
  }

  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas');
  all.sort((a,b)=>a.id.localeCompare(b.id));
  items = [];
  const seen = new Set();
  while(items.length < lvl.n) {
    const p = all[Math.floor(rnd() * all.length)];
    if(!seen.has(p.id)){
      seen.add(p.id);
      items.push(p);
    }
  }

  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      done: false,
      won: false,
      board: board.map(r=>r.slice())
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  board = historyRec.board;
  gameOver = historyRec.done;

  endEl.style.display='none';
  selected = null;
  render();
  
  if (gameOver) {
    if (historyRec.won) win();
    else lose();
  }
}

function faceHTML(idx){
  const it = items[idx-1];
  return `<img src="${FutbolDB.photoOf(it)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(it)}'" alt="${it.name}" title="${it.name}">`;
}

function render(){
  boardEl.style.gridTemplateColumns = `repeat(${lvl.n}, ${lvl.cell}px)`;
  boardEl.style.gridTemplateRows = `repeat(${lvl.n}, ${lvl.cell}px)`;
  boardEl.innerHTML = '';
  for(let r=0;r<lvl.n;r++)for(let c=0;c<lvl.n;c++){
    const d = document.createElement('div');
    d.className = 'cell' + (given[r][c]?' given':'') + ((selected && selected[0]===r && selected[1]===c)?' selected':'');
    d.dataset.r = r; d.dataset.c = c;
    
    d.style.borderRight = '1px solid var(--border)';
    d.style.borderBottom = '1px solid var(--border)';
    if ((c + 1) % lvl.bw === 0 && c !== lvl.n - 1) d.style.borderRight = '3px solid var(--text-primary)';
    if ((r + 1) % lvl.bh === 0 && r !== lvl.n - 1) d.style.borderBottom = '3px solid var(--text-primary)';
    if (c === lvl.n - 1) d.style.borderRight = 'none';
    if (r === lvl.n - 1) d.style.borderBottom = 'none';
    
    if(board[r][c]) d.innerHTML = faceHTML(board[r][c]);
    
    d.addEventListener('click', ()=>{ 
      if(gameOver) return;
      if(given[r][c]) return; 
      selected=[r,c]; 
      render(); 
    });
    boardEl.appendChild(d);
  }
  
  const picker = document.getElementById('picker');
  picker.innerHTML = '';
  for(let i=1;i<=lvl.n;i++){
    const b = document.createElement('div');
    b.className='pick';
    b.innerHTML = faceHTML(i);
    b.addEventListener('click', ()=>placeNumber(i));
    picker.appendChild(b);
  }

  document.onkeydown = (e)=>{
    if(gameOver) return;
    if(!selected) return;
    if(e.key==='Backspace' || e.key==='Delete'){ 
      const [r,c]=selected; 
      board[r][c]=0; 
      saveProgress();
      render(); 
    }
    else if(/^[1-6]$/.test(e.key)){ placeNumber(parseInt(e.key,10)); }
  };
}

function saveProgress() {
  historyRec.board = board.map(r=>r.slice());
  const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
}

function placeNumber(n){
  if(gameOver) return;
  if(!selected) return;
  if(n>lvl.n) return;
  const [r,c]=selected;
  if(given[r][c]) return;
  board[r][c] = n;
  
  saveProgress();
  render();
  
  if(board.every(row=>row.every(v=>v>0))){
    if(isValid()) win();
  }
}

function isValid(){
  for(let r=0;r<lvl.n;r++)for(let c=0;c<lvl.n;c++) if(board[r][c]!==solution[r][c]) return false;
  return true;
}

document.getElementById('btn-check').addEventListener('click', ()=>{
  if(gameOver) return;
  let ok=true;
  for(let r=0;r<lvl.n;r++)for(let c=0;c<lvl.n;c++){
    const el=document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if(board[r][c] && board[r][c]!==solution[r][c]){
      ok=false; if(el)el.classList.add('error');
    }
  }
  if(ok && board.every(row=>row.every(v=>v>0))) win();
});

function win(){
  if(!gameOver) {
    gameOver=true;
    historyRec.done=true; historyRec.won=true;
    saveProgress();
    if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  
  const endEl=document.getElementById('end');
  endEl.className='end-overlay-common win';
  endEl.innerHTML=`<h2>¡Sudoku resuelto! 🎉</h2>
    <p style="color:var(--text-secondary);">El mismo sudoku completado por todos hoy.</p>
    <textarea readonly style="width:100%;height:40px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">Furbol Sudoku Diario 6x6 🟩 Completado</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

function lose(){
  if(!gameOver) {
    gameOver=true;
    historyRec.done=true; historyRec.won=false;
    saveProgress();
  }
  
  const endEl=document.getElementById('end');
  endEl.className='end-overlay-common fail';
  endEl.innerHTML=`<h2>¡Te has rendido! 🏳️</h2>
    <p style="color:var(--text-secondary);">El sudoku de hoy pudo contigo.</p>
    <textarea readonly style="width:100%;height:40px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">Furbol Sudoku Diario 6x6 🟥 Abandonado</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.getElementById('btn-surrender').addEventListener('click', ()=>{
  if(gameOver) return;
  lose();
});

document.addEventListener('DOMContentLoaded', init);
