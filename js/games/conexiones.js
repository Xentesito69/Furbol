/**
 * conexiones.js — 16 jugadores → 4 grupos de 4 según una propiedad común.
 * Propiedades posibles: nationality, club, league, surname, anyClub.
 */

const STORAGE_KEY = 'furbol.conexiones';
const MAX_LIVES = 4;

let categories;   // [{key, value, label, players:[]}, ...4]
let cells;        // [{player, catIdx, solved:false}] x16
let selected;     // Set of cell indices
let lives;
let solvedCats;   // Set of solved catIdx
let gameOver;

const gridEl    = document.getElementById('grid');
const heartsEl  = document.getElementById('hearts');
const solvedEl  = document.getElementById('solved-list');
const verdictEl = document.getElementById('verdict');
const endEl     = document.getElementById('end-overlay');
const chipWins  = document.getElementById('chip-wins');

function loadStats() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { wins: 0, plays: 0 }; } catch { return { wins: 0, plays: 0 }; } }
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function refreshChips() { chipWins.textContent = loadStats().wins; }

function shuffle(a) { for (let i = a.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function pickCategories() {
  // Buscar 4 categorías que tengan ≥4 jugadores y NO se solapen
  const all = FutbolDB.getAll();
  const candidates = [];

  // Cada candidato: {key, value, label, icon, players:[]}
  // Definir tipos de categoría con su agrupador
  const _clubIcon = (clubName) => {
    const sample = all.find(p => p.club === clubName);
    if (!sample) return '⚽';
    const url = FutbolDB.crestOf(sample);
    if (!url) return '⚽';
    return `<img src="${url}" onerror="this.onerror=null;this.outerHTML='⚽'" alt="" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;">`;
  };

  const catTypes = [
    { key:'nationality', textLabel:'Nacionalidad',
      group: () => { const m={}; all.forEach(p=>{ if(p.nationality)(m[p.nationality]=m[p.nationality]||[]).push(p); }); return m; },
      icon: (v) => FurbolUI.flag(v, 20) },
    { key:'club',        textLabel:'Club',
      group: () => { const m={}; all.forEach(p=>{ if(p.club)(m[p.club]=m[p.club]||[]).push(p); }); return m; },
      icon: (v) => _clubIcon(v) },
    { key:'league',      textLabel:'Liga',
      group: () => { const m={}; all.forEach(p=>{ if(p.league)(m[p.league]=m[p.league]||[]).push(p); }); return m; },
      icon: (v) => { const url=FutbolDB.leagueLogo(v); return url ? `<img src="${url}" onerror="this.onerror=null;this.outerHTML='🏆'" alt="" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;">` : '🏆'; } },
    { key:'surname',     textLabel:'Apellido',
      group: () => { const m={}; all.forEach(p=>{ const s=p.name.split(/\s+/).pop(); (m[s]=m[s]||[]).push(p); }); return m; },
      icon: () => '📛' },
    { key:'anyClub',     textLabel:'Jugaron en',
      group: () => { const m={}; all.forEach(p=>{ const clubs=[p.club,...(p.formerClubs||[])]; clubs.forEach(c=>{ if(c)(m[c]=m[c]||[]).push(p); }); }); return m; },
      icon: (v) => _clubIcon(v) },
  ];

  for (const ct of catTypes) {
    const buckets = ct.group();
    for (const v of Object.keys(buckets)) {
      if (buckets[v].length >= 4) {
        const iconHtml = ct.icon(v, buckets[v]);
        candidates.push({ key: ct.key, value: v, label: ct.textLabel + ': ' + v, icon: iconHtml, players: buckets[v] });
      }
    }
  }

  // Intentar muestrear 4 categorías cuyos jugadores no se solapen
  shuffle(candidates);
  for (let attempt = 0; attempt < 200; attempt++) {
    shuffle(candidates);
    const chosen = [];
    const used = new Set();
    for (const c of candidates) {
      // ¿Hay 4 jugadores aún no usados?
      const free = c.players.filter(p => !used.has(p.id));
      if (free.length < 4) continue;
      // Diversidad: evita varias categorías de la misma key salvo que no haya opción
      if (chosen.length && chosen.some(ch => ch.key === c.key) && chosen.length < 3) {
        if (Math.random() < 0.5) continue;
      }
      const four = shuffle([...free]).slice(0, 4);
      chosen.push({ ...c, players: four });
      four.forEach(p => used.add(p.id));
      if (chosen.length === 4) break;
    }
    if (chosen.length === 4) return chosen;
  }
  return null;
}

function startConex() {
  const cats = pickCategories();
  if (!cats) { alert('No se pudieron generar categorías'); return; }
  categories = cats;
  cells = [];
  cats.forEach((c, i) => c.players.forEach(p => cells.push({ player: p, catIdx: i, solved: false })));
  shuffle(cells);
  selected = new Set();
  lives = MAX_LIVES;
  solvedCats = new Set();
  gameOver = false;
  solvedEl.innerHTML = '';
  endEl.style.display = 'none';
  verdictEl.style.display = 'none';
  renderHearts();
  renderGrid();
  refreshChips();
  console.log('🤫 (Debug) Categorías:', cats.map(c => c.label));
}
window.startConex = startConex;

function renderHearts() {
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const s = document.createElement('span');
    s.className = 'heart' + (i < (MAX_LIVES - lives) ? ' lost' : '');
    s.textContent = '❤️';
    heartsEl.appendChild(s);
  }
}

function renderGrid() {
  gridEl.innerHTML = '';
  cells.forEach((cell, idx) => {
    if (cell.solved) return; // No mostramos celdas resueltas en el grid
    const div = document.createElement('div');
    div.className = 'conex-tile' + (selected.has(idx) ? ' selected' : '');
    div.dataset.idx = idx;
    div.innerHTML = `
      <img class="photo" src="${FutbolDB.photoOf(cell.player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(cell.player)}'" alt="">
      <div>${cell.player.name}</div>
    `;
    div.addEventListener('click', () => onTile(idx));
    gridEl.appendChild(div);
  });
}

function onTile(idx) {
  if (gameOver) return;
  if (cells[idx].solved) return;
  if (selected.has(idx)) selected.delete(idx);
  else if (selected.size < 4) selected.add(idx);
  renderGrid();
}

function onSubmit() {
  if (gameOver) return;
  if (selected.size !== 4) {
    flashVerdict('Selecciona 4 jugadores', 'wrong');
    return;
  }
  const idxs = [...selected];
  const cats = idxs.map(i => cells[i].catIdx);
  const allSame = cats.every(c => c === cats[0]);
  if (allSame) {
    // Resuelto
    const catIdx = cats[0];
    solvedCats.add(catIdx);
    idxs.forEach(i => cells[i].solved = true);
    selected.clear();
    addSolvedRow(catIdx);
    flashVerdict('✓ ¡Grupo correcto!', 'right');
    renderGrid();
    if (solvedCats.size === 4) win();
  } else {
    // Saber si está "a 1" (3 del mismo grupo)
    const counts = {};
    cats.forEach(c => counts[c] = (counts[c]||0)+1);
    const max = Math.max(...Object.values(counts));
    lives--;
    renderHearts();
    flashVerdict(max === 3 ? '✗ Cerca, te faltó uno.' : '✗ Combinación incorrecta', 'wrong');
    if (lives <= 0) lose();
  }
}

function addSolvedRow(catIdx) {
  const c = categories[catIdx];
  const row = document.createElement('div');
  row.className = `solved-row cat-${catIdx}`;
  const icon = c.icon || '';
  row.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;">${icon} ${c.label}</span><div class="members">${c.players.map(p => p.name).join(' · ')}</div>`;
  solvedEl.appendChild(row);
}

function flashVerdict(msg, type) {
  verdictEl.className = 'verdict ' + type;
  verdictEl.textContent = msg;
  verdictEl.style.display = 'block';
  clearTimeout(flashVerdict._t);
  flashVerdict._t = setTimeout(() => { verdictEl.style.display = 'none'; }, 1800);
}

function win() {
  gameOver = true;
  const s = loadStats(); s.wins++; s.plays++; if(window.FurbolAlbum) FurbolAlbum.addPacks(1); saveStats(s); refreshChips();
  endEl.className = 'end-overlay win';
  endEl.innerHTML = `
    <h2>¡Conexiones resuelto! 🎉</h2>
    <p style="color:var(--text-secondary);margin-bottom:14px;">Con ${lives}/${MAX_LIVES} vidas.</p>
    <button class="btn btn--primary" onclick="startConex()">Nueva partida</button>
  `;
  endEl.style.display = 'block';
  endEl.scrollIntoView({ behavior:'smooth', block:'center' });
}

function lose() {
  gameOver = true;
  const s = loadStats(); s.plays++; saveStats(s);
  // Revelar todas las categorías no resueltas
  categories.forEach((c, i) => { if (!solvedCats.has(i)) { solvedCats.add(i); addSolvedRow(i); c.players.forEach(p => { const idx = cells.findIndex(x => x.player.id === p.id); if (idx>=0) cells[idx].solved = true; }); } });
  renderGrid();
  endEl.className = 'end-overlay fail';
  endEl.innerHTML = `
    <h2>Se acabaron las vidas</h2>
    <p style="color:var(--text-secondary);margin-bottom:14px;">Esas eran las 4 conexiones.</p>
    <button class="btn btn--primary" onclick="startConex()">Reintentar</button>
  `;
  endEl.style.display = 'block';
  endEl.scrollIntoView({ behavior:'smooth', block:'center' });
}

document.getElementById('btn-submit').addEventListener('click', onSubmit);
document.getElementById('btn-clear').addEventListener('click', () => { selected.clear(); renderGrid(); });
document.getElementById('btn-shuffle').addEventListener('click', () => { cells = shuffle(cells); renderGrid(); });

document.addEventListener('DOMContentLoaded', async () => {
  await FutbolDB.load();
  startConex();
});

