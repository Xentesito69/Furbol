/** reto-diario.js — Adivina con seed = fecha de hoy. Compartir resultado. */
const KEY='furbol.diario', MAX=8;
let target, attempts=0, selectedId=null, gameOver=false, todayKey;
const grid=document.getElementById('guesses'), inp=document.getElementById('rd-input'),
  sug=document.getElementById('sug-box'), endEl=document.getElementById('end'),
  chipAttempts=document.getElementById('chip-attempts'), chipStreak=document.getElementById('chip-streak'),
  dayInfo=document.getElementById('day-info');

function loadS(){return FurbolUI.loadStats(KEY,{streak:0,best:0,lastDay:null,history:{}})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  const seed = FurbolUI.todaySeed();
  todayKey = String(seed);
  const rnd = FurbolUI.seededRandom(seed);
  // Filtra jugadores famosos (valor de mercado > 20M) para no poner cracks oscuros
  const pool = FutbolDB.getAll().filter(p=>p.marketValue>=20_000_000);
  target = pool[Math.floor(rnd()*pool.length)];

  const s=loadS();
  const today = s.history[todayKey];
  if(today){
    // Ya jugó hoy → reconstruir
    attempts = today.guesses.length;
    today.guesses.forEach(id=>{
      const p = FutbolDB.getAll().find(x=>x.id===id);
      if(p) compareAndRender(p);
    });
    gameOver = today.won || attempts>=MAX;
    if(gameOver) showEnd(today.won);
  }
  updateChips();
  const d=new Date();
  dayInfo.textContent = `📆 ${d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})} · mismo para todos`;
  console.log('🤫 diario:', target.name);
}
window.init=init;

function updateChips(){
  chipAttempts.textContent = `${attempts}/${MAX}`;
  chipStreak.textContent = loadS().streak;
}

inp.addEventListener('input', ()=>{
  const v=inp.value.trim(); selectedId=null;
  if(v.length<2){sug.style.display='none';return;}
  const r=FutbolDB.query({name:v,limit:6});
  if(!r.length){sug.style.display='none';return;}
  sug.innerHTML = r.map(p=>`<div class="sug" data-id="${p.id}" data-name="${p.name}">${FurbolUI.flag(p.nationality,18)}<strong>${p.name}</strong><span style="color:var(--text-muted);font-size:0.75rem;">${p.club}</span></div>`).join('');
  sug.style.display='block';
});
sug.addEventListener('click',e=>{const it=e.target.closest('.sug'); if(!it)return; inp.value=it.dataset.name; selectedId=it.dataset.id; sug.style.display='none';});
inp.addEventListener('keydown',e=>{if(e.key==='Enter')guess();});
document.getElementById('btn-guess').addEventListener('click',guess);

function guess(){
  if(gameOver)return;
  let p=null;
  if(selectedId) p=FutbolDB.getAll().find(x=>x.id===selectedId);
  else { const v=inp.value.trim(); if(!v)return; const m=FutbolDB.query({name:v}); if(m.length)p=m[0]; }
  if(!p)return;
  // No repetir
  if([...grid.querySelectorAll('.grow:not(.header)')].some(r=>r.dataset.id===p.id)){ inp.value=''; return; }
  attempts++;
  compareAndRender(p);
  inp.value=''; selectedId=null; sug.style.display='none';
  updateChips();
  // Persistir
  const s=loadS();
  if(!s.history[todayKey]) s.history[todayKey] = { guesses: [], won: false };
  s.history[todayKey].guesses.push(p.id);
  if(p.id===target.id){
    s.history[todayKey].won = true;
    // Racha
    const yKey = String(FurbolUI.todaySeed() - 1);
    s.streak = (s.lastDay===yKey || s.lastDay===todayKey) ? (s.streak+1) : 1;
    s.lastDay = todayKey;
    if(s.streak>s.best) s.best=s.streak;
    saveS(s); gameOver=true; showEnd(true);
  } else if(attempts>=MAX){
    s.streak = 0; s.lastDay = todayKey; saveS(s); gameOver=true; showEnd(false);
  } else saveS(s);
  updateChips();
}

function compareAndRender(p){
  const row=document.createElement('div'); row.className='grow'; row.dataset.id=p.id;
  const isNameOk = p.id===target.id;
  const natOk = p.nationality===target.nationality;
  const ligOk = p.league===target.league;
  const cluOk = p.club===target.club;
  const posOk = p.position===target.position;
  const ageDiff = p.age - target.age;
  let aSt='miss', aArr=''; if(ageDiff===0) aSt='match'; else if(Math.abs(ageDiff)<=2) aSt='partial'; if(ageDiff>0) aArr='⬇️'; else if(ageDiff<0) aArr='⬆️';
  const valDiff = p.marketValue - target.marketValue;
  const pct = Math.abs(valDiff)/(target.marketValue||1);
  let vSt='miss', vArr=''; if(valDiff===0) vSt='match'; else if(pct<=0.2) vSt='partial'; if(valDiff>0) vArr='⬇️'; else if(valDiff<0) vArr='⬆️';
  row.innerHTML = `
    <div class="gcell ${isNameOk?'match':''}">${p.name}</div>
    <div class="gcell ${natOk?'match':'miss'}">${FurbolUI.flag(p.nationality,18)}<div style="font-size:0.6rem;">${p.nationality}</div></div>
    <div class="gcell ${ligOk?'match':'miss'}">${p.league}</div>
    <div class="gcell ${cluOk?'match':'miss'}">${FurbolUI.crest(p,16)}<div style="font-size:0.6rem;">${p.club}</div></div>
    <div class="gcell ${posOk?'match':'miss'}">${({Portero:'POR',Defensa:'DEF',Centrocampista:'MED',Delantero:'DEL'})[p.position]||p.position}</div>
    <div class="gcell ${aSt}">${p.age} ${aArr}</div>
    <div class="gcell ${vSt}">${FutbolDB.formatValue(p.marketValue)} ${vArr}</div>`;
  const header = grid.querySelector('.header');
  if(header && header.nextSibling) grid.insertBefore(row, header.nextSibling);
  else grid.appendChild(row);
}

function showEnd(won){
  // Construir cadena emoji para compartir
  const rows = [...grid.querySelectorAll('.grow:not(.header)')];
  const emojiLines = rows.map(r=>{
    return [...r.querySelectorAll('.gcell')].map(c=>{
      if(c.classList.contains('match')) return '🟩';
      if(c.classList.contains('partial')) return '🟨';
      return '⬛';
    }).join('');
  }).reverse().join('\n');
  const shareText = `Furbol Adivina Diario ${won?attempts:'X'}/${MAX}\n\n${emojiLines}`;
  endEl.className='end-overlay-common ' + (won?'win':'fail');
  endEl.innerHTML = `<h2>${won?'¡Resuelto!':'No esta vez'}</h2>
    <p style="color:var(--text-secondary);margin-bottom:10px;">Era ${target.name}</p>
    <textarea readonly style="width:100%;height:110px;font-family:monospace;font-size:0.95rem;background:#f5f8fc;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;">${shareText}</textarea>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copiado ✓';">📋 Copiar resultado</button>`;
  endEl.style.display='block';
  inp.disabled=true;
}

document.addEventListener('DOMContentLoaded', init);
