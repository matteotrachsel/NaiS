# -*- coding: utf-8 -*-
"""
Generiert src/data/zeigerpflanzen.ts aus _zeiger.tsv
(extrahiert aus der alphabetischen NaiS-Zeigerpflanzenliste, Anhang 2A).

Quelle: 00_Mini_NaiS_vollstandig_2026.pdf, Seiten 25-31.
Bei Änderungen an der Quelle: _zeiger.tsv neu extrahieren und dieses Skript erneut ausführen.
"""
import re, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TSV = os.path.join(HERE, "zeigerpflanzen_quelle.tsv")
OUT = os.path.join(ROOT, "src", "data", "zeigerpflanzen.ts")

STUFEN = ["collin", "submontan", "untermontan", "obermontan",
          "hochmontan", "subalpin", "obersubalpin"]


def parse_hoehen(text):
    s = " " + text.lower() + " "
    if "alle höhenstufen" in s or "alle hohenstufen" in s:
        return list(STUFEN)
    s = s.replace("colllin", "collin").replace("subalpine", "subalpin")
    repl = [("obersubalpin", "§6§"), ("subalpin", "§5§"),
            ("hochmontan", "§4§"), ("hoch-", "§4§"),
            ("obermontan", "§3§"), ("ober-", "§3§"),
            ("untermontan", "§2§"), ("unter-", "§2§"),
            ("submontan", "§1§"), ("sub-", "§1§"),
            ("collin", "§0§")]
    for a, b in repl:
        s = s.replace(a, b)
    idx = [int(m.group(1)) for m in re.finditer(r"§(\d)§", s)]
    if not idx:
        return []
    if "bis" in s:
        lo, hi = min(idx), max(idx)
        return [STUFEN[i] for i in range(lo, hi + 1)]
    return [STUFEN[i] for i in sorted(set(idx))]


def parse_eigenschaften(zeiger, detail):
    z = (zeiger + " " + detail).lower()
    eig = []

    def add(x):
        if x not in eig:
            eig.append(x)

    # Säure-/Basenachse
    if "basisch" in z or "basich" in z:
        add("basisch")
    if "sauer" in z or "säurez" in z or "saurez" in z:
        add("sauer")
    if "mittel" in z:
        add("neutral")
    # Feuchteachse — Mehrwort-Token zuerst
    work = z
    if "wechselfeucht" in work or "wechseltrocken" in work:
        add("wechselfeucht")
        work = work.replace("wechselfeucht", " ").replace("wechseltrocken", " ")
    if "luftfeucht" in work:
        add("luftfeucht")
        work = work.replace("luftfeucht", " ")
    if "nass" in work or "hochmoor" in work or "zwischenmoore" in work:
        add("nass")
    if "feucht" in work:
        add("feucht")
    if "frisch" in work:
        add("frisch")
    if "trocken" in work:
        add("trocken")
    # Nährstoffe
    if "nährstoffreich" in z or "naehrstoffreich" in z:
        add("naehrstoffreich")
    # weitere
    if "laurophyll" in z:
        add("waermeliebend")
    return eig


def make_id(latin, used):
    s = latin.lower()
    s = re.sub(r"\b(sl\.?|ssp\.?|sp\.?|und|var\.?)\b", " ", s)
    s = s.replace("‘", "").replace("’", "")
    s = re.sub(r"[^a-zàáâäãåéèêëíìîïóòôöõúùûüñç]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    # Umlaute vereinheitlichen für stabile IDs / ML-Klassennamen
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("é", "e"),
                 ("è", "e"), ("ê", "e"), ("á", "a"), ("à", "a"), ("â", "a")):
        s = s.replace(a, b)
    base = s or "art"
    cand = base
    i = 2
    while cand in used:
        cand = f"{base}_{i}"
        i += 1
    used.add(cand)
    return cand


def ts_str(x):
    return '"' + x.replace('\\', '\\\\').replace('"', '\\"') + '"'


def main():
    rows = []
    used = set()
    with open(TSV, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 4:
                continue
            lat, de, hoehe, zeiger = parts[0], parts[1], parts[2], parts[3]
            detail = parts[4] if len(parts) > 4 else ""
            lat = re.sub(r"\bund\b\s*$", "", lat).strip()
            if not lat or not de:
                continue
            eig = parse_eigenschaften(zeiger, detail)
            if not eig:
                continue
            nur_nadel = ("nadelwald" in (zeiger + " " + detail).lower())
            rows.append({
                "id": make_id(lat, used),
                "de": de.strip(),
                "lat": lat,
                "eig": eig,
                "hoehen": parse_hoehen(hoehe),
                "nadel": nur_nadel,
                "hinweis": detail.strip(),
            })

    rows.sort(key=lambda r: r["de"].lower())

    lines = []
    lines.append("import type { Zeigerpflanze } from '@/types/nais';")
    lines.append("")
    lines.append("/**")
    lines.append(" * Katalog der NaiS-Zeigerpflanzen.")
    lines.append(" *")
    lines.append(" * AUTOMATISCH GENERIERT aus der alphabetischen Zeigerpflanzenliste des")
    lines.append(" * NaiS-Ordners (Anhang 2A, «Bestimmen des Standortstyps»).")
    lines.append(" * Quelle: 00_Mini_NaiS_vollstandig_2026.pdf. Nicht von Hand editieren –")
    lines.append(" * stattdessen scripts/gen_zeigerpflanzen.py anpassen und neu ausführen.")
    lines.append(" *")
    lines.append(" * `id` entspricht dem (slugifizierten) lateinischen Namen und dient")
    lines.append(" * als Zuordnungsschlüssel (u. a. für die PlantNet-Erkennung).")
    lines.append(" */")
    lines.append("export const ZEIGERPFLANZEN: Zeigerpflanze[] = [")
    for r in rows:
        eig = "[" + ", ".join(ts_str(e) for e in r["eig"]) + "]"
        parts = [
            f"id: {ts_str(r['id'])}",
            f"nameDe: {ts_str(r['de'])}",
            f"nameLat: {ts_str(r['lat'])}",
            f"eigenschaften: {eig}",
        ]
        if r["hoehen"]:
            hoehen = "[" + ", ".join(ts_str(h) for h in r["hoehen"]) + "]"
            parts.append(f"hoehenstufen: {hoehen}")
        if r["nadel"]:
            parts.append("nurNadelwald: true")
        if r["hinweis"]:
            parts.append(f"hinweis: {ts_str(r['hinweis'])}")
        lines.append("  { " + ", ".join(parts) + " },")
    lines.append("];")
    lines.append("")
    lines.append("/** Schnellzugriff nach id. */")
    lines.append("export const ZEIGERPFLANZEN_BY_ID: Readonly<Record<string, Zeigerpflanze>> =")
    lines.append("  Object.fromEntries(ZEIGERPFLANZEN.map((p) => [p.id, p]));")
    lines.append("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"{len(rows)} Zeigerpflanzen -> {OUT}")


if __name__ == "__main__":
    main()
