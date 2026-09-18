/* Gemeinsame Themen-Taxonomie — wird von Verzeichnis (app.js) und
   Mitmachen-Formular (join.js) genutzt. Reihenfolge = Anzeigereihenfolge.
   Orientiert an den Sections der EPSS, umgemünzt auf journalistisch
   relevante Themen und Politikfelder.
   Muss synchron bleiben mit: data/experts.schema.json (enum),
   scripts/issue_to_profile.py (TOPICS) und .github/ISSUE_TEMPLATE/profil.yml
   — scripts/validate.py prüft das. */
window.PSW_TOPICS = [
  { name: 'Wahlen & Wahlverhalten',                 color: '#2b44df' },
  { name: 'Parteien & Parteienwettbewerb',          color: '#e03e1f' },
  { name: 'Öffentliche Meinung & Umfragen',         color: '#00805f' },
  { name: 'Politische Kommunikation',               color: '#7a3ff2' },
  { name: 'Digitale Medien & Desinformation',       color: '#d61f69' },
  { name: 'Künstliche Intelligenz & Digitalpolitik', color: '#0f4c81' },
  { name: 'Demokratie & Autokratisierung',          color: '#b97e00' },
  { name: 'Extremismus & Radikalisierung',          color: '#0d7ea8' },
  { name: 'Protest & Soziale Bewegungen',           color: '#c2410c' },
  { name: 'Politische Beteiligung & Repräsentation', color: '#6d28d9' },
  { name: 'Geschlecht, Gleichstellung & Diversität', color: '#be185d' },
  { name: 'Migration & Integration',                color: '#a16207' },
  { name: 'Europäische Union',                      color: '#1d4ed8' },
  { name: 'Internationale Beziehungen & Diplomatie', color: '#4d7c0f' },
  { name: 'Krieg, Konflikt & Sicherheit',           color: '#7f1d1d' },
  { name: 'Entwicklungspolitik & Globaler Süden',   color: '#b45309' },
  { name: 'Regierung, Koalitionen & Parlamente',    color: '#9333ea' },
  { name: 'Föderalismus & Landespolitik',           color: '#0e7490' },
  { name: 'Lokal- & Kommunalpolitik',               color: '#166534' },
  { name: 'Verwaltung & Staatsmodernisierung',      color: '#475569' },
  { name: 'Recht, Justiz & Verfassung',             color: '#713f12' },
  { name: 'Interessengruppen & Lobbyismus',         color: '#be123c' },
  { name: 'Wirtschafts- & Finanzpolitik',           color: '#b91c1c' },
  { name: 'Sozialpolitik & Wohlfahrtsstaat',        color: '#0f766e' },
  { name: 'Gesundheitspolitik',                     color: '#15803d' },
  { name: 'Bildungs- & Wissenschaftspolitik',       color: '#c026d3' },
  { name: 'Klima-, Umwelt- & Energiepolitik',       color: '#15703b' },
  { name: 'Politische Theorie & Ideengeschichte',   color: '#5b21b6' },
  { name: 'Vergleichende Politikwissenschaft',      color: '#0369a1' },
  { name: 'Methoden, Daten & Prognosen',            color: '#334155' }
];
