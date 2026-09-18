# Wissen Schafft Politik

Verzeichnis deutschsprachiger Politikwissenschaftler:innen für Medienanfragen.
Journalist:innen finden hier Ansprechpartner:innen für Interviews und Einordnungen,
kategorisiert nach Themenfeldern. Alle gelisteten Personen verpflichten sich auf einen
[Kodex](https://wissen-schafft-politik.github.io/kodex.html) für evidenzbasierte
Wissenschaftskommunikation.

Website: https://wissen-schafft-politik.github.io/

Das Verzeichnis ist eine Initiative von Heike Klüver (Humboldt-Universität zu Berlin)
und Simon Munzert (Hertie School, Berlin). Vorbild ist
[Women Also Know Stuff](https://womenalsoknowstuff.com).

## Aufbau

Die Website ist vollständig statisch und wird über GitHub Pages ausgeliefert
(Branch `main`, Wurzelverzeichnis).

```
index.html                 Verzeichnis mit Suche, Themenfiltern und Profilansicht
kodex.html                 Kodex (Selbstverpflichtung)
mitmachen.html             Selbsteintrag (Formular, erzeugt ein vorausgefülltes GitHub-Issue)
impressum.html             Impressum
datenschutz.html           Datenschutzhinweise
style.css                  Stylesheet
topics.js                  Themen-Taxonomie (30 Themenfelder)
app.js                     Verzeichnis-Logik (Laden, Filtern, Profilansicht)
join.js                    Logik des Eintragsformulars
data/experts.json          Profildaten, versioniert in Git
data/experts.schema.json   JSON-Schema für die Profildaten
data/img/                  Profilfotos
fonts/, fonts.css          Selbst gehostete Schriften (keine Anfragen an Drittserver)
scripts/                   Python-Skripte für Profilverarbeitung und Validierung
.github/                   Issue-Formular und GitHub-Actions-Workflows
```

## Aufnahme neuer Profile

1. Das Formular auf [mitmachen.html](https://wissen-schafft-politik.github.io/mitmachen.html)
   erzeugt ein vorausgefülltes GitHub-Issue auf Basis des Templates
   [profil.yml](.github/ISSUE_TEMPLATE/profil.yml). Alternativ kann das Issue direkt auf
   GitHub ausgefüllt oder der Eintrag per E-Mail an das Team geschickt werden.
2. Der Workflow [profil-intake.yml](.github/workflows/profil-intake.yml) verarbeitet das
   Issue mit [scripts/issue_to_profile.py](scripts/issue_to_profile.py): Er prüft die
   Angaben, schreibt den Eintrag nach `data/experts.json` und öffnet einen Pull Request.
   Bei Validierungsfehlern kommentiert der Workflow das Issue; nach einer Korrektur des
   Issues startet die Verarbeitung erneut.
3. Das Redaktionsteam prüft den Pull Request (Plausibilität, Links, institutionelle
   Zugehörigkeit). Mit dem Merge erscheint das Profil im Verzeichnis.
4. Der Workflow [validate.yml](.github/workflows/validate.yml) validiert `data/experts.json`
   bei jedem Push und Pull Request gegen das JSON-Schema, prüft auf Duplikate und stellt
   sicher, dass die Themen-Taxonomie in `topics.js`, Schema, Parser und Issue-Template
   übereinstimmt.

Profiländerungen laufen über denselben Weg; Einträge mit bereits bekannter E-Mail-Adresse
werden aktualisiert statt neu angelegt. Löschungen nimmt das Team per E-Mail entgegen
(Kontakt siehe [Impressum](https://wissen-schafft-politik.github.io/impressum.html)).

## Konfiguration des Repositories

Für den Betrieb sind folgende Einstellungen erforderlich (Stand: eingerichtet):

- GitHub Pages: Branch `main`, Verzeichnis `/ (root)`.
- Actions: Workflow-Berechtigungen auf *Read and write permissions*, Option
  *Allow GitHub Actions to create and approve pull requests* aktiviert
  (auf Organisations- und Repository-Ebene).
- Labels `neues-profil` (löst den Intake-Workflow aus) und `profil`
  (Kennzeichnung der automatisch erzeugten Pull Requests).

Hinweis: Bei automatisch erzeugten Pull Requests kann der Validierungs-Workflow den
Status `action_required` haben und muss im Pull Request manuell gestartet werden
(*Approve and run*).

## Lokale Entwicklung

Die Seite lädt `data/experts.json` per `fetch` und benötigt daher einen lokalen
Webserver:

```bash
python3 -m http.server 8000
```

Anschließend ist die Seite unter http://localhost:8000 erreichbar.

Nach manuellen Änderungen an `data/experts.json`:

```bash
pip install jsonschema
python3 scripts/validate.py
```

## Lizenz

Der Code steht unter der MIT-Lizenz (siehe [LICENSE](LICENSE)). Die Profildaten in
`data/experts.json` wurden von den gelisteten Personen selbst eingetragen und zur
Veröffentlichung freigegeben; Änderung oder Löschung kann jederzeit verlangt werden.
