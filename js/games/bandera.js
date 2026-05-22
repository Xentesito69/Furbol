/**
 * bandera.js — "Bandera → Jugador": adivina cuantos jugadores de una nación
 * puedas en 60 segundos. Usa bandera real y fotos.
 */

const STORAGE_KEY = 'furbol.bandera';
const TIME_LIMIT = 60;

let country, pool, found, missed, timer, secondsLeft, gameOver;

const flagEl    = document.getElementById('big-flag');
const countryEl = document.getElementById('country-name');
const timerEl   = document.getElementById('timer');
const inputEl   = document.getElementById('player-input');
const listEl    = document.getElementById('found-list');
const foundCnt  = document.getElementById('found-count');
const totalCnt  = document.getElementById('total-count');
const endOv     = document.getElementById('end-overlay');
const endSum    = document.getElementById('end-summary');
const missedListEl = document.getElementById('missed-list');
const sugBox    = document.getElementById('sug-box');

// Usa FurbolUI.normalize() de _helpers.js (NFD → sin diacríticos → minúsculas)

function flagHeroHTML(nat) {
  const url = FutbolDB.flagImg(nat, 320);
  if (url) return `<img src="${url}" alt="${nat}" style="width:200px; height:auto; max-height:140px; border-radius:8px; object-fit:cover; box-shadow:0 4px 20px rgba(0,0,0,0.4);">`;
  return `<div style="font-size:5.5rem; line-height:1;">${FutbolDB.flagOf(nat)}</div>`;
}
function crestHTML(player, size = 18) {
  const url = FutbolDB.crestOf(player);
  if (url) return `<img src="${url}" onerror="this.onerror=null;this.style.display=\'none\'" alt="" style="width:${size}px; height:${size}px; object-fit:contain; vertical-align:middle;">`;
  return `<span>${FutbolDB.clubEmojiOf(player)}</span>`;
}
function photoHTML(player, size = 32) {
  return `<img src="${FutbolDB.photoOf(player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(player)}'" alt="${player.name}" style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; flex-shrink:0;">`;
}

async function initFlagGame() {
  await FutbolDB.load();
  clearInterval(timer);
  gameOver = false;

  const allNats = FutbolDB.getNationalities();
  let candidate;
  do {
    candidate = allNats[Math.floor(Math.random() * allNats.length)];
    pool = FutbolDB.query({ nationality: candidate });
  } while (pool.length < 3);

  country = candidate;
  flagEl.innerHTML = flagHeroHTML(country);
  countryEl.textContent = country;
  totalCnt.textContent = pool.length;
  foundCnt.textContent = '0';
  found = [];
  missed = [...pool];

  listEl.innerHTML = '';
  endOv.style.display = 'none';
  sugBox.style.display = 'none';
  inputEl.value = '';
  inputEl.disabled = false;
  inputEl.focus();

  secondsLeft = TIME_LIMIT;
  updateTimer();
  timer = setInterval(() => {
    secondsLeft--;
    updateTimer();
    if (secondsLeft <= 0) endGame();
  }, 1000);
}
window.initFlagGame = initFlagGame;

function updateTimer() {
  timerEl.textContent = secondsLeft;
  timerEl.classList.remove('warning', 'danger');
  if (secondsLeft <= 10) timerEl.classList.add('danger');
  else if (secondsLeft <= 25) timerEl.classList.add('warning');
}

let selectedId = null;

inputEl.addEventListener('input', () => {
  if (gameOver) return;
  const v = inputEl.value.trim();
  selectedId = null;
  if (v.length < 2) { sugBox.style.display = 'none'; return; }
  
  const r = FutbolDB.query({ name: v, limit: 6 });
  if (!r.length) { sugBox.style.display = 'none'; return; }
  
  sugBox.innerHTML = r.map(p => `
    <div class="sug" data-id="${p.id}" data-name="${p.name}">
      ${photoHTML(p, 24)}
      <strong>${p.name}</strong>
      <span style="color:var(--text-muted);font-size:0.8rem;">(${p.club})</span>
    </div>
  `).join('');
  sugBox.style.display = 'block';
});

sugBox.addEventListener('click', e => {
  const it = e.target.closest('.sug');
  if (!it) return;
  inputEl.value = it.dataset.name;
  selectedId = it.dataset.id;
  sugBox.style.display = 'none';
  
  const p = missed.find(x => x.id === selectedId);
  if (p) {
    acceptGuess(p);
  } else {
    inputEl.value = ''; // Incorrecto, limpiamos
    selectedId = null;
  }
});

document.addEventListener('click', e => {
  if(!e.target.closest('.search-wrapper')) sugBox.style.display='none';
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (selectedId) {
      const p = missed.find(x => x.id === selectedId);
      if (p) acceptGuess(p);
      else { inputEl.value = ''; selectedId = null; sugBox.style.display = 'none'; }
      return;
    }
    
    const v = FurbolUI.normalize(inputEl.value);
    if (!v) return;
    const candidates = missed.filter(p =>
      FurbolUI.normalize(p.name).includes(v) ||
      FurbolUI.normalize(p.name.split(/\s+/).pop()).startsWith(v)
    );
    if (candidates.length === 1) acceptGuess(candidates[0]);
    else { inputEl.value = ''; sugBox.style.display = 'none'; }
  }
});

function acceptGuess(p) {
  missed = missed.filter(x => x.id !== p.id);
  found.push(p);
  foundCnt.textContent = found.length;
  inputEl.value = '';
  selectedId = null;
  sugBox.style.display = 'none';
  
  // Bonus de tiempo
  secondsLeft += 3;
  updateTimer();
  
  // Feedback visual +3s
  const p3 = document.createElement('div');
  p3.textContent = '+3s';
  p3.style.cssText = 'position:absolute; color:var(--accent-green); font-weight:bold; font-size:1.2rem; top:0; right:10px; animation:floatUp 1s forwards; pointer-events:none;';
  timerEl.parentElement.appendChild(p3);
  if(!document.getElementById('plus3-anim')) {
    const s = document.createElement('style'); s.id = 'plus3-anim';
    s.innerHTML = `@keyframes floatUp { 0%{opacity:1;transform:translateY(0);} 100%{opacity:0;transform:translateY(-20px);} }`;
    document.head.appendChild(s);
  }
  
  const item = document.createElement('div');
  item.className = 'found-item';
  item.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center;">
      ${photoHTML(p, 36)}
      <div>
        <strong>${p.name}</strong>
        <div class="pmeta" style="display:flex; align-items:center; gap:5px;">${crestHTML(p,14)} ${p.club} · ${p.position}</div>
      </div>
    </div>
    <span style="color:var(--accent-green); font-weight:800;">✓</span>
  `;
  listEl.prepend(item);

  if (missed.length === 0) endGame(true);
}

function endGame(perfect = false) {
  if (gameOver) return;
  gameOver = true;
  clearInterval(timer);
  inputEl.disabled = true;

  let stats;
  try { stats = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { stats = {}; }
  const prev = stats[country] || 0;
  if (found.length > prev) stats[country] = found.length; if(found.length>=5 && window.FurbolAlbum) FurbolAlbum.addPacks(1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));

  document.getElementById('end-title').textContent = perfect ? '¡Perfecto! 🏆' : '¡Tiempo!';
  endSum.innerHTML = `Encontrados <strong>${found.length}</strong> de <strong>${pool.length}</strong> jugadores de ${country}.`;

  if (missed.length) {
    missedListEl.innerHTML = '<div style="font-weight:700; margin-bottom:8px;">Te faltaron:</div>' +
      missed.map(p => `<div class="missed-item" style="display:flex;align-items:center;gap:6px;">${photoHTML(p,24)} ${p.name} <span style="color:var(--text-muted);">(${p.club})</span></div>`).join('');
  } else {
    missedListEl.innerHTML = '<div style="color:var(--accent-green); font-weight:700;">¡Los encontraste a todos!</div>';
  }

  endOv.style.display = 'block';
  endOv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('btn-skip').addEventListener('click', initFlagGame);
document.addEventListener('DOMContentLoaded', initFlagGame);

