/* ── Mitmachen-Formular: erzeugt ein vorausgefülltes GitHub-Issue
      (Template: .github/ISSUE_TEMPLATE/profil.yml) oder eine E-Mail. ── */
(function () {
  'use strict';

  // Repository, in dem Profile als Issues eingereicht werden:
  const REPO = 'wissen-schafft-politik/wissen-schafft-politik.github.io';
  const CONTACT_EMAIL = 'wissen-schafft-politik@posteo.de'; // TODO: echte Team-Adresse eintragen

  const TOPICS = window.PSW_TOPICS || [];
  const $topics = document.getElementById('form-topics');
  const $form = document.getElementById('join-form');
  const $error = document.getElementById('form-error');
  const selected = new Set();

  /* Themen-Chips */
  TOPICS.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = t.name;
    btn.style.setProperty('--chip-color', t.color);
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      if (selected.has(t.name)) {
        selected.delete(t.name);
      } else if (selected.size < 6) {
        selected.add(t.name);
      } else {
        showError('Maximal sechs Themenfelder — bitte zuerst eines abwählen.');
        return;
      }
      hideError();
      btn.classList.toggle('active', selected.has(t.name));
      btn.setAttribute('aria-pressed', String(selected.has(t.name)));
    });
    $topics.appendChild(btn);
  });

  const val = id => document.getElementById(id).value.trim();

  function showError(msg) { $error.textContent = msg; $error.hidden = false; }
  function hideError() { $error.hidden = true; }

  function collect() {
    hideError();
    const required = [
      ['f-name', 'Name'], ['f-position', 'Position'], ['f-institution', 'Institution'],
      ['f-sprachen', 'Interviewsprachen'], ['f-kurzbio', 'Kurzbeschreibung'],
      ['f-bio', 'Selbstbeschreibung'], ['f-email', 'E-Mail']
    ];
    for (const [id, label] of required) {
      if (!val(id)) {
        showError(`Bitte das Feld „${label}“ ausfüllen.`);
        document.getElementById(id).focus();
        return null;
      }
    }
    if (selected.size === 0) {
      showError('Bitte mindestens ein Themenfeld wählen.');
      return null;
    }
    if (!document.getElementById('f-kodex').checked || !document.getElementById('f-datenschutz').checked) {
      showError('Bitte Kodex-Selbstverpflichtung und Datenschutz-Einwilligung bestätigen.');
      return null;
    }
    return {
      name: val('f-name'),
      position: val('f-position'),
      institution: val('f-institution'),
      ort: val('f-ort'),
      sprachen: val('f-sprachen'),
      themen: [...selected].join(', '),
      kurzbio: val('f-kurzbio'),
      bio: val('f-bio'),
      email: val('f-email'),
      telefon: val('f-telefon'),
      pressestelle: val('f-pressestelle'),
      website: val('f-website'),
      scholar: val('f-scholar'),
      orcid: val('f-orcid'),
      social: val('f-social'),
      publikationen: val('f-pubs'),
      medien: val('f-medien')
    };
  }

  /* GitHub Issue-Form-Prefill: Feld-IDs müssen mit profil.yml übereinstimmen */
  $form.addEventListener('submit', ev => {
    ev.preventDefault();
    const d = collect();
    if (!d) return;
    const params = new URLSearchParams({
      template: 'profil.yml',
      title: `Neues Profil: ${d.name}`,
      name: d.name,
      position: d.position,
      institution: d.institution,
      ort: d.ort,
      sprachen: d.sprachen,
      themen: d.themen,
      kurzbio: d.kurzbio,
      bio: d.bio,
      email: d.email,
      telefon: d.telefon,
      pressestelle: d.pressestelle,
      website: d.website,
      scholar: d.scholar,
      orcid: d.orcid,
      social: d.social,
      publikationen: d.publikationen,
      medien: d.medien
    });
    window.open(`https://github.com/${REPO}/issues/new?${params}`, '_blank', 'noopener');
  });

  /* E-Mail-Fallback */
  document.getElementById('mail-btn').addEventListener('click', () => {
    const d = collect();
    if (!d) return;
    const body = [
      'Hallo, ich möchte mich bei Wissen Schafft Politik eintragen.',
      '',
      `Name: ${d.name}`,
      `Position: ${d.position}`,
      `Institution: ${d.institution}`,
      `Ort: ${d.ort}`,
      `Interviewsprachen: ${d.sprachen}`,
      `Themenfelder: ${d.themen}`,
      '',
      `Kurzbeschreibung: ${d.kurzbio}`,
      '',
      `Selbstbeschreibung: ${d.bio}`,
      '',
      `E-Mail (öffentlich): ${d.email}`,
      d.telefon && `Telefon: ${d.telefon}`,
      d.pressestelle && `Pressestelle: ${d.pressestelle}`,
      d.website && `Website: ${d.website}`,
      d.scholar && `Google Scholar: ${d.scholar}`,
      d.orcid && `ORCID: ${d.orcid}`,
      d.social && `Social Media:\n${d.social}`,
      d.publikationen && `\nPublikationen:\n${d.publikationen}`,
      d.medien && `\nMedienbeiträge:\n${d.medien}`,
      '',
      'Ich stimme dem Kodex zu und willige in die öffentliche Speicherung und Anzeige der Daten ein.'
    ].filter(Boolean).join('\n');
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Neues Profil: ' + d.name)}&body=${encodeURIComponent(body)}`;
  });
})();
