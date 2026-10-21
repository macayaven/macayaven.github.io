# /// script
# requires-python = ">=3.11"
# dependencies = ["markdown==3.7"]
# ///
"""Render the approved vLLM GB10 note (Markdown) into a static page in the site's style.

Usage (from the repo root): uv run tools/build_note.py <source.md> notes/<slug>/index.html
The article text comes only from the source file; this script adds layout, never words.
The date comes from the italic byline ("21 October 2026 · ..."); notes/<slug>/og.png, if present, becomes the link-preview image.
"""
import re
import sys
from datetime import datetime
from html import escape
from pathlib import Path

import markdown

SITE = "https://carloscrespomacaya.com/"

src, out = Path(sys.argv[1]), Path(sys.argv[2])
SLUG = out.parent.as_posix().strip("/") + "/"
text = src.read_text(encoding="utf-8")

title = re.match(r"# (.+)\n", text).group(1).strip()
published = datetime.strptime(re.search(r"^\*(\d{1,2} \w+ \d{4}) ·", text, re.M).group(1), "%d %B %Y").date().isoformat()
og_image = out.parent / "og.png"
body_md = text.split("\n", 1)[1]
paras = [p for p in body_md.split("\n\n") if p.strip() and not p.lstrip().startswith(("*", "#"))]
# Meta description: the article's own first two sentences of the opening paragraph and the next one.
description = paras[0].strip() + " " + paras[1].strip().split(". ")[0] + "."

html = markdown.markdown(body_md, extensions=["tables", "fenced_code"], output_format="html")

# Byline and disclosure: same words, styled as meta lines.
html = re.sub(r"^<p><em>(.+?)</em></p>", r'<p class="meta">\1</p>', html, count=1)
html = re.sub(r"<p><em>(I ran every container.+?)</em></p>\s*$", r'<p class="disclosure">\1</p>', html, flags=re.S)
# Tables scroll inside the column on narrow screens instead of widening the page.
html = html.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
# External links open in a new tab, as on the homepage.
html = re.sub(r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', html)

og_tags = (
    f'  <meta property="og:image" content="{SITE}{SLUG}og.png">\n'
    '  <meta property="og:image:width" content="1200">\n'
    '  <meta property="og:image:height" content="627">\n'
    f'  <meta property="og:image:alt" content="{escape(title)}">\n'
    '  <meta name="twitter:card" content="summary_large_image">'
    if og_image.exists() else '  <meta name="twitter:card" content="summary">'
)

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)} · Carlos Crespo Macaya</title>
  <meta name="description" content="{escape(description)}">
  <meta name="author" content="Carlos Crespo Macaya">
  <link rel="canonical" href="{SITE}{SLUG}">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(description)}">
  <meta property="og:url" content="{SITE}{SLUG}">
  <meta property="og:type" content="article">
  <meta property="article:published_time" content="{published}">
{og_tags}
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
  :root {{ --accent: #5fb98f; --bg: #0e0d0b; --panel: #161512; --fg: #f2efe9; --text: #dcd8d0; --muted: #9a958c; --line: rgba(255,255,255,0.09); }}
  * {{ box-sizing: border-box; }}
  html {{ scroll-behavior: smooth; }}
  body {{ margin: 0; background: var(--bg); color: var(--text); font-family: 'IBM Plex Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }}
  ::selection {{ background: #c9a24a; color: #0e0d0b; }}
  :focus-visible {{ outline: 2px solid var(--accent); outline-offset: 4px; }}
  a {{ color: inherit; text-decoration: none; }}
  nav {{ position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px clamp(16px, 5vw, 64px); background: color-mix(in srgb, var(--bg) 82%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }}
  .brand {{ font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: 0.04em; color: var(--fg); display: flex; align-items: center; gap: 9px; }}
  .brand .dot {{ width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }}
  .brand .muted {{ color: var(--muted); }}
  .navlinks {{ display: flex; align-items: center; gap: clamp(14px, 3vw, 30px); font-family: 'JetBrains Mono', monospace; font-size: 12.5px; letter-spacing: 0.03em; color: var(--muted); }}
  .navlinks a:hover {{ color: var(--fg); }}
  .navlinks .pill {{ color: var(--fg); border: 1px solid rgba(255,255,255,0.14); padding: 7px 14px; border-radius: 999px; }}
  article {{ max-width: 740px; margin: 0 auto; padding: clamp(48px, 9vh, 96px) clamp(16px, 5vw, 64px) clamp(48px, 8vh, 80px); font-size: 17px; line-height: 1.72; }}
  .eyebrow {{ font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 0.05em; color: var(--accent); margin: 0 0 18px; }}
  h1 {{ font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: clamp(30px, 5.2vw, 46px); line-height: 1.12; letter-spacing: -0.01em; color: var(--fg); margin: 0 0 16px; overflow-wrap: anywhere; }}
  .meta {{ font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: var(--muted); margin: 0 0 40px; padding-bottom: 28px; border-bottom: 1px solid var(--line); }}
  h2 {{ font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: clamp(22px, 3vw, 26px); line-height: 1.25; color: var(--fg); margin: 2.4em 0 0.7em; }}
  p {{ margin: 0 0 1.1em; }}
  strong {{ color: var(--fg); font-weight: 600; }}
  article a {{ color: var(--fg); border-bottom: 1px solid color-mix(in srgb, var(--accent) 55%, transparent); transition: border-color 0.2s; }}
  article a:hover {{ border-bottom-color: var(--accent); }}
  ul {{ margin: 0 0 1.2em; padding-left: 1.2em; }}
  li {{ margin: 0 0 0.55em; }}
  li::marker {{ color: var(--accent); }}
  code {{ font-family: 'JetBrains Mono', monospace; font-size: 0.84em; background: var(--panel); border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; color: var(--fg); overflow-wrap: anywhere; }}
  pre {{ background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; margin: 0 0 1.3em; overflow-x: auto; line-height: 1.55; }}
  pre code {{ background: none; border: 0; padding: 0; font-size: 13px; white-space: pre; overflow-wrap: normal; }}
  .table-wrap {{ overflow-x: auto; margin: 0 0 1.4em; border: 1px solid var(--line); border-radius: 10px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 15px; font-variant-numeric: tabular-nums; }}
  th, td {{ padding: 10px 14px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }}
  th {{ font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 500; letter-spacing: 0.03em; color: var(--muted); background: var(--panel); }}
  tbody tr:last-child td {{ border-bottom: 0; }}
  td:first-child {{ color: var(--fg); }}
  .disclosure {{ margin-top: 2.6em; padding-top: 22px; border-top: 1px solid var(--line); font-size: 14.5px; color: var(--muted); }}
  .back {{ display: inline-block; margin-top: 28px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: var(--muted); border: 0 !important; }}
  .back:hover {{ color: var(--fg); }}
  footer {{ border-top: 1px solid var(--line); padding: 32px clamp(16px, 5vw, 64px); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--muted); }}
  footer .ok {{ color: #c9a24a; }}
  @media (max-width: 600px) {{
    [data-navtext] {{ display: none; }}
    article {{ font-size: 16px; }}
    th, td {{ padding: 9px 11px; }}
  }}
  </style>
</head>
<body>
  <nav>
    <a class="brand" href="/"><span class="dot"></span>carlos<span class="muted">.crespo</span></a>
    <div class="navlinks">
      <a href="/#work" data-navtext="1">work</a>
      <a href="/#path" data-navtext="1">path</a>
      <a class="pill" href="/#contact">get in touch</a>
    </div>
  </nav>

  <article>
    <p class="eyebrow">NOTES · INFERENCE</p>
    <h1>{escape(title)}</h1>
{html}
    <a class="back" href="/">← carloscrespomacaya.com</a>
  </article>

  <footer>
    <span>© 2026 Carlos Crespo Macaya</span>
    <span>status: <span class="ok">everything is fine (definitely)</span></span>
  </footer>
</body>
</html>
"""
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding="utf-8")
print(f"wrote {out} ({len(page)} bytes); description: {description}")
