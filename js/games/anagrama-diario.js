/** anagrama-diario.js */
const KEY='furbol.anagrama-diario';
const MAX_LIVES = 3;

let target, surname, normalized, letters, placed, gameOver=false, lives=MAX_LIVES;
let todayKey, historyRec;

const scramble=document.getElementById('scramble'), answer=document.getElementById('answer'),
  hint=document.getElementById('hint'), verdict=document.getElementById('verdict'),
  endEl=document.getElementById('end'), dayInfo=document.getElementById('day-info'),
  heartsEl=document.getElementById('hearts'), actionButtons=document.getElementById('action-buttons');

function loadS(){return FurbolUI.loadStats(KEY,{history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

function renderHearts() {
  let html = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    html += `<span class="heart ${i >= lives ? 'lost' : ''}">❤️</span>`;
  }
  heartsEl.innerHTML = html;
}

function pickPlayer(rnd){
  const all = FutbolDB.getAll().filter(p => p.league !== 'Leyendas');
  all.sort((a,b)=>a.id.localeCompare(b.id));

  for(let i=0;i<500;i++){
    const idx = Math.floor(rnd() * all.length);
    const p=all[idx];
    const parts=p.name.split(/\s+/);
    const sur=parts[parts.length-1];
    const n=sur.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'');
    if(n.length>=4 && n.length<=9) return {p, surname:sur, normalized:n};
  }
  const p=all[0]; const sur=p.name.split(/\s+/).pop();
  return {p, surname:sur, normalized:sur.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'')};
}

function seededShuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function init(){
  await FutbolDB.load();
  
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed * 22 + 99);

  const d = new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · mismo reto para todos`;

  const pick = pickPlayer(rnd); target=pick.p; surname=pick.surname; normalized=pick.normalized;
  
  do { 
    letters = seededShuffle(normalized.split(''), rnd);
  } while(letters.join('')===normalized);
  
  placed = [];
  
  const s = loadS();
  if (!s.history[todayKey]) {
    s.history[todayKey] = {
      done: false,
      won: false,
      mistakes: []
    };
    saveS(s);
  }
  historyRec = s.history[todayKey];
  gameOver = historyRec.done;
  lives = MAX_LIVES - historyRec.mistakes.length;
  
  verdict.style.display='none'; endEl.style.display='none';
  hint.textContent = `${normalized.length} letras`;
  
  renderHearts();
  render();
  
  if (gameOver) {
    actionButtons.style.display = 'none';
    showEnd(historyRec.won);
  }
}

function render(){
  scramble.innerHTML = letters.map((ch,i)=>{
    const used = placed.includes(i);
    return `<div class="letter ${used?'placed':''}" data-i="${i}">${ch}</div>`;
  }).join('');
  scramble.querySelectorAll('.letter:not(.placed)').forEach(el=>el.addEventListener('click',()=>{
    if(gameOver) return;
    if(placed.length<normalized.length){ placed.push(parseInt(el.dataset.i,10)); render(); verdict.style.display='none'; }
  }));
  answer.innerHTML = '';
  for(let i=0;i<normalized.length;i++){
    const ch = placed[i]!==undefined ? letters[placed[i]] : '';
    const div = document.createElement('div');
    div.className = 'ans-slot' + (ch?' filled':'');
    div.textContent = ch;
    div.addEventListener('click',()=>{ if(gameOver) return; if(i<placed.length){ placed.splice(i,1); render(); }});
    answer.appendChild(div);
  }
}

document.getElementById('btn-clear').addEventListener('click',()=>{ if(gameOver)return; placed=[]; render(); verdict.style.display='none'; });
document.getElementById('btn-check').addEventListener('click',check);

function check(){
  if(gameOver) return;
  if(placed.length!==normalized.length) return;
  const guess = placed.map(i=>letters[i]).join('');
  
  if(guess===normalized) {
    historyRec.done = true;
    historyRec.won = true;
    const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    gameOver = true;
    if (window.FurbolAlbum) FurbolAlbum.addPacks(1);
    actionButtons.style.display = 'none';
    showEnd(true);
  } else {
    lives--;
    historyRec.mistakes.push(guess);
    renderHearts();
    
    verdict.className='verdict wrong'; verdict.textContent='✗ No es eso'; verdict.style.display='block';
    
    answer.classList.add('error-shake');
    setTimeout(()=>answer.classList.remove('error-shake'), 400);
    
    if (lives <= 0) {
      historyRec.done = true;
      historyRec.won = false;
      const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
      gameOver = true;
      actionButtons.style.display = 'none';
      showEnd(false);
    } else {
      const s=loadS(); s.history[todayKey] = historyRec; saveS(s);
    }
  }
}

function showEnd(won){
  let squares = '';
  for(let i=0; i<historyRec.mistakes.length; i++) squares += '🟥';
  if (won) squares += '🟩';
  
  const shareText = `Furbol Anagrama Diario ${won ? historyRec.mistakes.length + 1 : 'X'}/3\n\n${squares}`;
  
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Bien!':'Era…'}</h2>
    <p style="font-family:var(--font-main);font-weight:800;font-size:1.4rem;margin:6px 0;">${surname}</p>
    <p style="color:var(--text-secondary);">${target.name}</p>
    <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;margin-top:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);

const style = document.createElement('style');
style.innerHTML = `
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-4px);} 75%{transform:translateX(4px);} }
.error-shake { animation: shake 0.2s ease 2; border-color:var(--accent-red)!important; }
`;
document.head.appendChild(style);
