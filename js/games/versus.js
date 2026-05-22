/** versus.js — 2 jugadores alternando turnos. 10 rondas. */
const KEY='furbol.versus', ROUNDS=10;
let names=['Jugador 1','Jugador 2'], scores=[0,0], turn=0, round=0, current, correctIdx, ended=false;
const setup=document.getElementById('setup'), game=document.getElementById('game'),
  banner=document.getElementById('banner'), board=document.getElementById('board'),
  qcard=document.getElementById('qcard'), opts=document.getElementById('options'),
  verdict=document.getElementById('verdict'), endEl=document.getElementById('end'),
  chipRound=document.getElementById('chip-round');

document.getElementById('btn-start').addEventListener('click', async ()=>{
  names = [document.getElementById('n1').value||'Jugador 1', document.getElementById('n2').value||'Jugador 2'];
  await FutbolDB.load();
  setup.style.display='none'; game.style.display='block';
  scores=[0,0]; turn=0; round=0; ended=false;
  next();
});

function render(){
  banner.textContent = `Turno de ${names[turn]}`;
  banner.className = 'turn-banner ' + (turn===0?'p1':'p2');
  board.innerHTML = names.map((n,i)=>`
    <div class="score-card ${turn===i?'active '+(i===0?'p1':'p2'):''} ${i===0?'p1':'p2'}">
      <div class="pname">${n}</div>
      <div class="score">${scores[i]}</div>
    </div>
  `).join('');
  chipRound.textContent = `${Math.floor(round/2)+1}/${ROUNDS}`;
}

function genQ(){
  // Misma estructura que trivia: nacionalidad/club/liga/posición
  const types = ['nationality','club','league','position'];
  const key = types[Math.floor(Math.random()*types.length)];
  const p = FutbolDB.random();
  const correct = p[key];
  let pool;
  if(key==='nationality') pool = FutbolDB.getNationalities();
  else if(key==='club') pool = FutbolDB.getClubs();
  else if(key==='league') pool = FutbolDB.getLeagues();
  else pool = ['Portero','Defensa','Centrocampista','Delantero'];
  const opts = FurbolUI.shuffle([correct, ...FurbolUI.shuffle(pool.filter(x=>x!==correct)).slice(0,3)]);
  const labels = {nationality:'¿Nacionalidad de', club:'¿En qué club juega', league:'¿En qué liga juega', position:'¿Qué posición ocupa'};
  return { q:`${labels[key]} ${p.name}?`, photo:FutbolDB.photoOf(p), avatar:FutbolDB.avatarOf(p), options:opts, correct };
}

function next(){
  if(round >= ROUNDS*2){ finish(); return; }
  current = genQ(); correctIdx = current.options.indexOf(current.correct);
  render(); verdict.style.display='none';
  qcard.innerHTML = `<img class="q-photo" src="${current.photo}" onerror="this.onerror=null;this.src='${current.avatar}'"><div class="question">${current.q}</div>`;
  opts.innerHTML = current.options.map((o,i)=>`<button class="mc-option" data-idx="${i}">${o}</button>`).join('');
  opts.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>pick(parseInt(b.dataset.idx,10))));
}

function pick(i){
  const correct = i===correctIdx;
  opts.querySelectorAll('.mc-option').forEach((b,j)=>b.classList.add(j===correctIdx?'right':(j===i?'wrong':'disabled')));
  if(correct){ scores[turn]++; verdict.className='verdict right'; verdict.textContent=`✓ +1 para ${names[turn]}`; }
  else { verdict.className='verdict wrong'; verdict.innerHTML=`✗ Era <strong>${current.correct}</strong>`; }
  verdict.style.display='block';
  setTimeout(()=>{ turn = 1-turn; round++; next(); }, 1300);
}

function finish(){
  render();
  const winner = scores[0]===scores[1] ? 'Empate' : (scores[0]>scores[1] ? names[0]+' gana 🏆' : names[1]+' gana 🏆');
  endEl.className='end-overlay-common win';
  endEl.innerHTML=`<h2>${winner}</h2>
    <p style="font-size:1.1rem;margin:8px 0;color:var(--text-secondary);">${names[0]} <strong>${scores[0]}</strong> — <strong>${scores[1]}</strong> ${names[1]}</p>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="location.reload()">Otra partida</button>`;
  endEl.style.display='block';
}
