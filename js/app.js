/**
 * app.js — Lógica de la página de inicio
 */

const GAMES = [
  {
    id: 'adivina', icon: '🔍', title: 'Adivina el Jugador',
    desc: 'Recibe pistas progresivas — posición, liga, edad, nacionalidad, valor — y descúbrelo con el menor número de intentos.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Clásico', type: 'blue' }],
    href: 'games/adivina.html', difficulty: '⭐⭐', available: true, category: 'adivinanza',
  },
  {
    id: 'mas-caro', icon: '💰', title: '¿Quién vale más?',
    desc: 'Compara el valor de mercado de dos jugadores. Tres vidas, racha infinita. Rápido y adictivo.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Rápido', type: 'blue' }],
    href: 'games/mas-caro.html', difficulty: '⭐', available: true, category: 'contrarreloj',
  },
  {
    id: 'wordle', icon: '🔤', title: 'Wordle Futbolero',
    desc: 'Adivina el apellido del jugador en 6 intentos. Cada letra da pistas de color.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Palabras', type: 'blue' }],
    href: 'games/wordle.html', difficulty: '⭐⭐', available: true, category: 'adivinanza',
  },
  {
    id: 'bandera', icon: '🏳️', title: 'Bandera → Jugador',
    desc: 'Bandera + 60 segundos para nombrar el mayor número de jugadores de esa selección.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Contrarreloj', type: 'blue' }],
    href: 'games/bandera.html', difficulty: '⭐', available: true, category: 'contrarreloj',
  },
  {
    id: 'companeros', icon: '🤝', title: 'Compañeros',
    desc: '¿Están en el mismo equipo esta temporada? Sí o No. 3 vidas, racha infinita.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Plantilla', type: 'blue' }],
    href: 'games/companeros.html', difficulty: '⭐', available: true, category: 'logica',
  },
  {
    id: 'carrera', icon: '🗺️', title: 'Carrera de Clubs',
    desc: 'Ordena los clubs por los que pasó un jugador a lo largo de su carrera.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Historia', type: 'blue' }],
    href: 'games/carrera.html', difficulty: '⭐⭐⭐', available: true, category: 'logica',
  },
  {
    id: 'conexiones', icon: '🔗', title: 'Conexiones',
    desc: 'Agrupa 16 jugadores en 4 categorías ocultas. Encuentra el patrón antes de quedarte sin vidas.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Estrategia', type: 'blue' }],
    href: 'games/conexiones.html', difficulty: '⭐⭐⭐', available: true, category: 'logica',
  },
  {
    id: 'reto-diario', icon: '🔍', title: 'Adivina Diario',
    desc: 'Adivina el jugador del día. Una partida igual para todo el mundo.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/reto-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'grid-diario', icon: '🎯', title: 'Grid Diario',
    desc: 'La misma grid 3×3 para todo el mundo cada día. Rellena las 9 casillas.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/grid-diario.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'wordle-diario', icon: '🔤', title: 'Wordle Diario',
    desc: 'La misma palabra para todos cada día. Adivina el apellido en 6 intentos.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/wordle-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'conexiones-diario', icon: '🔗', title: 'Conexiones Diario',
    desc: 'El mismo reto para todos cada día. Agrupa a los 16 jugadores en 4 grupos de 4.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/conexiones-diario.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'pixelada-diario', icon: '📸', title: 'Pixelada Diario',
    desc: 'La misma foto pixelada para todos. ¿A cuánto blur lo adivinas?',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/pixelada-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'intruso-diario', icon: '🎯', title: 'Intruso Diario',
    desc: 'La misma combinación para todos cada día. Encuentra al jugador que no encaja.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/intruso-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'escudo-zoom-diario', icon: '🔍', title: 'Escudo Zoom Diario',
    desc: 'Un trozo super ampliado de un escudo. Un solo intento para adivinar el club.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/escudo-zoom-diario.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'carrera-jugador-diario', icon: '🗺️', title: 'Carrera Diario',
    desc: 'Mira los clubes en orden cronológico y adivina al jugador del día en 3 intentos.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/carrera-jugador-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: '4-companeros-diario', icon: '👥', title: '4 Compañeros Diario',
    desc: '4 jugadores con los que el objetivo del día compartió club. Adivina el objetivo.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/4-companeros-diario.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'anagrama-diario', icon: '🔀', title: 'Anagrama Diario',
    desc: 'El mismo apellido desordenado para todos cada día. Tienes 3 intentos para ordenarlo.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/anagrama-diario.html', difficulty: '⭐', available: true, category: 'diario',
  },
  {
    id: 'sopa-diaria', icon: '🔎', title: 'Sopa Diaria',
    desc: 'Cuadrícula de 16x16 con los mismos 12 jugadores escondidos para todos cada día.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/sopa-diaria.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'puzzle-diario', icon: '🧩', title: 'Puzzle Diario',
    desc: 'Un puzzle de 16 piezas. La misma imagen y orden para todos cada día. ¡Mide tu tiempo!',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/puzzle-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'sudoku-diario', icon: '🔢', title: 'Sudoku Diario',
    desc: 'Un Sudoku de 6x6 con jugadores. El mismo tablero para todos cada día.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/sudoku-diario.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'plantilla-diaria', icon: '⏱️', title: 'Plantilla Diaria',
    desc: 'Un solo intento al día. ¿Cuántos jugadores del club puedes nombrar en 60s?',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/plantilla-diario.html', difficulty: '⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'bingo-diario', icon: '🎰', title: 'Bingo Diario',
    desc: 'El mismo cartón y orden de jugadores para todos cada día. ¡Rellena las 12 casillas en 2 minutos!',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/bingo-diario.html', difficulty: '⭐⭐⭐', available: true, category: 'diario',
  },
  {
    id: 'jugador-diario', icon: '🕵️', title: 'Jugador Diario',
    desc: 'Descubre al jugador aleatorio del día y sé sincero: ¿lo conocías?',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Diario', type: 'blue' }],
    href: 'games/jugador-diario.html', difficulty: '⭐', available: true, category: 'diario',
  },
  {
    id: 'pixelada', icon: '📸', title: 'Foto Pixelada',
    desc: 'La foto se va aclarando con el tiempo. Adivínalo antes de verlo nítido.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Visual', type: 'blue' }],
    href: 'games/pixelada.html', difficulty: '⭐⭐', available: true, category: 'adivinanza',
  },
  {
    id: 'intruso', icon: '🎯', title: 'El Intruso',
    desc: '4 jugadores. 3 comparten algo. Encuentra al que no encaja.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Lógica', type: 'blue' }],
    href: 'games/intruso.html', difficulty: '⭐⭐', available: true, category: 'logica',
  },
  {
    id: 'primer-club', icon: '🌱', title: '¿De qué club salió?',
    desc: 'Multiple choice: el primer club profesional del jugador.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Historia', type: 'blue' }],
    href: 'games/primer-club.html', difficulty: '⭐⭐', available: true, category: 'logica',
  },
  {
    id: 'escudo-zoom', icon: '🔍', title: 'Escudo Zoom',
    desc: 'Trozo ultra-ampliado del escudo. Adivina el club entre 4.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Visual', type: 'blue' }],
    href: 'games/escudo-zoom.html', difficulty: '⭐⭐', available: true, category: 'logica',
  },
  {
    id: 'plantilla', icon: '⏱️', title: 'Plantilla 60s',
    desc: 'Aparece un club, 60 segundos para nombrar a su plantilla.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Contrarreloj', type: 'blue' }],
    href: 'games/plantilla.html', difficulty: '⭐⭐⭐', available: true, category: 'contrarreloj',
  },
  {
    id: 'draft', icon: '🪙', title: 'Draft',
    desc: '11 rondas con 2 jugadores cada una. Elige el mejor XI.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Estrategia', type: 'blue' }],
    href: 'games/draft.html', difficulty: '⭐⭐', available: true, category: 'estrategia',
  },
  {
    id: 'anagrama', icon: '🔀', title: 'Anagrama',
    desc: 'Letras desordenadas. Reconstruye el apellido del jugador.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Palabras', type: 'blue' }],
    href: 'games/anagrama.html', difficulty: '⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'sopa', icon: '🔠', title: 'Sopa de letras',
    desc: 'Cuadrícula 12×12 con 8 apellidos ocultos. Encuéntralos.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Palabras', type: 'blue' }],
    href: 'games/sopa.html', difficulty: '⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'puzzle', icon: '🧩', title: 'Puzzle Futbolero',
    desc: 'Reconstruye la foto de un jugador intercambiando piezas. 8, 16 o 32 piezas.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Visual', type: 'blue' }],
    href: 'games/puzzle.html', difficulty: '⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'random', icon: '🎲', title: 'Random Player',
    desc: 'Botón "sorpréndeme": ficha aleatoria con foto, escudo y carrera.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Explorar', type: 'blue' }],
    href: 'games/random.html', difficulty: '⭐', available: true, category: 'explorar',
  },
  {
    id: 'trivia', icon: '🧠', title: 'Trivia Infinita',
    desc: 'Preguntas multiple-choice sin fin. 3 vidas, tiempo limitado.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Rápido', type: 'blue' }],
    href: 'games/trivia.html', difficulty: '⭐', available: true, category: 'contrarreloj',
  },
  {
    id: 'versus', icon: '⚔️', title: 'Versus 1v1',
    desc: '2 jugadores, mismo dispositivo, 10 preguntas por turno alternado.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Multijugador', type: 'blue' }],
    href: 'games/versus.html', difficulty: '⭐⭐', available: true, category: 'multijugador',
  },
  {
    id: 'pasamela', icon: '🔄', title: 'Pásamela',
    desc: 'Cadena de jugadores que comparten algo. Sin repetir. El que falla, pierde.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Multijugador', type: 'blue' }],
    href: 'games/pasamela.html', difficulty: '⭐⭐', available: true, category: 'multijugador',
  },
  {
    id: 'torneo', icon: '🏆', title: 'Modo Torneo',
    desc: '5 mini-retos seguidos. Suma puntos y mejora tu mejor histórico.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Combinado', type: 'blue' }],
    href: 'games/torneo.html', difficulty: '⭐⭐⭐', available: true, category: 'estrategia',
  },
  {
    id: 'sudoku', icon: '🔢', title: 'Sudoku Futbolero',
    desc: '9 caras de cracks en lugar de números. Niveles 4×4, 6×6 y 9×9.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Lógica', type: 'blue' }],
    href: 'games/sudoku.html', difficulty: '⭐⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'sudoku-rm', icon: '👑', title: 'Sudoku Real Madrid',
    desc: 'Sudoku de caras con jugadores del Real Madrid. 4×4, 6×6 y 9×9.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Clubes', type: 'blue' }],
    href: 'games/sudoku.html?v=rm', difficulty: '⭐⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'sudoku-fcb', icon: '🔴', title: 'Sudoku FC Barcelona',
    desc: 'Sudoku de caras con jugadores del FC Barcelona. 4×4, 6×6 y 9×9.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Clubes', type: 'blue' }],
    href: 'games/sudoku.html?v=fcb', difficulty: '⭐⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'sudoku-laliga', icon: '<img src="https://flagcdn.com/w80/es.png" style="width:0.9em; height:0.9em; border-radius:8px; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.15);">', title: 'Sudoku LaLiga',
    desc: 'Sudoku de escudos con equipos de LaLiga. 4×4, 6×6 y 9×9.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Ligas', type: 'blue' }],
    href: 'games/sudoku.html?v=laliga', difficulty: '⭐⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'sudoku-pl', icon: '<img src="https://flagcdn.com/w80/gb-eng.png" style="width:0.9em; height:0.9em; border-radius:8px; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.15);">', title: 'Sudoku Premier League',
    desc: 'Sudoku de escudos con equipos de la Premier League. 4×4, 6×6 y 9×9.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Ligas', type: 'blue' }],
    href: 'games/sudoku.html?v=pl', difficulty: '⭐⭐⭐', available: true, category: 'puzzle',
  },
  {
    id: 'carrera-jugador', icon: '🗺️', title: 'Carrera → Jugador',
    desc: 'Mira los clubs en orden cronológico y adivina al jugador.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Historia', type: 'blue' }],
    href: 'games/carrera-jugador.html', difficulty: '⭐⭐', available: true, category: 'logica',
  },
  {
    id: '4-companeros', icon: '👥', title: '4 Compañeros',
    desc: '4 jugadores con los que X compartió club. Adivina X.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Historia', type: 'blue' }],
    href: 'games/4-companeros.html', difficulty: '⭐⭐⭐', available: true, category: 'logica',
  },
  {
    id: 'bingo', icon: '🎰', title: 'Bingo',
    desc: '12 casillas con requisitos. Jugadores uno a uno. 2 modos.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Contrarreloj', type: 'blue' }],
    href: 'games/bingo.html', difficulty: '⭐⭐', available: true, category: 'contrarreloj',
  },
  {
    id: 'grid', icon: '🎯', title: 'Grid 3×3',
    desc: 'Rellena el 3 en raya con jugadores que cumplan fila y columna. Modo 1v1.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Multijugador', type: 'blue' }],
    href: 'games/grid.html', difficulty: '⭐⭐⭐', available: true, category: 'multijugador',
  },
  {
    id: 'xi-ideal', icon: '📋', title: 'Arma tu XI',
    desc: 'Recibe 18 jugadores aleatorios y arma el mejor 4-3-3 posible.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Táctica', type: 'blue' }],
    href: 'games/xi-ideal.html', difficulty: '⭐⭐', available: true, category: 'estrategia',
  },
  {
    id: 'album', icon: '🏠', title: 'Álbum de Cromos',
    desc: 'Tu colección de jugadores. Abre sobres ganados en otros juegos y completá el álbum.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Colección', type: 'gold' }],
    href: 'games/album.html', difficulty: '⭐', available: true, category: 'coleccion',
  },
  {
    id: 'arma-xi-coleccion', icon: '🧩', title: 'XI de tu Colección',
    desc: 'Arma el mejor 4-3-3 con los jugadores que tienes desbloqueados en tu álbum.',
    badges: [{ text: 'Disponible', type: 'green' }, { text: 'Colección', type: 'gold' }],
    href: 'games/arma-xi-coleccion.html', difficulty: '⭐⭐', available: true, category: 'coleccion',
  },
];

const CATEGORIES = [
  { id:'diario',       icon:'📅', name:'Diario',        desc:'Retos que cambian cada 24 horas' },
  { id:'adivinanza',   icon:'🔍', name:'Adivinanza',    desc:'Identifica al jugador' },
  { id:'logica',       icon:'🧩', name:'Lógica',        desc:'Patrones, conexiones, historia' },
  { id:'puzzle',       icon:'🔠', name:'Puzzles',       desc:'Palabras y juegos mentales' },
  { id:'contrarreloj', icon:'⏱️', name:'Contrarreloj',  desc:'Velocidad y memoria' },
  { id:'estrategia',   icon:'🎯', name:'Estrategia',    desc:'Forma equipos, toma decisiones' },
  { id:'multijugador', icon:'👯', name:'Multijugador',  desc:'Misma pantalla, varios jugadores' },
  { id:'explorar',     icon:'🎲', name:'Explorar',      desc:'Sin presión, descubre' },
];

let currentCategory = null;

function renderCategories() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  const titleEl = document.querySelector('.home-title');
  const subEl = document.querySelector('.home-sub');
  if (titleEl) titleEl.textContent = 'Elige una categoría';
  if (subEl) subEl.textContent = 'Cada categoría tiene varios juegos';
  grid.innerHTML = CATEGORIES.map(c => {
    const count = GAMES.filter(g => g.category === c.id && g.available).length;
    return `
      <article class="glass-card game-card reveal" onclick="showCategory('${c.id}')" role="button" tabindex="0">
        <span class="game-card__icon" aria-hidden="true">${c.icon}</span>
        <div class="game-card__badges">
          <span class="badge badge--blue">${count} juego${count===1?'':'s'}</span>
        </div>
        <h3 class="game-card__title">${c.name}</h3>
        <p class="game-card__desc">${c.desc}</p>
        <div class="game-card__footer">
          <span class="game-card__status">Ver juegos</span>
          <div class="game-card__arrow" aria-hidden="true">→</div>
        </div>
      </article>`;
  }).join('');
  setTimeout(initScrollReveal, 50);
}

function showCategory(catId) {
  currentCategory = catId;
  const cat = CATEGORIES.find(c => c.id === catId);
  const grid = document.getElementById('games-grid');
  const titleEl = document.querySelector('.home-title');
  const subEl = document.querySelector('.home-sub');
  if (titleEl) titleEl.innerHTML = `${cat.icon} ${cat.name}`;
  if (subEl) subEl.innerHTML = `${cat.desc} <a href="#" onclick="event.preventDefault(); renderCategories(); window.scrollTo(0,0);" style="color:var(--accent-blue); font-weight:700; margin-left:10px;">← Volver</a>`;
  const list = GAMES.filter(g => g.category === catId);
  grid.innerHTML = list.map(g => `
    <article class="glass-card game-card reveal ${!g.available ? 'game-card--disabled' : ''}"
      id="game-card-${g.id}"
      ${g.available ? `onclick="location.href='${g.href}'"` : ''}
      role="${g.available ? 'button' : 'article'}"
      tabindex="${g.available ? '0' : '-1'}">
      <span class="game-card__icon" aria-hidden="true">${g.icon}</span>
      <div class="game-card__badges">
        ${g.badges.map(b => `<span class="badge badge--${b.type}">${b.text}</span>`).join('')}
        <span class="badge badge--diff">${g.difficulty}</span>
      </div>
      <h3 class="game-card__title">${g.title}</h3>
      <p class="game-card__desc">${g.desc}</p>
      <div class="game-card__footer">
        <span class="game-card__status ${!g.available ? 'game-card__status--soon' : ''}">${g.available ? '▶ Jugar' : 'Próximamente'}</span>
        ${g.available ? `<div class="game-card__arrow" aria-hidden="true">→</div>` : ''}
      </div>
    </article>`).join('');
  setTimeout(initScrollReveal, 50);
  updateDailyBadges();
}
window.showCategory = showCategory;
window.renderCategories = renderCategories;

function renderGames() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = GAMES.map(g => `
    <article
      class="glass-card game-card reveal ${!g.available ? 'game-card--disabled' : ''}"
      ${g.available ? `onclick="location.href='${g.href}'"` : ''}
      role="${g.available ? 'button' : 'article'}"
      tabindex="${g.available ? '0' : '-1'}"
      aria-label="${g.title}"
      id="game-card-${g.id}">
      <span class="game-card__icon" aria-hidden="true">${g.icon}</span>
      <div class="game-card__badges">
        ${g.badges.map(b => `<span class="badge badge--${b.type}">${b.text}</span>`).join('')}
        <span class="badge badge--diff">${g.difficulty}</span>
      </div>
      <h3 class="game-card__title">${g.title}</h3>
      <p class="game-card__desc">${g.desc}</p>
      <div class="game-card__footer">
        <span class="game-card__status ${!g.available ? 'game-card__status--soon' : ''}">
          ${g.available ? '▶ Jugar' : 'Próximamente'}
        </span>
        ${g.available ? `<div class="game-card__arrow" aria-hidden="true">→</div>` : ''}
      </div>
    </article>`).join('');

  grid.querySelectorAll('.game-card[tabindex="0"]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') card.click();
    });
  });
}

async function updateStats() {
  await FutbolDB.load();
}

/* ===== Daily Summary & Badges ===== */
function todaySeed() {
  const d = new Date();
  return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`, 10);
}

function getDailyResults() {
  const key = String(todaySeed());
  const get = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
  const dailies = [
    { id: 'reto-diario',     data: get('furbol.diario'),          check: h => h.history?.[key] ? (h.history[key].won ? 'win' : (h.history[key].guesses?.length >= 8 ? 'lose' : null)) : null },
    { id: 'grid-diario',     data: get('furbol.grid-diario'),     check: h => h.history?.[key]?.done ? (h.history[key].cells?.length === 9 ? 'win' : 'lose') : null },
    { id: 'wordle-diario',   data: get('furbol.wordle-diario'),   check: h => h.history?.[key] ? (h.history[key].won ? 'win' : (h.history[key].guesses?.length >= 6 ? 'lose' : null)) : null },
    { id: 'pixelada-diario', data: get('furbol.pixelada-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'conexiones-diario', data: get('furbol.conexiones-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'intruso-diario', data: get('furbol.intruso-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'escudo-zoom-diario', data: get('furbol.escudo-zoom-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'carrera-jugador-diario', data: get('furbol.carrera-jugador-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: '4-companeros-diario', data: get('furbol.4comp-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'anagrama-diario', data: get('furbol.anagrama-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'sopa-diaria', data: get('furbol.sopa-diaria'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'puzzle-diario', data: get('furbol.puzzle-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'sudoku-diario', data: get('furbol.sudoku-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'plantilla-diaria', data: get('furbol.plantilla-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'bingo-diario', data: get('furbol.bingo-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
    { id: 'jugador-diario', data: get('furbol.jugador-diario'), check: h => h.history?.[key]?.done ? (h.history[key].won ? 'win' : 'lose') : null },
  ];
  return dailies.map(d => ({ id: d.id, result: d.check(d.data) }));
}

function updateDailySummary() {
  const el = document.getElementById('daily-summary');
  if (!el) return;
  const d = new Date();
  const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  el.innerHTML = `<span class="date">${dateStr}</span>`;
  // Update stat pills
  const results = getDailyResults();
  const wins = results.filter(r => r.result === 'win').length;
  const losses = results.filter(r => r.result === 'lose').length;
  const wEl = document.getElementById('stat-daily-wins');
  const lEl = document.getElementById('stat-daily-losses');
  if (wEl) wEl.textContent = wins;
  if (lEl) lEl.textContent = losses;
}

function updateDailyBadges() {
  const results = getDailyResults();
  results.forEach(r => {
    const card = document.getElementById('game-card-' + r.id);
    if (!card) return;
    // Reset previous styles
    card.classList.remove('game-card--win', 'game-card--lose');
    if (r.result === 'win') {
      card.classList.add('game-card--win');
    } else if (r.result === 'lose') {
      card.classList.add('game-card--lose');
    }
  });
}

function showDbInfo() {
  const get = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
  const sAdivina = get('furbol.adivina');
  const sMascaro = get('furbol.mascaro');
  const sWordle  = get('furbol.wordle');
  const sComp    = get('furbol.companeros');
  const sCar     = get('furbol.carrera');
  const sConex   = get('furbol.conexiones');
  const sXi      = get('furbol.xi');
  const sPixel   = get('furbol.pixelada');
  const sSopa    = get('furbol.sopa');
  const sPuzzle  = get('furbol.puzzle');
  const sSudoku  = get('furbol.sudoku');
  const sBingo   = get('furbol.bingo');
  const sAnag    = get('furbol.anagrama');
  const sIntr    = get('furbol.intruso');
  const sTrivia  = get('furbol.trivia');
  const sPrimer  = get('furbol.primerclub');
  const sEscudo  = get('furbol.escudozoom');
  const s4Comp   = get('furbol.4comp');
  const sGrid    = get('furbol.grid');
  const sCarJug  = get('furbol.carrerajug');
  const sBand    = get('furbol.bandera');
  const sPlant   = get('furbol.plantilla');

  const row = (icon, name, stats) => `<div class="mini-row">${icon} <span>${name}:</span> ${stats}</div>`;

  openModal(`
    <h2 style="font-family:var(--font-main);font-size:1.5rem;margin-bottom:16px;">📊 Tus estadísticas</h2>

    <h3 style="font-family:var(--font-main);font-size:1.05rem;margin-bottom:10px;">🎯 Adivinanza</h3>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;margin-bottom:18px;">
      ${row('🔍','Adivina',`<strong>${sAdivina.wins||0}</strong> wins · Mejor racha <strong>${sAdivina.bestStreak||0}</strong>`)}
      ${row('📸','Foto Pixelada',`<strong>${sPixel.wins||0}</strong> wins · Mejor racha <strong>${sPixel.best||0}</strong>`)}
      ${row('🗺️','Carrera Clubs',`<strong>${sCar.wins||0}</strong> resueltas`)}
      ${row('🏃','Carrera Jugador',`<strong>${sCarJug.wins||0}</strong> resueltas`)}
    </div>

    <h3 style="font-family:var(--font-main);font-size:1.05rem;margin-bottom:10px;">🧩 Puzzles y Palabras</h3>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;margin-bottom:18px;">
      ${row('🔤','Wordle',`<strong>${sWordle.wins||0}</strong> wins · Mejor racha <strong>${sWordle.bestStreak||0}</strong>`)}
      ${row('🔠','Anagrama',`<strong>${sAnag.wins||0}</strong> wins · Mejor racha <strong>${sAnag.best||0}</strong>`)}
      ${row('🔍','Sopa de Letras',`<strong>${sSopa.wins||0}</strong> resueltas`)}
      ${row('🧩','Puzzle',`<strong>${sPuzzle.wins||0}</strong> resueltos`)}
      ${row('🔢','Sudoku',`<strong>${Object.values(sSudoku.wins||{}).reduce((a,b)=>a+b,0)}</strong> resueltos`)}
    </div>

    <h3 style="font-family:var(--font-main);font-size:1.05rem;margin-bottom:10px;">🧠 Lógica y Conocimiento</h3>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;margin-bottom:18px;">
      ${row('💰','¿Quién vale más?',`Mejor racha <strong>${sMascaro.best||0}</strong>`)}
      ${row('🤝','Compañeros',`Mejor racha <strong>${sComp.best||0}</strong>`)}
      ${row('🕵️','El Intruso',`Mejor racha <strong>${sIntr.best||0}</strong>`)}
      ${row('🔗','Conexiones',`<strong>${sConex.wins||0}</strong> resueltas`)}
      ${row('🧠','Trivia',`Mejor racha <strong>${sTrivia.best||0}</strong>`)}
      ${row('👶','Primer Club',`Mejor racha <strong>${sPrimer.best||0}</strong>`)}
      ${row('🔍','Escudo Zoom',`Mejor racha <strong>${sEscudo.best||0}</strong>`)}
      ${row('👥','4 Compañeros',`<strong>${s4Comp.wins||0}</strong> resueltos`)}
    </div>

    <h3 style="font-family:var(--font-main);font-size:1.05rem;margin-bottom:10px;">⚽ Otros</h3>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:0.85rem;margin-bottom:18px;">
      ${row('🎱','Bingo',`<strong>${sBingo.wins||0}</strong> completados`)}
      ${row('🎰','Grid',`Mejor solo <strong>${sGrid.bestSolo||0}</strong>`)}
      ${row('📋','Arma tu XI',`Mejor XI <strong>${(sXi.best||0) ? (sXi.best/1_000_000).toFixed(0)+'M€' : '0M€'}</strong>`)}
      ${row('🚩','Banderas',`<strong>${sBand.wins||0}</strong> resueltas`)}
      ${row('📋','Plantilla',`<strong>${sPlant.wins||0}</strong> resueltas`)}
    </div>

    <div style="margin-top:22px;display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn--outline" onclick="resetStats()" style="padding:8px 14px;font-size:0.82rem;">Borrar stats</button>
      <button class="btn btn--primary" onclick="closeModal()" style="padding:8px 16px;font-size:0.82rem;">Cerrar</button>
    </div>
  `);
}
window.showDbInfo = showDbInfo;

function resetStats() {
  if (!confirm('¿Borrar todas tus estadísticas locales?')) return;
  ['furbol.adivina','furbol.mascaro','furbol.wordle','furbol.bandera','furbol.companeros','furbol.carrera',
   'furbol.conexiones','furbol.xi','furbol.pixelada','furbol.sopa','furbol.puzzle','furbol.sudoku',
   'furbol.bingo','furbol.anagrama','furbol.intruso','furbol.trivia','furbol.primerclub','furbol.escudozoom',
   'furbol.4comp','furbol.grid','furbol.carrerajug','furbol.plantilla','furbol.diario',
   'furbol.grid-diario','furbol.wordle-diario','furbol.pixelada-diario', 'furbol.conexiones-diario', 'furbol.intruso-diario', 'furbol.escudo-zoom-diario', 'furbol.carrera-jugador-diario', 'furbol.4comp-diario', 'furbol.anagrama-diario', 'furbol.sopa-diaria', 'furbol.puzzle-diario', 'furbol.sudoku-diario', 'furbol.plantilla-diario', 'furbol.bingo-diario', 'furbol.jugador-diario']
    .forEach(k => localStorage.removeItem(k));
  closeModal();
  setTimeout(showDbInfo, 100);
}
window.resetStats = resetStats;

function openModal(html) {
  let m = document.getElementById('fq-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'fq-modal';
    m.innerHTML = `<div class="fq-modal-bg" onclick="closeModal()"></div><div class="fq-modal-card"></div>`;
    document.body.appendChild(m);
  }
  m.querySelector('.fq-modal-card').innerHTML = html;
  m.classList.add('open');
}
window.openModal = openModal;

function closeModal() { document.getElementById('fq-modal')?.classList.remove('open'); }
window.closeModal = closeModal;

function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', async () => {
  renderCategories();
  setTimeout(initScrollReveal, 80);
  await updateStats();
  updateDailySummary();
  setTimeout(initScrollReveal, 160);
  // Actualizar UI de colección después de confirmar que DB está cargada
  if (typeof updateColeccionUI === 'function') updateColeccionUI();
});
