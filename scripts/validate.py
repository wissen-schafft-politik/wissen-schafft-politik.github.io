#!/usr/bin/env python3
"""Validiert data/experts.json gegen data/experts.schema.json.

Zusätzlich zu jsonschema: Duplikat-Checks für id und E-Mail sowie ein
Drift-Check, dass die Themen-Taxonomie in topics.js, Schema-Enum,
issue_to_profile.py und dem Issue-Template übereinstimmt.
"""
import json
import re
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "data" / "experts.json").read_text(encoding="utf-8"))
schema = json.loads((ROOT / "data" / "experts.schema.json").read_text(encoding="utf-8"))

errors = []

# Taxonomie-Drift-Check über alle vier Quellen
topics_js = re.findall(r"name:\s*'([^']+)'", (ROOT / "topics.js").read_text(encoding="utf-8"))
schema_enum = schema["$defs"]["expert"]["properties"]["topics"]["items"]["enum"]
sys.path.insert(0, str(ROOT / "scripts"))
from issue_to_profile import TOPICS as parser_topics  # noqa: E402
template = (ROOT / ".github" / "ISSUE_TEMPLATE" / "profil.yml").read_text(encoding="utf-8")
for name, source in [(topics_js, "topics.js"), (parser_topics, "issue_to_profile.py")]:
    if list(name) != list(schema_enum):
        errors.append(f"Themen-Taxonomie in {source} weicht vom Schema-Enum ab.")
missing_in_template = [t for t in schema_enum if t not in template]
if missing_in_template:
    errors.append(f"Themen fehlen im Issue-Template profil.yml: {missing_in_template}")

# experts.js (Script-Fallback) muss experts.json spiegeln
js_file = ROOT / "data" / "experts.js"
if not js_file.exists():
    errors.append("data/experts.js fehlt (Script-Fallback; aus experts.json erzeugen).")
else:
    js_src = js_file.read_text(encoding="utf-8").strip()
    js_json = js_src.removeprefix("window.PSW_EXPERTS = ").removesuffix(";")
    if json.loads(js_json) != data:
        errors.append("data/experts.js ist nicht synchron mit experts.json "
                      "(scripts/issue_to_profile.py: write_experts_js).")
for err in Draft202012Validator(schema).iter_errors(data):
    path = " → ".join(str(p) for p in err.absolute_path) or "(root)"
    errors.append(f"{path}: {err.message}")

seen_ids, seen_mails = set(), set()
for e in data.get("experts", []):
    if e["id"] in seen_ids:
        errors.append(f"Doppelte id: {e['id']}")
    if e["email"].lower() in seen_mails:
        errors.append(f"Doppelte E-Mail: {e['email']}")
    seen_ids.add(e["id"])
    seen_mails.add(e["email"].lower())

if errors:
    print(f"❌ {len(errors)} Validierungsfehler in data/experts.json:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print(f"✅ data/experts.json ist gültig ({len(data.get('experts', []))} Profile).")
