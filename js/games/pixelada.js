/** pixelada.js — Foto que se va desbloqueando con el tiempo. */
const KEY='furbol.pixelada';
let target, level, timer, gameOver, streak=0, selectedId=null;
const img=document.getElementById('pix-img'), chipLevel=document.getElementById('chip-level'),
  chipWins=document.getElementById('chip-wins'), chipStreak=document.getElementById('chip-streak'),
  inp=document.getElementById('pix-input'), sug=document.getElementById('sug-box'),
  endEl=document.getElementById('end');

function loadS(){return FurbolUI.loadStats(KEY,{wins:0,streak:0,best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){const s=loadS(); chipWins.textContent=s.wins; chipStreak.textContent=s.best;}

async function init(){
  await FutbolDB.load();
  // Solo jugadores con foto real disponible
  const conFoto = FutbolDB.getAll().filter(p => p.photo && p.photo.trim() !== '');
  target = conFoto[Math.floor(Math.random() * conFoto.length)];
  level = 12; // px size (scaled up)
  gameOver=false;
  endEl.style.display='none';
  
  // Disable transition temporarily to apply the initial blur instantly
  img.style.transition = 'none';
  applyLevel();
  
  img.src = target.photo;
  img.onerror = () => { img.onerror=null; img.src = FutbolDB.avatarOf(target); };
  
  // Force reflow and restore transition
  void img.offsetHeight;
  setTimeout(() => { img.style.transition = ''; }, 50);

  refresh();
  inp.value=''; selectedId=null; inp.focus();
  clearInterval(timer);
  timer = setInterval(()=>{ if(gameOver)return; level=Math.max(1,level-1); applyLevel(); if(level===1){clearInterval(timer);} },4000);
  console.log('🤫 (Debug)', target.name);
}
window.init=init;

function applyLevel(){
  // level=12 → muy pixelado; level=1 → casi nítido
  const pct = Math.round(level/12*100);
  chipLevel.textContent = pct + '%';
  // Truco: aplicar transform scale + filter blur para simular pixelación progresiva
  img.style.filter = `blur(${level*1.5}px) contrast(${1 + level*0.05})`;
  img.style.transform = `scale(${1 + level*0.03})`;
}

inp.addEventListener('input', ()=>{
  const v = inp.value.trim();
  selectedId=null;
  if(v.length<2){sug.style.display='none'; return;}
  const results = FutbolDB.query({name:v, limit:6});
  if(results.length===0){sug.style.display='none'; return;}
  sug.innerHTML = results.map(p=>`<div class="sug" data-id="${p.id}" data-name="${p.name}">${FurbolUI.flag(p.nationality,18)}<strong>${p.name}</strong><span style="color:var(--text-muted);font-size:0.75rem;">${p.club}</span></div>`).join('');
  sug.style.display='block';
});
sug.addEventListener('click',e=>{
  const it=e.target.closest('.sug'); if(!it)return;
  inp.value=it.dataset.name; selectedId=it.dataset.id; sug.style.display='none';
});
inp.addEventListener('keydown',e=>{if(e.key==='Enter')guess();});
document.getElementById('btn-guess').addEventListener('click',guess);
document.getElementById('btn-skip').addEventListener('click',()=>{ if(gameOver)return; reveal(false); });

function guess(){
  if(gameOver)return;
  let p=null;
  if(selectedId) p=FutbolDB.getAll().find(x=>x.id===selectedId);
  else {
    const v=inp.value.trim(); if(!v)return;
    const m=FutbolDB.query({name:v}); if(m.length)p=m[0];
  }
  if(!p)return;
  if(p.id===target.id) reveal(true);
  else { inp.value=''; selectedId=null; sug.style.display='none'; }
}

function reveal(won){
  gameOver=true; clearInterval(timer);
  img.style.filter='none'; img.style.transform='none';
  const s=loadS();
  if(won){ s.wins++; s.streak++; if(s.streak>s.best)s.best=s.streak;
    // Recompensa: 1 sobre por victoria
    if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  else { s.streak=0; }
  saveS(s); refresh();
  endEl.className = 'end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Bien!':'Era…'}</h2>
    <p style="margin:8px 0; color:var(--text-secondary);">${target.name} — ${FurbolUI.flag(target.nationality,18)} ${target.nationality}<br>${target.club} · ${target.position}</p>
    <button class="btn btn--primary" onclick="init()">Siguiente</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);
