/** primer-club.js — Multiple choice: el primer club de la carrera del jugador. */
const KEY='furbol.primerclub';
let target, options, correctIdx, streak=0, gameOver=false;
const card=document.getElementById('card'),optsEl=document.getElementById('options'),
  verdict=document.getElementById('verdict'),endEl=document.getElementById('end'),
  chipStreak=document.getElementById('chip-streak'),chipBest=document.getElementById('chip-best');

function loadS(){return FurbolUI.loadStats(KEY,{best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){ chipStreak.textContent=streak; chipBest.textContent=loadS().best; }

async function init(){
  await FutbolDB.load();
  gameOver=false; verdict.style.display='none'; endEl.style.display='none';
  let tries=0;
  do { target = FutbolDB.random(); tries++; }
  while(tries<60 && (!target.formerClubs || target.formerClubs.length===0));
  // primer club = el último de formerClubs (orden = más reciente → más antiguo)
  const firstClub = target.formerClubs[target.formerClubs.length-1] || target.club;
  // Generar 3 distractores: otros clubes únicos
  const allClubs = [...new Set(FutbolDB.getAll().map(p=>p.club))].filter(c=>c!==firstClub);
  const distractors = FurbolUI.shuffle(allClubs).slice(0,3);
  options = FurbolUI.shuffle([firstClub, ...distractors]);
  correctIdx = options.indexOf(firstClub);
  render();
  refresh();
  console.log('🤫', target.name, '→', firstClub);
}
window.init=init;

function render(){
  card.innerHTML = `<div class="pname" style="font-size:1.6rem;">${target.name}</div>`;
  optsEl.innerHTML = options.map((c,i)=>{
    // Crear un objeto fake para crestHTML
    const sample = FutbolDB.getAll().find(p=>p.club===c);
    return `<button class="mc-option" data-idx="${i}">${sample?FurbolUI.crest(sample,28):'⚽'} ${c}</button>`;
  }).join('');
  optsEl.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>pick(parseInt(b.dataset.idx,10))));
}

function pick(i){
  if(gameOver)return;
  gameOver=true;
  const correct = i===correctIdx;
  optsEl.querySelectorAll('.mc-option').forEach((b,j)=>{
    b.classList.add(j===correctIdx?'right':(j===i?'wrong':'disabled'));
  });
  if(correct){ streak++; const s=loadS(); if(streak>s.best){s.best=streak;saveS(s);} if(streak%5===0 && window.FurbolAlbum) FurbolAlbum.addPacks(1); refresh();
    verdict.className='verdict right'; verdict.textContent='✓ ¡Correcto!'; verdict.style.display='block';
    setTimeout(init,1400);
  } else {
    streak=0; refresh();
    verdict.className='verdict wrong';
    verdict.innerHTML = `Su primer club fue <strong>${options[correctIdx]}</strong>`; verdict.style.display='block';
    endEl.className='end-overlay-common fail';
    endEl.innerHTML = `<h2>Racha rota</h2><button class="btn btn--primary" onclick="init()">Otra</button>`;
    endEl.style.display='block';
  }
}

document.addEventListener('DOMContentLoaded', init);

