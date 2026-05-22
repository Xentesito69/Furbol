/**
 * _helpers.js — Utilidades compartidas entre los nuevos juegos.
 */
const FurbolUI = {
  flag(nat, size = 24) {
    const url = FutbolDB.flagImg(nat, 40);
    if (url) return `<img src="${url}" alt="${nat}" style="width:${size}px;height:${Math.round(size*0.66)}px;object-fit:cover;border-radius:3px;vertical-align:middle;">`;
    return `<span style="font-size:${size*0.9}px;">${FutbolDB.flagOf(nat)}</span>`;
  },
  crest(p, size = 22) {
    const url = FutbolDB.crestOf(p);
    if (url) return `<img src="${url}" onerror="this.onerror=null;this.style.display='none'" alt="" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;">`;
    return `<span>${FutbolDB.clubEmojiOf(p)}</span>`;
  },
  crestUrl(p) { return FutbolDB.crestOf(p) || ''; },
  photo(p, size = 40) {
    return `<img class="photo" src="${FutbolDB.photoOf(p)}" onerror="this.onerror=null;this.src='${FutbolDB.avatarOf(p)}'" alt="${p.name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;">`;
  },
  normalize(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[øØ]/g, 'o').replace(/[đĐ]/g, 'd').replace(/[łŁ]/g, 'l')
      .toLowerCase().trim();
  },
  shuffle(a) {
    const x = [...a];
    for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; }
    return x;
  },
  // PRNG sembrado con fecha — para reto diario
  seededRandom(seed) {
    let s = seed | 0;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  },
  todaySeed() {
    const d = new Date();
    return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`, 10);
  },
  // localStorage helpers
  loadStats(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch { return def; }
  },
  saveStats(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};
window.FurbolUI = FurbolUI;
