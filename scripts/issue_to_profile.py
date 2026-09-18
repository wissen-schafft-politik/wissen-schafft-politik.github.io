#!/usr/bin/env python3
"""Wandelt ein per Issue-Formular (profil.yml) eingereichtes Profil in einen
Eintrag in data/experts.json um.

Aufruf (durch GitHub Action):
    python scripts/issue_to_profile.py issue_body.md

Liest den Issue-Body (Markdown, wie ihn GitHub-Issue-Formulare rendern:
"### Feldlabel\n\nWert"), validiert die Angaben und schreibt den Eintrag
nach data/experts.json (neu oder Update anhand der E-Mail-Adresse bzw. id).
Gibt bei Validierungsfehlern eine Fehlermeldung auf stderr aus und endet
mit Exit-Code 1 — die Action postet die Meldung dann als Issue-Kommentar.
"""
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = REPO_ROOT / "data" / "experts.json"

TOPICS = [
    "Wahlen & Wahlverhalten",
    "Parteien & Parteienwettbewerb",
    "Öffentliche Meinung & Umfragen",
    "Politische Kommunikation",
    "Digitale Medien & Desinformation",
    "Künstliche Intelligenz & Digitalpolitik",
    "Demokratie & Autokratisierung",
    "Extremismus & Radikalisierung",
    "Protest & Soziale Bewegungen",
    "Politische Beteiligung & Repräsentation",
    "Geschlecht, Gleichstellung & Diversität",
    "Migration & Integration",
    "Europäische Union",
    "Internationale Beziehungen & Diplomatie",
    "Krieg, Konflikt & Sicherheit",
    "Entwicklungspolitik & Globaler Süden",
    "Regierung, Koalitionen & Parlamente",
    "Föderalismus & Landespolitik",
    "Lokal- & Kommunalpolitik",
    "Verwaltung & Staatsmodernisierung",
    "Recht, Justiz & Verfassung",
    "Interessengruppen & Lobbyismus",
    "Wirtschafts- & Finanzpolitik",
    "Sozialpolitik & Wohlfahrtsstaat",
    "Gesundheitspolitik",
    "Bildungs- & Wissenschaftspolitik",
    "Klima-, Umwelt- & Energiepolitik",
    "Politische Theorie & Ideengeschichte",
    "Vergleichende Politikwissenschaft",
    "Methoden, Daten & Prognosen",
]

# Issue-Form-Label -> internes Feld
LABELS = {
    "Name": "name",
    "Position": "position",
    "Institution": "institution",
    "Ort (optional)": "ort",
    "Interviewsprachen": "sprachen",
    "Themenfelder (1–6, durch Komma getrennt)": "themen",
    "Kurzbeschreibung (max. 300 Zeichen)": "kurzbio",
    "Selbstbeschreibung (max. 1500 Zeichen)": "bio",
    "E-Mail für Presseanfragen (wird öffentlich angezeigt)": "email",
    "Telefon (optional, wird öffentlich angezeigt)": "telefon",
    "Pressestelle (optional)": "pressestelle",
    "Website (optional)": "website",
    "Google-Scholar-Profil (optional)": "scholar",
    "ORCID (optional)": "orcid",
    "Social-Media-Profile (optional, eine URL pro Zeile)": "social",
    "Ausgewählte Publikationen (optional, max. 8)": "publikationen",
    "Medienbeiträge (optional, max. 8)": "medien",
    "Profilfoto (optional)": "foto",
    "Bildrechte (nur bei Foto erforderlich)": "bildrechte",
}

# Nur GitHub-eigene Attachment-Hosts sind als Fotoquelle zulässig
PHOTO_URL_RE = re.compile(
    r"https://(?:github\.com/user-attachments/assets/[\w-]+"
    r"|[\w.-]*githubusercontent\.com/[^\s)\"'>\]]+)"
)
PHOTO_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
PHOTO_MAX_BYTES = 8 * 1024 * 1024

EMPTY = {"", "_No response_", "None", "n/a", "N/A", "-"}


def parse_issue_body(body: str) -> dict:
    """Zerlegt den von GitHub gerenderten Issue-Form-Body in Label->Wert."""
    fields = {}
    current = None
    lines = []
    for line in body.splitlines():
        m = re.match(r"^### (.+?)\s*$", line)
        if m:
            if current is not None:
                fields[current] = "\n".join(lines).strip()
            current = m.group(1).strip()
            lines = []
        elif current is not None:
            lines.append(line)
    if current is not None:
        fields[current] = "\n".join(lines).strip()

    out = {}
    for label, key in LABELS.items():
        v = fields.get(label, "").strip()
        out[key] = "" if v in EMPTY else v
    return out


def slugify(name: str) -> str:
    s = re.sub(r"^(Prof\.|Dr\.|PD|Jun\.-Prof\.)\s*", "", name, flags=re.I)
    s = re.sub(r"\b(Prof|Dr|PD)\.?\s+", "", s)
    s = unicodedata.normalize("NFKD", s)
    s = s.replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = s.encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "profil"


def parse_link_lines(raw: str, what: str, errors: list) -> list:
    items = []
    for i, line in enumerate([l for l in raw.splitlines() if l.strip()], 1):
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            errors.append(
                f"{what}, Zeile {i}: erwartet `Titel | Outlet | Jahr | URL`, erhalten: `{line.strip()[:80]}`"
            )
            continue
        title, outlet, year, url = parts[0], parts[1], parts[2], parts[3]
        item = {"title": title, "outlet": outlet, "url": url}
        if year:
            try:
                item["year"] = int(re.sub(r"\D", "", year))
            except ValueError:
                errors.append(f"{what}, Zeile {i}: Jahr `{year}` ist keine Zahl.")
        if not re.match(r"^https?://", url):
            errors.append(f"{what}, Zeile {i}: URL `{url[:60]}` muss mit http(s):// beginnen.")
        items.append(item)
    if len(items) > 8:
        errors.append(f"{what}: maximal 8 Einträge (angegeben: {len(items)}).")
    return items[:8]


def classify_socials(raw: str) -> dict:
    socials = {}
    patterns = [
        ("bluesky", r"bsky\.app"),
        ("twitter", r"(twitter\.com|(^|\.|/)x\.com)"),
        ("mastodon", r"(mastodon\.|\.social/@|/@\w+$)"),
        ("linkedin", r"linkedin\.com"),
        ("github", r"github\.com"),
    ]
    for url in [l.strip() for l in raw.splitlines() if l.strip()]:
        for key, pat in patterns:
            if re.search(pat, url) and key not in socials:
                socials[key] = url
                break
    return socials


def build_expert(f: dict, errors: list) -> dict:
    themen = [t.strip() for t in f["themen"].split(",") if t.strip()]
    # Toleranz: Kurzform "und"/"u." und fehlende &-Zeichen normalisieren
    canon = {re.sub(r"\W+", "", t.lower()): t for t in TOPICS}
    resolved = []
    for t in themen:
        key = re.sub(r"\W+", "", t.lower().replace("und", ""))
        match = canon.get(re.sub(r"\W+", "", t.lower())) or canon.get(key)
        if match:
            if match not in resolved:
                resolved.append(match)
        else:
            errors.append(f"Unbekanntes Themenfeld: `{t}` (zulässige Werte siehe Formular).")
    if not 1 <= len(resolved) <= 6 and not errors:
        errors.append(f"Bitte 1–6 Themenfelder angeben (erkannt: {len(resolved)}).")

    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", f["email"]):
        errors.append(f"E-Mail-Adresse `{f['email']}` sieht ungültig aus.")
    if len(f["kurzbio"]) > 300:
        errors.append(f"Kurzbeschreibung zu lang ({len(f['kurzbio'])}/300 Zeichen).")
    if len(f["bio"]) > 1500:
        errors.append(f"Selbstbeschreibung zu lang ({len(f['bio'])}/1500 Zeichen).")
    if len(f["bio"]) < 50:
        errors.append("Selbstbeschreibung zu kurz (mindestens 50 Zeichen).")
    for key in ("website", "scholar", "orcid"):
        if f[key] and not re.match(r"^https?://", f[key]):
            errors.append(f"{key}: `{f[key][:60]}` muss mit http(s):// beginnen.")

    expert = {
        "id": slugify(f["name"]),
        "name": f["name"],
        "position": f["position"],
        "institution": f["institution"],
        "location": f["ort"] or None,
        "languages": [s.strip() for s in f["sprachen"].split(",") if s.strip()],
        "topics": resolved,
        "keywords": [],
        "shortBio": f["kurzbio"],
        "bio": f["bio"],
        "email": f["email"],
        "phone": f["telefon"] or None,
        "pressOffice": f["pressestelle"] or None,
        "website": f["website"] or None,
        "scholar": f["scholar"] or None,
        "orcid": f["orcid"] or None,
        "socials": classify_socials(f["social"]),
        "publications": parse_link_lines(f["publikationen"], "Publikationen", errors),
        "media": parse_link_lines(f["medien"], "Medienbeiträge", errors),
        "photo": None,
        "joined": date.today().strftime("%B %Y"),
    }
    return expert


def handle_photo(foto_raw: str, bildrechte_raw: str, expert: dict, errors: list):
    """Lädt ein per Issue angehängtes Profilfoto nach data/img/ herunter.

    Nur mit ausdrücklicher Bildrechte-Bestätigung (Nutzung ohne
    Urheber-/Quellenangabe); nur GitHub-Attachment-URLs, max. 8 MB,
    JPG/PNG/WebP.
    """
    m = PHOTO_URL_RE.search(foto_raw or "")
    if not m:
        if foto_raw.strip():
            errors.append(
                "Profilfoto: Es wurde Text angegeben, aber kein Bild-Anhang erkannt. "
                "Bitte das Bild direkt in das Feld ziehen (Drag & Drop)."
            )
        return
    if "[x]" not in (bildrechte_raw or "").lower():
        errors.append(
            "Profilfoto: Bitte die Bildrechte-Bestätigung ankreuzen — das Bild muss "
            "ohne Urheber-/Quellenangabe nutzbar sein. Alternativ das Foto-Feld leeren."
        )
        return
    url = m.group(0)
    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": "wissen-schafft-politik-bot"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            ctype = resp.headers.get_content_type()
            ext = PHOTO_TYPES.get(ctype)
            if not ext:
                errors.append(f"Profilfoto: Dateityp `{ctype}` wird nicht unterstützt (JPG, PNG oder WebP).")
                return
            data = resp.read(PHOTO_MAX_BYTES + 1)
            if len(data) > PHOTO_MAX_BYTES:
                errors.append("Profilfoto: Datei ist größer als 8 MB — bitte verkleinern.")
                return
    except Exception as e:  # noqa: BLE001 — Fehlermeldung geht als Issue-Kommentar zurück
        errors.append(f"Profilfoto: Download fehlgeschlagen ({e}). Bitte erneut anhängen.")
        return
    img_dir = REPO_ROOT / "data" / "img"
    img_dir.mkdir(parents=True, exist_ok=True)
    for old in img_dir.glob(f"{expert['id']}.*"):
        old.unlink()
    (img_dir / f"{expert['id']}{ext}").write_bytes(data)
    expert["photo"] = f"data/img/{expert['id']}{ext}"


GERMAN_MONTHS = {
    "January": "Januar", "February": "Februar", "March": "März", "April": "April",
    "May": "Mai", "June": "Juni", "July": "Juli", "August": "August",
    "September": "September", "October": "Oktober", "November": "November",
    "December": "Dezember",
}


def main() -> int:
    body = Path(sys.argv[1]).read_text(encoding="utf-8")
    fields = parse_issue_body(body)

    errors = []
    for key, label in [("name", "Name"), ("position", "Position"),
                       ("institution", "Institution"), ("themen", "Themenfelder"),
                       ("kurzbio", "Kurzbeschreibung"), ("bio", "Selbstbeschreibung"),
                       ("email", "E-Mail")]:
        if not fields.get(key):
            errors.append(f"Pflichtfeld fehlt: {label}")

    expert = build_expert(fields, errors) if not errors else None

    if expert is not None and not errors:
        handle_photo(fields.get("foto", ""), fields.get("bildrechte", ""), expert, errors)

    if errors:
        print("Der Eintrag konnte nicht automatisch verarbeitet werden:\n", file=sys.stderr)
        for e in errors:
            print(f"- {e}", file=sys.stderr)
        print("\nBitte das Issue bearbeiten (Button „Edit“) — der Bot versucht es dann erneut.",
              file=sys.stderr)
        return 1

    for en, de in GERMAN_MONTHS.items():
        expert["joined"] = expert["joined"].replace(en, de)

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    experts = data["experts"]

    # Update, falls E-Mail oder id bereits existiert; sonst neu.
    existing = next((i for i, e in enumerate(experts)
                     if e["email"].lower() == expert["email"].lower()
                     or e["id"] == expert["id"]), None)
    if existing is not None:
        expert["joined"] = experts[existing].get("joined", expert["joined"])
        if not expert.get("photo"):
            expert["photo"] = experts[existing].get("photo")
        expert["keywords"] = experts[existing].get("keywords", [])
        experts[existing] = expert
        action = "aktualisiert"
    else:
        experts.append(expert)
        action = "neu angelegt"

    experts.sort(key=lambda e: e["name"])
    data["updated"] = date.today().isoformat()
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    print(f"Profil {expert['id']} {action}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
