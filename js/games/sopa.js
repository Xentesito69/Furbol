/** sopa.js — Sopa de letras. Sin fotos en pistas. Botón rendirse. Muestra pendientes en rojo. */
const KEY='furbol.sopa';
const LEVELS = {
  easy:   { size: 10, count: 6,  label: 'Fácil' },
  medium: { size: 13, count: 8,  label: 'Medio' },
  hard:   { size: 16, count: 12, label: 'Difícil' },
};
let level='easy', grid, words, found, selStart=null, selEnd=null, gaveUp=false;
const gridEl=document.getElementById('grid'),cluesEl=document.getElementById('clues'),
  endEl=document.getElementById('end'), chipFound=document.getElementById('chip-found'),
  chipTotal=document.getElementById('chip-total');

function loadS(){return FurbolUI.loadStats(KEY,{wins:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'');}

function getSurname(p){
  const parts = p.name.split(/\s+/);
  return parts[parts.length-1];
}

function clueFor(p){
  const opts = [];
  opts.push({text:`Juega en ${p.club}`});
  opts.push({text:`${p.nationality} · ${p.position.toLowerCase()}`});
  opts.push({text:`${p.position} de ${p.age} años`});
  if(p.formerClubs && p.formerClubs.length){
    opts.push({text:`Pasó por ${p.formerClubs.slice(0,2).join(', ')}`});
    opts.push({text:`Empezó en ${p.formerClubs[p.formerClubs.length-1]}`});
  }
  if(p.marketValue >= 50_000_000){
    opts.push({text:`Vale ${FutbolDB.formatValue(p.marketValue)}`});
  }
  return opts[Math.floor(Math.random()*opts.length)];
}

function makeGrid(size, count){
  const players=[]; const surnames=[]; const seen=new Set();
  let tries=0;
  while(players.length<count && tries++<300){
    const p = FutbolDB.random();
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
    for(let t=0; t<300 && !ok; t++){
      const dir = directions[Math.floor(Math.random()*directions.length)];
      const r0 = Math.floor(Math.random()*size);
      const c0 = Math.floor(Math.random()*size);
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
      placed.push({ word, player, cells, clue: clueFor(player), surname: getSurname(player) });
      ok = true;
    }
  }
  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!grid[r][c]) grid[r][c]=alphabet[Math.floor(Math.random()*alphabet.length)];
  return placed;
}

async function init(){
  await FutbolDB.load();
  const lvl = LEVELS[level];
  words = makeGrid(lvl.size, lvl.count);
  found = new Set();
  gaveUp = false;
  endEl.style.display='none';
  gridEl.style.gridTemplateColumns = `repeat(${lvl.size}, 1fr)`;
  gridEl.style.fontSize = (lvl.size>=14 ? '0.7rem' : (lvl.size>=12 ? '0.78rem' : '0.92rem'));
  chipTotal.textContent = lvl.count;
  chipFound.textContent = '0';
  render();
}
window.init=init;

function render(){
  gridEl.innerHTML='';
  const size = LEVELS[level].size;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const d=document.createElement('div'); d.className='sopa-cell'; d.dataset.r=r; d.dataset.c=c;
    d.textContent=grid[r][c];
    // Encontradas en verde
    for(const w of words){
      if(found.has(w.word) && w.cells.some(([rr,cc])=>rr===r&&cc===c)){
        d.classList.add('found'); break;
      }
    }
    // Pendientes reveladas en rojo (tras rendirse)
    if(gaveUp){
      for(const w of words){
        if(!found.has(w.word) && w.cells.some(([rr,cc])=>rr===r&&cc===c)){
          d.classList.add('missed'); break;
        }
      }
    }
    gridEl.appendChild(d);
  }

  // Pistas: solo texto, sin foto. Al acertar, mostrar foto + apellido
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
    el.addEventListener('mousedown',e=>{e.preventDefault();dragging=true; selStart=el; selEnd=el; updateSel();});
    el.addEventListener('mouseenter',()=>{ if(dragging){ selEnd=el; updateSel(); }});
    el.addEventListener('touchstart',e=>{e.preventDefault(); dragging=true; selStart=el; selEnd=el; updateSel();},{passive:false});
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
  if(hit){ found.add(hit.word); chipFound.textContent=found.size; render(); if(found.size===words.length) finish(false); }
  selStart=selEnd=null;
}

function giveUp(){
  if(gaveUp) return;
  gaveUp=true;
  render();
  // Mostrar panel de resultado
  endEl.className='end-overlay-common fail';
  endEl.innerHTML=`<h2>Te has rendido 😅</h2>
    <p style="color:var(--text-secondary);">Encontraste <strong>${found.size}</strong>/${words.length}. Las que faltaban están en rojo.</p>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Nueva sopa</button>`;
  endEl.style.display='block';
}
window.giveUp=giveUp;

function finish(surrendered){
  if(!surrendered){
    const s=loadS(); s.wins=(s.wins||0)+1; saveS(s); if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
    endEl.className='end-overlay-common win';
    endEl.innerHTML=`<h2>¡Sopa completa! 🎉</h2><p style="color:var(--text-secondary);">Encontraste a los ${words.length} jugadores.</p><button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Otra sopa</button>`;
    endEl.style.display='block';
  }
}

document.getElementById('btn-new').addEventListener('click', init);
// Botón rendirse (se inyecta en HTML si existe, o se añade dinámicamente)
const giveUpBtn = document.getElementById('btn-giveup');
if(giveUpBtn) giveUpBtn.addEventListener('click', giveUp);

document.querySelectorAll('.level-btn').forEach(b=>b.addEventListener('click', ()=>{
  document.querySelectorAll('.level-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  level = b.dataset.l;
  init();
}));
document.addEventListener('DOMContentLoaded', init);

