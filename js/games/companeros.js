/**
 * companeros.js — ¿Coincidieron en el mismo club? Sí / No.
 * Usa el historial (club + formerClubs) de cada jugador.
 */

const STORAGE_KEY = 'furbol.companeros';
const START_LIVES = 3;

let lives, streak, gameOver;
let pairA, pairB, sharedNow;

const pairEl   = document.getElementById('pair');
const btnYes   = document.getElementById('btn-yes');
const btnNo    = document.getElementById('btn-no');
const verdictEl= document.getElementById('verdict');
const livesRow = document.getElementById('lives-row');
const chipStreak = document.getElementById('chip-streak');
const chipBest = document.getElementById('chip-best');
const endEl    = document.getElementById('end-overlay');
const endSum   = document.getElementById('end-summary');

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { best: 0, plays: 0 }; }
  catch { return { best: 0, plays: 0 }; }
}
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function refreshChips() {
  chipStreak.textContent = streak;
  chipBest.textContent = loadStats().best;
}

function renderLives() {
  livesRow.innerHTML = '';
  for (let i = 0; i < START_LIVES; i++) {
    const s = document.createElement('span');
    s.className = 'life' + (i < (START_LIVES - lives) ? ' lost' : '');
    s.textContent = '❤️';
    livesRow.appendChild(s);
  }
}

async function startComp() {
  await FutbolDB.load();
  lives = START_LIVES; streak = 0; gameOver = false;
  endEl.style.display = 'none';
  verdictEl.style.display = 'none';
  btnYes.disabled = false; btnNo.disabled = false;
  renderLives(); refreshChips();
  newPair();
}
window.startComp = startComp;

function newPair() {
  // Sesgo: 50/50 entre pares que comparten equipo ACTUAL y pares que no
  const wantShared = Math.random() < 0.5;
  let a, b, shared, tries = 0;
  while (tries++ < 150) {
    [a, b] = FutbolDB.randomN(2, { league: undefined });
    if (!a || !b || a.league === 'Leyendas' || b.league === 'Leyendas') continue;
    // Solo equipo ACTUAL — así son compañeros reales
    shared = (a.clubId === b.clubId) ? [a.club] : [];
    if (wantShared && shared.length > 0) break;
    if (!wantShared && shared.length === 0) break;
  }
  pairA = a; pairB = b; sharedNow = shared;
  verdictEl.style.display = 'none';
  renderPair();
}

function photoImg(p) {
  return `<img class="photo" src="${FutbolDB.photoOf(p)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(p)}'" alt="${p.name}">`;
}
function crestSmall(p) {
  const u = FutbolDB.crestOf(p);
  return u ? `<img src="${u}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;">` : FutbolDB.clubEmojiOf(p);
}
function careerLine(p) {
  const clubs = [p.club, ...(p.formerClubs || [])];
  return clubs.slice(0, 6).join(' · ') + (clubs.length > 6 ? '…' : '');
}

function renderPair() {
  pairEl.innerHTML = `
    <div class="pair-card">
      ${photoImg(pairA)}
      <div class="pname">${pairA.name}</div>
    </div>
    <div class="pair-vs">?</div>
    <div class="pair-card">
      ${photoImg(pairB)}
      <div class="pname">${pairB.name}</div>
    </div>
  `;
}

function onChoice(saidYes) {
  if (gameOver) return;
  const correct = (saidYes && sharedNow.length > 0) || (!saidYes && sharedNow.length === 0);
  if (correct) {
    streak++; if (streak % 5 === 0 && window.FurbolAlbum) FurbolAlbum.addPacks(1);
    verdictEl.className = 'verdict right';
    verdictEl.innerHTML = `✓ ¡Correcto! ${sharedNow.length ? `<div class="why">Compañeros en <strong>${sharedNow.join(', ')}</strong> esta temporada.</div>` : `<div class="why">No están en el mismo equipo actualmente.</div>`}`;
    verdictEl.style.display = 'block';
    refreshChips();
    setTimeout(newPair, 1400);
  } else {
    lives--;
    renderLives();
    verdictEl.className = 'verdict wrong';
    verdictEl.innerHTML = `✗ Fallaste. ${sharedNow.length ? `<div class="why">Sí son compañeros en <strong>${sharedNow.join(', ')}</strong>.</div>` : `<div class="why">No están en el mismo equipo actualmente.</div>`}`;
    verdictEl.style.display = 'block';
    if (lives <= 0) gameOverFn();
    else setTimeout(newPair, 1900);
  }
}

function gameOverFn() {
  gameOver = true;
  btnYes.disabled = true; btnNo.disabled = true;
  const s = loadStats(); s.plays++;
  if (streak > s.best) s.best = streak;
  saveStats(s); refreshChips();
  endSum.textContent = `Racha final: ${streak}. Mejor histórica: ${s.best}.`;
  endEl.style.display = 'block';
  endEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

btnYes.addEventListener('click', () => onChoice(true));
btnNo.addEventListener('click', () => onChoice(false));
document.addEventListener('keydown', e => {
  if (gameOver) return;
  if (e.key === 'y' || e.key === 's' || e.key === 'ArrowLeft')  onChoice(true);
  if (e.key === 'n' || e.key === 'ArrowRight') onChoice(false);
});

document.addEventListener('DOMContentLoaded', startComp);

