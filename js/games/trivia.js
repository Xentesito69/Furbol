/** trivia.js — Preguntas multiple-choice infinitas con vidas y tiempo. */
const KEY='furbol.trivia', LIVES=3, T_LIMIT=10;
let lives, streak, current, correctIdx, gameOver, timer, secs;
const qcard=document.getElementById('qcard'), optsEl=document.getElementById('options'),
  verdict=document.getElementById('verdict'), endEl=document.getElementById('end'),
  chipStreak=document.getElementById('chip-streak'), chipBest=document.getElementById('chip-best'),
  livesEl=document.getElementById('lives'), tfill=document.getElementById('timer-fill');

function loadS(){return FurbolUI.loadStats(KEY,{best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){ chipStreak.textContent=streak; chipBest.textContent=loadS().best; renderLives(); }
function renderLives(){
  livesEl.innerHTML='';
  for(let i=0;i<LIVES;i++){
    const s=document.createElement('span');
    s.className='life'+(i<(LIVES-lives)?' lost':'');
    s.textContent='❤️'; livesEl.appendChild(s);
  }
}

const QTYPES = [
  // (player) → "¿De qué nacionalidad es?"
  {gen(){const p=FutbolDB.random(); const opts=[p.nationality, ...FurbolUI.shuffle(FutbolDB.getNationalities().filter(n=>n!==p.nationality)).slice(0,3)]; return {q:`¿Nacionalidad de ${p.name}?`,photo:FutbolDB.photoOf(p),avatar:FutbolDB.avatarOf(p), options:FurbolUI.shuffle(opts), correct:p.nationality};}},
  // → "¿En qué club juega?"
  {gen(){const p=FutbolDB.random(); const clubs=FutbolDB.getClubs(); const opts=[p.club, ...FurbolUI.shuffle(clubs.filter(c=>c!==p.club)).slice(0,3)]; return {q:`¿En qué club juega ${p.name}?`,photo:FutbolDB.photoOf(p),avatar:FutbolDB.avatarOf(p), options:FurbolUI.shuffle(opts), correct:p.club};}},
  // → "¿En qué liga juega?"
  {gen(){const p=FutbolDB.random(); const opts=[p.league, ...FurbolUI.shuffle(FutbolDB.getLeagues().filter(l=>l!==p.league)).slice(0,3)]; return {q:`¿En qué liga juega ${p.name}?`,photo:FutbolDB.photoOf(p),avatar:FutbolDB.avatarOf(p), options:FurbolUI.shuffle(opts), correct:p.league};}},
  // → "¿Qué posición ocupa?"
  {gen(){const p=FutbolDB.random(); const opts=['Portero','Defensa','Centrocampista','Delantero']; return {q:`¿Qué posición ocupa ${p.name}?`,photo:FutbolDB.photoOf(p),avatar:FutbolDB.avatarOf(p), options:opts, correct:p.position};}},
];

async function init(){
  await FutbolDB.load();
  lives=LIVES; streak=0; endEl.style.display='none';
  refresh(); nextQ();
}
window.init=init;

function nextQ(){
  verdict.style.display='none';
  if(gameOver) return;
  const type = QTYPES[Math.floor(Math.random()*QTYPES.length)];
  current = type.gen();
  correctIdx = current.options.indexOf(current.correct);
  qcard.innerHTML = `<img class="q-photo" src="${current.photo}" onerror="this.onerror=null;this.src='${current.avatar}'" alt=""><div class="question">${current.q}</div>`;
  optsEl.innerHTML = current.options.map((o,i)=>`<button class="mc-option" data-idx="${i}">${o}</button>`).join('');
  optsEl.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>pick(parseInt(b.dataset.idx,10))));
  // timer
  secs = T_LIMIT*10; tfill.style.width='100%';
  clearInterval(timer);
  timer = setInterval(()=>{
    secs--; tfill.style.width = (secs/(T_LIMIT*10)*100) + '%';
    if(secs<=0){ clearInterval(timer); pick(-1); }
  }, 100);
}

function pick(i){
  if(gameOver) return;
  clearInterval(timer);
  const correct = i===correctIdx;
  optsEl.querySelectorAll('.mc-option').forEach((b,j)=>{
    b.classList.add(j===correctIdx?'right':(j===i?'wrong':'disabled'));
  });
  if(correct){ streak++; const s=loadS(); if(streak>s.best){s.best=streak;saveS(s);} if(streak%5===0 && window.FurbolAlbum) FurbolAlbum.addPacks(1); refresh();
    verdict.className='verdict right'; verdict.textContent='✓'; verdict.style.display='block';
    setTimeout(nextQ, 800);
  } else {
    lives--; refresh();
    verdict.className='verdict wrong';
    verdict.innerHTML = i===-1 ? '⏰ ¡Tiempo!' : `Era <strong>${current.correct}</strong>`;
    verdict.style.display='block';
    if(lives<=0) end();
    else setTimeout(nextQ, 1300);
  }
}

function end(){
  gameOver=true;
  endEl.className='end-overlay-common fail';
  endEl.innerHTML=`<h2>Game Over</h2><p style="color:var(--text-secondary);">Racha final: <strong>${streak}</strong></p><button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Otra vez</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);

