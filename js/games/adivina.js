/**
 * adivina.js — Adivina el Jugador. Imágenes reales y persistencia.
 */

const MAX_ATTEMPTS = 8;
const STORAGE_KEY  = 'furbol.adivina';

let targetPlayer    = null;
let attempts        = 0;
let isGameOver      = false;
let selectedPlayerId = null;
let activeSugIdx    = -1;

const searchInput    = document.getElementById('player-search');
const suggestionsBox = document.getElementById('suggestions-box');
const btnGuess       = document.getElementById('btn-guess');
const btnGiveUp      = document.getElementById('btn-give-up');
const guessesGrid    = document.getElementById('guesses-grid');
const winScreen      = document.getElementById('win-screen');
const loseScreen     = document.getElementById('lose-screen');
const attemptsCount  = document.getElementById('attempts-count');
const chipAttempts   = document.getElementById('chip-attempts');
const chipStreak     = document.getElementById('chip-streak');
const chipWins       = document.getElementById('chip-wins');
const toastEl        = document.getElementById('toast');

document.getElementById('max-attempts-label').textContent = MAX_ATTEMPTS;

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { wins:0, plays:0, streak:0, bestStreak:0 }; }
  catch { return { wins:0, plays:0, streak:0, bestStreak:0 }; }
}
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function renderStats() {
  const s = loadStats();
  chipStreak.textContent = s.bestStreak;
  chipWins.textContent   = s.wins;
}
function updateAttemptsChip() { chipAttempts.textContent = `${attempts}/${MAX_ATTEMPTS}`; }

function showToast(msg, type = 'info') {
  toastEl.textContent = msg;
  toastEl.style.borderColor = type === 'error' ? 'rgba(198,40,40,0.6)' : 'var(--border)';
  toastEl.style.opacity = '1';
  toastEl.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(-50%) translateY(10px)';
  }, 2200);
}

async function initGame() {
  await FutbolDB.load();
  targetPlayer = FutbolDB.random();
  console.log("🤫 (Debug) El jugador es:", targetPlayer.name);

  attempts = 0; isGameOver = false;
  searchInput.value = ''; selectedPlayerId = null;
  searchInput.disabled = false; btnGuess.disabled = false;
  winScreen.style.display = 'none'; loseScreen.style.display = 'none';

  const header = guessesGrid.querySelector('.header');
  guessesGrid.innerHTML = '';
  if (header) guessesGrid.appendChild(header);

  updateAttemptsChip();
  renderStats();
  searchInput.focus();
}
window.initGame = initGame;

function flagHTML(nat, size = 24) {
  const url = FutbolDB.flagImg(nat, 40);
  if (url) return `<img src="${url}" alt="${nat}" style="width:${size}px;height:${Math.round(size*0.66)}px;object-fit:cover;border-radius:3px;vertical-align:middle;">`;
  return `<span style="font-size:${size*0.9}px;">${FutbolDB.flagOf(nat)}</span>`;
}
function crestHTML(player, size = 22) {
  const url = FutbolDB.crestOf(player);
  if (url) return `<img src="${url}" onerror="this.onerror=null;this.style.display=\'none\'" alt="" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;">`;
  return `<span>${FutbolDB.clubEmojiOf(player)}</span>`;
}
function photoHTML(player, size = 40) {
  return `<img src="${FutbolDB.photoOf(player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(player)}'" alt="${player.name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;">`;
}

searchInput.addEventListener('input', (e) => {
  if (isGameOver) return;
  const val = e.target.value.trim();
  activeSugIdx = -1;
  if (val.length < 2) {
    suggestionsBox.style.display = 'none';
    selectedPlayerId = null;
    return;
  }
  const results = FutbolDB.query({ name: val, limit: 8 });
  if (results.length > 0) {
    suggestionsBox.innerHTML = results.map((p, i) => `
      <div class="suggestion-item" data-id="${p.id}" data-name="${p.name}" data-idx="${i}">
        ${photoHTML(p, 36)}
        ${flagHTML(p.nationality, 22)}
        <div style="flex:1;">
          <div style="font-weight:600;">${p.name}</div>
          <div class="meta">${p.club} · ${p.position} · ${p.age}</div>
        </div>
      </div>
    `).join('');
    suggestionsBox.style.display = 'block';
  } else {
    suggestionsBox.style.display = 'none';
  }
});

suggestionsBox.addEventListener('click', (e) => {
  const item = e.target.closest('.suggestion-item');
  if (item) {
    searchInput.value = item.dataset.name;
    selectedPlayerId = item.dataset.id;
    suggestionsBox.style.display = 'none';
    searchInput.focus();
  }
});

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.style.display = 'none';
  }
});

searchInput.addEventListener('keydown', (e) => {
  const items = [...suggestionsBox.querySelectorAll('.suggestion-item')];
  if (suggestionsBox.style.display !== 'none' && items.length) {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeSugIdx = (activeSugIdx + 1) % items.length; updateActiveSug(items); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); activeSugIdx = (activeSugIdx - 1 + items.length) % items.length; updateActiveSug(items); return; }
    if (e.key === 'Enter' && activeSugIdx >= 0) { e.preventDefault(); items[activeSugIdx].click(); makeGuess(); return; }
  }
  if (e.key === 'Enter') makeGuess();
  if (e.key === 'Escape') suggestionsBox.style.display = 'none';
});

function updateActiveSug(items) {
  items.forEach((it, i) => it.classList.toggle('active', i === activeSugIdx));
  items[activeSugIdx]?.scrollIntoView({ block: 'nearest' });
}

btnGuess.addEventListener('click', makeGuess);
btnGiveUp.addEventListener('click', () => {
  if (isGameOver) return;
  if (confirm('¿Seguro que quieres rendirte?')) handleLose();
});

function makeGuess() {
  if (isGameOver) return;
  let guessPlayer = null;
  if (selectedPlayerId) {
    guessPlayer = FutbolDB.getAll().find(p => p.id === selectedPlayerId);
  } else {
    const val = searchInput.value.trim();
    if (!val) { showToast('Escribe un nombre primero', 'error'); return; }
    const matches = FutbolDB.query({ name: val });
    if (matches.length > 0) guessPlayer = matches[0];
  }
  if (!guessPlayer) { showToast('Jugador no encontrado', 'error'); return; }

  const already = [...guessesGrid.querySelectorAll('.guess-row:not(.header)')].some(r => r.dataset.id === guessPlayer.id);
  if (already) { showToast('Ya has probado con ese jugador', 'error'); return; }

  attempts++;
  compareAndRender(guessPlayer);
  searchInput.value = ''; selectedPlayerId = null;
  suggestionsBox.style.display = 'none';
  updateAttemptsChip();

  if (guessPlayer.id === targetPlayer.id) handleWin();
  else if (attempts >= MAX_ATTEMPTS) handleLose();
}

function compareAndRender(guess) {
  const row = document.createElement('div');
  row.className = 'guess-row';
  row.dataset.id = guess.id;

  const isNameCorrect = guess.id === targetPlayer.id;
  const natMatch = guess.nationality === targetPlayer.nationality;
  const leagueMatch = guess.league === targetPlayer.league;
  const clubMatch = guess.club === targetPlayer.club;
  const posMatch = guess.position === targetPlayer.position;

  const ageDiff = guess.age - targetPlayer.age;
  let ageStatus = 'miss', ageArrow = '';
  if (ageDiff === 0) ageStatus = 'match';
  else if (Math.abs(ageDiff) <= 2) ageStatus = 'partial';
  if (ageDiff > 0) ageArrow = '⬇️'; else if (ageDiff < 0) ageArrow = '⬆️';

  const valDiff = guess.marketValue - targetPlayer.marketValue;
  const pct = Math.abs(valDiff) / (targetPlayer.marketValue || 1);
  let valStatus = 'miss', valArrow = '';
  if (valDiff === 0) valStatus = 'match';
  else if (pct <= 0.20) valStatus = 'partial';
  if (valDiff > 0) valArrow = '⬇️'; else if (valDiff < 0) valArrow = '⬆️';

  row.innerHTML = `
    <div class="guess-cell ${isNameCorrect ? 'match' : ''}">
      ${photoHTML(guess, 32)}
      <div style="margin-top:4px;font-size:0.78rem;">${guess.name}</div>
    </div>
    <div class="guess-cell ${natMatch ? 'match' : 'miss'}">
      ${flagHTML(guess.nationality, 28)}
      <div class="sub">${guess.nationality}</div>
    </div>
    <div class="guess-cell ${leagueMatch ? 'match' : 'miss'}">
      <div>${guess.league}</div>
    </div>
    <div class="guess-cell ${clubMatch ? 'match' : 'miss'}">
      ${crestHTML(guess, 24)}
      <div class="sub">${guess.club}</div>
    </div>
    <div class="guess-cell ${posMatch ? 'match' : 'miss'}">
      <div>${shortPos(guess.position)}</div>
    </div>
    <div class="guess-cell ${ageStatus}">
      <div>${guess.age} <span class="arrow">${ageArrow}</span></div>
    </div>
    <div class="guess-cell ${valStatus}">
      <div>${FutbolDB.formatValue(guess.marketValue)} <span class="arrow">${valArrow}</span></div>
    </div>
  `;

  const header = guessesGrid.querySelector('.header');
  if (header && header.nextSibling) guessesGrid.insertBefore(row, header.nextSibling);
  else guessesGrid.appendChild(row);
}

function shortPos(pos) {
  if (!pos) return '';
  return ({ 'Portero':'POR', 'Defensa':'DEF', 'Centrocampista':'MED', 'Delantero':'DEL' })[pos] || pos;
}

function handleWin() {
  isGameOver = true;
  searchInput.disabled = true; btnGuess.disabled = true;
  attemptsCount.textContent = attempts;
  const s = loadStats(); s.wins++; s.plays++; s.streak++; if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
  if (s.streak > s.bestStreak) s.bestStreak = s.streak;
  saveStats(s); renderStats();
  document.getElementById('reveal-card-win').innerHTML = playerCardHTML(targetPlayer);
  winScreen.style.display = 'block';
  winScreen.scrollIntoView({ behavior:'smooth', block:'center' });
}

function handleLose() {
  isGameOver = true;
  searchInput.disabled = true; btnGuess.disabled = true;
  const s = loadStats(); s.plays++; s.streak = 0; saveStats(s); renderStats();
  document.getElementById('reveal-card-lose').innerHTML = playerCardHTML(targetPlayer);
  loseScreen.style.display = 'block';
  loseScreen.scrollIntoView({ behavior:'smooth', block:'center' });
}

function playerCardHTML(p) {
  return `
    <div style="display:flex;gap:14px;align-items:center;">
      ${photoHTML(p, 64)}
      <div>
        <div class="big">${p.name}</div>
        <div class="sm" style="display:flex;gap:6px;align-items:center;margin-top:4px;">${flagHTML(p.nationality,20)} ${p.nationality}</div>
        <div class="sm" style="display:flex;gap:6px;align-items:center;margin-top:2px;">${crestHTML(p,20)} ${p.club} · ${p.league}</div>
        <div class="sm">${p.position} · ${p.age} años · ${FutbolDB.formatValue(p.marketValue)}</div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initGame);

