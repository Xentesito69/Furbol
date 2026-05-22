/**
 * wordle.js - Wordle futbolero (apellido del jugador). Sin pista.
 * Render por-tile in-place (no wipe global), conserva colores.
 */

const STORAGE_KEY = 'furbol.wordle';
const MAX_ROWS = 6;

let target;
let displayName;
let player;
let wordLen;
let curRow, curCol;
let board;
let gameOver = false;

const boardEl    = document.getElementById('board');
const kbEl       = document.getElementById('keyboard');
const hintEl     = document.getElementById('hint-text');
const winScreen  = document.getElementById('win-screen');
const loseScreen = document.getElementById('lose-screen');
const chipStreak = document.getElementById('chip-streak');
const chipWins   = document.getElementById('chip-wins');

const KB = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKLÑ".split(""),
  ["ENTER", ..."ZXCVBNM".split(""), "⌫"]
];

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { wins:0, streak:0, bestStreak:0 }; }
  catch { return { wins:0, streak:0, bestStreak:0 }; }
}
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function refreshChips() {
  const s = loadStats();
  chipStreak.textContent = s.bestStreak;
  chipWins.textContent   = s.wins;
}

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-ZÑ]/g, '');
}

function pickPlayer() {
  for (let i = 0; i < 50; i++) {
    const p = FutbolDB.random();
    const parts = p.name.split(/\s+/);
    const surname = parts[parts.length - 1];
    const norm = normalize(surname);
    if (norm.length >= 4 && norm.length <= 10) return { p, surname, norm };
  }
  const p = FutbolDB.random();
  const parts = p.name.split(/\s+/);
  return { p, surname: parts[parts.length-1], norm: normalize(parts[parts.length-1]) };
}

async function initWordle() {
  await FutbolDB.load();
  const pick = pickPlayer();
  player = pick.p;
  displayName = pick.surname;
  target = pick.norm;
  wordLen = target.length;
  curRow = 0; curCol = 0; gameOver = false;
  board = Array.from({length: MAX_ROWS}, () => Array(wordLen).fill(''));
  for (const k in keyState) delete keyState[k];

  hintEl.textContent = `${wordLen} letras • 6 intentos`;
  winScreen.style.display = 'none';
  loseScreen.style.display = 'none';

  buildBoard();
  renderKeyboard();
  refreshChips();
  console.log('🤐 (Debug) Palabra:', target, '—', player.name);
}
window.initWordle = initWordle;

/** Construye el tablero UNA SOLA VEZ por partida. */
function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < MAX_ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'word-row';
    row.dataset.r = r;
    for (let c = 0; c < wordLen; c++) {
      const tile = document.createElement('div');
      tile.className = 'word-tile';
      tile.dataset.r = r; tile.dataset.c = c;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

/** Actualiza una celda concreta sin reconstruir el resto. */
function setTile(r, c, ch) {
  const tile = boardEl.querySelector(`.word-tile[data-r="${r}"][data-c="${c}"]`);
  if (!tile) return;
  tile.textContent = ch;
  tile.classList.toggle('filled', !!ch);
}

const keyState = {};

function renderKeyboard() {
  kbEl.innerHTML = '';
  KB.forEach(rowKeys => {
    const row = document.createElement('div');
    row.className = 'kb-row';
    rowKeys.forEach(k => {
      const key = document.createElement('div');
      key.className = 'key' + (k.length > 1 ? ' wide' : '');
      if (keyState[k]) key.classList.add(keyState[k]);
      key.textContent = k;
      key.addEventListener('click', () => handleKey(k));
      row.appendChild(key);
    });
    kbEl.appendChild(row);
  });
}

function handleKey(k) {
  if (gameOver) return;
  if (k === 'ENTER') return submitGuess();
  if (k === '⌫' || k === 'BACKSPACE') {
    if (curCol > 0) {
      curCol--;
      board[curRow][curCol] = '';
      setTile(curRow, curCol, '');
    }
    return;
  }
  if (/^[A-ZÑ]$/.test(k) && curCol < wordLen) {
    board[curRow][curCol] = k;
    setTile(curRow, curCol, k);
    curCol++;
  }
}

document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  const k = e.key.length === 1 ? e.key.toUpperCase() : e.key.toUpperCase();
  if (k === 'BACKSPACE') return handleKey('⌫');
  if (k === 'ENTER') return handleKey('ENTER');
  if (/^[A-ZÑ]$/.test(k)) handleKey(k);
});

function flashShake() {
  const tiles = boardEl.querySelectorAll(`.word-tile[data-r="${curRow}"]`);
  tiles.forEach(t => {
    t.animate(
      [{ transform:'translateX(0)' }, { transform:'translateX(-6px)' }, { transform:'translateX(6px)' }, { transform:'translateX(0)' }],
      { duration: 250 }
    );
  });
}

function submitGuess() {
  if (curCol < wordLen) { flashShake(); return; }
  const guess = board[curRow].join('');
  const colors = compute(guess, target);

  const tiles = boardEl.querySelectorAll(`.word-tile[data-r="${curRow}"]`);
  tiles.forEach((t, i) => {
    setTimeout(() => {
      t.classList.add(colors[i]);
      const ch = guess[i];
      const prio = { absent: 0, present: 1, correct: 2 };
      if (!keyState[ch] || prio[colors[i]] > prio[keyState[ch]]) keyState[ch] = colors[i];
      if (i === wordLen - 1) renderKeyboard();
    }, i * 200);
  });

  setTimeout(() => {
    if (guess === target) {
      gameOver = true;
      const s = loadStats();
      s.wins++; s.streak++; if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
      saveStats(s); refreshChips();
      document.getElementById('win-text').innerHTML = playerRevealHTML(player, displayName, `${curRow + 1} intento${curRow ? 's' : ''}`);
      winScreen.style.display = 'block';
      return;
    }
    curRow++; curCol = 0;
    if (curRow >= MAX_ROWS) {
      gameOver = true;
      const s = loadStats(); s.streak = 0; saveStats(s); refreshChips();
      document.getElementById('lose-text').innerHTML = playerRevealHTML(player, displayName);
      loseScreen.style.display = 'block';
    }
  }, wordLen * 200 + 100);
}

function compute(guess, ans) {
  const res = Array(wordLen).fill('absent');
  const ansArr = ans.split('');
  const used = Array(wordLen).fill(false);
  for (let i = 0; i < wordLen; i++) {
    if (guess[i] === ansArr[i]) { res[i] = 'correct'; used[i] = true; }
  }
  for (let i = 0; i < wordLen; i++) {
    if (res[i] === 'correct') continue;
    const idx = ansArr.findIndex((c, j) => !used[j] && c === guess[i]);
    if (idx >= 0) { res[i] = 'present'; used[idx] = true; }
  }
  return res;
}

function playerRevealHTML(p, surname, attempts = null) {
  const flagUrl = FutbolDB.flagImg(p.nationality, 40);
  const crestUrl = FutbolDB.crestOf(p);
  const photo = FutbolDB.photoOf(p);
  const flagPart = flagUrl ? `<img src="${flagUrl}" style="width:18px;height:12px;border-radius:2px;">` : FutbolDB.flagOf(p.nationality);
  const crestPart = crestUrl ? `<img src="${crestUrl}" style="width:16px;height:16px;object-fit:contain;margin-left:6px;">` : '';
  return `
    <div style="display:flex;gap:14px;align-items:center;justify-content:center;margin-top:8px;">
      <img src="${photo}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(p)}'" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--border);">
      <div style="text-align:left;">
        <div style="font-family:var(--font-main);font-weight:800;font-size:1.15rem;">${surname}</div>
        <div style="color:var(--text-secondary);font-size:0.85rem;">${p.name}</div>
        <div style="display:flex;gap:6px;align-items:center;font-size:0.8rem;margin-top:4px;">
          ${flagPart}<span>${p.nationality}</span>${crestPart}<span>${p.club}</span>
        </div>
        ${attempts ? `<div style="color:var(--accent-green);font-weight:700;margin-top:4px;">En ${attempts}.</div>` : ''}
      </div>
    </div>`;
}

document.getElementById('btn-new').addEventListener('click', initWordle);
document.addEventListener('DOMContentLoaded', initWordle);
