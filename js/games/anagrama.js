/** anagrama.js — Apellido con letras desordenadas. */
const KEY='furbol.anagrama';
let target, surname, normalized, letters, placed, streak=0, gameOver=false;
const scramble=document.getElementById('scramble'), answer=document.getElementById('answer'),
  hint=document.getElementById('hint'), verdict=document.getElementById('verdict'),
  endEl=document.getElementById('end'), chipWins=document.getElementById('chip-wins'),
  chipStreak=document.getElementById('chip-streak');

function loadS(){return FurbolUI.loadStats(KEY,{wins:0,best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){ const s=loadS(); chipWins.textContent=s.wins; chipStreak.textContent=s.best; }

function pickPlayer(){
  for(let i=0;i<50;i++){
    const p=FutbolDB.random();
    const parts=p.name.split(/\s+/);
    const sur=parts[parts.length-1];
    const n=sur.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'');
    if(n.length>=4 && n.length<=9) return {p, surname:sur, normalized:n};
  }
  const p=FutbolDB.random(); const sur=p.name.split(/\s+/).pop();
  return {p, surname:sur, normalized:sur.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'')};
}

async function init(){
  await FutbolDB.load();
  const pick = pickPlayer(); target=pick.p; surname=pick.surname; normalized=pick.normalized;
  // Mezclar — asegurar que no salga igual
  do { letters = FurbolUI.shuffle(normalized.split('')); } while(letters.join('')===normalized);
  placed = [];
  gameOver=false; verdict.style.display='none'; endEl.style.display='none';
  hint.textContent = `${normalized.length} letras`;
  render(); refresh();
  console.log('🤫', normalized);
}
window.init=init;

function render(){
  scramble.innerHTML = letters.map((ch,i)=>{
    const used = placed.includes(i);
    return `<div class="letter ${used?'placed':''}" data-i="${i}">${ch}</div>`;
  }).join('');
  scramble.querySelectorAll('.letter:not(.placed)').forEach(el=>el.addEventListener('click',()=>{
    if(placed.length<normalized.length){ placed.push(parseInt(el.dataset.i,10)); render(); }
  }));
  answer.innerHTML = '';
  for(let i=0;i<normalized.length;i++){
    const ch = placed[i]!==undefined ? letters[placed[i]] : '';
    const div = document.createElement('div');
    div.className = 'ans-slot' + (ch?' filled':'');
    div.textContent = ch;
    div.addEventListener('click',()=>{ if(i<placed.length){ placed.splice(i,1); render(); }});
    answer.appendChild(div);
  }
}

document.getElementById('btn-clear').addEventListener('click',()=>{placed=[];render();});
document.getElementById('btn-check').addEventListener('click',check);
document.getElementById('btn-skip').addEventListener('click',()=>{ if(gameOver)return; finish(false); });

function check(){
  if(placed.length!==normalized.length) return;
  const guess = placed.map(i=>letters[i]).join('');
  if(guess===normalized) finish(true);
  else { verdict.className='verdict wrong'; verdict.textContent='✗ No es eso'; verdict.style.display='block'; }
}

function finish(won){
  gameOver=true;
  const s=loadS();
  if(won){ s.wins++; streak++; if(streak>s.best){s.best=streak;} if(window.FurbolAlbum) FurbolAlbum.addPacks(1); }
  else { streak=0; }
  saveS(s); refresh();
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Bien!':'Era…'}</h2>
    <p style="font-family:var(--font-main);font-weight:800;font-size:1.4rem;margin:6px 0;">${surname}</p>
    <p style="color:var(--text-secondary);">${target.name}</p>
    <button class="btn btn--primary" onclick="init()" style="margin-top:12px;">Siguiente</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);

