/** escudo-zoom-diario.js — Adivina el club por un trozo super-ampliado del escudo. Reto diario. */
const KEY='furbol.escudo-zoom-diario';

let target, gameOver=false, todayKey, historyRec;
const img=document.getElementById('ez-img'),
  verdict=document.getElementById('verdict'),endEl=document.getElementById('end'),
  dayInfo=document.getElementById('day-info'),
  searchBox=document.getElementById('search-box'),
  guessInput=document.getElementById('guess-input'),
  btnGuess=document.getElementById('btn-guess'),
  suggestionsBox=document.getElementById('suggestions');

let allClubs = [];

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  
  // Extraer todos los clubes que tienen escudo
  allClubs = FutbolDB.getAll().reduce((acc,p)=>{ 
    const url=FutbolDB.crestOf(p); 
    if(url && !acc.find(x=>x.id===p.clubId)) acc.push({id:p.clubId, name:p.club, url}); 
    return acc; 
  }, []);

  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 23 + 12);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo escudo para todos`;

  // Seleccionar club de forma determinista
  allClubs.sort((a,b)=>a.id.localeCompare(b.id)); 
  const targetIdx = Math.floor(rnd() * allClubs.length);
  target = allClubs[targetIdx];

  // Zoom determinista (offset entre -100 y -440 igual que el original)
  const offX = -Math.floor(rnd()*340)-100;
  const offY = -Math.floor(rnd()*340)-100;

  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      done: false,
      won: false,
      guess: null
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  gameOver = historyRec.done;

  img.src = target.url;
  img.onerror = () => { img.onerror=null; img.style.display='none'; };
  
  if (gameOver) {
    searchBox.style.display = 'none';
    img.style.left='0'; img.style.top='0'; img.style.transform='scale(1)'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='contain';
    showEnd(historyRec.won, historyRec.guess);
  } else {
    img.style.cssText = '';
    img.style.position = 'absolute';
    img.style.width = '600px';
    img.style.height = '600px';
    img.style.objectFit = 'contain';
    img.style.transition = 'transform 0.5s ease, left 0.5s ease, top 0.5s ease';
    img.style.display = 'block';
    img.style.left = offX + 'px';
    img.style.top  = offY + 'px';
    img.style.transform = 'scale(1.8)';
  }
}

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function makeGuess() {
  if (gameOver) return;
  const val = guessInput.value.trim();
  if (!val) return;
  
  // Buscar coincidencia exacta (normalizada)
  const normVal = normalize(val);
  const matchedClub = allClubs.find(c => normalize(c.name) === normVal);
  
  // Guardar intento aunque no lo encuentre en la lista
  const guessName = matchedClub ? matchedClub.name : val;
  const correct = matchedClub && matchedClub.id === target.id;
  
  gameOver = true;
  historyRec.done = true;
  historyRec.won = correct;
  historyRec.guess = guessName;
  
  const s = loadS();
  s.history[todayKey] = historyRec;
  saveS(s);
  
  searchBox.style.display = 'none';
  
  // Mostrar el escudo entero animado
  img.style.left='0'; img.style.top='0'; img.style.transform='scale(1)'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='contain';
  
  if (correct) {
    if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
  }
  
  // Un pequeño retraso para dejar que la animación del zoom se aprecie
  setTimeout(() => showEnd(correct, guessName), 600);
}

function updateSuggestions() {
  const val = normalize(guessInput.value);
  if (!val) {
    suggestionsBox.style.display = 'none';
    return;
  }
  
  const matches = allClubs.filter(c => normalize(c.name).includes(val)).slice(0, 8);
  
  if (matches.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }
  
  suggestionsBox.innerHTML = matches.map(c => 
    `<div class="suggestion-item" data-name="${c.name}">${c.name}</div>`
  ).join('');
  
  suggestionsBox.style.display = 'block';
  
  suggestionsBox.querySelectorAll('.suggestion-item').forEach(el => {
    el.addEventListener('click', () => {
      guessInput.value = el.dataset.name;
      suggestionsBox.style.display = 'none';
      makeGuess();
    });
  });
}

guessInput.addEventListener('input', updateSuggestions);

// Ocultar sugerencias al hacer click fuera
document.addEventListener('click', (e) => {
  if (!searchBox.contains(e.target)) {
    suggestionsBox.style.display = 'none';
  }
});

function showEnd(won, guessName) {
  if(won){
    verdict.className='verdict right'; verdict.textContent='✓ ¡Correcto!'; verdict.style.display='block';
  } else {
    verdict.className='verdict wrong';
    verdict.innerHTML = `✗ Era <strong>${target.name}</strong><br><small>Dijiste: ${guessName}</small>`;
    verdict.style.display='block';
  }
  
  const shareText = `Furbol Escudo Zoom Diario ${won ? '✓' : '✗'}\n\n${won ? '🔍 Me bastó este trocito para adivinar' : '🔍 Imposible con ese trocito'}`;
  
  endEl.className = 'end-overlay-common ' + (won ? 'win' : 'fail');
  endEl.innerHTML = `<h2>${won ? '¡Ojo clínico!' : 'Fin del juego'}</h2>
    <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:8px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

btnGuess.addEventListener('click', makeGuess);
guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') makeGuess();
});

document.addEventListener('DOMContentLoaded', init);
