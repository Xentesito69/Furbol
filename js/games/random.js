/** random.js — Muestra una ficha aleatoria. */
const profile=document.getElementById('profile');
async function roll(){
  await FutbolDB.load();
  const p = FutbolDB.random();
  const careerClubs = [p.club, ...(p.formerClubs||[])].slice(0,8);
  profile.innerHTML = `
    ${FurbolUI.photo(p,140)}
    <div class="pname">${p.name}</div>
    <div class="pnat">${FurbolUI.flag(p.nationality,22)} ${p.nationality}</div>
    <div class="pclub">${FurbolUI.crest(p,22)} ${p.club}</div>
    <div class="meta-row">
      <div class="meta-pill"><strong>${p.position}</strong>Posición</div>
      <div class="meta-pill"><strong>${p.age} años</strong>Edad</div>
      <div class="meta-pill"><strong>${p.league}</strong>Liga</div>
      <div class="meta-pill"><strong>${FutbolDB.formatValue(p.marketValue)}</strong>Valor de mercado</div>
    </div>
    ${careerClubs.length>1 ? `<div class="career"><div class="career-title">Carrera</div><div class="career-list">${careerClubs.join(' → ')}</div></div>`: ''}
  `;
}
window.roll=roll;
document.getElementById('btn-roll').addEventListener('click', roll);
document.addEventListener('DOMContentLoaded', roll);
