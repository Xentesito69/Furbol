/** sopa-diaria.js */
const KEY='furbol.sopa-diaria';
const SIZE = 16, COUNT = 12;

let grid, words, found, selStart=null, selEnd=null, gameOver=false, gaveUp=false;
let todayKey, historyRec;

const gridEl=document.getElementById('grid'),cluesEl=document.getElementById('clues'),
  endEl=document.getElementById('end'), chipFound=document.getElementById('chip-found'),
  chipTotal=document.getElementById('chip-total'), dayInfo=document.getElementById('day-info');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'');}

function getSurname(p){
  const parts = p.name.split(/\s+/);
  return parts[parts.length-1];
}

function clueFor(p, rnd){
  const opts = [];
  opts.push({text:`Juega en ${p.club}`});
  opts.push({text:`${p.nationality} · ${p.position.toLowerCase()}`});
  opts.push({text:`${p.position} de ${p.age} años`});
  if(p.formerClubs && p.formerClubs.length){
    opts.push({text:`Pasó por ${p.formerClubs.slice(0,2).join(', ')}`});
    opts.push({text:`Empezó en ${p.formerClubs[p.formerClubs.length-1]}`});
  }
  if(p.marketValue >= 50000000){
    opts.push({text:`Vale ${FutbolDB.formatValue(p.marketValue)}`});
  }
  return opts[Math.floor(rnd()*opts.length)];
}

function makeGrid(size, count, rnd){
  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas');
  all.sort((a,b)=>a.id.localeCompare(b.id));

  const players=[]; const surnames=[]; const seen=new Set();
  let tries=0;
  while(players.length<count && tries++<500){
    const idx = Math.floor(rnd() * all.length);
    const p = all[idx];
    const sur = normalize(getSurname(p));
    if(sur.length<4 || sur.length>size-2 || seen.has(sur)) continue;
    seen.add(sur);
    players.push(p);
    surnames.push(sur);
  }
  
  grid = Array.from({length:size},()=>Array(size).fill(''));
  const directions = [[0,1],[1,0],[1,1],[-1,1]];
  const placed = [];
  
  for(let idx=0; idx<surnames.length; idx++){
    const word = surnames[idx]; const player = players[idx];
    let ok = false;
    for(let t=0; t<500 && !ok; t++){
      const dir = directions[Math.floor(rnd()*directions.length)];
      const r0 = Math.floor(rnd()*size);
      const c0 = Math.floor(rnd()*size);
      const r1 = r0 + dir[0]*(word.length-1);
      const c1 = c0 + dir[1]*(word.length-1);
      if(r1<0||r1>=size||c1<0||c1>=size) continue;
      
      let canPlace=true;
      for(let i=0;i<word.length;i++){
        const r=r0+dir[0]*i, c=c0+dir[1]*i;
        if(grid[r][c] && grid[r][c]!==word[i]) { canPlace=false; break; }
      }
      if(!canPlace) continue;
      
      const cells=[];
      for(let i=0;i<word.length;i++){
        const r=r0+dir[0]*i, c=c0+dir[1]*i;
        grid[r][c]=word[i]; cells.push([r,c]);
      }
      placed.push({ word, player, cells, clue: clueFor(player, rnd), surname: getSurname(player) });
      ok = true;
    }
  }
  
  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!grid[r][c]) grid[r][c]=alphabet[Math.floor(rnd()*alphabet.length)];
  return placed;
}

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 33 + 77);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  words = makeGrid(SIZE, COUNT, rnd);
  found = new Set();
  
  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      done: false,
      won: false,
      found: []
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  gameOver = historyRec.done;
  gaveUp = gameOver && !historyRec.won;
  
  for(const w of historyRec.found) found.add(w);
  
  endEl.style.display='none';
  gridEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  gridEl.style.fontSize = '0.7rem';
  chipTotal.textContent = COUNT;
  chipFound.textContent = found.size;
  
  render();
  
  if (gameOver) {
    if (historyRec.won) finish(false);
    else finish(true);
  }
}

function render(){
  gridEl.innerHTML='';
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const d=document.createElement('div'); d.className='sopa-cell'; d.dataset.r=r; d.dataset.c=c;
    d.textContent=grid[r][c];
    for(const w of words){
      if(found.has(w.word) && w.cells.some(([rr,cc])=>rr===r&&cc===c)){
        d.classList.add('found'); break;
      }
    }
    if(gaveUp){
      for(const w of words){
        if(!found.has(w.word) && w.cells.some(([rr,cc])=>rr===r&&cc===c)){
          d.classList.add('missed'); break;
        }
      }
    }
    gridEl.appendChild(d);
  }

  cluesEl.innerHTML = words.map((w)=>{
    const done = found.has(w.word);
    const missed = gaveUp && !done;
    let inner = '';
    if(done){
      inner = `${FurbolUI.photo(w.player, 34)}<div class="clue-text"><strong>${w.surname}</strong> ✓</div>`;
    } else if(missed){
      inner = `${FurbolUI.photo(w.player, 34)}<div class="clue-text" style="color:var(--accent-red);"><strong>${w.surname}</strong> ✗</div>`;
    } else {
      inner = `<div class="clue-icon">?</div><div class="clue-text">${w.clue.text}</div>`;
    }
    return `<div class="clue-item ${done?'done':''} ${missed?'missed':''}">${inner}</div>`;
  }).join('');
  bindDrag();
}

function bindDrag(){
  let dragging=false;
  gridEl.querySelectorAll('.sopa-cell').forEach(el=>{
    el.addEventListener('mousedown',e=>{if(gameOver)return; e.preventDefault();dragging=true; selStart=el; selEnd=el; updateSel();});
    el.addEventListener('mouseenter',()=>{ if(gameOver)return; if(dragging){ selEnd=el; updateSel(); }});
    el.addEventListener('touchstart',e=>{if(gameOver)return; e.preventDefault(); dragging=true; selStart=el; selEnd=el; updateSel();},{passive:false});
  });
  document.onmouseup=()=>{ if(dragging){ dragging=false; commitSel(); }};
  gridEl.ontouchmove=e=>{
    if(!dragging) return;
    const t=e.touches[0];
    const target=document.elementFromPoint(t.clientX,t.clientY);
    if(target && target.classList.contains('sopa-cell')){ selEnd=target; updateSel(); }
  };
  gridEl.ontouchend=()=>{ if(dragging){ dragging=false; commitSel(); }};
}

function cellsBetween(a,b){
  const r1=+a.dataset.r,c1=+a.dataset.c,r2=+b.dataset.r,c2=+b.dataset.c;
  const dr=Math.sign(r2-r1), dc=Math.sign(c2-c1);
  const len=Math.max(Math.abs(r2-r1),Math.abs(c2-c1))+1;
  if((r1!==r2 && c1!==c2) && Math.abs(r2-r1)!==Math.abs(c2-c1)) return null;
  const out=[];
  for(let i=0;i<len;i++) out.push([r1+dr*i, c1+dc*i]);
  return out;
}

function updateSel(){
  gridEl.querySelectorAll('.sel').forEach(el=>el.classList.remove('sel'));
  if(!selStart||!selEnd) return;
  const cells=cellsBetween(selStart,selEnd);
  if(!cells) return;
  for(const [r,c] of cells){
    const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if(el) el.classList.add('sel');
  }
}

function commitSel(){
  if(!selStart||!selEnd){ return; }
  const cells=cellsBetween(selStart,selEnd);
  if(!cells){ updateSel(); selStart=selEnd=null; return; }
  const word=cells.map(([r,c])=>grid[r][c]).join('');
  const wordRev=word.split('').reverse().join('');
  const hit = words.find(w => !found.has(w.word) && (w.word===word || w.word===wordRev));
  gridEl.querySelectorAll('.sel').forEach(el=>el.classList.remove('sel'));
  
  if(hit){ 
    found.add(hit.word);
    historyRec.found.push(hit.word);
    const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    
    chipFound.textContent=found.size; 
    render(); 
    if(found.size===words.length) {
      historyRec.done = true;
      historyRec.won = true;
      s.history[todayKey] = historyRec; saveS(s);
      gameOver = true;
      if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
      finish(false);
    }
  }
  selStart=selEnd=null;
}

function giveUp(){
  if(gaveUp || gameOver) return;
  gaveUp=true;
  gameOver=true;
  
  historyRec.done = true;
  historyRec.won = false;
  const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
  
  render();
  finish(true);
}
window.giveUp=giveUp;

function finish(surrendered){
  const shareText = `Furbol Sopa Diaria ${surrendered ? 'Me rendí' : 'Completada'} (${found.size}/${words.length})`;
  
  if(surrendered){
    endEl.className='end-overlay-common fail';
    endEl.innerHTML=`<h2>Te has rendido 😅</h2>
      <p style="color:var(--text-secondary);">Encontraste <strong>${found.size}</strong>/${words.length}. Las que faltaban están en rojo.</p>
      <textarea readonly style="width:100%;height:40px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
      <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
    endEl.style.display='block';
  } else {
    endEl.className='end-overlay-common win';
    endEl.innerHTML=`<h2>¡Sopa completa! 🎉</h2>
      <p style="color:var(--text-secondary);">Encontraste a los ${words.length} jugadores.</p>
      <textarea readonly style="width:100%;height:40px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
      <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
    endEl.style.display='block';
  }
}

document.getElementById('btn-giveup').addEventListener('click', giveUp);
document.addEventListener('DOMContentLoaded', init);
