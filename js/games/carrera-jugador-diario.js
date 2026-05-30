/** carrera-jugador-diario.js */
const KEY = 'furbol.carrera-jugador-diario';
const MAX_LIVES = 3;

let target, careerClubs, gameOver = false, selectedId = null, lives = MAX_LIVES;
let todayKey, historyRec;

const careerEl=document.getElementById('career'),inp=document.getElementById('cj-input'),
  sug=document.getElementById('sug-box'),endEl=document.getElementById('end'),
  dayInfo=document.getElementById('day-info'),heartsEl=document.getElementById('hearts'),
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

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 71 + 3);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo jugador para todos`;

  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas' && p.formerClubs && p.formerClubs.length >= 2 && p.marketValue >= 5000000);
  all.sort((a,b)=>a.id.localeCompare(b.id)); 
  
  const targetIdx = Math.floor(rnd() * all.length);
  target = all[targetIdx];
  
  careerClubs = [...(target.formerClubs||[])].reverse().concat([target.club]);

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
    showEnd(historyRec.won);
  } else {
    inp.disabled = false;
  }
}

function render(){
  careerEl.innerHTML = careerClubs.map((c,i)=>{
    const sample = FutbolDB.getAll().find(x=>x.club===c);
    const crestUrl = (sample && FutbolDB.crestOf(sample)) || (FutbolDB.crestByName && FutbolDB.crestByName(c)) || null;
    const crest = crestUrl ? `<img class="crest-mini" src="${crestUrl}" onerror="this.onerror=null;this.style.display='none'">` : '⚽';
    const isLast = i===careerClubs.length-1;
    return `<div class="career-item">${i+1}. ${crest} <span>${c}</span>${isLast?' <span style="color:var(--accent-blue);font-size:0.78rem;margin-left:auto;">actual</span>':''}</div>`;
  }).join('');
}

// autocomplete
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
  
  if(p.id===target.id) {
    historyRec.done = true;
    historyRec.won = true;
    const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    gameOver = true;
    if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
    searchContainer.style.display = 'none';
    showEnd(true);
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
      showEnd(false);
    } else {
      const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    }
  }
}

function showEnd(won){
  let squares = '';
  for(let i=0; i<historyRec.mistakes.length; i++) squares += '🟥';
  if (won) squares += '🟩';
  
  const shareText = `Furbol Carrera Diaria ${won ? historyRec.mistakes.length + 1 : 'X'}/3\n\n${squares}`;
  
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML=`<h2>${won?'¡Correcto!':'Se acabaron las vidas'}</h2>
    <div style="display:flex;gap:14px;align-items:center;justify-content:center;margin:10px 0;">
      ${FurbolUI.photo(target,72)}
      <div style="text-align:left;"><div style="font-family:var(--font-main);font-weight:800;font-size:1.2rem;">${target.name}</div></div>
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
