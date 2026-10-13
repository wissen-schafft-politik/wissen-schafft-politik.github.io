#!/usr/bin/env python3
"""Erzeugt assets/maps.js: zwei statische SVG-Grundkarten (Welt + DACH)
aus einem lokalen Natural-Earth-GeoJSON (public domain), plus die
Projektionsparameter, mit denen karte.js Standorte als Punkte platziert.

Plattkarte (equirechteckig): x = (lon - lon0) * kx, y = (lat0 - lat) * ky.
Keine Drittserver zur Laufzeit — die Karten liegen vollständig im Repo.

Aufruf: python3 scripts/build_maps.py <welt-110m.geo.json> [<laender-50m.geojson>]
Das optionale zweite Argument (höher aufgelöst, z. B. Natural Earth 50m
mit Property ADM0_A3) wird für die DACH-Karte verwendet.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DACH = {"DEU", "AUT", "CHE"}
# Nachbarn als Kontext auf der DACH-Karte
DACH_CONTEXT = {"FRA", "ITA", "NLD", "BEL", "LUX", "POL", "CZE", "SVK",
                "HUN", "SVN", "HRV", "DNK", "GBR", "LIE"}


def rings(geom):
    if geom["type"] == "Polygon":
        yield from geom["coordinates"]
    elif geom["type"] == "MultiPolygon":
        for poly in geom["coordinates"]:
            yield from poly


def project(lon, lat, p):
    return (lon - p["lon0"]) * p["kx"], (p["lat0"] - lat) * p["ky"]


def feature_path(geom, p, min_px=4.0):
    """SVG-Pfad eines Features; winzige Inseln (<min_px Kantenlänge) entfallen."""
    parts = []
    for ring in rings(geom):
        pts = [project(lon, lat, p) for lon, lat in ring]
        xs = [x for x, _ in pts]
        ys = [y for _, y in pts]
        if (max(xs) - min(xs)) < min_px and (max(ys) - min(ys)) < min_px:
            continue
        # Punkte ausdünnen: nur übernehmen, wenn >0.8px vom letzten entfernt
        kept = [pts[0]]
        for pt in pts[1:]:
            if abs(pt[0] - kept[-1][0]) + abs(pt[1] - kept[-1][1]) > 0.8:
                kept.append(pt)
        if len(kept) < 3:
            continue
        parts.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in kept) + "Z")
    return "".join(parts)


def build(features, p, classify, key=None, min_px=4.0):
    key = key or (lambda f: f.get("id"))
    out = []
    for f in features:
        cls = classify(key(f))
        if cls is None:
            continue
        d = feature_path(f["geometry"], p, min_px=min_px)
        if d:
            out.append(f'<path class="{cls}" d="{d}"/>')
    return "\n".join(out)


def fid(f):
    return f.get("id") or f.get("properties", {}).get("ADM0_A3")


def main():
    src = json.load(open(sys.argv[1], encoding="utf-8"))
    features = src["features"]
    dach_features = features
    if len(sys.argv) > 2:
        dach_features = json.load(open(sys.argv[2], encoding="utf-8"))["features"]

    # ── Weltkarte: 1000px breit, Breitengrade 84°N bis 56°S ──
    k = 1000 / 360
    world = {"lon0": -180, "lat0": 84, "kx": k, "ky": k,
             "w": 1000, "h": round((84 + 56) * k, 1)}
    world_svg = build(features, world, lambda cid: "land", key=fid)

    # ── DACH-Karte: 4.6°–18.4°O, 45.0°–55.8°N ──
    import math
    ky = 620 / (55.8 - 45.0)
    dach = {"lon0": 4.6, "lat0": 55.8, "kx": ky * math.cos(math.radians(50.4)),
            "ky": ky}
    dach["w"] = round((18.4 - 4.6) * dach["kx"], 1)
    dach["h"] = 620
    def classify_dach(cid):
        if cid in DACH:
            return "land land--dach"
        if cid in DACH_CONTEXT:
            return "land land--context"
        return None
    dach_svg = build(dach_features, dach, classify_dach, key=fid, min_px=2.0)

    js = ("/* Generiert von scripts/build_maps.py — nicht von Hand editieren.\n"
          "   Quelle: Natural Earth (public domain) via world.geo.json. */\n"
          "window.PSW_MAPS = " + json.dumps({
              "world": {**world, "svg": world_svg},
              "dach": {**dach, "svg": dach_svg},
          }, ensure_ascii=False) + ";\n")
    out = ROOT / "assets" / "maps.js"
    out.write_text(js, encoding="utf-8")
    print(f"{out} geschrieben ({len(js) // 1024} KB) — "
          f"Welt {world['w']}x{world['h']}, DACH {dach['w']}x{dach['h']}")


if __name__ == "__main__":
    main()
