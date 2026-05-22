/**
 * mas-caro.js — Higher/Lower de valor de mercado, con fotos y escudos reales.
 */

const STORAGE_KEY = 'furbol.mascaro';
const START_LIVES = 3;

let lives, streak;
let left, right;
let pendingPick = false;

const duelEl    = document.getElementById('duel');
const verdictEl = document.getElementById('verdict');
const livesRow  = document.getElementById('lives-row');
const chipStreak= document.getElementById('chip-streak');
const chipBest  = document.getElementById('chip-best');
const endEl     = document.getElementById('end-overlay');
const endSum    = document.getElementById('end-summary');

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { best: 0, plays: 0 }; }
  catch { return { best: 0, plays: 0 }; }
}
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function refreshChips() {
  chipStreak.textContent = streak;
  chipBest.textContent   = loadStats().best;
}

function renderLives() {
  livesRow.innerHTML = '';
  for (let i = 0; i < START_LIVES; i++) {
    const span = document.createElement('span');
    span.className = 'life' + (i < (START_LIVES - lives) ? ' lost' : '');
    span.textContent = '❤️';
    livesRow.appendChild(span);
  }
}

async function startGame() {
  await FutbolDB.load();
  lives = START_LIVES;
  streak = 0;
  pendingPick = false;
  endEl.style.display = 'none';
  verdictEl.style.display = 'none';
  renderLives();
  refreshChips();
  newDuel(true);
}
window.startGame = startGame;

function pickActive() {
  let p;
  do { p = FutbolDB.random(); } while (!p || p.league === 'Leyendas' || !p.marketValue);
  return p;
}
function newDuel(initial = false) {
  if (initial) {
    let a = pickActive();
    let b;
    do { b = pickActive(); } while (b.id === a.id || b.marketValue === a.marketValue);
    left = a; right = b;
  } else {
    left = window.lastWinner || pickActive();
    do { right = pickActive(); } while (right.id === left.id || right.marketValue === left.marketValue);
  }
  window.lastWinner = null;
  pendingPick = true;
  verdictEl.style.display = 'none';
  renderDuel({ revealRight: false });
}

function renderDuel({ revealRight }) {
  duelEl.innerHTML = `
    ${cardHTML('left', left, true)}
    <div class="vs-badge">VS</div>
    ${cardHTML('right', right, revealRight)}
  `;
  duelEl.querySelectorAll('.pick-btn').forEach(btn => {
    btn.addEventListener('click', () => onPick(btn.dataset.side));
  });
}

function flagHTML(nat, size = 40) {
  const url = FutbolDB.flagImg(nat, 80);
  if (url) return `<img src="${url}" alt="${nat}" style="width:${size}px; height:${Math.round(size*0.66)}px; border-radius:4px; object-fit:cover; margin-bottom:6px;">`;
  return `<div style="font-size:${size*0.9}px; margin-bottom:6px;">${FutbolDB.flagOf(nat)}</div>`;
}
function crestHTML(player, size = 22) {
  const url = FutbolDB.crestOf(player);
  if (url) return `<img src="${url}" onerror="this.onerror=null;this.style.display=\'none\'" alt="" style="width:${size}px; height:${size}px; object-fit:contain; vertical-align:middle;">`;
  return `<span>${FutbolDB.clubEmojiOf(player)}</span>`;
}
function photoHTML(player, size = 80) {
  return `<img src="${FutbolDB.photoOf(player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(player)}'" alt="${player.name}" style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; margin-bottom:12px; border:2px solid var(--border);">`;
}

function cardHTML(side, p, revealValue) {
  const valueBlock = revealValue
    ? `<div class="value-block">
         <div class="value-label">Valor de mercado</div>
         <div class="value-amt">${FutbolDB.formatValue(p.marketValue)}</div>
       </div>`
    : `<div class="pick-buttons">
         <button class="pick-btn" data-side="${side}-up">⬆ Vale más</button>
         <button class="pick-btn" data-side="${side}-down">⬇ Vale menos</button>
       </div>`;

  return `
    <div class="duel-card ${revealValue ? 'locked' : ''}" data-side="${side}">
      ${photoHTML(p, 72)}
      ${flagHTML(p.nationality, 36)}
      <div class="pname">${p.name}</div>
      <div class="club" style="display:flex; align-items:center; justify-content:center; gap:6px;">${crestHTML(p, 18)} ${p.club}</div>
      <div class="meta">${p.position} · ${p.age} años</div>
      ${side === 'left'
        ? `<div class="value-block">
             <div class="value-label">Valor de mercado</div>
             <div class="value-amt">${FutbolDB.formatValue(p.marketValue)}</div>
           </div>`
        : valueBlock}
    </div>
  `;
}

function onPick(action) {
  if (!pendingPick) return;
  pendingPick = false;
  const userSaysHigher = action.endsWith('up');
  const actuallyHigher = right.marketValue > left.marketValue;
  const correct = userSaysHigher === actuallyHigher;

  renderDuel({ revealRight: true });

  if (correct) {
    streak++;
    verdictEl.className = 'verdict right';
    verdictEl.textContent = '✓ ¡Correcto!';
    // Sobre cada 5 aciertos seguidos
    if (streak % 5 === 0 && window.FurbolAlbum) {
      FurbolAlbum.addPacks(1);
      verdictEl.textContent = `✓ ¡Correcto! 🎴 ¡Sobre conseguido! (racha ${streak})`;
    }
    verdictEl.style.display = 'block';
    window.lastWinner = right;
    refreshChips();
    setTimeout(newDuel, 1400);
  } else {
    lives--;
    renderLives();
    verdictEl.className = 'verdict wrong';
    verdictEl.textContent = `✗ Fallaste. ${right.name} vale ${FutbolDB.formatValue(right.marketValue)}.`;
    verdictEl.style.display = 'block';
    if (lives <= 0) gameOver();
    else { window.lastWinner = right; setTimeout(newDuel, 1800); }
  }
}

function gameOver() {
  const s = loadStats();
  s.plays++;
  if (streak > s.best) s.best = streak;
  saveStats(s);
  refreshChips();
  endSum.textContent = `Racha final: ${streak}. Mejor histórica: ${s.best}.`;
  endEl.style.display = 'block';
  endEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', startGame);
