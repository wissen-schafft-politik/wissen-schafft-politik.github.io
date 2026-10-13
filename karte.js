/* ── Karten-Seite: Forschungsstandorte auf statischen SVG-Karten
   (Welt + DACH, generiert von scripts/build_maps.py — keine
   Drittserver). Orte werden über data/places.json aus dem Profilfeld
   „Ort“ verortet. ── */
(function () {
  'use strict';

  const MAPS = window.PSW_MAPS || {};
  const $canvas = document.getElementById('map-canvas');
  const $panel = document.getElementById('map-panel');
  const $note = document.getElementById('map-note');

  let experts = [];
  let places = {};
  let current = 'dach';
  let selected = null; // Ortsname

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Profile nach Ort gruppieren */
  function groups() {
    const g = new Map();
    experts.forEach(e => {
      const ort = (e.location || '').trim();
      if (!ort) return;
      if (!g.has(ort)) g.set(ort, []);
      g.get(ort).push(e);
    });
    return g;
  }

  function project(map, lat, lon) {
    return [(lon - map.lon0) * map.kx, (map.lat0 - lat) * map.ky];
  }

  function inside(map, x, y) {
    return x >= 0 && x <= map.w && y >= 0 && y <= map.h;
  }

  function render() {
    const map = MAPS[current];
    const g = groups();
    const unknown = [];
    let dots = '';
    const located = [];

    [...g.entries()].forEach(([ort, people]) => {
      const place = places[ort];
      if (!place) { unknown.push(ort); return; }
      const [x, y] = project(map, place.lat, place.lon);
      if (!inside(map, x, y)) return; // außerhalb des Ausschnitts (nur DACH-Karte)
      located.push([ort, people]);
      const r = current === 'dach' ? 7 + 2.5 * Math.sqrt(people.length - 1)
                                   : 5 + 2 * Math.sqrt(people.length - 1);
      dots += `
        <g class="map-dot${ort === selected ? ' selected' : ''}" data-ort="${esc(ort)}"
           role="button" tabindex="0" aria-label="${esc(ort)}: ${people.length} Profil(e)">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>
          <title>${esc(ort)} — ${people.length} ${people.length === 1 ? 'Profil' : 'Profile'}</title>
        </g>`;
    });

    $canvas.innerHTML = `
      <svg viewBox="0 0 ${map.w} ${map.h}" xmlns="http://www.w3.org/2000/svg"
        class="map-svg map-svg--${current}">
        ${map.svg}
        ${dots}
      </svg>`;

    $canvas.querySelectorAll('.map-dot').forEach(dot => {
      const pick = () => {
        selected = selected === dot.dataset.ort ? null : dot.dataset.ort;
        render();
      };
      dot.addEventListener('click', pick);
      dot.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); }
      });
    });

    renderPanel(g, located, unknown);
  }

  function renderPanel(g, located, unknown) {
    located.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'de'));

    if (selected && g.has(selected)) {
      const people = g.get(selected).slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'de'));
      $panel.innerHTML = `
        <div class="map-panel-head">
          <h2>${esc(selected)}</h2>
          <button type="button" class="map-panel-close" aria-label="Auswahl aufheben">×</button>
        </div>
        <ul class="map-people">
          ${people.map(e => `
            <li>
              <strong>${esc(e.name)}</strong><br>
              <span>${esc(e.institution)}</span>
            </li>`).join('')}
        </ul>
        <a class="map-panel-link" href="verzeichnis.html?ort=${encodeURIComponent(selected)}">
          Im Verzeichnis anzeigen →</a>`;
      $panel.querySelector('.map-panel-close').addEventListener('click', () => {
        selected = null;
        render();
      });
    } else {
      $panel.innerHTML = `
        <div class="map-panel-head"><h2>Standorte</h2></div>
        <ul class="map-locations">
          ${located.map(([ort, people]) => `
            <li><button type="button" data-ort="${esc(ort)}">
              <span>${esc(ort)}</span>
              <span class="map-loc-count">${people.length}</span>
            </button></li>`).join('')}
        </ul>
        ${located.length === 0 ? '<p class="map-empty">Im gewählten Ausschnitt liegen keine Standorte — zur Weltkarte wechseln.</p>' : ''}`;
      $panel.querySelectorAll('button[data-ort]').forEach(btn => {
        btn.addEventListener('click', () => {
          selected = btn.dataset.ort;
          render();
        });
      });
    }

    if (unknown.length) {
      $note.hidden = false;
      $note.textContent = 'Ohne Verortung (Ort nicht im Ortsverzeichnis): ' + unknown.join(', ');
    } else {
      $note.hidden = true;
    }
  }

  document.querySelectorAll('.map-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      current = btn.dataset.map;
      document.querySelectorAll('.map-toggle-btn').forEach(b =>
        b.classList.toggle('active', b === btn));
      render();
    });
  });

  /* Daten kommen aus data/experts.js und data/places.js (synchron,
     keine fetch-Abhängigkeit) */
  places = window.PSW_PLACES || {};
  const expertsReady = window.PSW_EXPERTS
    ? Promise.resolve(window.PSW_EXPERTS)
    : fetch('data/experts.json').then(r => r.json());
  expertsReady
    .then(data => {
      experts = data.experts || [];
      render();
    })
    .catch(err => {
      console.error(err);
      $canvas.innerHTML = '<p class="error">Die Karte konnte nicht geladen werden.</p>';
    });
})();
