/**
 * xi-ideal.js — Arma tu XI: 4-3-3.
 * 18 jugadores aleatorios (con cuotas por posición), elige los 11 mejores.
 */

const STORAGE_KEY = 'furbol.xi';
const FORMATION = { GK: 1, DEF: 4, MID: 3, FWD: 3 };
const POS_LABEL = { GK:'Portero', DEF:'Defensa', MID:'Centrocampista', FWD:'Delantero' };
const SHORT     = { 'Portero':'GK', 'Defensa':'DEF', 'Centrocampista':'MID', 'Delantero':'FWD' };

let bench;     // array de jugadores disponibles
let placed;    // {posKey -> [player, player, ...]}  posKey = 'GK','DEF','MID','FWD'

const pitchEl   = document.getElementById('pitch');
const benchEl   = document.getElementById('bench');
const summaryEl = document.getElementById('summary');

function shuffle(a) { for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

/** Foto normal */
function actionPhoto(p) {
  return FutbolDB.photoOf(p) || FutbolDB.avatarOf(p);
}

async function newGame() {
  await FutbolDB.load();
  // Cogemos pool por posición y luego mezclamos para tener 18 (1 GK extra, etc.)
  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas');
  const pickN = (pos, n) => shuffle(all.filter(p => p.position === pos)).slice(0, n);
  bench = [
    ...pickN('Portero', 2),
    ...pickN('Defensa', 6),
    ...pickN('Centrocampista', 5),
    ...pickN('Delantero', 5),
  ];
  shuffle(bench);
  placed = { GK: [], DEF: [], MID: [], FWD: [] };
  buildPitch();
  renderBench();
  summaryEl.classList.remove('show');
  summaryEl.innerHTML = '';
}
window.newGame = newGame;

function buildPitch() {
  // Solo construir slots una vez
  pitchEl.querySelectorAll('.line').forEach(line => {
    line.innerHTML = '';
    const pos = line.dataset.pos;
    const count = +line.dataset.count;
    for (let i = 0; i < count; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.pos = pos;
      slot.dataset.idx = i;
      slot.innerHTML = `<div class="pos-label">${POS_LABEL[pos]}</div>`;
      slot.addEventListener('click', () => onSlotClick(pos, i));
      // Drag/drop
      slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('over'));
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('over');
        const pid = e.dataTransfer.getData('text/plain');
        const player = bench.find(p => p.id === pid);
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
    slot.classList.add('filled');
    const aPhoto = actionPhoto(player);
    slot.innerHTML = `
      <button class="remove" title="Quitar">×</button>
      <img class="photo" src="${aPhoto}" onerror="this.onerror=null;this.src='${FutbolDB.photoOf(player)}'" alt="${player.name}">
      <div class="name">${player.name}</div>
    `;
    slot.querySelector('.remove').addEventListener('click', e => {
      e.stopPropagation();
      removeFromSlot(pos, idx);
    });
  } else {
    slot.classList.remove('filled');
    slot.innerHTML = `<div class="pos-label">${POS_LABEL[pos]}</div>`;
  }
}

function renderBench() {
  benchEl.innerHTML = '';
  bench.forEach(p => {
    const used = isUsed(p.id);
    const card = document.createElement('div');
    card.className = 'bench-card' + (used ? ' used' : '');
    card.draggable = !used;
    card.dataset.id = p.id;
    const short = SHORT[p.position] || '?';
    card.innerHTML = `
      <img class="photo" src="${actionPhoto(p)}" onerror="this.onerror=null;this.src='${FutbolDB.photoOf(p)}'" alt="">
      <div class="nm">${p.name}</div>
      <div class="meta">${p.club}</div>
      <span class="badge-pos ${short}">${short}</span>
    `;
    card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', p.id));
    card.addEventListener('click', () => {
      if (used) return;
      // Coloca en la primera ranura libre de su posición
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
  const pkPlayer = SHORT[player.position];
  if (pkPlayer !== posKey) {
    alert(`${player.name} es ${player.position}, no encaja en esa posición.`);
    return;
  }
  // Si ya estaba en otra ranura, sácalo primero
  for (const k of Object.keys(placed)) {
    for (let i = 0; i < placed[k].length; i++) {
      if (placed[k][i] && placed[k][i].id === player.id) {
        placed[k][i] = undefined;
        renderSlot(k, i, null);
      }
    }
  }
  // Si la ranura estaba ocupada, devuelve al banquillo
  if (placed[posKey][idx]) {
    placed[posKey][idx] = undefined;
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

function totalCount() {
  return Object.values(placed).reduce((acc, arr) => acc + arr.filter(Boolean).length, 0);
}
function totalValue() {
  return Object.values(placed).reduce((acc, arr) => acc + arr.filter(Boolean).reduce((a,p) => a + (p.marketValue||0), 0), 0);
}

function finish() {
  if (totalCount() < 11) {
    alert('Coloca los 11 jugadores antes de comprobar.');
    return;
  }
  const value = totalValue();
  const top = FutbolDB.getAll()
    .filter(p => p.league !== 'Leyendas')
    .sort((a,b) => b.marketValue - a.marketValue)
    .slice(0, 11)
    .reduce((a,p) => a + p.marketValue, 0);
  const pct = Math.round(value / top * 100);
  const s = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { best: 0, plays: 0 }; } catch { return { best:0, plays:0 }; } })();
  s.plays++;
  if (value > s.best) s.best = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

  summaryEl.innerHTML = `
    <div style="color:var(--text-secondary);font-size:0.85rem;">Valor total de tu XI</div>
    <div class="total">${FutbolDB.formatValue(value)}</div>
    <div style="color:var(--text-secondary);">${pct}% del XI más caro posible</div>
    <div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted);">Mejor histórico: ${FutbolDB.formatValue(s.best)}</div>
    <button class="btn btn--primary" style="margin-top:14px;" onclick="newGame()">Nueva partida</button>
  `;
  summaryEl.classList.add('show');
  summaryEl.scrollIntoView({ behavior:'smooth', block:'center' });
}

function onSlotClick(pos, idx) {
  // Click vacío en ranura no hace nada (las cards del banquillo se encargan)
}

document.getElementById('btn-new').addEventListener('click', newGame);
document.getElementById('btn-finish').addEventListener('click', finish);

document.addEventListener('DOMContentLoaded', newGame);
