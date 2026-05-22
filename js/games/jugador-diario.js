/** jugador-diario.js */
const KEY='furbol.jugador-diario';
let p, todayKey, historyRec, gameOver=false;

const profileEl = document.getElementById('profile');
const actionsEl = document.getElementById('actions');
const endEl = document.getElementById('end');
const dayInfo = document.getElementById('day-info');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 88 + 12);
  
  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo jugador para todos`;

  const all = FutbolDB.getAll().filter(x=>x.league!=='Leyendas');
  all.sort((a,b)=>a.id.localeCompare(b.id)); // Deterministic
  p = all[Math.floor(rnd() * all.length)];
  
  renderProfile();
  
  const s = loadS();
  if(!s.history[todayKey]) {
    historyRec = { done: false, won: false };
    s.history[todayKey] = historyRec;
    saveS(s);
  } else {
    historyRec = s.history[todayKey];
    gameOver = historyRec.done;
  }
  
  if(gameOver) {
    actionsEl.style.display = 'none';
    showEnd();
  }
}

function renderProfile(){
  const crest = FutbolDB.crestOf(p);
  const flag = FurbolUI.flag(p.nationality, 20);
  let clubHtml = '';
  if(crest) clubHtml = `<img src="${crest}" onerror="this.onerror=null;this.style.display='none'" style="height:24px;object-fit:contain;"> ${p.club}`;
  else clubHtml = `<span>${FutbolDB.clubEmojiOf(p)}</span> ${p.club}`;
  
  let car = '';
  if(p.formerClubs && p.formerClubs.length){
    car = `<div class="career">
      <div class="career-title">Trayectoria</div>
      <div class="career-list">${p.formerClubs.join(' ➔ ')} ➔ ${p.club}</div>
    </div>`;
  }

  profileEl.innerHTML = `
    <img class="photo" src="${FutbolDB.photoOf(p)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(p)}'" alt="${p.name}">
    <div class="pname">${p.name}</div>
    <div class="pnat">${flag} ${p.nationality}</div>
    <div class="pclub">${clubHtml}</div>
    <div class="meta-row">
      <div class="meta-pill">Posición<strong>${p.position||'-'}</strong></div>
      <div class="meta-pill">Edad<strong>${p.age ? p.age+' años' : '-'}</strong></div>
    </div>
    ${car}
  `;
}

function finish(won) {
  if(gameOver) return;
  gameOver = true;
  historyRec.done = true;
  historyRec.won = won;
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
  
  if(won && window.FurbolAlbum) FurbolAlbum.addPacks(1);
  
  actionsEl.style.display = 'none';
  showEnd();
}

function showEnd() {
  const won = historyRec.won;
  endEl.className='end-overlay-common '+(won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Saber no ocupa lugar! 🧠':'La próxima vez será 😅'}</h2>
    <p style="color:var(--text-secondary); margin-bottom:10px;">${won?'Conocías al jugador del día.':'No conocías al jugador de hoy.'}</p>
    <textarea readonly style="width:100%;height:60px;font-family:monospace;font-size:0.85rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">Furbol Jugador Diario 🕵️\n${p.name}\n${won?'✅ Sí lo conocía':'❌ No lo conocía'}</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.getElementById('btn-yes').addEventListener('click', ()=>finish(true));
document.getElementById('btn-no').addEventListener('click', ()=>finish(false));

document.addEventListener('DOMContentLoaded', init);
