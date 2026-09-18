#!/usr/bin/env python3
"""Validiert data/experts.json gegen data/experts.schema.json.

Zusätzlich zu jsonschema: Duplikat-Checks für id und E-Mail.
"""
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "data" / "experts.json").read_text(encoding="utf-8"))
schema = json.loads((ROOT / "data" / "experts.schema.json").read_text(encoding="utf-8"))

errors = []
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
