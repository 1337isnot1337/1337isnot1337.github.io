#!/usr/bin/env python3
"""Build a useful navigation index from the already validated research catalogue.

Reads the published catalogue's manifest. Does not rewrite, rank, or endorse
mathematical claims, and does not modify the upstream generated pages.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

SITE = "https://itsdavis.com"
INDEX_URL = SITE + "/research-notes/"
CATALOGUE_PREFIX = SITE + "/solved-conjectures/docs/"
TITLE = "Mathematical research notes and verification records | Cinna Davis"
DESCRIPTION = (
    "Browse published mathematical working notes, candidate calculations, "
    "verification records and Lean formalization notes from the solved-conjectures catalogue."
)
SECTIONS = [
    ("Verification and formalization", "verification"),
    ("Candidate investigations", "candidate"),
    ("Other research notes", "other"),
]
ROUTE = re.compile(r"^docs/(?:[a-z0-9][a-z0-9-]*/)+$")


def note_entries(manifest: dict, catalogue_dir: Path) -> list[dict]:
    """Use only actual, indexable, public, uniquely routed documentation pages."""
    entries = []
    urls = set()
    for page in manifest["pages"]:
        route = page.get("route", "")
        if not ROUTE.fullmatch(route) or page.get("noindex"):
            continue
        url = page.get("canonical", "")
        if url != SITE + "/solved-conjectures/" + route:
            raise ValueError(f"Invalid note URL for route {route!r}: {url!r}")
        if page.get("file") != route + "index.html":
            raise ValueError(f"Inconsistent page path for {route!r}")
        if url in urls:
            raise ValueError(f"Duplicate note URL: {url}")
        if not (catalogue_dir / page["file"]).is_file():
            raise ValueError(f"Missing built page: {page['file']}")
        urls.add(url)
        name = page.get("title", "").removesuffix(" | Solved conjectures").strip()
        if not name or len(name) > 200:
            raise ValueError(f"Missing or excessive note title: {route}")
        date = page.get("lastmod", "")[:10]
        if date:
            try:
                datetime.strptime(date, "%Y-%m-%d")
            except ValueError as err:
                raise ValueError(f"Invalid lastmod for {route}") from err
        tag = (
            "verification"
            if any(term in route for term in ("verification", "formalization", "lean-status", "receipts"))
            else "candidate"
            if "candidate" in route or "search" in route
            else "other"
        )
        entries.append(dict(url=url, title=name, source=page.get("source", ""),
                            lastmod=date, kind=tag))
    return sorted(entries, key=lambda item: item["title"].casefold())


def render(entries: list[dict]) -> str:
    categorized = defaultdict(list)
    for item in entries:
        categorized[item["kind"]].append(item)
    sections = []
    for heading, key in SECTIONS:
        group = categorized.get(key, [])
        if not group:
            continue
        lis = []
        for entry in group:
            title = escape(entry["title"])
            url = escape(entry["url"], quote=True)
            source = escape(entry["source"])
            when = (f'<time datetime="{entry["lastmod"]}">{entry["lastmod"]}</time>'
                    if entry["lastmod"] else "")
            lis.append(f'<li><a href="{url}">{title}</a>'
                       f'<span class="note-details">{source} {when}</span></li>')
        sections.append(f'<section class="notes-section"><h2>{heading} '
                        f'<small>{len(group)}</small></h2><ul class="notes-list">{"".join(lis)}</ul></section>')
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "CollectionPage", "@id": INDEX_URL + "#page",
             "url": INDEX_URL, "name": TITLE, "description": DESCRIPTION,
             "isPartOf": {"@id": SITE + "/#website"},
             "breadcrumb": {"@id": INDEX_URL + "#breadcrumbs"}},
            {"@type": "BreadcrumbList", "@id": INDEX_URL + "#breadcrumbs",
             "itemListElement": [
                 {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                 {"@type": "ListItem", "position": 2, "name": "Projects", "item": SITE + "/projects/"},
                 {"@type": "ListItem", "position": 3, "name": "Research notes", "item": INDEX_URL}
             ]},
        ],
    }
    structured = json.dumps(graph, ensure_ascii=False).replace("<", "\\u003c")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#fffbf6">
  <title>{escape(TITLE)}</title>
  <meta name="description" content="{escape(DESCRIPTION, quote=True)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="{INDEX_URL}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{INDEX_URL}">
  <meta property="og:title" content="{escape(TITLE, quote=True)}">
  <meta property="og:description" content="{escape(DESCRIPTION, quote=True)}">
  <meta property="og:image" content="{SITE}/assets/conjectures-preview.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Solved conjectures, with illustrated playing cards beside the title.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{SITE}/assets/conjectures-preview.jpg">
  <meta name="twitter:image:alt" content="Solved conjectures, with illustrated playing cards beside the title.">
  <link rel="icon" href="/assets/prints/favicon.png">
  <link rel="stylesheet" href="/pixelation.css?v=3">
  <link rel="stylesheet" href="/shelf.css?v=26">
  <link rel="stylesheet" href="/projects/project-pages.css?v=2">
  <link rel="stylesheet" href="/research-notes/notes.css?v=3">
  <link rel="stylesheet" href="/desk-extras.css?v=9">
  <script defer src="/project-paper.js?v=2"></script>
  <script type="application/ld+json">{structured}</script>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="mast"><div class="page-width mast-inner">
  <a class="byline" href="/">Cinna Davis</a>
  <nav aria-label="Main navigation"><a href="/">Shelf</a><a href="/projects/">Projects</a><a href="/about/">About</a></nav>
</div></header>
<main id="content" class="project-page">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/projects/">Projects</a><span aria-hidden="true">/</span><span aria-current="page">Research notes</span></nav>
  <section class="collection-intro">
    <p class="eyebrow">Research archive</p>
    <h1>Working notes and checks.</h1>
    <p class="lead">A navigable index of {len(entries)} published research notes, candidate calculations, and verification records from the mathematical conjecture catalogue.</p>
    <p>These are unrefereed working documents. Candidate calculations and partial formalizations do not imply a solved conjecture. The <a href="/solved-conjectures/">main catalogue</a> identifies the precise scope of each recorded result.</p>
  </section>
  <div class="notes-sections">{"".join(sections)}</div>
  <section class="related"><h2>Related work</h2>
    <div class="related-links"><a href="/solved-conjectures/">Results and proofs</a><a href="/solved-conjectures/docs/lean-status/">Lean verification status</a><a href="/projects/">All projects</a></div>
  </section>
</main>
<footer class="project-footer"><div class="page-width"><p>Cinna Davis · Software, mathematics &amp; research</p><nav aria-label="Elsewhere"><a href="https://github.com/1337isnot1337/solved-conjectures">Research repository</a><a href="/">Project shelf</a></nav></div></footer>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalogue", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads((args.catalogue / "build-manifest.json").read_text())
    if manifest.get("base_url") != SITE + "/solved-conjectures/":
        raise ValueError("Unexpected catalogue origin")
    entries = note_entries(manifest, args.catalogue)
    if not entries:
        raise ValueError("Published catalogue contains no indexed documentation")
    html = render(entries)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html)
    print(f"Generated notes index with {len(entries)} published documents")


if __name__ == "__main__":
    main()
