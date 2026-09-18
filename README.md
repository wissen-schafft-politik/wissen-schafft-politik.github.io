# Wissen Schafft Politik

**Das Expertise-Verzeichnis der deutschsprachigen Politikwissenschaft** — inspiriert von
[Women Also Know Stuff](https://womenalsoknowstuff.com). Journalist:innen finden hier
Politikwissenschaftler:innen für Interviews und Einordnungen, kategorisiert nach Themen.
Alle Gelisteten verpflichten sich auf den [Kodex](kodex.html) für evidenzbasierte
Wissenschaftskommunikation.

**Live:** https://wissen-schafft-politik.github.io/

## Architektur

Komplett statisch, gehostet auf GitHub Pages — kein Server, keine Datenbank-Software,
keine Kosten:

```
index.html          Verzeichnis mit Suche, Themenfiltern und Profil-Modals
kodex.html          Der Kodex (Selbstverpflichtung)
mitmachen.html      Selbsteintrag (Formular → vorausgefülltes GitHub-Issue)
impressum.html      Impressum (Platzhalter — ausfüllen!)
datenschutz.html    Datenschutzhinweise (Platzhalter — prüfen!)
style.css           Design (hell, editorial-brutalistisch)
topics.js           Gemeinsame Themen-Taxonomie
app.js              Verzeichnis-Logik (Laden, Filtern, Modal)
join.js             Mitmachen-Formular-Logik
data/experts.json   „Datenbank“: alle Profile, versioniert in Git
data/experts.schema.json   JSON-Schema für die Validierung
fonts/, fonts.css   Selbst gehostete Schriften (DSGVO: keine Google-Requests)
scripts/            Python-Skripte für Intake und Validierung
.github/            Issue-Formular + Actions (Automatisierung)
```

## Wie kommen neue Profile rein?

1. **Website-Formular** ([mitmachen.html](mitmachen.html)): erzeugt ein vorausgefülltes
   GitHub-Issue (Template [.github/ISSUE_TEMPLATE/profil.yml](.github/ISSUE_TEMPLATE/profil.yml)).
2. **GitHub Action** ([profil-intake.yml](.github/workflows/profil-intake.yml)): parst das
   Issue ([scripts/issue_to_profile.py](scripts/issue_to_profile.py)), validiert die Angaben,
   schreibt den Eintrag in `data/experts.json` und öffnet einen **Pull Request**.
   Bei Fehlern kommentiert der Bot das Issue; die Person kann es einfach editieren.
3. **Redaktionelle Freigabe**: Ein Mensch prüft den PR (Plausibilität, Links, Zugehörigkeit)
   und merged — damit ist das Profil live. Jede Änderung ist in der Git-Historie dokumentiert.
4. **Validierung**: [validate.yml](.github/workflows/validate.yml) prüft `experts.json` bei
   jedem Push/PR gegen das JSON-Schema (inkl. Duplikat-Checks).

Änderungen laufen über denselben Weg (gleiche E-Mail ⇒ Update statt Neuanlage).
Ohne GitHub-Konto: E-Mail-Fallback im Formular.

## Deployment (einmalig)

1. GitHub-**Organisation** `wissen-schafft-politik` anlegen (oder anderen Namen wählen —
   dann die URLs in `join.js` [Konstante `REPO`], `index.html`, `.github/ISSUE_TEMPLATE/*`
   und dieser README anpassen).
2. Repository `wissen-schafft-politik.github.io` in der Organisation anlegen und dieses
   Verzeichnis pushen:
   ```bash
   git remote add origin git@github.com:wissen-schafft-politik/wissen-schafft-politik.github.io.git
   git push -u origin main
   ```
3. **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
4. **Settings → Actions → General**: „Workflow permissions“ auf *Read and write permissions*
   stellen und *Allow GitHub Actions to create and approve pull requests* aktivieren
   (nötig für den Profil-Intake-Bot).
5. `impressum.html`, `datenschutz.html` und die Kontakt-E-Mail in `join.js`
   (`CONTACT_EMAIL`) sind auf Simon Munzert eingetragen — bei Bedarf anpassen.
6. Optional: Profilfotos nach `data/img/` legen und im jeweiligen Profil
   (`"photo": "data/img/name.jpg"`) referenzieren.

## Lokal entwickeln

```bash
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen (nötig, weil `experts.json` per `fetch` geladen wird).

Datenbank von Hand ändern? Danach validieren:

```bash
pip install jsonschema && python3 scripts/validate.py
```

## Lizenz

Code: MIT (siehe [LICENSE](LICENSE)). Profildaten: von den gelisteten Personen selbst
eingetragen und freigegeben; jede Person kann Änderung/Löschung verlangen.
