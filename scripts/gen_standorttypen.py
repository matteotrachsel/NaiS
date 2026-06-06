# -*- coding: utf-8 -*-
"""
Generiert src/data/standorttypen.ts: den vollständigen NaiS-Katalog der
Waldstandortstypen.

Quellen (aus dem NaiS-Ordner, Anhang 2A):
  - Standortstyp-Übersicht (Inhaltsverzeichnis): Nr. + Name
  - Kap. 10 «Kurzbeschreibung der Standortstypen»: Gliederung 10.1-10.16
    liefert die Höhenstufe je Typengruppe.

Höhenstufe  -> aus der Kapitelgruppe (10.x), in der der Typ beschrieben ist.
Baumarten   -> aus dem (systematischen) NaiS-Typnamen («…-Xwald»-Stamm).
Ökologie    -> aus den Zeigerpflanzen-Stichworten im Typnamen.

Input: scripts/standorttypen_quelle.txt (PDF-Seiten 86-181, mit ===== PAGE n =====).
"""
import re, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, "standorttypen_quelle.txt")
OUT = os.path.join(ROOT, "src", "data", "standorttypen.ts")

STUFEN_ORDER = ["collin", "submontan", "untermontan", "obermontan",
                "hochmontan", "subalpin", "obersubalpin"]

# Kap. 10.x  ->  Höhenstufe(n)
SECTION_STUFE = {
    "10.1": ["obersubalpin"],
    "10.2": ["subalpin"],
    "10.3": ["hochmontan", "subalpin"],
    "10.4": ["hochmontan"],
    "10.5": ["hochmontan", "subalpin"],
    "10.6": ["obermontan"],
    "10.7": ["obermontan"],
    "10.8": ["untermontan"],
    "10.9": ["untermontan"],
    "10.10": ["submontan"],
    "10.11": ["submontan", "untermontan"],
    "10.12": ["collin"],
    "10.13": ["collin"],
    "10.14": ["collin", "submontan", "untermontan"],
    "10.15": ["subalpin", "obersubalpin"],
    "10.16": [],  # Sonderwaldstandorte -> Fallback über Name
}

# Baumart-Konstante (Name in baumarten.ts)  ->  Morphem im Typnamen.
# Reihenfolge wichtig: Spezifischeres zuerst.
TREE_MORPHEMES = [
    ("Bergfoehre", ["Bergföhren", "Bergföhre"]),
    ("Waldfoehre", ["Föhren", "Föhre"]),
    ("Arve", ["Arven", "Arve"]),
    ("Laerche", ["Lärchen", "Lärche"]),
    ("Fichte", ["Fichten", "Fichtenwald", "-Fi-", "Fichte"]),
    ("Tanne", ["Tannen", "Tannenwald", "Ta-", "Tanne"]),
    ("Hagebuche", ["Hagebuchen", "Hagebuche"]),
    ("Hopfenbuche", ["Hopfenbuchen", "Hopfenbuche"]),
    ("Buche", ["Buchen", "Buchenwald", "Buche"]),
    ("Flaumeiche", ["Flaumeichen", "Flaumeiche"]),
    ("Stieleiche", ["Eichen", "Eichenwald", "Eiche"]),
    ("Bergahorn", ["Ahorn"]),
    ("Bergulme", ["Ulmen", "Ulme"]),
    ("Winterlinde", ["Linden", "Linde"]),
    ("Kastanie", ["Kastanien", "Kastanie"]),
    ("Hagebuche", ["Hagebuchen"]),
    ("Schwarzerle", ["Schwarzerlen", "Schwarzerle", "Erlenbruch"]),
    ("Weisserle", ["Weisserlen", "Weisserle"]),
    ("Gruenerle", ["Grünerlen", "Grünerle"]),
    ("Birke", ["Birken", "Birke"]),
    ("Mehlbeere", ["Mehlbeer"]),
    ("Robinie", ["Robinien", "Robinie"]),
    ("Eibe", ["Eiben", "Eibe"]),
]

# Säure-/Basenstichworte im Typnamen
SAUER = ["Heidelbeer", "Preiselbeer", "Hainsimsen", "Waldsimsen", "Wollreitgras",
         "Alpenlattich", "Alpenrosen", "Alpenrose", "Rostblätt", "Peitschenmoos",
         "Besenheide", "Torfmoos", "Schneesimsen", "Ehrenpreis", "Wachtelweizen",
         "Drahtschmiele", "saurer", "Heidelbeere", "Hainsimsen-"]
BASISCH = ["Waldmeister", "Lungenkraut", "Platterbsen", "Bingelkraut", "Zahnwurz",
           "Aronstab", "Karbonat", "Kalk", "Blaugras", "Seggen", "Weissegge",
           "Bergsegge", "Erika", "Orchideen", "Steinrosen", "Steinmispel",
           "Zwergbuchs", "Linden-Buchen", "Kreuzdorn", "Kronenwicken", "Gamander",
           "Turmkressen", "Turinermeister", "Hopfenbuchen", "Immenblatt",
           "Lerchensporn", "Hirschzungen", "Alpendost", "Seifenkraut", "Hauhechel",
           "Purpurwaldmeister", "Blaustern", "Wacholder", "Strauchwicken",
           "Steinrosen-", "Kreuzlabkraut", "neutraler bis basischer", "Kron"]
NEUTRAL = ["Perlgras", "Waldschwingel", "Waldhirsen", "Waldgersten", "Goldregen",
           "Labkraut", "Mehlbeer", "Ahorn-Buchen", "Waldlabkraut", "mesophil",
           "Mesophil", "Mesophiler"]

NASS = ["Bruch", "Moorrand", "Moor", "Muldenwald", "Auenwald", "Sumpf",
        "Traubenkirschen-Eschen", "Birkenbruch", "Königsfarn"]
FEUCHT = ["Hochstauden", "Schachtelhalm", "Pestwurz", "Feuchter", "Feuchte",
          "Bach-", "Riesenschachtelhalm", "feucht", "Spierstaude"]
TROCKEN = ["Trockener", "Trockene", "Xero", "trocken", "Steinrosen", "Hauhechel",
           "Seifenkraut", "Orchideen", "Weissegge", "Bergsegge", "Flaumeichen",
           "Kronenwicken", "Kreuzdorn", "Gamander", "Turmkressen", "Felsen",
           "Blaugras", "Preiselbeer", "Besenheide", "Erika", "Niedrige"]
WECHSEL = ["Pfeifengras", "Wechselfeucht", "Buntreitgras", "Strandpfeifengras"]


def has(name, words):
    return any(w in name for w in words)


def parse_toc(text):
    """Findet TOC-Zeilen 'CODE Name Seite'."""
    entries = []
    seen = set()
    pat = re.compile(r"^(Rob|\(?\d[0-9A-Za-z*/().\-]*)\s+(.+?)\s+(\d{1,3})$")
    for line in text.splitlines():
        line = line.strip()
        m = pat.match(line)
        if not m:
            continue
        code, name, _page = m.group(1), m.group(2).strip(), m.group(3)
        if name.startswith(("Name", "Kurz")):
            continue
        if len(name) < 4:
            continue
        if code in seen:
            continue
        seen.add(code)
        entries.append((code, name))
    return entries


def find_sections(kurz):
    """Liefert Liste (sectionkey, start_index) in Reihenfolge."""
    secs = []
    for m in re.finditer(r"(?m)^10\.(\d+)\s", kurz):
        secs.append(("10." + m.group(1), m.start()))
    secs.sort(key=lambda s: s[1])
    return secs


def stufe_for_code(code, name, kurz, sections):
    """Höhenstufe via Kapitelgruppe, in der der Typ beschrieben wird."""
    firstword = re.split(r"\s", name)[0]
    pat = re.compile(r"(?<![\w\d])" + re.escape(code) + r"\s+" + re.escape(firstword))
    m = pat.search(kurz)
    if m:
        pos = m.start()
        sec = None
        for key, start in sections:
            if start <= pos:
                sec = key
            else:
                break
        if sec and SECTION_STUFE.get(sec):
            return list(SECTION_STUFE[sec]), sec
    return stufe_from_name(name), None


def stufe_from_name(name):
    """Fallback-Höhenstufe aus Baumkomposition / Stichworten."""
    if has(name, ["Arven", "Lärchen-Arven", "Arvenwald"]):
        return ["obersubalpin"]
    if has(name, ["Bergföhren", "Bergföhre"]):
        return ["subalpin", "obersubalpin"]
    if has(name, ["Alpenrose", "Alpenrosen", "Alpenlattich"]):
        return ["subalpin", "obersubalpin"]
    if "Fichtenwald" in name and "Tannen" not in name:
        return ["subalpin"]
    if has(name, ["Tannen-Fichten", "Fichten-Tannen"]):
        return ["hochmontan"]
    if "Tannen-Buchen" in name or "Tannenwald" in name:
        return ["obermontan"]
    if "Buchenwald" in name or "Buchen" in name:
        return ["submontan", "untermontan"]
    if has(name, ["Eichen", "Kastanien", "Hagebuchen", "Hopfenbuchen", "Flaumeichen", "Robinien"]):
        return ["collin", "submontan"]
    if "Eschen" in name or "Ahorn" in name:
        return ["submontan", "untermontan", "obermontan"]
    if "Föhren" in name:
        return ["collin", "submontan", "untermontan"]
    return ["submontan", "untermontan", "obermontan"]


def baumarten_from_name(name, stufen):
    found = []
    for const, morphs in TREE_MORPHEMES:
        for mo in morphs:
            if mo in name:
                if const not in found:
                    found.append(const)
                break
    # Eschen-/Ahorn-Sonderfälle ohne expliziten Baum-Stamm
    if not found:
        return [("Buche", "hauptbaumart")]
    # Letztes Morphem (näher an «…wald») ist Hauptbaumart; reihen nach Position
    pos = {}
    for const, morphs in TREE_MORPHEMES:
        for mo in morphs:
            i = name.rfind(mo)
            if i >= 0:
                pos[const] = max(pos.get(const, -1), i)
    found.sort(key=lambda c: pos.get(c, 0))  # aufsteigend: Prefix -> Hauptstamm
    out = []
    n = len(found)
    for idx, const in enumerate(found):
        # die letzten 1-2 (Hauptstamm + evt. erster Codominant) = Hauptbaumart
        eig = "hauptbaumart" if idx >= n - 2 else "nebenbaumart"
        out.append((const, eig))
    # Pionier in höheren Lagen ergänzen
    high = any(s in stufen for s in ("hochmontan", "subalpin", "obersubalpin"))
    consts = [c for c, _ in out]
    if high and any(c in consts for c in ("Fichte", "Tanne", "Arve", "Laerche", "Bergfoehre")):
        if "Vogelbeere" not in consts:
            out.append(("Vogelbeere", "pionier"))
    return out


def eig_from_name(name):
    eig = []
    # Säure-/Basenachse
    if has(name, SAUER):
        eig.append("sauer")
    elif has(name, BASISCH):
        eig.append("basisch")
    elif has(name, NEUTRAL):
        eig.append("neutral")
    elif "Eschen" in name or "Ahorn" in name:
        eig.append("basisch")  # Edellaub-/Eschenwälder meist basenreich
    # Feuchteachse (nur wenn klar definierend)
    if has(name, NASS):
        eig.append("nass")
    elif has(name, WECHSEL):
        eig.append("wechselfeucht")
    elif has(name, FEUCHT):
        eig.append("feucht")
    elif has(name, TROCKEN):
        eig.append("trocken")
    elif "Eschen" in name or "Ahorn" in name:
        eig.append("feucht")
    # Hochstauden -> nährstoffreich
    if "Hochstauden" in name and "naehrstoffreich" not in eig:
        eig.append("naehrstoffreich")
    # de-dupe, Reihenfolge erhalten
    seen, res = set(), []
    for e in eig:
        if e not in seen:
            seen.add(e); res.append(e)
    return res


def slug(name, code, used):
    s = (name + "_" + code).lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    s = re.sub(r"_+", "_", s)
    cand, i = s, 2
    while cand in used:
        cand = f"{s}_{i}"; i += 1
    used.add(cand)
    return cand


def ts(x):
    return '"' + x.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main():
    text = open(SRC, encoding="utf-8").read()
    marker = "10 Kurzbeschreibung der Standortstypen"
    cut = text.find(marker)
    toc_text = text[:cut] if cut > 0 else text
    kurz = text[cut:] if cut > 0 else text

    entries = parse_toc(toc_text)
    sections = find_sections(kurz)

    used_ids = set()
    used_consts = set()
    rows = []
    stats = {"with_section": 0, "fallback": 0}
    for code, name in entries:
        stufen, sec = stufe_for_code(code, name, kurz, sections)
        stats["with_section" if sec else "fallback"] += 1
        baum = baumarten_from_name(name, stufen)
        for c, _ in baum:
            used_consts.add(c)
        eig = eig_from_name(name)
        rows.append({
            "id": slug(name, code, used_ids),
            "name": name,
            "code": code,
            "stufen": stufen,
            "eig": eig,
            "baum": baum,
        })

    # nach erster Höhenstufe (hoch->tief) und Code sortieren für Lesbarkeit
    def sortkey(r):
        top = max((STUFEN_ORDER.index(s) for s in r["stufen"]), default=0)
        return (-top, r["code"])
    rows.sort(key=sortkey)

    lines = []
    lines.append("import type { Standortstyp } from '@/types/nais';")
    lines.append("import {")
    for c in sorted(used_consts):
        lines.append(f"  {c},")
    lines.append("} from './baumarten';")
    lines.append("")
    lines.append("/**")
    lines.append(" * Vollständiger NaiS-Katalog der Waldstandortstypen.")
    lines.append(" *")
    lines.append(" * AUTOMATISCH GENERIERT aus der Standortstyp-Übersicht und den")
    lines.append(" * Kurzbeschreibungen (Kap. 10) des NaiS-Ordners (Anhang 2A).")
    lines.append(" * Quelle: 00_Mini_NaiS_vollstandig_2026.pdf. Nicht von Hand editieren –")
    lines.append(" * stattdessen scripts/gen_standorttypen.py anpassen und neu ausführen.")
    lines.append(" *")
    lines.append(" * Höhenstufe: aus der Kapitelgruppe (10.x); Baumarten und Ökologie:")
    lines.append(" * aus dem systematischen NaiS-Typnamen abgeleitet. `naisCode` ist die")
    lines.append(" * NaiS-Typnummer. Für Feinheiten ggf. einzelne Einträge nachschärfen.")
    lines.append(" */")
    lines.append("export const STANDORTTYPEN: Standortstyp[] = [")
    for r in rows:
        stufen = "[" + ", ".join(ts(s) for s in r["stufen"]) + "]"
        eig = "[" + ", ".join(ts(e) for e in r["eig"]) + "]"
        baum = ", ".join(f"{c}({ts(e)})" for c, e in r["baum"])
        lines.append("  {")
        lines.append(f"    id: {ts(r['id'])},")
        lines.append(f"    name: {ts(r['name'])},")
        lines.append(f"    naisCode: {ts(r['code'])},")
        lines.append(f"    hoehenstufen: {stufen},")
        lines.append(f"    erforderlicheEigenschaften: {eig},")
        lines.append(f"    baumarten: [{baum}],")
        lines.append("  },")
    lines.append("];")
    lines.append("")

    open(OUT, "w", encoding="utf-8").write("\n".join(lines))
    print(f"{len(rows)} Standortstypen -> {OUT}")
    print(f"  Höhenstufe via Kapitel: {stats['with_section']}, via Name-Fallback: {stats['fallback']}")


if __name__ == "__main__":
    main()
