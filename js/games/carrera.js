/**
 * carrera.js — Ordena los clubs del jugador en orden cronológico
 * (formerClubs ya está en orden inverso: del más reciente al más antiguo).
 * El orden correcto = formerClubs.reverse() + [club actual].
 */

const STORAGE_KEY = 'furbol.carrera';

let player;
let correct;      // array de clubes en orden cronológico correcto
let current;      // orden actual del usuario
let solved = false;

const cardEl = document.getElementById('player-card');
const listEl = document.getElementById('sortable');
const endEl  = document.getElementById('end-overlay');
const btnCheck = document.getElementById('btn-check');
const btnSkip  = document.getElementById('btn-skip');
const chipWins   = document.getElementById('chip-wins');
const chipStreak = document.getElementById('chip-streak');

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { wins:0, streak:0, bestStreak:0 }; }
  catch { return { wins:0, streak:0, bestStreak:0 }; }
}
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function refreshChips() {
  const s = loadStats();
  chipWins.textContent = s.wins;
  chipStreak.textContent = s.bestStreak;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function startCarrera() {
  await FutbolDB.load();
  endEl.style.display = 'none';
  solved = false;
  btnCheck.disabled = false;

  // Elegir un jugador con al menos 3 clubs (former + actual)
  let p, all, tries = 0;
  do {
    p = FutbolDB.random();
    all = [p.club, ...(p.formerClubs || [])];
    tries++;
  } while (all.length < 3 && tries < 100);

  player = p;
  // formerClubs viene "más reciente → más antiguo" en nuestra BD,
  // así que orden cronológico real = invertido + club actual al final.
  correct = [...(player.formerClubs || [])].reverse().concat([player.club]);

  // Mezclar para el usuario; reintenta si por azar sale el orden correcto
  do { current = shuffle(correct); } while (current.every((c, i) => c === correct[i]));

  renderCard();
  renderList();
  refreshChips();
  console.log('🤫 (Debug) Carrera correcta de', player.name, ':', correct);
}
window.startCarrera = startCarrera;

function renderCard() {
  const photo = FutbolDB.photoOf(player);
  cardEl.innerHTML = `
    <img class="photo" src="${photo}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(player)}'" alt="${player.name}">
    <div>
      <div class="pname">${player.name}</div>
      <div class="hint">${correct.length} clubs en total</div>
    </div>
  `;
}

function renderList() {
  listEl.innerHTML = current.map((club, i) => {
    // Buscar un club en BD para usar su crest
    const sample = FutbolDB.getAll().find(x => x.club === club);
    const crestUrl = (sample && FutbolDB.crestOf(sample)) || (FutbolDB.crestByName && FutbolDB.crestByName(club)) || null;
    const crest = crestUrl ? `<img src="${crestUrl}" style="width:22px;height:22px;object-fit:contain;">` : `<span style="font-size:1.2rem;">⚽</span>`;
    return `
      <div class="club-pill" draggable="true" data-idx="${i}">
        <span class="order-num">${i + 1}</span>
        ${crest}
        <strong>${club}</strong>
        <div class="arrows">
          <button data-action="up"   data-idx="${i}" ${i === 0 ? 'disabled' : ''} title="Subir">▲</button>
          <button data-action="down" data-idx="${i}" ${i === current.length - 1 ? 'disabled' : ''} title="Bajar">▼</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind arrows
  listEl.querySelectorAll('button[data-action]').forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      if (solved) return;
      const idx = parseInt(b.dataset.idx, 10);
      const dir = b.dataset.action === 'up' ? -1 : 1;
      const ni = idx + dir;
      if (ni < 0 || ni >= current.length) return;
      [current[idx], current[ni]] = [current[ni], current[idx]];
      renderList();
    });
  });

  // Drag & drop
  let dragIdx = null;
  listEl.querySelectorAll('.club-pill').forEach(pill => {
    pill.addEventListener('dragstart', e => {
      if (solved) { e.preventDefault(); return; }
      dragIdx = parseInt(pill.dataset.idx, 10);
      pill.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    pill.addEventListener('dragend', () => pill.classList.remove('dragging'));
    pill.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    pill.addEventListener('drop', e => {
      e.preventDefault();
      if (solved || dragIdx === null) return;
      const dropIdx = parseInt(pill.dataset.idx, 10);
      if (dragIdx === dropIdx) return;
      const moved = current.splice(dragIdx, 1)[0];
      current.splice(dropIdx, 0, moved);
      dragIdx = null;
      renderList();
    });
  });
}

function check() {
  if (solved) return;
  const allRight = current.every((c, i) => c === correct[i]);

  // Pintar cada pill según si está en su posición correcta
  listEl.querySelectorAll('.club-pill').forEach((pill, i) => {
    pill.classList.toggle('right', current[i] === correct[i]);
    pill.classList.toggle('wrong', current[i] !== correct[i]);
  });

  if (allRight) {
    solved = true;
    btnCheck.disabled = true;
    const s = loadStats(); s.wins++; s.streak++; if(window.FurbolAlbum) FurbolAlbum.addPacks(1);
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    saveStats(s); refreshChips();
    endEl.className = 'end-overlay win';
    endEl.innerHTML = `
      <h2>¡Carrera completada! 🎉</h2>
      <p style="color:var(--text-secondary);margin-bottom:14px;">
        Orden correcto: <strong>${correct.join(' → ')}</strong>
      </p>
      <button class="btn btn--primary" onclick="startCarrera()">Otro jugador</button>
    `;
    endEl.style.display = 'block';
    endEl.scrollIntoView({ behavior:'smooth', block:'center' });
  }
}

function skip() {
  solved = true;
  btnCheck.disabled = true;
  const s = loadStats(); s.streak = 0; saveStats(s); refreshChips();
  endEl.className = 'end-overlay fail';
  endEl.innerHTML = `
    <h2>Carrera saltada</h2>
    <p style="color:var(--text-secondary);margin-bottom:14px;">
      La carrera de <strong>${player.name}</strong> era:<br>
      <span style="color:var(--text-primary);">${correct.join(' → ')}</span>
    </p>
    <button class="btn btn--primary" onclick="startCarrera()">Siguiente</button>
  `;
  endEl.style.display = 'block';
  endEl.scrollIntoView({ behavior:'smooth', block:'center' });
}

btnCheck.addEventListener('click', check);
btnSkip.addEventListener('click', skip);
document.addEventListener('DOMContentLoaded', startCarrera);

