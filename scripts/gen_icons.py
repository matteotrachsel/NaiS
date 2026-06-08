# -*- coding: utf-8 -*-
"""Erzeugt die PWA-/Apple-Icons im NaiS-Stil (schwarzes Feld, 2x2-Marke).

Ausgabe: public/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "icons")

INK = (26, 26, 26)      # #1a1a1a
RED = (216, 35, 42)     # #d8232a
GREY = (63, 63, 63)     # #3f3f3f


def make(size: int, mark_ratio: float, path: str):
    img = Image.new("RGB", (size, size), INK)
    d = ImageDraw.Draw(img)
    # 2x2-Marke zentriert
    mark = int(size * mark_ratio)
    gap = max(2, int(mark * 0.06))
    cell = (mark - gap) // 2
    x0 = (size - mark) // 2
    y0 = (size - mark) // 2
    colors = [[RED, GREY], [GREY, RED]]
    for r in range(2):
        for c in range(2):
            x = x0 + c * (cell + gap)
            y = y0 + r * (cell + gap)
            d.rectangle([x, y, x + cell, y + cell], fill=colors[r][c])
    img.save(path)
    print("->", os.path.relpath(path, ROOT))


os.makedirs(OUT, exist_ok=True)
make(192, 0.60, os.path.join(OUT, "icon-192.png"))
make(512, 0.60, os.path.join(OUT, "icon-512.png"))
# maskable: kleinere Marke im sicheren Mittelbereich (~80% safe zone)
make(512, 0.46, os.path.join(OUT, "icon-512-maskable.png"))
make(180, 0.60, os.path.join(OUT, "apple-touch-icon.png"))
