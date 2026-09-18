/* ── Theme-Vorschau: lädt themes/<name>.css via ?theme=<name>.
      Nur zum Layout-Vergleich während der Entwicklung gedacht —
      die Umschaltleiste erscheint ausschließlich auf localhost.
      Sobald ein Layout gewählt ist: Theme-Datei in style.css mergen
      und dieses Skript entfernen. ── */
(function () {
  'use strict';
  var THEMES = ['standard', 'editorial', 'institut', 'studio'];
  var theme = new URLSearchParams(location.search).get('theme') || 'standard';
  if (!/^[a-z]+$/.test(theme) || THEMES.indexOf(theme) < 0) theme = 'standard';

  if (theme !== 'standard') {
    document.write('<link rel="stylesheet" href="themes/' + theme + '.css">');
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Theme-Parameter an interne Links weiterreichen
    if (theme !== 'standard') {
      document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (/^[a-z-]+\.html(#.*)?$/.test(href)) {
          var parts = href.split('#');
          a.setAttribute('href', parts[0] + '?theme=' + theme + (parts[1] ? '#' + parts[1] : ''));
        } else if (/^#/.test(href) === false && /^index\.html#/.test(href)) {
          a.setAttribute('href', href.replace('#', '?theme=' + theme + '#'));
        }
      });
    }

    // Umschaltleiste nur lokal
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    var bar = document.createElement('div');
    bar.setAttribute('style',
      'position:fixed;bottom:14px;right:14px;z-index:999;display:flex;gap:4px;' +
      'background:#14171c;padding:6px 8px;border-radius:999px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,0.35);font:600 12px/1 system-ui,sans-serif;');
    THEMES.forEach(function (t) {
      var a = document.createElement('a');
      var page = location.pathname.split('/').pop() || 'index.html';
      a.href = page + (t === 'standard' ? '' : '?theme=' + t);
      a.textContent = t[0].toUpperCase() + t.slice(1);
      a.setAttribute('style',
        'padding:6px 10px;border-radius:999px;text-decoration:none;' +
        (t === theme ? 'background:#ffd93d;color:#14171c;' : 'color:#f5f1e8;'));
      bar.appendChild(a);
    });
    document.body.appendChild(bar);
  });
})();
