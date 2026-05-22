/** escudo-zoom.js — Adivina el club por un trozo super-ampliado del escudo. */
const KEY='furbol.escudozoom';
let target, options, correctIdx, streak=0, gameOver=false;
const img=document.getElementById('ez-img'),optsEl=document.getElementById('options'),
  verdict=document.getElementById('verdict'),endEl=document.getElementById('end'),
  chipStreak=document.getElementById('chip-streak'),chipBest=document.getElementById('chip-best');

function loadS(){return FurbolUI.loadStats(KEY,{best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}
function refresh(){ chipStreak.textContent=streak; chipBest.textContent=loadS().best; }

async function init(){
  await FutbolDB.load();
  gameOver=false; verdict.style.display='none'; endEl.style.display='none';
  const allClubs = FutbolDB.getAll().reduce((acc,p)=>{ const url=FutbolDB.crestOf(p); if(url && !acc.find(x=>x.id===p.clubId)) acc.push({id:p.clubId, name:p.club, url}); return acc; }, []);
  target = allClubs[Math.floor(Math.random()*allClubs.length)];
  const distractors = FurbolUI.shuffle(allClubs.filter(c=>c.id!==target.id)).slice(0,3);
  options = FurbolUI.shuffle([target, ...distractors]);
  correctIdx = options.findIndex(c=>c.id===target.id);
  // Zoom random
  const offX = -Math.floor(Math.random()*340)-100;
  const offY = -Math.floor(Math.random()*340)-100;
  img.src = target.url;
  img.onerror = () => { img.onerror=null; img.style.display='none'; };
  // Reset completo del img (después de revelar, mantiene width:100% etc.)
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
  render();
  refresh();
  console.log('🤫', target.name);
}
window.init=init;

function render(){
  optsEl.innerHTML = options.map((c,i)=>`<button class="mc-option" data-idx="${i}">${c.name}</button>`).join('');
  optsEl.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>pick(parseInt(b.dataset.idx,10))));
}

function pick(i){
  if(gameOver)return;
  gameOver=true;
  const correct=i===correctIdx;
  optsEl.querySelectorAll('.mc-option').forEach((b,j)=>{
    b.classList.add(j===correctIdx?'right':(j===i?'wrong':'disabled'));
  });
  // Mostrar el escudo entero
  img.style.left='0'; img.style.top='0'; img.style.transform='scale(1)'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='contain';
  if(correct){ streak++; const s=loadS(); if(streak>s.best){s.best=streak;saveS(s);} if(streak%5===0 && window.FurbolAlbum) FurbolAlbum.addPacks(1); refresh();
    verdict.className='verdict right'; verdict.textContent='✓ ¡Correcto!'; verdict.style.display='block';
    setTimeout(init,1600);
  } else {
    streak=0; refresh();
    verdict.className='verdict wrong';
    verdict.innerHTML = `Era <strong>${target.name}</strong>`; verdict.style.display='block';
    endEl.className='end-overlay-common fail';
    endEl.innerHTML = `<h2>Racha rota</h2><button class="btn btn--primary" onclick="init()">Otra</button>`;
    endEl.style.display='block';
  }
}

document.addEventListener('DOMContentLoaded', init);

