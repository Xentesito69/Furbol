/**
 * db.js — Módulo de base de datos de FútbolQuiz
 *
 * Carga y cachea los datos de jugadores desde window.PLAYERS_DATA.
 * Expone la API global `FutbolDB` para consultar jugadores,
 * equipos, ligas y nacionalidades, además de helpers de imágenes
 * (banderas, escudos y fotos).
 */

const FutbolDB = (() => {
  let _players  = [];
  let _clubs    = {};
  let _leagues  = {};
  let _loaded   = false;
  let _loading  = null;

  // ── Banderas: nación → ISO (para flagcdn.com) y emoji fallback ──
  const ISO = {
    "Argentina":"ar","Brasil":"br","Uruguay":"uy","Colombia":"co","Ecuador":"ec",
    "México":"mx","Estados Unidos":"us","Canadá":"ca",
    "España":"es","Inglaterra":"gb-eng","Escocia":"gb-sct","Gales":"gb-wls","Irlanda":"ie",
    "Francia":"fr","Italia":"it","Alemania":"de","Portugal":"pt","Países Bajos":"nl",
    "Bélgica":"be","Croacia":"hr","Serbia":"rs","Polonia":"pl","Suiza":"ch","Austria":"at",
    "Hungría":"hu","Eslovenia":"si","Eslovaquia":"sk","Turquía":"tr","Georgia":"ge",
    "Dinamarca":"dk","Suecia":"se","Noruega":"no","Finlandia":"fi","Albania":"al",
    "Bosnia y Herzegovina":"ba","República Checa":"cz","Ucrania":"ua",
    "Marruecos":"ma","Senegal":"sn","Nigeria":"ng","Ghana":"gh","Gambia":"gm","Egipto":"eg",
    "Camerún":"cm","Costa de Marfil":"ci","Argelia":"dz","Túnez":"tn","Mali":"ml",
    "Burkina Faso":"bf","Jamaica":"jm","Haití":"ht",
    "Japón":"jp","Corea del Sur":"kr","Australia":"au","Irán":"ir","Arabia Saudita":"sa","Israel":"il","Siria":"sy",
    "Armenia":"am","DR Congo":"cd","Gabón":"ga","Islandia":"is","Kosovo":"xk",
    "Nueva Zelanda":"nz","Republica Centroafricana":"cf","República Centroafricana":"cf",
    "Rusia":"ru","Venezuela":"ve",
    "Irlanda del Norte":"gb-nir","Paraguay":"py","Uzbekistán":"uz","Uzbekistan":"uz",
    "Rumania":"ro","Rumanía":"ro","Guinea":"gn","Guinea-Bissau":"gw",
    "Cabo Verde":"cv","Cape Verde":"cv","Angola":"ao",
    "Macedonia del Norte":"mk","North Macedonia":"mk","Guadalupe":"gp","Guadeloupe":"gp",
    "Chile":"cl","Grecia":"gr","República Dominicana":"do","Togo":"tg",
    "Honduras":"hn","Guinea Ecuatorial":"gq","Níger":"ne","Irak":"iq","Montenegro":"me","Luxemburgo":"lu","Mozambique":"mz"
  };
  const EMOJI_FLAGS = {
    "Argentina":"🇦🇷","Brasil":"🇧🇷","Uruguay":"🇺🇾","Colombia":"🇨🇴","Ecuador":"🇪🇨",
    "México":"🇲🇽","Estados Unidos":"🇺🇸","Canadá":"🇨🇦",
    "España":"🇪🇸","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Gales":"🏴󠁧󠁢󠁷󠁬󠁳󠁿","Irlanda":"🇮🇪",
    "Francia":"🇫🇷","Italia":"🇮🇹","Alemania":"🇩🇪","Portugal":"🇵🇹","Países Bajos":"🇳🇱",
    "Bélgica":"🇧🇪","Croacia":"🇭🇷","Serbia":"🇷🇸","Polonia":"🇵🇱","Suiza":"🇨🇭","Austria":"🇦🇹",
    "Hungría":"🇭🇺","Eslovenia":"🇸🇮","Eslovaquia":"🇸🇰","Turquía":"🇹🇷","Georgia":"🇬🇪",
    "Dinamarca":"🇩🇰","Suecia":"🇸🇪","Noruega":"🇳🇴","Finlandia":"🇫🇮","Albania":"🇦🇱",
    "Bosnia y Herzegovina":"🇧🇦","República Checa":"🇨🇿","Ucrania":"🇺🇦",
    "Marruecos":"🇲🇦","Senegal":"🇸🇳","Nigeria":"🇳🇬","Ghana":"🇬🇭","Gambia":"🇬🇲","Egipto":"🇪🇬",
    "Camerún":"🇨🇲","Costa de Marfil":"🇨🇮","Argelia":"🇩🇿","Túnez":"🇹🇳","Mali":"🇲🇱",
    "Burkina Faso":"🇧🇫","Jamaica":"🇯🇲","Haití":"🇭🇹",
    "Japón":"🇯🇵","Corea del Sur":"🇰🇷","Australia":"🇦🇺","Irán":"🇮🇷","Arabia Saudita":"🇸🇦","Israel":"🇮🇱","Siria":"🇸🇾",
    "Armenia":"🇦🇲","DR Congo":"🇨🇩","Gabón":"🇬🇦","Islandia":"🇮🇸","Kosovo":"🇽🇰",
    "Nueva Zelanda":"🇳🇿","Republica Centroafricana":"🇨🇫","República Centroafricana":"🇨🇫",
    "Rusia":"🇷🇺","Venezuela":"🇻🇪",
    "Irlanda del Norte":"🏴󠁧󠁢󠁮󠁩󠁲󠁿","Paraguay":"🇵🇾","Uzbekistán":"🇺🇿","Uzbekistan":"🇺🇿",
    "Rumania":"🇷🇴","Rumanía":"🇷🇴","Guinea":"🇬🇳","Guinea-Bissau":"🇬🇼",
    "Cabo Verde":"🇨🇻","Cape Verde":"🇨🇻","Angola":"🇦🇴",
    "Macedonia del Norte":"🇲🇰","North Macedonia":"🇲🇰","Guadalupe":"🇬🇵","Guadeloupe":"🇬🇵",
    "Chile":"🇨🇱","Grecia":"🇬🇷","República Dominicana":"🇩🇴","Togo":"🇹🇬",
    "Honduras":"🇭🇳","Guinea Ecuatorial":"🇬🇶","Níger":"🇳🇪","Irak":"🇮🇶","Montenegro":"🇲🇪","Luxemburgo":"🇱🇺","Mozambique":"🇲🇿"
  };

  /** Normaliza texto: elimina diacríticos para búsquedas tolerantes. */
  function _normalize(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[øØ]/g, 'o').replace(/[đĐ]/g, 'd').replace(/[łŁ]/g, 'l')
      .toLowerCase().trim();
  }

  async function load() {
    if (_loaded) return;
    if (_loading) return _loading;
    _loading = _fetchData();
    await _loading;
    _loaded = true;
  }

  async function _fetchData() {
    try {
      const raw = window.PLAYERS_DATA || { players: [], clubs: [], leagues: [] };
      _players = raw.players || [];
      (raw.clubs || []).forEach(c => { _clubs[c.id] = c; });
      (raw.leagues || []).forEach(l => { _leagues[l.name] = l; });
      console.log(`[FutbolDB] Cargados ${_players.length} jugadores, ${Object.keys(_clubs).length} equipos y ${Object.keys(_leagues).length} ligas.`);
    } catch (e) {
      console.error('[FutbolDB] Error al cargar players:', e);
      _players = [];
    }
  }

  function flagOf(nat) { return EMOJI_FLAGS[nat] || "🏳️"; }

  function flagImg(nat, size = 80) {
    const iso = ISO[nat];
    if (!iso) return null;
    return `https://flagcdn.com/w${size}/${iso}.png`;
  }

  function clubEmojiOf(player) {
    if (!player) return "⚽";
    const club = _clubs[player.clubId];
    return club && club.emoji ? club.emoji : "⚽";
  }

  function crestOf(player) {
    if (!player) return null;
    const club = _clubs[player.clubId];
    return club ? (club.crest || null) : null;
  }

  function crestOfClub(clubId) {
    const club = _clubs[clubId];
    return club ? (club.crest || null) : null;
  }

  /** Avatar generado (siempre funciona, usado como fallback). */
  function avatarOf(player) {
    if (!player) return null;
    const name = encodeURIComponent(player.name);
    const bg = ({
      'Portero':       '1976d2',
      'Defensa':       '2e7d32',
      'Centrocampista':'6a1b9a',
      'Delantero':     'c62828'
    })[player.position] || '0d47a1';
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=160&bold=true&font-size=0.36&format=svg`;
  }

  /** URL de soccerwiki construida a partir de swId. */
  function soccerwikiPhoto(swId) {
    if (!swId) return null;
    return `https://cdn.soccerwiki.org/images/player/${swId}.png`;
  }

  /** Foto del jugador. Orden de preferencia: photo (URL directa) → soccerwiki(swId) → avatar. */
  function photoOf(player) {
    if (!player) return null;
    if (player.photo) return player.photo;
    if (player.swId) return soccerwikiPhoto(player.swId);
    return avatarOf(player);
  }

  function getAll() { return _players; }

  function query({
    name, club, clubId, league, nationality,
    position, minAge, maxAge, minValue, maxValue, limit
  } = {}) {
    let result = _players;
    if (name)        { const nn = _normalize(name); result = result.filter(p => _normalize(p.name).includes(nn)); }
    if (clubId)      result = result.filter(p => p.clubId === clubId);
    if (club)        { const nc = _normalize(club); result = result.filter(p => _normalize(p.club).includes(nc)); }
    if (league)      result = result.filter(p => p.league === league);
    if (nationality) result = result.filter(p => p.nationality === nationality);
    if (position)    result = result.filter(p => p.position === position);
    if (minAge)      result = result.filter(p => p.age >= minAge);
    if (maxAge)      result = result.filter(p => p.age <= maxAge);
    if (minValue)    result = result.filter(p => p.marketValue >= minValue);
    if (maxValue)    result = result.filter(p => p.marketValue <= maxValue);
    if (limit)       result = result.slice(0, limit);
    return result;
  }

  function random(filters = {}) {
    const pool = filters && Object.keys(filters).length ? query(filters) : _players;
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function randomN(n, filters = {}) {
    const pool = [...(filters && Object.keys(filters).length ? query(filters) : _players)];
    const result = [];
    while (result.length < n && pool.length) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  }

  function getClub(id)         { return _clubs[id] || null; }
  function getLeagues()        { return [...new Set(_players.map(p => p.league))].sort(); }

  /** Datos de una liga (incluye logo). Devuelve null si no se conoce. */
  function getLeagueInfo(name) { return _leagues[name] || null; }
  /** URL del logo de la liga, o null si no hay. */
  function leagueLogo(name)    { const l = _leagues[name]; return l ? (l.logo || null) : null; }
  function getNationalities()  { return [...new Set(_players.map(p => p.nationality))].sort(); }
  function getClubs()          { return [...new Set(_players.map(p => p.club))].sort(); }
  function getPositions()      { return [...new Set(_players.map(p => p.position))].sort(); }

  function getStats() {
    return {
      players: _players.length,
      clubs:   getClubs().length,
      leagues: getLeagues().length,
      nations: getNationalities().length,
    };
  }


  function getTeammates(player) {
    return _players.filter(p => p.club === player.club && p.id !== player.id);
  }

  function sharedClub(playerA, playerB) {
    const clubsA = new Set([playerA.club, ...(playerA.formerClubs || [])]);
    const clubsB = new Set([playerB.club, ...(playerB.formerClubs || [])]);
    return [...clubsA].filter(c => clubsB.has(c));
  }

  function formatValue(v) {
    if (v == null) return "—";
    if (v >= 1000000) return (v / 1000000).toFixed(v >= 10000000 ? 0 : 1).replace('.0','') + "M€";
    if (v >= 1000)    return (v / 1000).toFixed(0) + "K€";
    return v + "€";
  }

  return {
    load, getAll, query, random, randomN,
    getClub, getLeagues, getLeagueInfo, leagueLogo, getNationalities, getClubs, getPositions,
    getStats, getTeammates, sharedClub,
    flagOf, flagImg, clubEmojiOf, crestOf, crestOfClub, photoOf, avatarOf, soccerwikiPhoto,
    formatValue,
    isLoaded: () => _loaded,
  };
})();

FutbolDB.load();