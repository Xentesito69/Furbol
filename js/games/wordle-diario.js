/** wordle-diario.js — Wordle con seed diaria. Mismo para todos. */
const KEY = 'furbol.wordle-diario';
const MAX_ROWS = 6;
let target, displayName, player, wordLen, curRow, curCol, board, gameOver = false, todayKey;

const boardEl = document.getElementById('board');
const kbEl = document.getElementById('keyboard');
const hintEl = document.getElementById('hint-text');
const winScreen = document.getElementById('win-screen');
const loseScreen = document.getElementById('lose-screen');
const chipAttempts = document.getElementById('chip-attempts');
const dayInfo = document.getElementById('day-info');

const KB = ["QWERTYUIOP".split(""), "ASDFGHJKLÑ".split(""), ["ENTER", ..."ZXCVBNM".split(""), "⌫"]];
const keyState = {};

function loadS() { return FurbolUI.loadStats(KEY, { history: {} }); }
function saveS(s) { FurbolUI.saveStats(KEY, s); }
function normalize(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-ZÑ]/g, ''); }

function pickPlayerSeeded(rnd) {
  const pool = FutbolDB.getAll().filter(p => p.marketValue >= 20_000_000).sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < 50; i++) {
    const p = pool[Math.floor(rnd() * pool.length)];
    const parts = p.name.split(/\s+/);
    const surname = parts[parts.length - 1];
    const norm = normalize(surname);
    if (norm.length >= 4 && norm.length <= 10) return { p, surname, norm };
  }
  const p = pool[Math.floor(rnd() * pool.length)];
  const parts = p.name.split(/\s+/);
  return { p, surname: parts[parts.length - 1], norm: normalize(parts[parts.length - 1]) };
}

async function init() {
  await FutbolDB.load();
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 3 + 17);

  const pick = pickPlayerSeeded(rnd);
  player = pick.p; displayName = pick.surname; target = pick.norm;
  wordLen = target.length;
  curRow = 0; curCol = 0; gameOver = false;
  board = Array.from({ length: MAX_ROWS }, () => Array(wordLen).fill(''));
  for (const k in keyState) delete keyState[k];

  hintEl.textContent = `${wordLen} letras • 6 intentos`;
  winScreen.style.display = 'none';
  loseScreen.style.display = 'none';
  buildBoard();
  renderKeyboard();

  // Restaurar si ya jugó hoy
  const s = loadS();
  const today = s.history[todayKey];
  if (today) {
    today.guesses.forEach(g => replayGuess(g));
    if (today.won || today.guesses.length >= MAX_ROWS) {
      gameOver = true;
      showEnd(today.won, today.guesses.length);
    }
  }

  chipAttempts.textContent = `${curRow}/${MAX_ROWS}`;
  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo para todos`;
}
window.init = init;

function replayGuess(guess) {
  for (let c = 0; c < wordLen; c++) {
    board[curRow][c] = guess[c];
    setTile(curRow, c, guess[c]);
  }
  const colors = compute(guess, target);
  const tiles = boardEl.querySelectorAll(`.word-tile[data-r="${curRow}"]`);
  tiles.forEach((t, i) => {
    t.classList.add(colors[i]);
    const ch = guess[i];
    const prio = { absent: 0, present: 1, correct: 2 };
    if (!keyState[ch] || prio[colors[i]] > prio[keyState[ch]]) keyState[ch] = colors[i];
  });
  renderKeyboard();
  curRow++; curCol = 0;
}

function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < MAX_ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'word-row'; row.dataset.r = r;
    for (let c = 0; c < wordLen; c++) {
      const tile = document.createElement('div');
      tile.className = 'word-tile'; tile.dataset.r = r; tile.dataset.c = c;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

function setTile(r, c, ch) {
  const tile = boardEl.querySelector(`.word-tile[data-r="${r}"][data-c="${c}"]`);
  if (!tile) return;
  tile.textContent = ch;
  tile.classList.toggle('filled', !!ch);
}

function renderKeyboard() {
  kbEl.innerHTML = '';
  KB.forEach(rowKeys => {
    const row = document.createElement('div'); row.className = 'kb-row';
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
  if (k === '⌫' || k === 'BACKSPACE') { if (curCol > 0) { curCol--; board[curRow][curCol] = ''; setTile(curRow, curCol, ''); } return; }
  if (/^[A-ZÑ]$/.test(k) && curCol < wordLen) { board[curRow][curCol] = k; setTile(curRow, curCol, k); curCol++; }
}

document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  const k = e.key.length === 1 ? e.key.toUpperCase() : e.key.toUpperCase();
  if (k === 'BACKSPACE') return handleKey('⌫');
  if (k === 'ENTER') return handleKey('ENTER');
  if (/^[A-ZÑ]$/.test(k)) handleKey(k);
});

function flashShake() {
  boardEl.querySelectorAll(`.word-tile[data-r="${curRow}"]`).forEach(t => {
    t.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 250 });
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
    const s = loadS();
    if (!s.history[todayKey]) s.history[todayKey] = { guesses: [], won: false };
    s.history[todayKey].guesses.push(guess);

    if (guess === target) {
      gameOver = true;
      s.history[todayKey].won = true;
      saveS(s);
      if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
      showEnd(true, curRow + 1);
    } else {
      curRow++; curCol = 0;
      if (curRow >= MAX_ROWS) {
        gameOver = true;
        saveS(s);
        showEnd(false, MAX_ROWS);
      } else {
        saveS(s);
      }
    }
    chipAttempts.textContent = `${Math.min(curRow, MAX_ROWS)}/${MAX_ROWS}`;
  }, wordLen * 200 + 100);
}

function compute(guess, ans) {
  const res = Array(ans.length).fill('absent');
  const ansArr = ans.split(''); const used = Array(ans.length).fill(false);
  for (let i = 0; i < ans.length; i++) { if (guess[i] === ansArr[i]) { res[i] = 'correct'; used[i] = true; } }
  for (let i = 0; i < ans.length; i++) { if (res[i] === 'correct') continue; const idx = ansArr.findIndex((c, j) => !used[j] && c === guess[i]); if (idx >= 0) { res[i] = 'present'; used[idx] = true; } }
  return res;
}

function showEnd(won, attempts) {
  // Build emoji share text from board
  const lines = [];
  const rows = Math.min(attempts, MAX_ROWS);
  for (let r = 0; r < rows; r++) {
    const tiles = boardEl.querySelectorAll(`.word-tile[data-r="${r}"]`);
    let line = '';
    tiles.forEach(t => {
      if (t.classList.contains('correct')) line += '🟩';
      else if (t.classList.contains('present')) line += '🟨';
      else line += '⬛';
    });
    lines.push(line);
  }
  const shareText = `Furbol Wordle Diario ${won ? attempts : 'X'}/${MAX_ROWS}\n\n${lines.join('\n')}`;
  const shareHTML = `<textarea readonly style="width:100%;height:100px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;

  const reveal = playerRevealHTML(player, displayName, won ? `${attempts} intento${attempts > 1 ? 's' : ''}` : null);

  if (won) {
    document.getElementById('win-text').innerHTML = reveal;
    document.getElementById('win-share').innerHTML = shareHTML;
    winScreen.style.display = 'block';
  } else {
    document.getElementById('lose-text').innerHTML = reveal;
    document.getElementById('lose-share').innerHTML = shareHTML;
    loseScreen.style.display = 'block';
  }
}

function playerRevealHTML(p, surname, attempts) {
  const flagUrl = FutbolDB.flagImg(p.nationality, 40);
  const crestUrl = FutbolDB.crestOf(p);
  const photo = FutbolDB.photoOf(p);
  const flagPart = flagUrl ? `<img src="${flagUrl}" style="width:18px;height:12px;border-radius:2px;">` : FutbolDB.flagOf(p.nationality);
  const crestPart = crestUrl ? `<img src="${crestUrl}" style="width:16px;height:16px;object-fit:contain;margin-left:6px;">` : '';
  return `<div style="display:flex;gap:14px;align-items:center;justify-content:center;margin-top:8px;">
    <img src="${photo}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(p)}'" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--border);">
    <div style="text-align:left;">
      <div style="font-family:var(--font-main);font-weight:800;font-size:1.15rem;">${surname}</div>
      <div style="color:var(--text-secondary);font-size:0.85rem;">${p.name}</div>
      <div style="display:flex;gap:6px;align-items:center;font-size:0.8rem;margin-top:4px;">${flagPart}<span>${p.nationality}</span>${crestPart}<span>${p.club}</span></div>
      ${attempts ? `<div style="color:var(--accent-green);font-weight:700;margin-top:4px;">En ${attempts}.</div>` : ''}
    </div></div>`;
}

document.addEventListener('DOMContentLoaded', init);
