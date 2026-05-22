/** pixelada-diario.js — Foto pixelada con seed diaria. Mismo para todos. */
const KEY = 'furbol.pixelada-diario';
let target, level, timer, gameOver = false, selectedId = null, todayKey;

const img = document.getElementById('pix-img'), chipLevel = document.getElementById('chip-level'),
  inp = document.getElementById('pix-input'), sug = document.getElementById('sug-box'),
  endEl = document.getElementById('end'), dayInfo = document.getElementById('day-info');

function loadS() { return FurbolUI.loadStats(KEY, { history: {} }); }
function saveS(s) { FurbolUI.saveStats(KEY, s); }

async function init() {
  await FutbolDB.load();
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 11 + 43);

  // Pool: jugadores con foto real y reconocibles
  const pool = FutbolDB.getAll()
    .filter(p => p.photo && p.photo.trim() !== '' && p.marketValue >= 10_000_000)
    .sort((a, b) => a.id.localeCompare(b.id));
  target = pool[Math.floor(rnd() * pool.length)];

  const s = loadS();
  const today = s.history[todayKey];

  if (today && today.done) {
    // Ya jugó hoy — mostrar resultado directamente
    gameOver = true;
    level = 1;
    img.style.transition = 'none';
    img.style.filter = 'none'; img.style.transform = 'none';
    img.src = target.photo;
    img.onerror = () => { img.onerror = null; img.src = FutbolDB.avatarOf(target); };
    chipLevel.textContent = '0%';
    inp.disabled = true;
    document.getElementById('btn-guess').disabled = true;
    document.getElementById('btn-skip').disabled = true;
    showEnd(today.won, today.level);
  } else {
    // Partida nueva o en curso
    level = 12;
    gameOver = false;
    endEl.style.display = 'none';
    img.style.transition = 'none';
    applyLevel();
    img.src = target.photo;
    img.onerror = () => { img.onerror = null; img.src = FutbolDB.avatarOf(target); };
    void img.offsetHeight;
    setTimeout(() => { img.style.transition = ''; }, 50);
    inp.value = ''; selectedId = null; inp.disabled = false; inp.focus();
    document.getElementById('btn-guess').disabled = false;
    document.getElementById('btn-skip').disabled = false;
    clearInterval(timer);
    timer = setInterval(() => {
      if (gameOver) return;
      level = Math.max(1, level - 1);
      applyLevel();
      if (level === 1) clearInterval(timer);
    }, 4000);
  }

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo para todos`;
}
window.init = init;

function applyLevel() {
  const pct = Math.round(level / 12 * 100);
  chipLevel.textContent = pct + '%';
  img.style.filter = `blur(${level * 1.5}px) contrast(${1 + level * 0.05})`;
  img.style.transform = `scale(${1 + level * 0.03})`;
}

// Autocomplete
inp.addEventListener('input', () => {
  const v = inp.value.trim(); selectedId = null;
  if (v.length < 2) { sug.style.display = 'none'; return; }
  const results = FutbolDB.query({ name: v, limit: 6 });
  if (results.length === 0) { sug.style.display = 'none'; return; }
  sug.innerHTML = results.map(p => `<div class="sug" data-id="${p.id}" data-name="${p.name}">${FurbolUI.flag(p.nationality, 18)}<strong>${p.name}</strong><span style="color:var(--text-muted);font-size:0.75rem;">${p.club}</span></div>`).join('');
  sug.style.display = 'block';
});
sug.addEventListener('click', e => {
  const it = e.target.closest('.sug'); if (!it) return;
  inp.value = it.dataset.name; selectedId = it.dataset.id; sug.style.display = 'none';
});
inp.addEventListener('keydown', e => { if (e.key === 'Enter') guess(); });
document.getElementById('btn-guess').addEventListener('click', guess);
document.getElementById('btn-skip').addEventListener('click', () => { if (gameOver) return; reveal(false); });

function guess() {
  if (gameOver) return;
  let p = null;
  if (selectedId) p = FutbolDB.getAll().find(x => x.id === selectedId);
  else { const v = inp.value.trim(); if (!v) return; const m = FutbolDB.query({ name: v }); if (m.length) p = m[0]; }
  if (!p) return;
  if (p.id === target.id) reveal(true);
  else { inp.value = ''; selectedId = null; sug.style.display = 'none'; }
}

function reveal(won) {
  gameOver = true; clearInterval(timer);
  img.style.filter = 'none'; img.style.transform = 'none';
  inp.disabled = true;
  document.getElementById('btn-guess').disabled = true;
  document.getElementById('btn-skip').disabled = true;

  const guessLevel = level;
  const s = loadS();
  s.history[todayKey] = { done: true, won, level: guessLevel };
  saveS(s);

  if (won && window.FurbolAlbum) FurbolAlbum.addPacks(1);
  showEnd(won, guessLevel);
}

function showEnd(won, guessLevel) {
  const pct = Math.round(guessLevel / 12 * 100);
  const shareText = won
    ? `Furbol Pixelada Diario ✅\nAdivinado al ${pct}% de blur`
    : `Furbol Pixelada Diario ❌\nNo lo adiviné`;

  endEl.className = 'end-overlay-common ' + (won ? 'win' : 'fail');
  endEl.innerHTML = `<h2>${won ? '¡Bien!' : 'Era…'}</h2>
    <p style="margin:8px 0; color:var(--text-secondary);">${target.name} — ${FurbolUI.flag(target.nationality, 18)} ${target.nationality}<br>${target.club} · ${target.position}</p>
    ${won ? `<p style="color:var(--accent-green);font-weight:700;">Adivinado al ${pct}% de blur</p>` : ''}
    <textarea readonly style="width:100%;height:60px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', init);
