/** conexiones-diario.js — Conexiones con seed diaria. */
const KEY = 'furbol.conexiones-diario';
const MAX_LIVES = 4;

let categories;   // [{key, value, label, players:[]}, ...4]
let cells;        // [{player, catIdx, solved:false}] x16
let selected;     // Set of cell indices
let lives;
let solvedCats;   // Set of solved catIdx
let gameOver;
let todayKey;
let historyRec;

const gridEl    = document.getElementById('grid');
const heartsEl  = document.getElementById('hearts');
const solvedEl  = document.getElementById('solved-list');
const verdictEl = document.getElementById('verdict');
const endEl     = document.getElementById('end-overlay');
const dayInfo   = document.getElementById('day-info');
const controls  = document.getElementById('controls');

function loadS() { return FurbolUI.loadStats(KEY, { history: {} }); }
function saveS(s) { FurbolUI.saveStats(KEY, s); }

// Deterministic shuffle
function seededShuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCategoriesSeeded(rnd) {
  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas' && p.marketValue >= 5_000_000); // Filter for recognizable players
  const candidates = [];

  const _clubIcon = (clubName) => {
    const sample = FutbolDB.getAll().find(p => p.club === clubName);
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
    // Deterministic sort of buckets
    const keys = Object.keys(buckets).sort();
    for (const v of keys) {
      if (buckets[v].length >= 4) {
        const iconHtml = ct.icon(v, buckets[v]);
        // Sort players deterministically
        buckets[v].sort((a, b) => a.id.localeCompare(b.id));
        candidates.push({ key: ct.key, value: v, label: ct.textLabel + ': ' + v, icon: iconHtml, players: buckets[v] });
      }
    }
  }

  // Sort candidates deterministically before shuffling
  candidates.sort((a, b) => (a.key + a.value).localeCompare(b.key + b.value));
  seededShuffle(candidates, rnd);

  for (let attempt = 0; attempt < 1000; attempt++) {
    seededShuffle(candidates, rnd);
    const chosen = [];
    const used = new Set();
    for (const c of candidates) {
      const free = c.players.filter(p => !used.has(p.id));
      if (free.length < 4) continue;
      if (chosen.length && chosen.some(ch => ch.key === c.key) && chosen.length < 3) {
        if (rnd() < 0.5) continue;
      }
      const four = seededShuffle([...free], rnd).slice(0, 4);
      chosen.push({ ...c, players: four });
      four.forEach(p => used.add(p.id));
      if (chosen.length === 4) break;
    }
    if (chosen.length === 4) {
      // Sort chosen categories to have consistent order (e.g. by difficulty)
      return chosen;
    }
  }
  return null;
}

async function init() {
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 13 + 59);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  const cats = pickCategoriesSeeded(rnd);
  if (!cats) { alert('Error generando el reto diario'); return; }
  categories = cats;

  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      boardLayout: [],
      solvedCats: [],
      mistakes: [],
      lives: MAX_LIVES,
      done: false,
      won: false
    };
    
    let initialCells = [];
    for (let i = 0; i < 4; i++) {
      for (const p of categories[i].players) {
        initialCells.push({ player: p, catIdx: i, solved: false, id: p.id });
      }
    }
    seededShuffle(initialCells, rnd);
    s.history[todayKey].boardLayout = initialCells.map(c => ({ id: c.id, catIdx: c.catIdx }));
    saveS(s);
  }

  historyRec = s.history[todayKey];
  
  // Reconstruct cells from history
  cells = historyRec.boardLayout.map(c => {
    const p = FutbolDB.getAll().find(x => x.id === c.id);
    return { player: p, catIdx: c.catIdx, solved: historyRec.solvedCats.includes(c.catIdx) };
  });

  selected = new Set();
  lives = historyRec.lives;
  solvedCats = new Set(historyRec.solvedCats);
  gameOver = historyRec.done;

  renderHearts();
  renderGrid();
  renderSolved(false);
  
  if (gameOver) {
    showEnd(historyRec.won);
  } else {
    endEl.style.display = 'none';
    controls.style.display = 'flex';
  }
}
window.init = init;

function renderHearts() {
  let html = '';
  for (let i = 0; i < MAX_LIVES; i++) html += `<span class="heart ${i >= lives ? 'lost' : ''}">❤️</span>`;
  heartsEl.innerHTML = html;
}

function renderSolved(animateLast) {
  solvedEl.innerHTML = '';
  const solvedArr = Array.from(solvedCats);
  for (let i = 0; i < solvedArr.length; i++) {
    const catIdx = solvedArr[i];
    const cat = categories[catIdx];
    const catPlayers = cells.filter(c => c.catIdx === catIdx).map(c => c.player);
    const row = document.createElement('div');
    row.className = `solved-row cat-${catIdx}`;
    if (!animateLast || i !== solvedArr.length - 1) {
      row.style.animation = 'none';
    }
    row.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:6px;">${cat.icon} <span>${cat.label.toUpperCase()}</span></div>
                     <div class="members">${catPlayers.map(p => p.name.split(' ').pop()).join(', ')}</div>`;
    solvedEl.appendChild(row);
  }
}

function renderGrid() {
  gridEl.innerHTML = '';
  const activeCells = cells.filter(c => !c.solved);
  for (let i = 0; i < activeCells.length; i++) {
    const c = activeCells[i];
    const idx = cells.indexOf(c); // global index
    const tile = document.createElement('div');
    tile.className = `conex-tile ${selected.has(idx) ? 'selected' : ''}`;
    tile.innerHTML = `<img src="${FutbolDB.photoOf(c.player)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(c.player)}'" class="photo">
                      <div>${c.player.name.split(' ').pop()}</div>`;
    tile.addEventListener('click', () => toggleSelect(idx));
    gridEl.appendChild(tile);
  }
}

function toggleSelect(idx) {
  if (gameOver) return;
  if (selected.has(idx)) {
    selected.delete(idx);
  } else {
    if (selected.size < 4) selected.add(idx);
  }
  renderGrid();
}

function showVerdict(msg, right) {
  verdictEl.textContent = msg;
  verdictEl.className = `verdict ${right ? 'right' : 'wrong'}`;
  verdictEl.style.display = 'block';
  setTimeout(() => { verdictEl.style.display = 'none'; }, 2000);
}

function checkSubmission() {
  if (gameOver || selected.size !== 4) return;
  const selArr = Array.from(selected);
  const firstCat = cells[selArr[0]].catIdx;
  const allSame = selArr.every(i => cells[i].catIdx === firstCat);

  // Determine actual attempt (array of 4 player IDs)
  const attemptIds = selArr.map(i => cells[i].player.id).sort();
  historyRec.mistakes.push(attemptIds);

  if (allSame) {
    showVerdict('¡Correcto!', true);
    selArr.forEach(i => cells[i].solved = true);
    solvedCats.add(firstCat);
    selected.clear();
    
    // Check if won
    if (solvedCats.size === 4) {
      gameOver = true;
      historyRec.won = true;
      if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
      showEnd(true);
    } else {
      // Re-layout remaining
      const active = cells.filter(c => !c.solved);
      const s = FurbolUI.todaySeed();
      seededShuffle(active, FurbolUI.seededRandom(s * 13 + 59 + solvedCats.size));
      // Re-integrate
      let activeIdx = 0;
      for (let i = 0; i < cells.length; i++) {
        if (!cells[i].solved) cells[i] = active[activeIdx++];
      }
    }
  } else {
    lives--;
    renderHearts();
    // One away check?
    const catCounts = {};
    selArr.forEach(i => { catCounts[cells[i].catIdx] = (catCounts[cells[i].catIdx] || 0) + 1; });
    const isOneAway = Object.values(catCounts).some(v => v === 3);
    
    if (lives <= 0) {
      gameOver = true;
      showVerdict('Sin vidas', false);
      showEnd(false);
    } else {
      showVerdict(isOneAway ? '¡A uno de acertar!' : 'Incorrecto', false);
    }
  }

  // Save history
  historyRec.done = gameOver;
  historyRec.lives = lives;
  historyRec.solvedCats = Array.from(solvedCats);
  historyRec.boardLayout = cells.map(c => ({ id: c.player.id, catIdx: c.catIdx }));
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
  
  renderGrid();
  renderSolved(allSame);
}

function showEnd(won) {
  controls.style.display = 'none';
  if (!won) {
    cells.forEach(c => c.solved = true);
    solvedCats = new Set([0,1,2,3]);
    renderGrid();
    renderSolved(false);
  }

  // Generate share text using mistakes array
  let lines = [];
  const emojis = ['🟨','🟩','🟦','🟪']; // Maps to catIdx 0,1,2,3
  
  // To generate the grid, we need to know the catIdx of each player in each mistake
  for (const mistakeIds of historyRec.mistakes) {
    let line = '';
    for (const pid of mistakeIds) {
      // Find the catIdx for this player id from categories
      let cIdx = 0;
      for(let i=0; i<4; i++) {
        if(categories[i].players.some(p => p.id === pid)) cIdx = i;
      }
      line += emojis[cIdx];
    }
    lines.push(line);
  }
  
  const totalAttempts = historyRec.mistakes.length;
  const shareText = `Furbol Conexiones Diario ${won ? totalAttempts : 'X'}\n\n${lines.join('\n')}`;
  
  endEl.className = 'end-overlay ' + (won ? 'win' : 'fail');
  endEl.innerHTML = `<h2>${won ? '¡Lo conseguiste!' : 'Fin del juego'}</h2>
    <textarea readonly style="width:100%;height:100px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display = 'block';
}

document.getElementById('btn-shuffle').addEventListener('click', () => {
  if (gameOver) return;
  const active = cells.filter(c => !c.solved);
  seededShuffle(active, Math.random); // Math.random is fine for UI shuffle
  let activeIdx = 0;
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i].solved) cells[i] = active[activeIdx++];
  }
  selected.clear();
  renderGrid();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (gameOver) return;
  selected.clear();
  renderGrid();
});

document.getElementById('btn-submit').addEventListener('click', checkSubmission);
document.addEventListener('DOMContentLoaded', init);
