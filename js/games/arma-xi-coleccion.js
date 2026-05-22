/** arma-xi-coleccion.js — XI builder usando solo jugadores desbloqueados del álbum */

const FORMATION = { GK:1, DEF:4, MID:3, FWD:3 };
const POS_LABEL = { GK:'Portero', DEF:'Defensa', MID:'Centrocampista', FWD:'Delantero' };
const SHORT     = { 'Portero':'GK','Defensa':'DEF','Centrocampista':'MID','Delantero':'FWD' };

let allUnlocked = [];  // jugadores desbloqueados
let placed = {};       // {posKey: [player, ...]}
let posFilter = 'ALL';

const pitchEl   = document.getElementById('pitch');
const benchEl   = document.getElementById('bench');
const summaryEl = document.getElementById('summary');

/** Foto normal (las dinámicas daban problemas) */
function actionPhoto(p) {
  return FutbolDB.photoOf(p) || FutbolDB.avatarOf(p);
}

async function newGame() {
  await FutbolDB.load();
  allUnlocked = FurbolAlbum.getUnlocked().filter(p => p.league !== 'Leyendas');

  if (allUnlocked.length < 11) {
    document.getElementById('unlock-msg').style.display = 'block';
    document.getElementById('game-area').style.display = 'none';
    return;
  }
  document.getElementById('unlock-msg').style.display = 'none';
  document.getElementById('game-area').style.display = 'block';

  placed = { GK:[], DEF:[], MID:[], FWD:[] };
  summaryEl.classList.remove('show');
  buildPitch();
  renderBench();
}
window.newGame = newGame;

function buildPitch() {
  pitchEl.querySelectorAll('.line').forEach(line => {
    line.innerHTML = '';
    const pos   = line.dataset.pos;
    const count = +line.dataset.count;
    for (let i = 0; i < count; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.pos = pos;
      slot.dataset.idx = i;
      slot.innerHTML = `<div class="pos-label">${POS_LABEL[pos]}</div>`;
      slot.addEventListener('click', () => onSlotClick(pos, i));
      slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('over'));
      slot.addEventListener('drop', e => {
        e.preventDefault(); slot.classList.remove('over');
        const pid = e.dataTransfer.getData('text/plain');
        const player = allUnlocked.find(p => p.id === pid);
        if (player) placePlayer(player, pos, i);
      });
      line.appendChild(slot);
    }
  });
}

function renderSlot(pos, idx, player) {
  const slot = pitchEl.querySelector(`.slot[data-pos="${pos}"][data-idx="${idx}"]`);
  if (!slot) return;
  if (player) {
    const aPhoto = actionPhoto(player);
    slot.classList.add('filled');
    slot.innerHTML = `
      <button class="remove" title="Quitar">×</button>
      <img class="photo" src="${aPhoto}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(player)}'" alt="${player.name}">
      <div class="name">${player.name}</div>`;
    // Fallback handler
    slot.querySelector('img').onerror = function() { this.onerror=null; this.src=FutbolDB.avatarOf(player); };
    slot.querySelector('.remove').addEventListener('click', e => { e.stopPropagation(); removeFromSlot(pos, idx); });
  } else {
    slot.classList.remove('filled');
    slot.innerHTML = `<div class="pos-label">${POS_LABEL[pos]}</div>`;
  }
}

function renderBench() {
  const filtered = posFilter === 'ALL' ? allUnlocked
    : allUnlocked.filter(p => SHORT[p.position] === posFilter);

  if (filtered.length === 0) {
    benchEl.innerHTML = '<div class="bench-empty">Sin jugadores en esta posición</div>';
    return;
  }

  benchEl.innerHTML = '';
  filtered.forEach(p => {
    const used = isUsed(p.id);
    const card = document.createElement('div');
    card.className = 'bench-card' + (used ? ' used' : '');
    card.draggable = !used;
    card.dataset.id = p.id;
    const short = SHORT[p.position] || '?';
    // Use action photo in bench too
    const aPhoto = actionPhoto(p);
    card.innerHTML = `
      <img class="photo" src="${aPhoto}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(p)}'" alt="">
      <div class="bc-info">
        <div class="nm">${p.name} ${p.count > 1 ? `<span style="color:var(--text-muted);font-size:0.65rem">×${p.count}</span>` : ''}</div>
        <div class="meta">${p.club}</div>
      </div>
      <span class="badge-pos ${short}">${short}</span>`;
    card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', p.id));
    card.addEventListener('click', () => {
      if (used) return;
      const pk = short;
      for (let i = 0; i < FORMATION[pk]; i++) {
        if (!placed[pk][i]) { placePlayer(p, pk, i); return; }
      }
    });
    benchEl.appendChild(card);
  });
}

function isUsed(pid) {
  return Object.values(placed).some(arr => arr.some(p => p && p.id === pid));
}

function placePlayer(player, posKey, idx) {
  const pk = SHORT[player.position];
  if (pk !== posKey) { alert(`${player.name} es ${player.position}, no encaja aquí.`); return; }
  for (const k of Object.keys(placed)) {
    for (let i = 0; i < placed[k].length; i++) {
      if (placed[k][i] && placed[k][i].id === player.id) {
        placed[k][i] = undefined; renderSlot(k, i, null);
      }
    }
  }
  placed[posKey][idx] = player;
  renderSlot(posKey, idx, player);
  renderBench();
}

function removeFromSlot(posKey, idx) {
  placed[posKey][idx] = undefined;
  renderSlot(posKey, idx, null);
  renderBench();
}

function onSlotClick() {}

function totalCount() { return Object.values(placed).reduce((a,arr) => a + arr.filter(Boolean).length, 0); }
function totalValue() { return Object.values(placed).reduce((a,arr) => a + arr.filter(Boolean).reduce((s,p) => s + (p.marketValue||0), 0), 0); }

function finish() {
  if (totalCount() < 11) { alert('Coloca los 11 jugadores primero.'); return; }
  const value = totalValue();
  const players = Object.values(placed).flat().filter(Boolean);
  const names = players.map(p => p.name).join(', ');
  summaryEl.innerHTML = `
    <div style="color:var(--text-secondary);font-size:0.85rem;">Tu XI de la colección</div>
    <div class="total">${FutbolDB.formatValue(value)}</div>
    <div style="color:var(--text-secondary);font-size:0.8rem;margin-top:8px;">${names}</div>
    <button class="btn btn--primary" style="margin-top:14px;" onclick="newGame()">🔄 Resetear</button>`;
  summaryEl.classList.add('show');
  summaryEl.scrollIntoView({ behavior:'smooth', block:'center' });
}
window.finish = finish;

function filterPos(pos, btn) {
  posFilter = pos;
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBench();
}
window.filterPos = filterPos;

document.addEventListener('DOMContentLoaded', newGame);
