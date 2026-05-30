/** grid.js — Tipo Immaculate Grid. Modos solo y 1v1. */
const KEY='furbol.grid';
let mode='solo', cols, rows, board, turn=0, openCell=null, gameOver=false;

const gridEl=document.getElementById('grid'), endEl=document.getElementById('end'),
  chipFilled=document.getElementById('chip-filled'), turnInfo=document.getElementById('turn-info'),
  modal=document.getElementById('picker-modal'), pickerInput=document.getElementById('picker-input'),
  pickerList=document.getElementById('picker-list'), pickerTitle=document.getElementById('picker-title');

function loadS(){return FurbolUI.loadStats(KEY,{bestSolo:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function clubsOf(p){ return new Set([p.club, ...(p.formerClubs||[])]); }

function isGridSolvableUnique(cs, rs, allPlayers) {
  const adj = Array.from({length: 9}, () => []);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const validPlayers = allPlayers.filter(p => rs[r].check(p) && cs[c].check(p));
      if (validPlayers.length === 0) return false;
      const cellIdx = r * 3 + c;
      for (const p of validPlayers) {
        adj[cellIdx].push(p.id);
      }
    }
  }
  const match = new Map();
  function dfs(u, visited) {
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        if (!match.has(v) || dfs(match.get(v), visited)) {
          match.set(v, u);
          return true;
        }
      }
    }
    return false;
  }
  for (let i = 0; i < 9; i++) {
    if (!dfs(i, new Set())) return false;
  }
  return true;
}

function pickConstraints(){
  const allPlayers = FutbolDB.getAll();
  const active = allPlayers.filter(p=>p.league!=='Leyendas');
  
  const allAttrsFlat = [];
  active.forEach(p => {
    allAttrsFlat.push({kind:'club', label:p.club, check: x=>clubsOf(x).has(p.club)});
    allAttrsFlat.push({kind:'nat', label:p.nationality, check: x=>x.nationality===p.nationality});
    allAttrsFlat.push({kind:'league', label:p.league, check: x=>x.league===p.league});
    if(p.formerClubs) p.formerClubs.forEach(c => allAttrsFlat.push({kind:'club', label:c, check: x=>clubsOf(x).has(c)}));
  });

  // Añadir la categoría One Club Man para que tenga probabilidad de salir
  for(let i=0; i<30; i++) {
    allAttrsFlat.push({
      kind:'oneclub', 
      label:'One Club Man', 
      check: x => x.league === 'Leyendas' && x.formerClubs && x.formerClubs.length === 1
    });
  }
  
  const pickWeighted = () => allAttrsFlat[Math.floor(Math.random() * allAttrsFlat.length)];

  for(let t=0; t<30000; t++){
    const cs = [pickWeighted(), pickWeighted(), pickWeighted()];
    const rs = [pickWeighted(), pickWeighted(), pickWeighted()];
    
    // Evitar etiquetas duplicadas
    const labels = [...cs,...rs].map(x=>x.label);
    if(new Set(labels).size < 6) continue;

    // Evitar intersecciones aburridas: un club no puede cruzarse con su propia liga actual
    let trivial = false;
    for(let r=0;r<3;r++){
      for(let c=0;c<3;c++){
        const kinds = [rs[r].kind, cs[c].kind];
        if(kinds.includes('league') && kinds.includes('club')){
          const cName = rs[r].kind === 'club' ? rs[r].label : cs[c].label;
          const lName = rs[r].kind === 'league' ? rs[r].label : cs[c].label;
          if(allPlayers.some(p => p.club === cName && p.league === lName)){ trivial = true; break; }
        }
      }
      if(trivial) break;
    }
    if(trivial) continue;
    
    // Validar rápidamente que al menos haya 1 jugador por celda
    let ok = true;
    for(let r=0;r<3;r++){
      for(let c=0;c<3;c++){
        if(!allPlayers.some(p => rs[r].check(p) && cs[c].check(p))){ ok=false; break; }
      }
      if(!ok) break;
    }
    if(!ok) continue;

    // Validar que se puede resolver con 9 distintos
    if(!isGridSolvableUnique(cs, rs, allPlayers)) continue;

    return {cols:cs, rows:rs};
  }
  
  // Fallback 100% seguro si la suerte falla
  return {
    cols: [
      {kind:'league', label:'La Liga', check:p=>p.league==='La Liga'},
      {kind:'nat', label:'España', check:p=>p.nationality==='España'},
      {kind:'nat', label:'Francia', check:p=>p.nationality==='Francia'}
    ],
    rows: [
      {kind:'club', label:'Real Madrid', check:p=>clubsOf(p).has('Real Madrid')},
      {kind:'club', label:'FC Barcelona', check:p=>clubsOf(p).has('FC Barcelona')},
      {kind:'club', label:'Atlético de Madrid', check:p=>clubsOf(p).has('Atlético de Madrid')}
    ]
  };
}

async function init(){
  await FutbolDB.load();
  const c = pickConstraints();
  cols = c.cols; rows = c.rows;
  board = Array.from({length:3},()=>Array(3).fill(null));
  turn = Math.random()<0.5 ? 0 : 1;
  gameOver=false; endEl.style.display='none';
  render();
  if(mode==='vs'){ turnInfo.style.display='block'; updateTurnInfo(); document.getElementById('btn-giveup').style.display='none'; }
  else { turnInfo.style.display='none'; document.getElementById('btn-giveup').style.display=''; }
}
window.init=init;

function updateTurnInfo(){
  turnInfo.className = 'turn-info ' + (turn===0?'p1':'p2');
  turnInfo.innerHTML = `Turno: <strong>${turn===0?'🔵 Jugador 1':'🔴 Jugador 2'}</strong>`;
}

function crestForName(name){
  const sample = FutbolDB.getAll().find(p=>p.club===name);
  if(sample){ const u=FutbolDB.crestOf(sample); if(u) return `<img class="crest" src="${u}" onerror="this.onerror=null;this.style.display='none'" style="width:36px;height:36px;object-fit:contain;">`; }
  const u2 = FutbolDB.crestByName ? FutbolDB.crestByName(name) : null;
  if(u2) return `<img class="crest" src="${u2}" onerror="this.onerror=null;this.style.display='none'" style="width:36px;height:36px;object-fit:contain;">`;
  return null;
}
function flagForNat(nat){ return FurbolUI.flag(nat, 36); }
function logoForLeague(name){
  const u = FutbolDB.leagueLogo(name);
  if(u) return `<img class="crest" src="${u}" onerror="this.onerror=null;this.style.display='none'" style="width:40px;height:40px;object-fit:contain;">`;
  return null;
}

function headerHTML(col){
  if(col.kind==='oneclub') return `<div style="font-size:0.7rem;font-weight:800;line-height:1.2;text-align:center;">ONE CLUB<br>MAN</div>`;
  if(col.kind==='club'){
    const cr = crestForName(col.label);
    return cr ? `<div style="display:flex;justify-content:center;align-items:center;">${cr}</div>` : `<div>${col.label}</div>`;
  }
  if(col.kind==='nat')    return `<div style="display:flex;justify-content:center;align-items:center;">${flagForNat(col.label)}</div>`;
  if(col.kind==='league'){
    const lg = logoForLeague(col.label);
    return lg ? `<div style="display:flex;justify-content:center;align-items:center;">${lg}</div>` : `<div style="font-size:0.7rem;font-weight:800;">${col.label}</div>`;
  }
  return `<div>${col.label}</div>`;
}

function render(){
  let html = '<div class="grid-head"></div>';
  for(const c of cols) html += `<div class="grid-head">${headerHTML(c)}</div>`;
  for(let r=0;r<3;r++){
    html += `<div class="grid-head">${headerHTML(rows[r])}</div>`;
    for(let c=0;c<3;c++){
      const v = board[r][c];
      if(v){
        if(mode==='solo'){
          html += `<div class="grid-cell locked"><img class="face" src="${FutbolDB.photoOf(v.player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(v.player)}'" title="${v.player.name}"></div>`;
        } else {
          html += `<div class="grid-cell locked"><span class="mark ${v.who===0?'p1':'p2'}">${v.who===0?'○':'×'}</span></div>`;
        }
      } else {
        html += `<div class="grid-cell" data-r="${r}" data-c="${c}"></div>`;
      }
    }
  }
  gridEl.innerHTML = html;
  gridEl.querySelectorAll('.grid-cell:not(.locked)').forEach(el=>{
    el.addEventListener('click', ()=>openPickerFor(+el.dataset.r, +el.dataset.c));
  });
  const filled = board.flat().filter(Boolean).length;
  chipFilled.textContent = filled;
  if(mode==='solo' && filled===9){ finishSolo(); return; }
  if(mode==='solo') document.getElementById('btn-giveup').style.display = gameOver ? 'none' : '';
  if(mode==='vs'){
    const w = checkWinVS();
    if(w!==null){ finishVS(w); return; }
    if(filled===9){ finishVS('draw'); return; }
  }
}

function openPickerFor(r, c){
  if(gameOver) return;
  openCell = { r, c };
  pickerTitle.innerHTML = `${rows[r].label} <span style="color:var(--text-muted);">×</span> ${cols[c].label}`;
  pickerInput.value=''; pickerList.innerHTML='';
  modal.classList.add('show'); pickerInput.focus();
}
function closePicker(){ modal.classList.remove('show'); openCell=null; }
window.closePicker = closePicker;

pickerInput.addEventListener('input', ()=>{
  const v = pickerInput.value.trim(); if(v.length<2){ pickerList.innerHTML=''; return; }
  const r = FutbolDB.query({name:v, limit:8});
  pickerList.innerHTML = r.map(p=>`<div class="picker-item" data-id="${p.id}">${FurbolUI.photo(p,32)}<div><strong>${p.name}</strong></div></div>`).join('');
  pickerList.querySelectorAll('.picker-item').forEach(el=>el.addEventListener('click',()=>commitPicker(el.dataset.id)));
});

function commitPicker(pid){
  const p = FutbolDB.getAll().find(x=>x.id===pid);
  if(!p || !openCell) return;

  // 1. No repetir jugadores
  if(board.flat().some(cell => cell && cell.player && cell.player.id === pid)) {
    pickerInput.placeholder = 'Ya has usado a este jugador';
    pickerInput.value=''; pickerList.innerHTML='';
    return;
  }

  const r=openCell.r, c=openCell.c;
  const ok = rows[r].check(p) && cols[c].check(p);
  if(ok){
    // 2. Comprobar si al usar este jugador bloqueamos otra celda que solo se puede resolver con él
    const allPlayers = FutbolDB.getAll();
    const usedIds = new Set(board.flat().filter(Boolean).map(v=>v.player.id));
    usedIds.add(pid);
    
    let blocksOtherCell = false;
    for(let i=0; i<3; i++){
      for(let j=0; j<3; j++){
        if(i===r && j===c) continue;
        if(board[i][j]) continue;
        
        // Verificamos si la celda i,j todavía tiene algún jugador válido
        const hasValid = allPlayers.some(x => !usedIds.has(x.id) && rows[i].check(x) && cols[j].check(x));
        if(!hasValid) { blocksOtherCell = true; break; }
      }
      if(blocksOtherCell) break;
    }

    if(blocksOtherCell) {
      pickerInput.placeholder = '⚠ Mejor ponlo en otra casilla (es la única opción allí)';
      pickerInput.value=''; pickerList.innerHTML='';
      return;
    }

    board[r][c] = { player: p, who: turn };
    closePicker();
    if(mode==='vs'){ turn = 1-turn; updateTurnInfo(); }
    render();
  } else {
    if(mode==='vs'){
      pickerInput.placeholder = '✗ No vale, pierdes turno';
      setTimeout(()=>{ turn = 1-turn; updateTurnInfo(); closePicker(); render(); }, 900);
    } else {
      pickerInput.placeholder = '✗ No cumple, prueba otro';
      pickerInput.value=''; pickerList.innerHTML='';
    }
  }
}

function checkWinVS(){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const flat = board.flat();
  for(const l of lines){
    const [a,b,c]=l;
    if(flat[a]&&flat[b]&&flat[c]&&flat[a].who===flat[b].who&&flat[b].who===flat[c].who) return flat[a].who;
  }
  return null;
}

function giveUp(){
  if(gameOver || mode!=='solo') return;
  gameOver = true;
  document.getElementById('btn-giveup').style.display='none';
  const allPlayers = FutbolDB.getAll();
  const usedIds = new Set(board.flat().filter(Boolean).map(v=>v.player.id));
  for(let r=0;r<3;r++){
    for(let c=0;c<3;c++){
      if(board[r][c]) continue;
      const match = allPlayers.find(p => !usedIds.has(p.id) && rows[r].check(p) && cols[c].check(p));
      if(match){
        board[r][c] = { player: match, who: -1, surrender: true };
        usedIds.add(match.id);
      }
    }
  }
  // Re-render con celdas rojas
  let html = '<div class="grid-head"></div>';
  for(const co of cols) html += `<div class="grid-head">${headerHTML(co)}</div>`;
  for(let r=0;r<3;r++){
    html += `<div class="grid-head">${headerHTML(rows[r])}</div>`;
    for(let c=0;c<3;c++){
      const v = board[r][c];
      if(v && v.surrender){
        html += `<div class="grid-cell surrender"><img class="face" src="${FutbolDB.photoOf(v.player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(v.player)}'" title="${v.player.name}"><div class="surr-name">${v.player.name.split(' ').pop()}</div></div>`;
      } else if(v){
        html += `<div class="grid-cell locked"><img class="face" src="${FutbolDB.photoOf(v.player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(v.player)}'" title="${v.player.name}"></div>`;
      } else {
        html += `<div class="grid-cell"></div>`;
      }
    }
  }
  gridEl.innerHTML = html;
  const filled = board.flat().filter(v=>v&&!v.surrender).length;
  endEl.className='end-overlay-common fail';
  endEl.innerHTML=`<h2>Te has rendido</h2><p style="color:var(--text-secondary);margin-bottom:8px;">Acertaste ${filled}/9 casillas</p><button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Nueva grid</button>`;
  endEl.style.display='block';
}

function finishSolo(){
  gameOver=true;
  document.getElementById('btn-giveup').style.display='none';
  const s=loadS(); if((s.bestSolo||0)<1) s.bestSolo=1; saveS(s);
  endEl.className='end-overlay-common win';
  endEl.innerHTML=`<h2>¡Grid completo! 🎉</h2><button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Nueva grid</button>`;
  endEl.style.display='block';
}
function finishVS(winner){
  gameOver=true;
  endEl.className='end-overlay-common '+(winner==='draw'?'fail':'win');
  endEl.innerHTML=`<h2>${winner==='draw'?'Empate':(winner===0?'🔵 Jugador 1 gana':'🔴 Jugador 2 gana')}</h2><button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Otra partida</button>`;
  endEl.style.display='block';
}

document.getElementById('btn-new').addEventListener('click', ()=>init());
document.getElementById('btn-giveup').addEventListener('click', ()=>giveUp());
document.querySelectorAll('.level-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.level-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  mode = b.dataset.mode;
  init();
}));
document.addEventListener('DOMContentLoaded', ()=>init());
