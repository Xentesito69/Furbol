/** 4-companeros-diario.js */
const KEY='furbol.4comp-diario';
const MAX_LIVES = 3;

let target, four, gameOver=false, selectedId=null, lives=MAX_LIVES;
let todayKey, historyRec;

const quadEl=document.getElementById('quad'), inp=document.getElementById('cc-input'),
  sug=document.getElementById('sug-box'), endEl=document.getElementById('end'),
  dayInfo=document.getElementById('day-info'), heartsEl=document.getElementById('hearts'),
  searchContainer=document.getElementById('search-container');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function renderHearts() {
  let html = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    html += `<span class="heart ${i >= lives ? 'lost' : ''}">❤️</span>`;
  }
  heartsEl.innerHTML = html;
}

function clubsOf(p){ return new Set([p.club, ...(p.formerClubs||[])]); }

function seededShuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 11 + 55);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas');
  all.sort((a,b)=>a.id.localeCompare(b.id));
  
  let mates = [];
  let tries = 0;
  while(tries++ < 200) {
    const tIdx = Math.floor(rnd() * all.length);
    const potentialTarget = all[tIdx];
    const tClubs = clubsOf(potentialTarget);
    if(tClubs.size < 2) continue;
    
    const candidates = all.filter(p => {
      if(p.id === potentialTarget.id) return false;
      const pClubs = clubsOf(p);
      for(const c of pClubs) if(tClubs.has(c)) return true;
      return false;
    });
    
    if(candidates.length < 4) continue;
    
    target = potentialTarget;
    seededShuffle(candidates, rnd);
    mates = candidates.slice(0,4);
    break;
  }
  
  four = mates;
  
  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      done: false,
      won: false,
      mistakes: []
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  gameOver = historyRec.done;
  lives = MAX_LIVES - historyRec.mistakes.length;

  renderHearts();
  render();
  
  inp.value=''; selectedId=null;
  
  if (gameOver) {
    searchContainer.style.display = 'none';
    showEnd(historyRec.won, null);
  } else {
    inp.disabled = false;
  }
}

function render(){
  quadEl.innerHTML = four.map(p=>`
    <div class="player-tile">${FurbolUI.photo(p,64)}<div class="pname">${p.name}</div></div>
  `).join('');
}

inp.addEventListener('input',()=>{
  if(gameOver)return;
  const v=inp.value.trim(); selectedId=null;
  if(v.length<2){sug.style.display='none';return;}
  const r=FutbolDB.query({name:v,limit:6});
  if(!r.length){sug.style.display='none';return;}
  sug.innerHTML = r.map(p=>`<div class="sug" data-id="${p.id}" data-name="${p.name}">${FurbolUI.flag(p.nationality,18)}<strong>${p.name}</strong></div>`).join('');
  sug.style.display='block';
});
sug.addEventListener('click',e=>{const it=e.target.closest('.sug');if(!it)return; inp.value=it.dataset.name; selectedId=it.dataset.id; sug.style.display='none';});
inp.addEventListener('keydown',e=>{if(e.key==='Enter')guess();});
document.getElementById('btn-guess').addEventListener('click',guess);
document.addEventListener('click', e => { if(!searchContainer.contains(e.target)) sug.style.display='none'; });

function guess(){
  if(gameOver)return;
  let p=null;
  if(selectedId) p=FutbolDB.getAll().find(x=>x.id===selectedId);
  else {const v=inp.value.trim(); if(!v)return; const m=FutbolDB.query({name:v}); if(m.length)p=m[0];}
  if(!p)return;
  
  inp.value=''; selectedId=null; sug.style.display='none';
  
  const tClubs = clubsOf(p);
  const ok = four.every(m=>{
    for(const c of clubsOf(m)) if(tClubs.has(c)) return true;
    return false;
  });
  
  if(ok) {
    historyRec.done = true;
    historyRec.won = true;
    const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    gameOver = true;
    if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
    searchContainer.style.display = 'none';
    showEnd(true, p);
  } else {
    lives--;
    historyRec.mistakes.push(p.name);
    renderHearts();
    
    inp.classList.add('error-shake');
    setTimeout(()=>inp.classList.remove('error-shake'), 400);
    
    if (lives <= 0) {
      historyRec.done = true;
      historyRec.won = false;
      const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
      gameOver = true;
      searchContainer.style.display = 'none';
      showEnd(false, null);
    } else {
      const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    }
  }
}

function showEnd(won, p=null){
  let squares = '';
  for(let i=0; i<historyRec.mistakes.length; i++) squares += '🟥';
  if (won) squares += '🟩';
  
  const shareText = `Furbol 4 Compañeros Diario ${won ? historyRec.mistakes.length + 1 : 'X'}/3\n\n${squares}`;
  const shown = won && p ? p : target;
  
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML=`<h2>${won?'¡Correcto!':'Una posible respuesta'}</h2>
    <p style="color:var(--text-secondary); font-size:0.85rem; margin:0 0 6px;">Pasó por al menos un club en común con cada uno de los 4.</p>
    <div style="display:flex;gap:14px;align-items:center;justify-content:center;margin:10px 0;">
      ${FurbolUI.photo(shown,72)}
      <div style="text-align:left;"><div style="font-family:var(--font-main);font-weight:800;font-size:1.2rem;">${shown.name}</div></div>
    </div>
    <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);

const style = document.createElement('style');
style.innerHTML = `
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }
.error-shake { animation: shake 0.2s ease 2; border-color:var(--accent-red)!important; }
`;
document.head.appendChild(style);
