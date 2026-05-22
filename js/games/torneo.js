/** torneo.js — 5 mini-retos seguidos: intruso, primer-club, escudo-zoom, anagrama, trivia. */
const KEY='furbol.torneo';
const STEPS = [
  { label:'Intruso',  points:25, run:intrusoStep },
  { label:'1er Club', points:20, run:primerClubStep },
  { label:'Escudo',   points:25, run:escudoStep },
  { label:'Anagrama', points:30, run:anagramaStep },
  { label:'Trivia',   points:15, run:triviaStep },
];
let stepIdx=0, score=0;
const host=document.getElementById('host'), prog=document.getElementById('progress'),
  chipScore=document.getElementById('chip-score'), endEl=document.getElementById('end');

function loadS(){return FurbolUI.loadStats(KEY,{best:0})}
function saveS(s){FurbolUI.saveStats(KEY,s)}

async function init(){
  await FutbolDB.load();
  stepIdx=0; score=0; endEl.style.display='none';
  renderProgress(); chipScore.textContent='0';
  STEPS[0].run();
}
window.init=init;

function renderProgress(){
  prog.innerHTML = STEPS.map((s,i)=>`<div class="step ${i<stepIdx?'done':(i===stepIdx?'active':'')}">${i+1}. ${s.label}</div>`).join('');
}

function award(points){
  score += points;
  chipScore.textContent = score;
}

function nextStep(){
  stepIdx++;
  if(stepIdx>=STEPS.length){ finish(); return; }
  renderProgress();
  STEPS[stepIdx].run();
}

function intrusoStep(){
  const KEYS=['club','nationality','league','position'];
  const prop = KEYS[Math.floor(Math.random()*KEYS.length)];
  const counts={}; FutbolDB.getAll().forEach(p=>{const v=p[prop]; if(v)counts[v]=(counts[v]||0)+1;});
  const candidates = Object.keys(counts).filter(v=>counts[v]>=3);
  const value = candidates[Math.floor(Math.random()*candidates.length)];
  const group = FurbolUI.shuffle(FutbolDB.getAll().filter(p=>p[prop]===value)).slice(0,3);
  let intruder, t=0; do{intruder=FutbolDB.random();t++;}while(t<50 && intruder[prop]===value);
  const four = FurbolUI.shuffle([...group, intruder]);
  const idx = four.findIndex(p=>p.id===intruder.id);
  const KEY_LABEL = { club:'CLUB', nationality:'NACIONALIDAD', league:'LIGA', position:'POSICIÓN' };
  host.innerHTML = `
    <h3 style="text-align:center; font-family:var(--font-main); margin-bottom:8px;">¿Quién no comparte ${KEY_LABEL[prop]}?</h3>
    <div class="grid4" id="g">${four.map((p,i)=>`<div class="player-tile" data-i="${i}">${FurbolUI.photo(p,52)}<div class="pname">${p.name}</div><div class="pmeta">${p.club}</div></div>`).join('')}</div>
  `;
  host.querySelectorAll('.player-tile').forEach(t=>t.addEventListener('click',()=>{
    const i=parseInt(t.dataset.i,10);
    host.querySelectorAll('.player-tile').forEach((tt,j)=>tt.classList.add(j===idx?'right':(j===i?'wrong':'disabled')));
    if(i===idx) award(STEPS[0].points);
    setTimeout(nextStep,1200);
  }));
}

function primerClubStep(){
  let p,t=0; do{p=FutbolDB.random();t++;}while(t<50 && (!p.formerClubs||p.formerClubs.length===0));
  const first = p.formerClubs[p.formerClubs.length-1] || p.club;
  const allClubs = [...new Set(FutbolDB.getAll().map(x=>x.club))].filter(c=>c!==first);
  const distract = FurbolUI.shuffle(allClubs).slice(0,3);
  const opts = FurbolUI.shuffle([first, ...distract]);
  const idx = opts.indexOf(first);
  host.innerHTML = `
    <div style="text-align:center;">${FurbolUI.photo(p,80)}<div style="font-family:var(--font-main); font-weight:800; font-size:1.1rem; margin:6px 0;">${p.name}</div><div style="color:var(--text-secondary); font-size:0.85rem;">${FurbolUI.flag(p.nationality,18)} ${p.nationality} · ${p.position}</div></div>
    <h3 style="text-align:center; font-family:var(--font-main); margin:14px 0 8px;">¿Primer club profesional?</h3>
    <div class="mc-grid" id="opts">${opts.map((c,i)=>`<button class="mc-option" data-i="${i}">${c}</button>`).join('')}</div>
  `;
  host.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>{
    const i=parseInt(b.dataset.i,10);
    host.querySelectorAll('.mc-option').forEach((bb,j)=>bb.classList.add(j===idx?'right':(j===i?'wrong':'disabled')));
    if(i===idx) award(STEPS[1].points);
    setTimeout(nextStep,1200);
  }));
}

function escudoStep(){
  const clubs = FutbolDB.getAll().reduce((acc,p)=>{const u=FutbolDB.crestOf(p); if(u&&!acc.find(x=>x.id===p.clubId))acc.push({id:p.clubId,name:p.club,url:u}); return acc;},[]);
  const target = clubs[Math.floor(Math.random()*clubs.length)];
  const distract = FurbolUI.shuffle(clubs.filter(c=>c.id!==target.id)).slice(0,3);
  const opts = FurbolUI.shuffle([target,...distract]);
  const idx = opts.findIndex(c=>c.id===target.id);
  const offX=-Math.floor(Math.random()*250)-100, offY=-Math.floor(Math.random()*250)-100;
  host.innerHTML = `
    <h3 style="text-align:center; font-family:var(--font-main); margin-bottom:10px;">¿Qué club?</h3>
    <div class="ez-frame"><img id="ez-img" src="${target.url}" style="left:${offX}px;top:${offY}px;transform:scale(1.6);" onerror="this.style.display='none'"/></div>
    <div class="mc-grid">${opts.map((c,i)=>`<button class="mc-option" data-i="${i}">${c.name}</button>`).join('')}</div>
  `;
  host.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>{
    const i=parseInt(b.dataset.i,10);
    host.querySelectorAll('.mc-option').forEach((bb,j)=>bb.classList.add(j===idx?'right':(j===i?'wrong':'disabled')));
    const im=document.getElementById('ez-img'); im.style.left='0';im.style.top='0';im.style.transform='scale(1)';im.style.width='100%';im.style.height='100%';
    if(i===idx) award(STEPS[2].points);
    setTimeout(nextStep,1500);
  }));
}

function anagramaStep(){
  let target,sur,norm,t=0;
  while(t++<50){
    target = FutbolDB.random();
    sur = target.name.split(/\s+/).pop();
    norm = sur.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-ZÑ]/g,'');
    if(norm.length>=4 && norm.length<=8) break;
  }
  let letters;
  do{ letters = FurbolUI.shuffle(norm.split('')); }while(letters.join('')===norm);
  const placed=[];
  host.innerHTML = `
    <h3 style="text-align:center; font-family:var(--font-main); margin-bottom:6px;">Ordena el apellido</h3>
    <div style="text-align:center; color:var(--text-secondary); font-size:0.85rem; margin-bottom:10px;">${FurbolUI.flag(target.nationality,16)} ${target.nationality} · ${target.club}</div>
    <div class="answer-row" id="ans"></div>
    <div class="scramble" id="scr"></div>
    <div style="display:flex; gap:8px; justify-content:center; margin-top:12px;">
      <button class="btn btn--outline" id="bclear" style="padding:6px 14px;font-size:0.85rem;">Borrar</button>
      <button class="btn btn--primary" id="bcheck" style="padding:6px 14px;font-size:0.85rem;">Comprobar</button>
    </div>
  `;
  function render(){
    const ans = document.getElementById('ans'), scr = document.getElementById('scr');
    scr.innerHTML = letters.map((c,i)=>`<div class="letter ${placed.includes(i)?'placed':''}" data-i="${i}">${c}</div>`).join('');
    scr.querySelectorAll('.letter:not(.placed)').forEach(el=>el.addEventListener('click',()=>{
      if(placed.length<norm.length){ placed.push(parseInt(el.dataset.i,10)); render(); }
    }));
    ans.innerHTML='';
    for(let i=0;i<norm.length;i++){
      const ch = placed[i]!==undefined ? letters[placed[i]] : '';
      const d=document.createElement('div'); d.className='ans-slot'+(ch?' filled':''); d.textContent=ch;
      d.addEventListener('click',()=>{if(i<placed.length){placed.splice(i,1);render();}});
      ans.appendChild(d);
    }
  }
  render();
  document.getElementById('bclear').addEventListener('click',()=>{placed.length=0;render();});
  document.getElementById('bcheck').addEventListener('click',()=>{
    if(placed.length!==norm.length) return;
    const g = placed.map(i=>letters[i]).join('');
    if(g===norm) award(STEPS[3].points);
    setTimeout(nextStep,1000);
  });
}

function triviaStep(){
  const p = FutbolDB.random();
  const types = ['nationality','club','league','position'];
  const k = types[Math.floor(Math.random()*types.length)];
  const correct = p[k];
  const pool = k==='position' ? ['Portero','Defensa','Centrocampista','Delantero'] : (
    k==='nationality'? FutbolDB.getNationalities() : (k==='club'? FutbolDB.getClubs() : FutbolDB.getLeagues())
  );
  const opts = FurbolUI.shuffle([correct, ...FurbolUI.shuffle(pool.filter(x=>x!==correct)).slice(0,3)]);
  const idx = opts.indexOf(correct);
  const labels = {nationality:'Nacionalidad', club:'Club', league:'Liga', position:'Posición'};
  host.innerHTML = `
    <div style="text-align:center;">${FurbolUI.photo(p,72)}<div style="font-family:var(--font-main); font-weight:800; margin-top:6px;">${p.name}</div></div>
    <h3 style="text-align:center; font-family:var(--font-main); margin:10px 0;">¿${labels[k]}?</h3>
    <div class="mc-grid">${opts.map((o,i)=>`<button class="mc-option" data-i="${i}">${o}</button>`).join('')}</div>
  `;
  host.querySelectorAll('.mc-option').forEach(b=>b.addEventListener('click',()=>{
    const i=parseInt(b.dataset.i,10);
    host.querySelectorAll('.mc-option').forEach((bb,j)=>bb.classList.add(j===idx?'right':(j===i?'wrong':'disabled')));
    if(i===idx) award(STEPS[4].points);
    setTimeout(nextStep,1200);
  }));
}

function finish(){
  stepIdx = STEPS.length; renderProgress();
  const s=loadS(); if(score>s.best){s.best=score;saveS(s);}
  const max = STEPS.reduce((a,s)=>a+s.points,0);
  endEl.className='end-overlay-common ' + (score>=max*0.6?'win':'fail');
  endEl.innerHTML=`<h2>Torneo terminado</h2>
    <p style="font-family:var(--font-main); font-weight:900; font-size:2.4rem; color:var(--accent-blue); margin:10px 0;">${score} / ${max}</p>
    <p style="color:var(--text-muted);font-size:0.85rem;">Mejor: ${loadS().best}</p>
    <button class="btn btn--primary" style="margin-top:12px;" onclick="init()">Otra ronda</button>`;
  endEl.style.display='block';
}

document.addEventListener('DOMContentLoaded', init);
