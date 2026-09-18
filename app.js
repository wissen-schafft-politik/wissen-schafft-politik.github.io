/* ── Wissen Schafft Politik — Verzeichnis-Logik ── */
(function () {
  'use strict';

  const TOPICS = window.PSW_TOPICS || [];
  const topicColor = name => {
    const t = TOPICS.find(t => t.name === name);
    return t ? t.color : '#2b44df';
  };

  const $grid       = document.getElementById('experts-grid');
  const $chips      = document.getElementById('topic-chips');
  const $search     = document.getElementById('search-input');
  const $clear      = document.getElementById('search-clear');
  const $count      = document.getElementById('filter-count');
  const $noResults  = document.getElementById('no-results');
  const $backdrop   = document.getElementById('modal-backdrop');
  const $modalBody  = document.getElementById('modal-content');
  const $modalClose = document.getElementById('modal-close');

  let experts = [];
  let activeTopic = null;
  let query = '';
  let lastFocus = null;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const initials = name => name
    .split(/\s+/)
    .filter(w => w && !/\.|^(PD|Prof|Dr|Jun)$/i.test(w))
    .map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ── Rendering ── */

  function renderChips() {
    const frag = document.createDocumentFragment();
    TOPICS.forEach(t => {
      const inUse = experts.some(e => (e.topics || []).includes(t.name));
      if (!inUse) return;
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.textContent = t.name;
      btn.style.setProperty('--chip-color', t.color);
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        activeTopic = activeTopic === t.name ? null : t.name;
        document.querySelectorAll('#topic-chips .chip').forEach(c => {
          const on = c.textContent === activeTopic;
          c.classList.toggle('active', on);
          c.setAttribute('aria-pressed', String(on));
        });
        renderGrid();
      });
      frag.appendChild(btn);
    });
    const reset = document.createElement('button');
    reset.className = 'chip chip-reset';
    reset.type = 'button';
    reset.textContent = 'Alle Themen';
    reset.addEventListener('click', () => {
      activeTopic = null;
      query = '';
      $search.value = '';
      $clear.hidden = true;
      document.querySelectorAll('#topic-chips .chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      renderGrid();
    });
    frag.appendChild(reset);
    $chips.replaceChildren(frag);
  }

  function matches(e) {
    if (activeTopic && !(e.topics || []).includes(activeTopic)) return false;
    if (!query) return true;
    const hay = [
      e.name, e.position, e.institution, e.location, e.bio,
      (e.topics || []).join(' '), (e.keywords || []).join(' ')
    ].join(' ').toLowerCase();
    return query.toLowerCase().split(/\s+/).every(w => hay.includes(w));
  }

  function cardHTML(e, idx) {
    const accent = topicColor((e.topics || [])[0]);
    const photo = e.photo
      ? `<img src="${esc(e.photo)}" alt="" loading="lazy">`
      : `<span class="expert-initials" aria-hidden="true">${esc(initials(e.name))}</span>`;
    const tags = (e.topics || []).slice(0, 4).map(t =>
      `<span class="topic-tag" style="--tag-color:${esc(topicColor(t))}">${esc(t)}</span>`
    ).join('');
    const more = (e.topics || []).length > 4
      ? `<span class="topic-tag" style="--tag-color:#5f6a76">+${e.topics.length - 4}</span>` : '';
    return `
      <button class="expert-card" data-idx="${idx}" style="--card-accent:${esc(accent)}"
        aria-haspopup="dialog" aria-label="Profil öffnen: ${esc(e.name)}">
        <div class="expert-head">
          <div class="expert-photo" style="background:${esc(accent)}">${photo}</div>
          <div>
            <div class="expert-name">${esc(e.name)}</div>
            <div class="expert-role">${esc(e.position)}<br>${esc(e.institution)}</div>
          </div>
        </div>
        <div class="expert-topics">${tags}${more}</div>
        <p class="expert-bio">${esc(e.shortBio || e.bio || '')}</p>
        <div class="expert-foot">
          <span>${esc(e.location || '')}</span>
          <span class="open-hint">Profil →</span>
        </div>
      </button>`;
  }

  function renderGrid() {
    const visible = experts.map((e, i) => ({ e, i })).filter(({ e }) => matches(e));
    $grid.innerHTML = visible.map(({ e, i }) => cardHTML(e, i)).join('');
    $noResults.hidden = visible.length > 0;
    if (visible.length === 0) {
      $noResults.textContent = 'Keine Treffer. Tipp: Filter zurücksetzen oder anderen Suchbegriff probieren.';
    }
    $count.textContent = activeTopic || query
      ? `${visible.length} von ${experts.length} Profilen`
      : `${experts.length} Profile`;
    $grid.querySelectorAll('.expert-card').forEach(card => {
      card.addEventListener('click', () => openModal(Number(card.dataset.idx)));
    });
  }

  /* ── Profile modal ── */

  const linkPills = e => {
    const s = e.socials || {};
    const pills = [
      e.website && ['Website', e.website],
      e.scholar && ['Google Scholar', e.scholar],
      e.orcid && ['ORCID', e.orcid],
      s.bluesky && ['Bluesky', s.bluesky],
      s.twitter && ['X / Twitter', s.twitter],
      s.mastodon && ['Mastodon', s.mastodon],
      s.linkedin && ['LinkedIn', s.linkedin],
      s.github && ['GitHub', s.github]
    ].filter(Boolean);
    return pills.map(([label, url]) =>
      `<a class="link-pill" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`
    ).join('');
  };

  const listItems = (items, fmt) => (items || []).map(fmt).join('');

  function openModal(idx) {
    const e = experts[idx];
    if (!e) return;
    lastFocus = document.activeElement;
    const accent = topicColor((e.topics || [])[0]);
    document.getElementById('profile-modal').style.setProperty('--accent', accent);

    const photo = e.photo
      ? `<img src="${esc(e.photo)}" alt="Foto von ${esc(e.name)}">`
      : `<span class="expert-initials" aria-hidden="true">${esc(initials(e.name))}</span>`;

    const pubs = listItems(e.publications, p => `
      <li><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>
        <span class="item-meta">— ${esc(p.outlet)}${p.year ? ', ' + esc(p.year) : ''}</span></li>`);

    const media = listItems(e.media, m => `
      <li><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${esc(m.title)}</a>
        <span class="item-meta">— ${esc(m.outlet)}${m.year ? ', ' + esc(m.year) : ''}</span></li>`);

    const langs = (e.languages || []).join(', ');

    $modalBody.innerHTML = `
      <div class="profile-head">
        <div class="profile-photo" style="background:${esc(accent)}">${photo}</div>
        <div>
          <h2 class="profile-name" id="modal-name">${esc(e.name)}</h2>
          <p class="profile-role">${esc(e.position)} · ${esc(e.institution)}</p>
          <p class="profile-meta">${esc(e.location || '')}${langs ? ' · Interviews: ' + esc(langs) : ''}</p>
        </div>
      </div>
      <div class="profile-topics">${(e.topics || []).map(t =>
        `<span class="topic-tag" style="--tag-color:${esc(topicColor(t))}">${esc(t)}</span>`).join('')}
      </div>
      <p class="profile-bio">${esc(e.bio || '')}</p>

      <div class="profile-section-label">Profile &amp; Links</div>
      <div class="profile-links">${linkPills(e)}</div>

      ${pubs ? `<div class="profile-section-label">Ausgewählte Publikationen</div>
      <ul class="profile-list">${pubs}</ul>` : ''}

      ${media ? `<div class="profile-section-label">In den Medien</div>
      <ul class="profile-list">${media}</ul>` : ''}

      <div class="contact-box">
        <strong>Presseanfragen:</strong>
        ${e.email ? ` <a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : ''}
        ${e.phone ? ` · ${esc(e.phone)}` : ''}
        ${e.pressOffice ? `<br><span>Pressestelle: ${esc(e.pressOffice)}</span>` : ''}
      </div>
      <div class="kodex-badge">✔ Hat den <a href="kodex.html" style="margin-left:0.25em"><u>Kodex</u></a> unterzeichnet${e.joined ? ' · dabei seit ' + esc(e.joined) : ''}</div>
    `;
    $backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    $modalClose.focus();
  }

  function closeModal() {
    $backdrop.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  $modalClose.addEventListener('click', closeModal);
  $backdrop.addEventListener('click', ev => { if (ev.target === $backdrop) closeModal(); });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !$backdrop.hidden) closeModal();
  });

  /* ── Search ── */

  let debounce;
  $search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      query = $search.value.trim();
      $clear.hidden = query === '';
      renderGrid();
    }, 120);
  });
  $clear.addEventListener('click', () => {
    $search.value = '';
    query = '';
    $clear.hidden = true;
    renderGrid();
    $search.focus();
  });

  /* ── Init ── */

  fetch('data/experts.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      experts = (data.experts || []).slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'de'));
      document.getElementById('stat-experts').textContent = experts.length;
      const used = new Set();
      experts.forEach(e => (e.topics || []).forEach(t => used.add(t)));
      document.getElementById('stat-topics').textContent = used.size;
      renderChips();
      renderGrid();
    })
    .catch(err => {
      console.error(err);
      $grid.innerHTML = '<p class="error">Das Verzeichnis konnte nicht geladen werden. Bitte später erneut versuchen.</p>';
    });
})();
