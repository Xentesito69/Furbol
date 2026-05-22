const fs = require('fs');
const html = \<!DOCTYPE html>
<html lang=\"es\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Furbol - Juegos de Fútbol</title>
  <link rel=\"icon\" href=\"images/LogoPrincipalFurbol.png\">
  <link rel=\"stylesheet\" href=\"css/style.css\">
  <style>
    .home-tabs { display:flex; border-bottom:2px solid var(--border); margin-bottom:24px; gap:20px; justify-content:center; }
    .home-tab { background:none; border:none; padding:12px 24px; font-size:1.1rem; font-weight:800; color:var(--text-secondary); cursor:pointer; position:relative; font-family:var(--font-main); transition:color 0.2s; }
    .home-tab:hover { color:var(--text); }
    .home-tab.active { color:var(--primary); }
    .home-tab.active::after { content:''; position:absolute; bottom:-2px; left:0; width:100%; height:4px; background:var(--primary); border-radius:4px 4px 0 0; }
    
    .tab-badge { background:var(--gold); color:#000; font-size:0.75rem; padding:2px 8px; border-radius:12px; margin-left:8px; font-weight:800; }

    .juegos-panel { display:none; }
    .juegos-panel.visible { display:block; animation:fadeIn 0.3s ease; }
    .coleccion-panel { display:none; max-width:800px; margin:0 auto; padding-top:10px; }
    .coleccion-panel.visible { display:block; animation:fadeIn 0.3s ease; }

    @keyframes fadeIn { from {opacity:0; transform:translateY(10px);} to {opacity:1; transform:translateY(0);} }

    /* Colección UI */
    .col-hero { display:flex; flex-direction:column; align-items:center; gap:16px; margin-bottom:30px; }
    .col-circle-wrap { position:relative; width:140px; height:140px; }
    .col-circle-bg { fill:none; stroke:var(--border); stroke-width:12; }
    .col-circle-fill { fill:none; stroke:var(--gold); stroke-width:12; stroke-linecap:round; transform:rotate(-90deg); transform-origin:50% 50%; transition:stroke-dashoffset 1s ease-out; }
    .col-circle-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .col-pct { font-size:1.8rem; font-weight:800; color:var(--gold); line-height:1; text-shadow:0 0 10px rgba(245,200,66,0.3); }
    .col-fraction { font-size:0.85rem; color:var(--text-secondary); margin-top:4px; font-weight:600; }

    .col-cards { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    @media(max-width:500px) { .col-cards { grid-template-columns:1fr; } }
    .col-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px; text-decoration:none; color:var(--text); text-align:center; transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s; display:flex; flex-direction:column; align-items:center; gap:8px; }
    .col-card:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,0.15); border-color:var(--primary); }
    .cc-icon { font-size:2.4rem; }
    .cc-title { font-size:1.2rem; font-weight:800; margin-top:8px; }
    .cc-desc { font-size:0.85rem; color:var(--text-secondary); }
    .cc-badge { background:var(--gold); color:#000; padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:800; margin-top:4px; }

    .pack-howto { max-width: 600px; margin: 20px auto 0; padding: 14px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; font-size: 0.85rem; color: var(--text-secondary); }
    .pack-howto strong { color: var(--text); }
    .pack-howto ul { margin: 6px 0 0 0; padding: 0; list-style: none; }
    .pack-howto li { margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }

    /* Stats bar */
    .stats-bar { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:20px; }
    .stat-pill { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:5px 14px; font-size:0.8rem; color:var(--text-secondary); }
    .stat-pill strong { color:var(--text); }
  </style>
</head>
<body>

<header class=\"navbar\" id=\"navbar\">
  <div class=\"container navbar__inner\">
    <a href=\"index.html\" class=\"navbar__logo\">
      <img src=\"images/LogoPrincipalFurbol.png\" alt=\"Furbol\"/>
      Fur<span>bol</span>
    </a>
    <nav aria-label=\"Navegación principal\">
      <ul class=\"navbar__nav\">
        <li><a href=\"#\" onclick=\"event.preventDefault(); showDbInfo();\">Mis stats</a></li>
      </ul>
    </nav>
    <div class=\"navbar__actions\">
      <button class=\"btn btn--outline\" onclick=\"showDbInfo()\" style=\"padding:8px 14px; font-size:0.82rem;\">?? Stats</button>
    </div>
  </div>
</header>

<main>
<section class=\"home-section\" id=\"juegos\">
  <div class=\"container\">

    <div class=\"stats-bar\" id=\"db-stats\">
      <span class=\"stat-pill\">?? <strong id=\"stat-players\">-</strong> jugadores</span>
      <span class=\"stat-pill\">??? <strong id=\"stat-clubs\">-</strong> equipos</span>
      <span class=\"stat-pill\">?? <strong id=\"stat-leagues\">-</strong> ligas</span>
      <span class=\"stat-pill\">?? <strong id=\"stat-nations\">-</strong> naciones</span>
    </div>

    <div class=\"home-tabs\">
      <button class=\"home-tab active\" id=\"tab-juegos\" onclick=\"switchTab('juegos')\">?? Juegos</button>
      <button class=\"home-tab\" id=\"tab-coleccion\" onclick=\"switchTab('coleccion')\">
        ?? Colección
        <span class=\"tab-badge\" id=\"tab-col-pct\">0%</span>
      </button>
    </div>

    <!-- JUEGOS PANEL -->
    <div id=\"panel-juegos\" class=\"juegos-panel visible\">
      <h1 class=\"home-title\" id=\"home-title\">Elige un juego</h1>
      <p class=\"home-sub\" id=\"home-sub\">Pon a prueba lo que sabes de fútbol</p>
      <div class=\"games-grid\" id=\"games-grid\">
        <!-- Cards insertadas por JS -->
      </div>
    </div>

    <!-- COLECCIÓN PANEL -->
    <div id=\"panel-coleccion\" class=\"coleccion-panel\">
      <div class=\"col-hero\">
        <div class=\"col-circle-wrap\">
          <svg width=\"140\" height=\"140\" viewBox=\"0 0 140 140\">
            <circle class=\"col-circle-bg\" cx=\"70\" cy=\"70\" r=\"58\"/>
            <circle class=\"col-circle-fill\" id=\"col-arc\" cx=\"70\" cy=\"70\" r=\"58\" stroke-dasharray=\"364\" stroke-dashoffset=\"364\"/>
          </svg>
          <div class=\"col-circle-label\">
            <span class=\"col-pct\" id=\"col-pct-num\">0%</span>
            <span class=\"col-fraction\" id=\"col-fraction\">0/0</span>
          </div>
        </div>
        <p style=\"color:var(--text-secondary);font-size:0.88rem;text-align:center;margin:0;\">
          Completa el álbum ganando juegos y abriendo sobres
        </p>
      </div>

      <div class=\"col-cards\">
        <a class=\"col-card\" href=\"games/album.html\" style=\"grid-column:1/-1\">
          <div class=\"cc-icon\">????</div>
          <div class=\"cc-title\">Álbum y Sobres</div>
          <div class=\"cc-badge\" id=\"col-combined-badge\">0 jugadores · 0 sobres</div>
          <div class=\"cc-desc\">Abre tus sobres y mira tu colección de cromos</div>
        </a>
        <a class=\"col-card\" href=\"games/arma-xi-coleccion.html\" style=\"grid-column:1/-1\">
          <div class=\"cc-icon\">?</div>
          <div class=\"cc-title\">Arma tu XI</div>
          <div class=\"cc-desc\">Monta el mejor equipo con tu colección</div>
        </a>
      </div>

      <div class=\"pack-howto\">
        <strong style=\"font-size:1rem; display:block; margin-bottom:12px; color:var(--primary);\">¿Cómo conseguir sobres?</strong>
        <div style=\"display:flex; flex-wrap:wrap; gap:24px;\">
          <div style=\"flex:1; min-width:200px;\">
            <strong>Ganando partida:</strong>
            <ul>
              <li>?? Foto Pixelada</li>
              <li>?? Adivina el Jugador</li>
              <li>?? Wordle Futbolero</li>
              <li>??? Carrera de Clubs</li>
              <li>?? Conexiones</li>
              <li>?? Anagrama</li>
              <li>?? Sopa de Letras</li>
              <li>?? Puzzle de Jugador</li>
              <li>?? Sudoku Futbolero</li>
              <li>?? Adivina por Trayectoria</li>
              <li>?? 4 Compañeros</li>
              <li>?? Bingo Futbolero</li>
            </ul>
          </div>
          <div style=\"flex:1; min-width:200px;\">
            <strong>Por cada Racha de 5:</strong>
            <ul>
              <li>?? ¿Quién vale más?</li>
              <li>?? Compañeros</li>
              <li>??? El Intruso</li>
              <li>?? Primer Club</li>
              <li>?? Escudo con Zoom</li>
              <li>?? Trivia Futbolera</li>
            </ul>
            <strong style=\"display:block; margin-top:12px;\">Encontrando al menos 5:</strong>
            <ul>
              <li>?? Bandera = Jugador</li>
              <li>?? Plantilla a Ciegas</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </section>
</main>

<footer class=\"footer\">
  <div class=\"container footer__inner\">
    <p class=\"footer__copy\">© 2025 Furbol · Datos basados en Transfermarkt</p>
    <nav class=\"footer__links\" aria-label=\"Pie\">
      <a href=\"#\" onclick=\"event.preventDefault(); switchTab('juegos')\">Juegos</a>
      <a href=\"#\" onclick=\"event.preventDefault(); switchTab('coleccion')\">Colección</a>
      <a href=\"#\" onclick=\"event.preventDefault(); showDbInfo();\">Stats</a>
    </nav>
  </div>
</footer>

<script src=\"data/players.js?v=4\"></script>
<script src=\"js/db.js?v=4\"></script>
<script src=\"js/album.js?v=4\"></script>
<script src=\"js/app.js?v=4\"></script>
<script>
  function switchTab(tab) {
    const isJuegos = tab === 'juegos';
    document.getElementById('panel-juegos').classList.toggle('visible', isJuegos);
    document.getElementById('panel-coleccion').classList.toggle('visible', !isJuegos);
    document.getElementById('tab-juegos').classList.toggle('active', isJuegos);
    document.getElementById('tab-coleccion').classList.toggle('active', !isJuegos);
    if (!isJuegos) updateColeccionUI();
  }
  window.switchTab = switchTab;

  async function updateColeccionUI() {
    if (!window.FurbolAlbum || !window.FutbolDB) return; await FutbolDB.load();
    try {
      const s = FurbolAlbum.getStats();
      const packs = FurbolAlbum.getPacks();
      const pct = s.pct;
      const circumference = 364; // 2*p*58 ˜ 364

      document.getElementById('col-pct-num').textContent = pct + '%';
      document.getElementById('col-fraction').textContent = \\/\\;
      document.getElementById('tab-col-pct').textContent = pct + '%';
      document.getElementById('col-combined-badge').textContent = \\ jugador\ · \ sobre\\;

      // Arc animation
      const offset = circumference - (pct / 100) * circumference;
      document.getElementById('col-arc').style.strokeDashoffset = offset;
    } catch (err) {
      console.error('Error updating coleccion UI:', err);
    }
  }

  window.addEventListener('furbol:album:update', () => {
    const s = FurbolAlbum.getStats();
    document.getElementById('tab-col-pct').textContent = s.pct + '%';
  });

  document.addEventListener('DOMContentLoaded', async () => {
    await FutbolDB.load();
    updateColeccionUI();
  });
</script>
</body>
</html>\;
fs.writeFileSync('index.html', html, 'utf8');
