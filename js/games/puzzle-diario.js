/** puzzle-diario.js */
const KEY='furbol.puzzle-diario';
const IMAGES_BASE='../PuzzleImagenes/', IMG_PREFIX='Foto', IMG_EXT='.jpg', IMG_MAX=200;
const cols=8, rows=2; 
const PZ_W=480, PZ_H=240, TRAY_SZ=88;

let currentImg='';
let pieceW=0, pieceH=0, totalPieces=16;
let boardState=[], trayState=[];
let moves=0, secs=0, timerInt=null, solved=false;
let todayKey, historyRec;

let dragSrc=null, clickSel=null, touchGhost=null, touchSrc=null;

const boardEl=document.getElementById('pz-board');
const trayEl=document.getElementById('pz-tray');
const winEl=document.getElementById('pz-win');
const winPhoto=document.getElementById('win-photo');
const winMeta=document.getElementById('win-meta');
const timeEl=document.getElementById('pz-time');
const movesEl=document.getElementById('pz-moves');
const dayInfo=document.getElementById('day-info');

const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const loadS=()=>FurbolUI.loadStats(KEY,{history:{}});
const saveS=s=>FurbolUI.saveStats(KEY,s);

function pieceCSS(idx,w,h){
  const c=idx%cols, r=Math.floor(idx/cols);
  return `background-image:url('${currentImg}');background-size:${PZ_W}px ${PZ_H}px;background-position:${-(c*w)}px ${-(r*h)}px;width:${w}px;height:${h}px`;
}
function trayCss(idx){
  const c=idx%cols, r=Math.floor(idx/cols);
  const sx=TRAY_SZ/pieceW, sy=TRAY_SZ/pieceH;
  return `background-image:url('${currentImg}');background-size:${Math.round(PZ_W*sx)}px ${Math.round(PZ_H*sy)}px;background-position:${-Math.round(c*pieceW*sx)}px ${-Math.round(r*pieceH*sy)}px;width:${TRAY_SZ}px;height:${TRAY_SZ}px`;
}

function saveProgress() {
  if(!historyRec) return;
  historyRec.boardState = boardState;
  historyRec.trayState = trayState;
  historyRec.moves = moves;
  historyRec.secs = secs;
  historyRec.won = solved;
  historyRec.done = solved; 
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
}

function performDrop(src, dstType, dstIdx){
  if(solved) return;
  const pieceIdx = src.from==='tray' ? trayState[src.ti] : boardState[src.ci];
  if(pieceIdx==null) return;

  if(dstType==='board'){
    const existing=boardState[dstIdx];
    boardState[dstIdx]=pieceIdx;
    if(src.from==='tray'){
      trayState.splice(src.ti,1);
      if(existing!=null) trayState.push(existing);
    } else {
      boardState[src.ci]= existing!=null ? existing : null;
    }
  } else {
    if(src.from==='board'){
      boardState[src.ci]=null;
      trayState.push(pieceIdx);
    }
  }
  moves++;
  clickSel=null;
  updateHUD(); renderBoard(); renderTray(); 
  saveProgress();
  checkSolved();
}

function renderBoard(){
  boardEl.style.gridTemplateColumns=`repeat(${cols},${pieceW}px)`;
  boardEl.innerHTML='';
  const placed=boardState.filter(v=>v!=null).length;
  document.getElementById('pz-placed').innerHTML=`${placed} / <span id="pz-total">${totalPieces}</span><small>Colocadas</small>`;

  for(let i=0;i<totalPieces;i++){
    const cell=document.createElement('div');
    cell.className='board-cell';
    cell.style.width=pieceW+'px'; cell.style.height=pieceH+'px';
    cell.dataset.idx=i;

    const v=boardState[i];
    if(v!=null){
      const inner=document.createElement('div');
      inner.className='piece-inner';
      inner.style.cssText=pieceCSS(v,pieceW,pieceH);
      cell.appendChild(inner);
      if(v===i) cell.classList.add('correct');
      cell.draggable=true;
      cell.addEventListener('dragstart',e=>{
        dragSrc={from:'board',ci:i};
        e.dataTransfer.effectAllowed='move';
        e.dataTransfer.setData('text/plain','');
        setTimeout(()=>cell.classList.add('dragging'),0);
      });
      cell.addEventListener('dragend',()=>{ cell.classList.remove('dragging'); clearHL(); dragSrc=null; });
      addTouchDrag(cell,'board',i);
    } else {
      if(clickSel) cell.classList.add('target');
    }

    cell.addEventListener('dragover',e=>{if(dragSrc){e.preventDefault();cell.classList.add('drag-over');}});
    cell.addEventListener('dragleave',e=>{ if(!e.relatedTarget||!cell.contains(e.relatedTarget)) cell.classList.remove('drag-over'); });
    cell.addEventListener('drop',e=>{
      e.preventDefault(); cell.classList.remove('drag-over');
      if(dragSrc){ const s=dragSrc; dragSrc=null; performDrop(s,'board',i); }
    });
    cell.addEventListener('click',()=>onCellClick(i));
    boardEl.appendChild(cell);
  }
  trayEl.style.maxHeight=Math.max(rows*pieceH+(rows-1)*3+8,180)+'px';
}

function renderTray(){
  trayEl.innerHTML='';
  trayState.forEach((pidx,ti)=>{
    const div=document.createElement('div');
    div.className='tray-piece'+(clickSel&&clickSel.from==='tray'&&clickSel.ti===ti?' selected':'');
    div.style.cssText=trayCss(pidx);
    div.dataset.ti=ti;
    div.draggable=true;
    div.addEventListener('dragstart',e=>{
      dragSrc={from:'tray',ti};
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain','');
      setTimeout(()=>div.style.opacity='0.4',0);
    });
    div.addEventListener('dragend',()=>{ div.style.opacity=''; clearHL(); dragSrc=null; });
    div.addEventListener('click',()=>onTrayClick(ti));
    addTouchDrag(div,'tray',ti);
    trayEl.appendChild(div);
  });

  const panel=trayEl.parentElement;
  panel.addEventListener('dragover',e=>{if(dragSrc&&dragSrc.from==='board'){e.preventDefault();panel.classList.add('drag-over');}});
  panel.addEventListener('dragleave',e=>{ if(!panel.contains(e.relatedTarget)) panel.classList.remove('drag-over'); });
  panel.addEventListener('drop',e=>{
    e.preventDefault(); panel.classList.remove('drag-over');
    if(dragSrc&&dragSrc.from==='board'){ const s=dragSrc; dragSrc=null; performDrop(s,'tray',0); }
  });
}

function onTrayClick(ti){
  if(solved) return;
  clickSel = (clickSel&&clickSel.from==='tray'&&clickSel.ti===ti) ? null : {from:'tray',ti};
  renderBoard(); renderTray();
}
function onCellClick(ci){
  if(solved) return;
  if(clickSel){
    if(clickSel.from==='board'&&clickSel.ci===ci){ clickSel=null; renderBoard(); renderTray(); return; }
    performDrop(clickSel,'board',ci);
  } else if(boardState[ci]!=null){
    clickSel={from:'board',ci};
    renderBoard(); renderTray();
  }
}

function addTouchDrag(el, from, idx){
  el.addEventListener('touchstart',e=>{
    if(solved) return;
    e.preventDefault();
    touchSrc=from==='tray'?{from,ti:idx}:{from,ci:idx};
    const touch=e.touches[0], rect=el.getBoundingClientRect();
    touchGhost=document.createElement('div');
    touchGhost.style.cssText=el.style.cssText+
      `;position:fixed;z-index:9999;pointer-events:none;opacity:0.85;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:scale(1.12);transition:none;left:${touch.clientX-rect.width/2}px;top:${touch.clientY-rect.height/2}px`;
    document.body.appendChild(touchGhost);
    el.style.opacity='0.3';
  },{passive:false});

  el.addEventListener('touchmove',e=>{
    if(solved) return;
    e.preventDefault();
    if(!touchGhost) return;
    const t=e.touches[0];
    const w=parseInt(touchGhost.style.width), h=parseInt(touchGhost.style.height);
    touchGhost.style.left=(t.clientX-w/2)+'px';
    touchGhost.style.top=(t.clientY-h/2)+'px';
    clearHL();
    touchGhost.style.pointerEvents='none';
    const target=document.elementFromPoint(t.clientX,t.clientY);
    target?.closest('.board-cell')?.classList.add('drag-over');
  },{passive:false});

  el.addEventListener('touchend',e=>{
    if(solved) return;
    e.preventDefault();
    touchGhost?.remove(); touchGhost=null;
    el.style.opacity='';
    clearHL();
    if(!touchSrc) return;
    const src=touchSrc; touchSrc=null;
    const t=e.changedTouches[0];
    const target=document.elementFromPoint(t.clientX,t.clientY);
    const bc=target?.closest('.board-cell');
    const tp=target?.closest('.tray-panel');
    if(bc) performDrop(src,'board',+bc.dataset.idx);
    else if(tp&&src.from==='board') performDrop(src,'tray',0);
  },{passive:false});
}

function clearHL(){ document.querySelectorAll('.drag-over').forEach(e=>e.classList.remove('drag-over')); }

function updateHUD(){
  timeEl.firstChild.textContent=fmt(secs);
  movesEl.firstChild.textContent=moves;
}

function checkSolved(){
  if(boardState.some(v=>v==null)||!boardState.every((v,i)=>v===i)) return;
  
  if(!solved) {
    solved=true; clearInterval(timerInt);
    historyRec.done = true;
    historyRec.won = true;
    saveProgress();
    if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  
  winPhoto.src=currentImg;
  winMeta.innerHTML=`⏱ <strong>${fmt(secs)}</strong> · 🔀 <strong>${moves}</strong> movimientos`;
  setTimeout(()=>winEl.classList.add('show'),400);
}

function seededShuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let imageSrcs=[];

async function discoverImages(){
  if(imageSrcs.length) return;
  const res=await Promise.all(
    Array.from({length:IMG_MAX},(_,i)=>i+1).map(i=>{
      const url=`${IMAGES_BASE}${IMG_PREFIX}${i}${IMG_EXT}`;
      return new Promise(r=>{const img=new Image();img.onload=()=>r(url);img.onerror=()=>r(null);img.src=url;});
    })
  );
  imageSrcs=res.filter(Boolean);
}

async function startNew(){
  winEl.classList.remove('show');
  clearInterval(timerInt);
  clickSel=null; dragSrc=null;

  await discoverImages();
  if(!imageSrcs.length){ boardEl.innerHTML='<p style="color:red;padding:20px">No hay imágenes en PuzzleImagenes/</p>'; return; }

  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 44 + 88);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · la misma imagen para todos`;

  const validIdx = Math.floor(rnd() * imageSrcs.length);
  currentImg = imageSrcs[validIdx];
  
  pieceW=Math.floor(PZ_W/cols);
  pieceH=Math.floor(PZ_H/rows);

  const s = loadS();
  if (!s.history[todayKey]) {
    boardState=Array(totalPieces).fill(null);
    let arr = [...Array(totalPieces).keys()];
    trayState=seededShuffle(arr, rnd);
    s.history[todayKey] = {
      done: false, won: false,
      boardState, trayState, moves:0, secs:0
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  boardState = historyRec.boardState;
  trayState = historyRec.trayState;
  moves = historyRec.moves;
  secs = historyRec.secs;
  solved = historyRec.won;

  updateHUD(); renderBoard(); renderTray();
  
  if (solved) {
    checkSolved();
  } else {
    timerInt=setInterval(()=>{ secs++; updateHUD(); if(secs%5===0)saveProgress(); },1000);
  }
}

function reshuffle(){
  if(solved) return;
  boardState.forEach((v,i)=>{ if(v!=null){ trayState.push(v); boardState[i]=null; }});
  
  trayState=FurbolUI.shuffle(trayState);
  clickSel=null; renderBoard(); renderTray();
  saveProgress();
}

document.getElementById('btn-shuffle').addEventListener('click',reshuffle);

document.getElementById('btn-share').addEventListener('click', function() {
  const text = `Furbol Puzzle Diario 🧩\n⏱ ${fmt(secs)}\n🔀 ${moves} movimientos\n🟩 Completado`;
  if(navigator.clipboard) {
    navigator.clipboard.writeText(text);
    this.textContent = 'Copiado ✓';
  }
});

document.addEventListener('DOMContentLoaded',startNew);
