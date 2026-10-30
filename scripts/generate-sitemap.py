#!/usr/bin/env python3
"""Gera sitemap.xml a partir das páginas HTML publicáveis da raiz."""
from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://bibliaonline.vps11710.panel.icontainer.work"
EXCLUDE = {"404.html"}
urls = []
for page in sorted(ROOT.glob("*.html")):
    if page.name in EXCLUDE:
        continue
    path = "" if page.name == "index.html" else page.name
    priority = "1.0" if page.name == "index.html" else ("0.3" if page.name in {"privacidade.html", "termos.html"} else "0.7")
    urls.append((f"{BASE_URL}/{path}", priority))
today = date.today().isoformat()
lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, priority in urls:
    lines += ["  <url>", f"    <loc>{escape(loc)}</loc>", f"    <lastmod>{today}</lastmod>", f"    <priority>{priority}</priority>", "  </url>"]
lines.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Sitemap gerado com {len(urls)} páginas.")
