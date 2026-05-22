/**
 * album.js — Sistema de Álbum y Sobres de Furbol
 * Gestiona la colección de jugadores, sobres pendientes, y recompensas de juegos.
 */

window.FurbolAlbum = (() => {
  const KEY_COLLECTION = 'furbol.album.collection'; // {playerId: count}
  const KEY_PACKS      = 'furbol.album.packs';       // number
  const CARDS_PER_PACK = 3;

  function _load(key, def) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
  }
  function _save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  /** Obtiene la colección actual {playerId: count} */
  function getCollection() {
    const col = _load(KEY_COLLECTION, {});
    return (col && typeof col === 'object') ? col : {};
  }

  /** Número de sobres disponibles */
  function getPacks() { return _load(KEY_PACKS, 0); }

  /** Añade N sobres (llamado al ganar juegos) */
  function addPacks(n = 1) {
    _save(KEY_PACKS, getPacks() + n);
    _dispatchUpdate();
  }

  /** ¿El jugador está en la colección? */
  function hasPlayer(playerId) { return (getCollection()[playerId] || 0) > 0; }

  /** Abre un sobre → devuelve array de {player, isNew, count} o null si no hay sobres */
  function openPack() {
    if (getPacks() < 1) return null;
    _save(KEY_PACKS, getPacks() - 1);

    // Solo jugadores con foto
    const pool = FutbolDB.getAll().filter(p => FutbolDB.photoOf(p));
    const col  = getCollection();
    const picks = [];

    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const p = pool[Math.floor(Math.random() * pool.length)];
      const prev = col[p.id] || 0;
      col[p.id] = prev + 1;
      picks.push({ player: p, isNew: prev === 0, count: col[p.id] });
    }
    _save(KEY_COLLECTION, col);
    _dispatchUpdate();
    return picks;
  }

  /** Stats del álbum */
  function getStats() {
    const pool = FutbolDB.getAll().filter(p => FutbolDB.photoOf(p));
    const col  = getCollection();
    const obtained = Object.keys(col).filter(id => col[id] > 0).length;
    return { total: pool.length, obtained, pct: pool.length ? Math.round(obtained / pool.length * 100) : 0 };
  }

  /** Jugadores obtenidos (únicos) agrupados por club */
  function byClub() {
    const col  = getCollection();
    const all  = FutbolDB.getAll();
    const map  = {};
    all.forEach(p => {
      if (!col[p.id]) return;
      if (!map[p.club]) map[p.club] = { club: p.club, clubId: p.clubId, league: p.league, players: [] };
      map[p.club].players.push({ ...p, count: col[p.id] });
    });
    return Object.values(map).sort((a, b) => a.club.localeCompare(b.club));
  }

  /** Jugadores obtenidos agrupados por nacionalidad */
  function byNationality() {
    const col = getCollection();
    const all = FutbolDB.getAll();
    const map = {};
    all.forEach(p => {
      if (!col[p.id]) return;
      if (!map[p.nationality]) map[p.nationality] = { nationality: p.nationality, players: [] };
      map[p.nationality].players.push({ ...p, count: col[p.id] });
    });
    return Object.values(map).sort((a, b) => a.nationality.localeCompare(b.nationality));
  }

  /** Lista de jugadores desbloqueados (sin duplicados) */
  function getUnlocked() {
    const col = getCollection();
    return FutbolDB.getAll().filter(p => col[p.id] > 0).map(p => ({ ...p, count: col[p.id] }));
  }

  function _dispatchUpdate() {
    window.dispatchEvent(new Event('furbol:album:update'));
  }

  return { getCollection, getPacks, addPacks, hasPlayer, openPack, getStats, byClub, byNationality, getUnlocked };
})();
