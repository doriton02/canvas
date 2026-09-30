#!/usr/bin/env python3
"""Build the static site.

    python3 build.py            # build this site (config + src/ -> *.html here)
    python3 build.py template   # build the starter template in template/

A site directory holds:
    site.config.json   site-wide settings (name, colors, menu, footer, address, SNS)
    src/layout.html    shared <head>, header and footer
    src/cta.html       the "Contact" band inserted where a page writes {{CTA}}
    src/pages/*.html   one file per page: settings lines, a "---" line, then the body

Only the Python standard library is used.
"""
import datetime
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

ICONS = {
    "instagram": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    "x": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
    "threads": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16.5 11.2c-.3-3-2.1-4.6-4.7-4.6-2 0-3.5.9-4.2 2.4"/><path d="M9 14.6c0 1.4 1.2 2.4 2.9 2.3 2.4-.1 3.5-2 3.3-5.3-1.6-.4-6.2-.8-6.2 3z"/><path d="M19 8.5C17.7 4.9 15 3 12 3 7 3 4 6.5 4 12s3 9 8 9c3.8 0 6.8-2 7.4-5.3.4-2.3-.8-4.3-3-5.2"/></svg>',
    "link": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
}


def lookup(cfg, dotted):
    """Resolve "company.address" style keys against the config."""
    value = cfg
    for part in dotted.split("."):
        value = value[part]
    return value


def fill(text, cfg, extra=None):
    """Replace {{key}} / {{a.b}} placeholders. Unknown keys are left untouched."""
    values = extra or {}

    def repl(m):
        key = m.group(1).strip()
        if key in values:
            return str(values[key])
        try:
            return str(lookup(cfg, key))
        except (KeyError, TypeError):
            return m.group(0)

    return re.sub(r"\{\{\s*([\w.]+)\s*\}\}", repl, text)


def parse_page(path):
    raw = path.read_text(encoding="utf-8")
    head, body = raw.split("\n---\n", 1)
    meta = {}
    for line in head.strip().splitlines():
        if line.strip():
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    return meta, body


def page_hero(meta):
    crumbs = ['<li><a href="index.html">Home</a></li>']
    for item in meta.get("breadcrumb", "").split(">"):
        item = item.strip()
        if not item:
            continue
        if "|" in item:
            name, href = (s.strip() for s in item.split("|", 1))
            crumbs.append(f'<li><a href="{href}">{name}</a></li>')
        else:
            crumbs.append(f'<li aria-current="page">{item}</li>')
    accent = meta.get("hero_accent", "var(--blue)")
    return f'''<section class="page-hero" style="--accent: {accent}">
  <div class="wrap">
    <h1 class="page-hero__title reveal">{meta["hero_en"]}</h1>
    <p class="page-hero__sub reveal" data-delay="1">{meta.get("hero_jp", "")}</p>
    <nav class="breadcrumb" aria-label="パンくずリスト"><ol>{"".join(crumbs)}</ol></nav>
  </div>
</section>

'''


def nav_html(cfg):
    items = []
    for n in cfg["nav"]:
        cls = ' class="btn"' if n.get("button") else ""
        items.append(f'        <li><a{cls} href="{n["href"]}" data-nav="{n.get("key", "")}">{n["label"]}</a></li>')
    return "\n".join(items)


def footer_nav_html(cfg):
    groups = []
    for g in cfg["footer_nav"]:
        links = "\n".join(f'            <li><a href="{l["href"]}">{l["label"]}</a></li>' for l in g["links"])
        groups.append(f'''        <div>
          <h2>{g["title"]}</h2>
          <ul>
{links}
          </ul>
        </div>''')
    return "\n".join(groups)


def sns_html(cfg):
    if not cfg.get("sns"):
        return ""
    links = "\n".join(
        f'          <a href="{s["url"]}" target="_blank" rel="noopener">{ICONS.get(s.get("type"), ICONS["link"])}{s["label"]}</a>'
        for s in cfg["sns"]
    )
    return f'        <div class="sns">\n{links}\n        </div>'


def color_css(cfg):
    colors = cfg.get("colors", {})
    if not colors:
        return ""
    rules = " ".join(f"--{k}: {v};" for k, v in colors.items())
    return f"<style>:root {{ {rules} }}</style>"


def build(site_dir):
    cfg = json.loads((site_dir / "site.config.json").read_text(encoding="utf-8"))
    src = site_dir / "src"
    layout = (src / "layout.html").read_text(encoding="utf-8")
    cta = (src / "cta.html").read_text(encoding="utf-8")
    year = datetime.date.today().year

    shared = {
        "nav": nav_html(cfg),
        "footer_nav": footer_nav_html(cfg),
        "sns": sns_html(cfg),
        "color_css": color_css(cfg),
        "copyright": cfg["brand"]["copyright"].replace("{year}", f'<span data-year>{year}</span>'),
        "tel_link": re.sub(r"\D", "", cfg["company"]["tel"]),
        "theme_color": cfg.get("colors", {}).get("canvas", "#f5f1e8"),
    }

    # A template/sub-site reuses the root stylesheet and script.
    if site_dir != ROOT:
        for sub in ("css", "js"):
            dest = site_dir / "assets" / sub
            dest.mkdir(parents=True, exist_ok=True)
            for f in (ROOT / "assets" / sub).iterdir():
                shutil.copy2(f, dest / f.name)

    count = 0
    for path in sorted((src / "pages").glob("*.html")):
        meta, body = parse_page(path)
        meta = {k: fill(v, cfg, shared) for k, v in meta.items()}
        name = path.name
        title = meta.get("full_title") or f'{meta["title"]} | {cfg["site_name"]}'
        url = cfg["base_url"] + ("" if name == "index.html" else name)

        if "hero_en" in meta:
            body = page_hero(meta) + body.lstrip()
        body = body.replace("{{CTA}}", cta.strip())

        page_vals = dict(shared)
        page_vals.update({
            "title": html.escape(title, quote=True),
            "description": html.escape(meta.get("desc", ""), quote=True),
            "url": url,
            "og_type": "website" if name == "index.html" else "article",
            "section": meta.get("section", ""),
            "body": fill(body.strip(), cfg, shared),
        })
        out = fill(layout, cfg, page_vals)
        (site_dir / name).write_text(out, encoding="utf-8")
        count += 1
    print(f"built {count} pages in {site_dir.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    target = ROOT / (sys.argv[1] if len(sys.argv) > 1 else ".")
    build(target.resolve())
