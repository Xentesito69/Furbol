/** sudoku.js — Sudoku futbolero con caras de jugadores. 4x4/6x6/9x9. */
const KEY='furbol.sudoku';
const STARS = ['Lionel Messi','Cristiano Ronaldo','Kylian Mbappé','Vinícius Júnior','Erling Haaland','Lamine Yamal','Neymar Jr','Karim Benzema','Jude Bellingham'];
const LEVELS = {
  easy:   { n: 4, bw: 2, bh: 2, removals: 8,  cell: 70 },
  medium: { n: 6, bw: 3, bh: 2, removals: 22, cell: 56 },
  hard:   { n: 9, bw: 3, bh: 3, removals: 50, cell: 46 },
};
let level='easy', solution, board, given, selected=null, items=[], isClubs=false;

function loadS(){return FurbolUI.loadStats(KEY,{wins:{easy:0,medium:0,hard:0}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}

function generateSolution(n, bw, bh){
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
    const candidates = shuffle([...Array(n).keys()].map(x=>x+1));
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

function init(){
  const lvl = LEVELS[level];
  solution = generateSolution(lvl.n, lvl.bw, lvl.bh);
  board = solution.map(row=>row.slice());
  given = Array.from({length:lvl.n},()=>Array(lvl.n).fill(true));
  let removed = 0;
  while(removed < lvl.removals){
    const r = Math.floor(Math.random()*lvl.n);
    const c = Math.floor(Math.random()*lvl.n);
    if(board[r][c] !== 0){ board[r][c] = 0; given[r][c] = false; removed++; }
  }

  const variant = new URLSearchParams(window.location.search).get('v');
  items = [];
  isClubs = false;
  
  const titles = {
    'rm': { title: 'Sudoku Real Madrid', sub: 'Jugadores del Real Madrid' },
    'fcb': { title: 'Sudoku FC Barcelona', sub: 'Jugadores del FC Barcelona' },
    'laliga': { title: 'Sudoku LaLiga', sub: 'Escudos de equipos de LaLiga' },
    'pl': { title: 'Sudoku Premier League', sub: 'Escudos de equipos de la Premier League' }
  };
  if(variant && titles[variant]){
    document.querySelector('.game-header__title').textContent = titles[variant].title;
    document.querySelector('.game-header__sub').textContent = 'Cada fila, columna y bloque debe tener cada elemento exactamente una vez. (' + titles[variant].sub + ')';
  }

  if (variant === 'rm') {
    const names = ['Vinícius Júnior','Jude Bellingham','Kylian Mbappé','Thibaut Courtois','Federico Valverde','Antonio Rüdiger','Eduardo Camavinga','Aurélien Tchouaméni','Dani Carvajal'];
    items = names.map(n => FutbolDB.getAll().find(x=>x.name===n)).filter(Boolean);
  } else if (variant === 'fcb') {
    const names = ['Pedri', 'Lamine Yamal', 'Robert Lewandowski', 'Raphinha', 'Jules Koundé', 'Ronald Araújo', 'Alejandro Balde', 'Dani Olmo', 'Pau Cubarsí'];
    items = names.map(n => FutbolDB.getAll().find(x=>x.name===n)).filter(Boolean);
  } else if (variant === 'laliga') {
    isClubs = true;
    const names = ['Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Sevilla FC', 'Valencia CF', 'Athletic Club', 'Villarreal', 'Real Betis', 'Getafe CF'];
    items = names.map(n => window.PLAYERS_DATA.clubs.find(x=>x.name===n)).filter(Boolean);
  } else if (variant === 'pl') {
    isClubs = true;
    const names = ['Manchester City', 'Liverpool', 'Arsenal', 'Manchester United', 'Chelsea', 'Tottenham Hotspur', 'Aston Villa', 'Newcastle United', 'Everton'];
    items = names.map(n => window.PLAYERS_DATA.clubs.find(x=>x.name===n)).filter(Boolean);
  } else {
    for(let i=0;i<9;i++){
      const name = STARS[i];
      const p = FutbolDB.getAll().find(x=>x.name===name) || FutbolDB.random();
      items.push(p);
    }
  }
  
  // Si no hay suficientes, rellenamos con aleatorios
  while(items.length < 9) {
    if(isClubs) items.push(window.PLAYERS_DATA.clubs[Math.floor(Math.random()*window.PLAYERS_DATA.clubs.length)]);
    else items.push(FutbolDB.random());
  }
  items = items.slice(0, lvl.n);

  document.getElementById('end').style.display='none';
  selected = null;
  render();
}
window.init=init;

function faceHTML(idx){
  const it = items[idx-1];
  if(isClubs){
    return `<img src="${it.crest}" onerror="this.onerror=null;this.src=''" alt="${it.name}" title="${it.name}" style="background:transparent; border-radius:0; border:none; box-shadow:none; width:80%; height:80%; object-fit:contain;">`;
  }
  return `<img src="${FutbolDB.photoOf(it)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(it)}'" alt="${it.name}" title="${it.name}">`;
}

function render(){
  const lvl = LEVELS[level];
  const boardEl = document.getElementById('board');
  boardEl.style.gridTemplateColumns = `repeat(${lvl.n}, ${lvl.cell}px)`;
  boardEl.style.gridTemplateRows = `repeat(${lvl.n}, ${lvl.cell}px)`;
  boardEl.innerHTML = '';
  for(let r=0;r<lvl.n;r++)for(let c=0;c<lvl.n;c++){
    const d = document.createElement('div');
    d.className = 'cell' + (given[r][c]?' given':'') + ((selected && selected[0]===r && selected[1]===c)?' selected':'');
    d.dataset.r = r; d.dataset.c = c;
    // Clean border generation to prevent messy overlapping
    d.style.borderRight = '1px solid var(--border)';
    d.style.borderBottom = '1px solid var(--border)';
    
    // Thick block borders
    if ((c + 1) % lvl.bw === 0 && c !== lvl.n - 1) {
      d.style.borderRight = '3px solid var(--text-primary)';
    }
    if ((r + 1) % lvl.bh === 0 && r !== lvl.n - 1) {
      d.style.borderBottom = '3px solid var(--text-primary)';
    }
    
    // Remove outer edges so they don't overlap with the main board border
    if (c === lvl.n - 1) { d.style.borderRight = 'none'; }
    if (r === lvl.n - 1) { d.style.borderBottom = 'none'; }
    if(board[r][c]) d.innerHTML = faceHTML(board[r][c]);
    d.addEventListener('click', ()=>{ if(given[r][c]) return; selected=[r,c]; render(); });
    boardEl.appendChild(d);
  }
  // Picker
  const picker = document.getElementById('picker');
  picker.style.gridTemplateColumns = `repeat(${lvl.n}, 1fr)`;
  picker.innerHTML = '';
  for(let i=1;i<=lvl.n;i++){
    const b = document.createElement('div');
    b.className='pick';
    b.innerHTML = faceHTML(i);
    b.addEventListener('click', ()=>placeNumber(i));
    picker.appendChild(b);
  }
  // Keyboard delete
  document.onkeydown = (e)=>{
    if(!selected) return;
    if(e.key==='Backspace' || e.key==='Delete'){ const [r,c]=selected; board[r][c]=0; render(); }
    else if(/^[1-9]$/.test(e.key)){ placeNumber(parseInt(e.key,10)); }
  };
}

function placeNumber(n){
  if(!selected) return;
  const lvl = LEVELS[level];
  if(n>lvl.n) return;
  const [r,c]=selected;
  if(given[r][c]) return;
  board[r][c] = n;
  render();
  // Auto-check si está completo
  if(board.every(row=>row.every(v=>v>0))){
    if(isValid()) win();
  }
}

function isValid(){
  const lvl = LEVELS[level];
  for(let r=0;r<lvl.n;r++)for(let c=0;c<lvl.n;c++) if(board[r][c]!==solution[r][c]) return false;
  return true;
}

document.getElementById('btn-check').addEventListener('click', ()=>{
  const lvl=LEVELS[level];
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
  const s=loadS(); s.wins[level]=(s.wins[level]||0)+1; saveS(s); if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
  const endEl=document.getElementById('end');
  endEl.className='end-overlay-common win';
  endEl.innerHTML=`<h2>¡Sudoku resuelto! 🎉</h2><p style="color:var(--text-secondary);">Nivel ${LEVELS[level] ? level : ''}</p><button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Otro</button>`;
  endEl.style.display='block';
}

document.getElementById('btn-new').addEventListener('click', init);
document.querySelectorAll('.level-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.level-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  level = b.dataset.l;
  init();
}));
document.addEventListener('DOMContentLoaded', async ()=>{ await FutbolDB.load(); init(); });

