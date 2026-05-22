/** intruso-diario.js — 4 jugadores, 3 comparten propiedad, 1 no. Reto diario. */
const KEY='furbol.intruso-diario';

let four=[], intruderIdx=-1, hintText='';
let todayKey, historyRec, gameOver;

const grid=document.getElementById('grid'),hint=document.getElementById('hint'),
  verdict=document.getElementById('verdict'),endEl=document.getElementById('end'),
  dayInfo=document.getElementById('day-info');

const CAT_TYPES = [
  { id:'club',        label:v=>'Mismo CLUB: '+v,
    group: all => { const m={}; all.forEach(p=>{ if(p.club)(m[p.club]=m[p.club]||[]).push(p); }); return m; },
    check: (p,v) => p.club===v },
  { id:'nationality', label:v=>'Misma NACIONALIDAD: '+v,
    group: all => { const m={}; all.forEach(p=>{ if(p.nationality)(m[p.nationality]=m[p.nationality]||[]).push(p); }); return m; },
    check: (p,v) => p.nationality===v },
  { id:'league',      label:v=>'Misma LIGA: '+v,
    group: all => { const m={}; all.forEach(p=>{ if(p.league)(m[p.league]=m[p.league]||[]).push(p); }); return m; },
    check: (p,v) => p.league===v },
  { id:'surname',     label:v=>'Mismo APELLIDO: '+v,
    group: all => { const m={}; all.forEach(p=>{ const s=p.name.split(/\s+/).pop(); (m[s]=m[s]||[]).push(p); }); return m; },
    check: (p,v) => p.name.split(/\s+/).pop()===v },
  { id:'anyClub',     label:v=>'Jugaron en '+v,
    group: all => { const m={}; all.forEach(p=>{ const clubs=[p.club,...(p.formerClubs||[])]; clubs.forEach(c=>{ if(c)(m[c]=m[c]||[]).push(p); }); }); return m; },
    check: (p,v) => p.club===v || (p.formerClubs||[]).includes(v) },
];

function loadS(){return FurbolUI.loadStats(KEY,{ history: {} })}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function seededShuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDailyPuzzle(rnd) {
  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas' && p.marketValue >= 3_000_000);
  all.sort((a,b)=>a.id.localeCompare(b.id)); // sort for determinism
  
  let candidates = [];
  for (const ct of CAT_TYPES) {
    const buckets = ct.group(all);
    const keys = Object.keys(buckets).sort();
    for (const v of keys) {
      if (buckets[v].length >= 3) {
        buckets[v].sort((a,b)=>a.id.localeCompare(b.id));
        candidates.push({ cat: ct, value: v, players: buckets[v] });
      }
    }
  }
  
  // Sort candidates to guarantee identical array on all devices
  candidates.sort((a,b) => (a.cat.id + a.value).localeCompare(b.cat.id + b.value));
  seededShuffle(candidates, rnd);
  
  const chosen = candidates[0];
  const group = seededShuffle([...chosen.players], rnd).slice(0,3);
  
  // Pick an intruder deterministically
  const possibleIntruders = all.filter(p => !chosen.cat.check(p, chosen.value));
  seededShuffle(possibleIntruders, rnd);
  const intruder = possibleIntruders[0];
  
  const finalFour = seededShuffle([...group, intruder], rnd);
  const intrIdx = finalFour.findIndex(p => p.id === intruder.id);
  
  return {
    four: finalFour,
    intruderIdx: intrIdx,
    catLabel: chosen.cat.label(chosen.value)
  };
}

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 41 + 17);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  const puzzle = generateDailyPuzzle(rnd);
  four = puzzle.four;
  intruderIdx = puzzle.intruderIdx;
  hintText = '🔗 ' + puzzle.catLabel;

  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      done: false,
      won: false,
      guess: -1
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  gameOver = historyRec.done;
  
  if (gameOver) {
    hint.textContent = hintText;
  } else {
    hint.textContent = '🔗 ¿Quién no encaja?';
  }
  
  render();
  
  if (gameOver) showEnd(historyRec.won, historyRec.guess);
}
window.init=init;

function render(){
  grid.innerHTML = four.map((p,i)=>`
    <div class="player-tile" data-idx="${i}">
      ${FurbolUI.photo(p,64)}
      <div class="pname">${p.name}</div>
    </div>
  `).join('');
  
  grid.querySelectorAll('.player-tile').forEach(t=>{
    const i = parseInt(t.dataset.idx,10);
    if (gameOver) {
      if (i === intruderIdx) t.classList.add('right');
      else if (i === historyRec.guess) t.classList.add('wrong');
      else t.classList.add('disabled');
    } else {
      t.addEventListener('click',()=>pick(i));
    }
  });
}

function pick(i){
  if(gameOver)return;
  gameOver=true;
  const correct = i===intruderIdx;
  
  historyRec.done = true;
  historyRec.won = correct;
  historyRec.guess = i;
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
  
  render();
  
  if(correct) {
    if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  showEnd(correct, i);
}

function showEnd(won, guessIdx) {
  hint.textContent = hintText;
  
  if(won){
    verdict.className='verdict right'; verdict.textContent='✓ ¡Correcto!'; verdict.style.display='block';
  } else {
    verdict.className='verdict wrong';
    verdict.innerHTML = `✗ El intruso era <strong>${four[intruderIdx].name}</strong>`;
    verdict.style.display='block';
  }
  
  // Create share text
  // We represent the 4 players as squares. The intruder is a green square if won, or the chosen one is red if lost, others are black.
  let squares = [];
  for (let i = 0; i < 4; i++) {
    if (i === intruderIdx && won) squares.push('🟩');
    else if (i === guessIdx && !won) squares.push('🟥');
    else if (i === intruderIdx && !won) squares.push('🟩'); // show where it was
    else squares.push('⬛');
  }
  
  const shareText = `Furbol Intruso Diario ${won ? '✓' : '✗'}\n\n${squares.join('')}`;
  
  endEl.className = 'end-overlay-common ' + (won ? 'win' : 'fail');
  endEl.innerHTML = `<h2>${won ? '¡Lo lograste!' : 'Fallaste'}</h2>
    <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);
