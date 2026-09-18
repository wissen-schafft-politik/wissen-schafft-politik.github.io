/* ── Themenfeld-Übersicht (themen.html): listet alle Themenfelder der
   Taxonomie, auch unbesetzte, mit Kurzbeschreibung und Profilzahl. ── */
(function () {
  'use strict';

  const TOPICS = window.PSW_TOPICS || [];
  const $grid = document.getElementById('topics-grid');

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  fetch('data/experts.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      const experts = data.experts || [];
      const count = name => experts.filter(e => (e.topics || []).includes(name)).length;
      $grid.innerHTML = TOPICS.map(t => {
        const n = count(t.name);
        const link = n > 0
          ? `<a class="topic-card-link" href="verzeichnis.html?thema=${encodeURIComponent(t.name)}">
               ${n} ${n === 1 ? 'Profil' : 'Profile'} anzeigen →</a>`
          : `<a class="topic-card-link topic-card-link--empty" href="mitmachen.html">
               Noch unbesetzt — jetzt eintragen →</a>`;
        return `
          <div class="topic-card${n === 0 ? ' topic-card--empty' : ''}" style="--tag-color:${esc(t.color)}">
            <div class="topic-card-head">
              <span class="topic-card-dot" aria-hidden="true"></span>
              <h2 class="topic-card-name">${esc(t.name)}</h2>
              <span class="topic-card-count">${n}</span>
            </div>
            <p class="topic-card-desc">${esc(t.desc || '')}</p>
            ${link}
          </div>`;
      }).join('');
    })
    .catch(err => {
      console.error(err);
      $grid.innerHTML = '<p class="error">Die Themenfelder konnten nicht geladen werden.</p>';
    });
})();
