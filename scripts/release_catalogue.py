#!/usr/bin/env python3
"""Publish a checked catalogue, or an explicitly dated, checked snapshot.

Current and fallback builds never share output. A failed current build cannot
supply any files to the release. Research checkouts are read-only inputs.
"""
from datetime import datetime, timezone
from html import escape
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent
REPOSITORY = "https://github.com/1337isnot1337/solved-conjectures"
STYLE = '''<style id="catalogue-snapshot-style">
.catalogue-snapshot{margin:20px 0 28px;padding:16px 20px;border:1px solid #b9c6bc;border-left:4px solid #665584;background:#eee9f4;color:#24352f;font:inherit;line-height:1.6}
.catalogue-snapshot p{margin:4px 0}.catalogue-snapshot a{color:#3e365d;text-decoration:underline}.catalogue-snapshot strong{font-weight:650}
@media(max-width:480px){.catalogue-snapshot{padding:12px 14px}}
</style>'''


def utc(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Provenance dates must include a timezone")
    return parsed.astimezone(timezone.utc)


def readable(value):
    return utc(value).strftime("%d %b %Y, %H:%M UTC")


def identity(source):
    def git(*args):
        return subprocess.check_output(["git", "-C", str(source), *args], text=True).strip()
    commit = git("rev-parse", "HEAD")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Source must identify an immutable commit")
    if git("status", "--porcelain"):
        raise ValueError("Catalogue source checkout must be clean")
    return {"commit": commit, "date": git("show", "-s", "--format=%cI", "HEAD")}


def run_builder(source, output, base_url):
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    subprocess.run([sys.executable, str(HERE.parent / "tests/catalogue_compat_test.py"), str(source)], check=True, env=env)
    subprocess.run([sys.executable, str(HERE / "build_catalogue.py"), "--source", str(source),
                    "--output", str(output), "--base-url", base_url], check=True, env=env)
    check_output(source, output)


def check_output(source, output):
    subprocess.run([sys.executable, str(source / "scripts/check_site.py"), str(output)],
                   check=True, env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"))


def verify_manifest(output, expected):
    manifest = json.loads((output / "build-manifest.json").read_text())
    if (manifest.get("source_repository") != REPOSITORY
            or manifest.get("source_commit") != expected["commit"]
            or manifest.get("source_dirty") is not False
            or utc(manifest["source_commit_date"]) != utc(expected["date"])):
        raise ValueError("Built catalogue provenance does not match its clean source")
    return manifest


def snapshot_metadata(text, item, date):
    old_title, old_description = item["title"], item["description"]
    title = f"Snapshot {utc(date).strftime('%d %b %Y')} · {old_title}"
    description = f"Catalogue snapshot ({readable(date)}). {old_description}"
    replacements = [(f"<title>{escape(old_title)}</title>", f"<title>{escape(title)}</title>")]
    for attribute, key, old, new in [("name", "description", old_description, description),
                                   ("property", "og:title", old_title, title),
                                   ("property", "og:description", old_description, description),
                                   ("name", "twitter:title", old_title, title),
                                   ("name", "twitter:description", old_description, description)]:
        replacements.append((f'<meta {attribute}="{key}" content="{escape(old)}">',
                             f'<meta {attribute}="{key}" content="{escape(new)}">'))
    for old, new in replacements:
        if text.count(old) != 1:
            raise ValueError("Unrecognized snapshot metadata")
        text = text.replace(old, new, 1)
    scripts = list(re.finditer(r'<script type="application/ld\+json">(.*?)</script>', text, re.S))
    if len(scripts) != 1:
        raise ValueError("Unrecognized snapshot structured metadata")
    match = scripts[0]
    structured = json.loads(match.group(1))
    if structured.get("name") != old_title or structured.get("description") != old_description:
        raise ValueError("Structured metadata does not match the source manifest")
    structured.update(name=title, description=description)
    encoded = json.dumps(structured, ensure_ascii=False).replace("<", "\\u003c")
    text = text[:match.start(1)] + encoded + text[match.end(1):]
    item.update(title=title, description=description)
    return text


def annotate_snapshot(output, provenance, config):
    rendered = provenance["rendered_source"]
    sha = rendered["commit"]
    notice = (f'<aside class="catalogue-snapshot" aria-label="Catalogue snapshot">'
              f'<strong>Catalogue snapshot · {escape(readable(rendered["date"]))}</strong>'
              f'<p>Source <a href="{REPOSITORY}/commit/{sha}">{sha[:7]}</a>, '
              f'<a href="{escape(config["validation_run"], quote=True)}">validated {escape(readable(config["validated_at"]))}</a>.</p>'
              '<p>Newer repository changes are not included because catalogue validation has not passed. '
              f'<a href="{REPOSITORY}">See the current repository</a>.</p></aside>')
    manifest_path = output / "build-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest_pages = {item["file"]: item for item in manifest["pages"]}
    pages = list(output.rglob("*.html"))
    if not pages:
        raise ValueError("Snapshot has no HTML pages")
    if set(manifest_pages) != {page.relative_to(output).as_posix() for page in pages}:
        raise ValueError("Snapshot manifest does not cover every HTML page")
    for page in pages:
        text = page.read_text()
        if text.count('<main id="main" class="container">') != 1 or text.count('</head>') != 1:
            raise ValueError(f"Unrecognized catalogue shell: {page}")
        if 'class="catalogue-snapshot"' in text:
            raise ValueError("Snapshot must start from an unannotated build")
        text = snapshot_metadata(text, manifest_pages[page.relative_to(output).as_posix()], rendered["date"])
        # Generated source/code links refer to this snapshot, not a moving main.
        for kind in ("blob", "tree"):
            text = text.replace(f'href="{REPOSITORY}/{kind}/main/', f'href="{REPOSITORY}/{kind}/{sha}/')
        text = text.replace('</head>', STYLE + '\n</head>', 1)
        text = text.replace('<main id="main" class="container">', '<main id="main" class="container">\n' + notice, 1)
        page.write_text(text)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return len(pages)


def verify_annotation(output, provenance):
    snapshot = provenance["mode"] == "snapshot"
    for page in output.rglob("*.html"):
        text = page.read_text()
        if text.count('class="catalogue-snapshot"') != int(snapshot):
            raise ValueError(f"Incorrect snapshot notice coverage: {page}")
        if snapshot:
            date = provenance["rendered_source"]["date"]
            description_prefix = escape(f"Catalogue snapshot ({readable(date)}).")
            title_prefix = escape(f"Snapshot {utc(date).strftime('%d %b %Y')} · ")
            for prefix in (f'<title>{title_prefix}',
                           f'<meta name="description" content="{description_prefix}',
                           f'<meta property="og:title" content="{title_prefix}',
                           f'<meta property="og:description" content="{description_prefix}',
                           f'<meta name="twitter:title" content="{title_prefix}',
                           f'<meta name="twitter:description" content="{description_prefix}'):
                if text.count(prefix) != 1:
                    raise ValueError(f"Missing dated snapshot metadata: {page}")
            if provenance["rendered_source"]["commit"] not in text:
                raise ValueError(f"Missing snapshot revision: {page}")
            if any(f'href="{REPOSITORY}/{kind}/main/' in text for kind in ("blob", "tree")):
                raise ValueError(f"Snapshot source link points at moving main: {page}")



def add_breadcrumb_schema(output):
    """Attach BreadcrumbList to the existing page JSON-LD without changing its type.

    The upstream catalogue already renders visible breadcrumb navigation. This
    pass mirrors those links rather than generating fictitious hierarchy.
    """
    manifest = json.loads((output / "build-manifest.json").read_text())
    pages = {item["file"]: item for item in manifest["pages"]}
    # Release-unit-test fixtures deliberately contain only minimal metadata.
    if "index.html" not in pages or "canonical" not in pages["index.html"]:
        return 0
    home = pages["index.html"]["canonical"]
    count = 0
    for filename, item in pages.items():
        if filename == "index.html" or item.get("noindex") or not item.get("canonical"):
            continue
        url = item["canonical"]
        crumbs = [("All results", home)]
        parts = filename.split("/")
        if len(parts) >= 4 and parts[0] == "results" and parts[-1] == "index.html":
            result_file = "/".join(parts[:2]) + "/index.html"
            parent = pages.get(result_file)
            if parent and parent.get("canonical") and parent["canonical"] != url:
                crumbs.append((parent["title"].split(" | ")[0], parent["canonical"]))
        crumbs.append((item["title"].split(" | ")[0], url))
        script = re.search(r'<script type="application/ld\+json">(.*?)</script>', (output / filename).read_text(), re.S)
        if script is None:
            raise ValueError(f"Missing JSON-LD in {filename}")
        page_path = output / filename
        text = page_path.read_text()
        structured = json.loads(script.group(1))
        if not isinstance(structured, dict) or structured.get("url") != url:
            raise ValueError(f"Unexpected structured page metadata in {filename}")
        structured["breadcrumb"] = {
            "@type": "BreadcrumbList",
            "@id": url + "#breadcrumbs",
            "itemListElement": [
                {"@type": "ListItem", "position": i, "name": name, "item": link}
                for i, (name, link) in enumerate(crumbs, 1)
            ],
        }
        encoded = json.dumps(structured, ensure_ascii=False).replace("<", "\\u003c")
        page_path.write_text(text[:script.start(1)] + encoded + text[script.end(1):])
        count += 1
    return count


def apply_reader_skin(output):
    """Style generated pages without rewriting research text or source assets."""
    css = (HERE.parent / "site/research-reader.css").read_bytes()
    if not css.strip():
        raise ValueError("Website reader stylesheet is empty")
    digest = hashlib.sha256(css).hexdigest()
    name = f"reader-{digest[:16]}.css"
    pages = list(output.rglob("*.html"))
    manifest = json.loads((output / "build-manifest.json").read_text())
    if not pages or {item["file"] for item in manifest["pages"]} != {page.relative_to(output).as_posix() for page in pages}:
        raise ValueError("Reader styling requires complete manifest coverage")
    links = []
    for page in pages:
        text = page.read_text()
        originals = re.findall(r'<link rel="stylesheet" href="(/(?:[^"?#]+/)?assets/site\.css)">', text)
        if len(originals) != 1 or text.count('</head>') != 1 or 'id="website-reader-style"' in text:
            raise ValueError(f"Unrecognized reader stylesheet shell: {page}")
        href = originals[0][:-len("site.css")] + name
        link = f'<link id="website-reader-style" rel="stylesheet" href="{escape(href, quote=True)}">'
        # Append only a stylesheet in the head. The entire body is unchanged.
        page.write_text(text.replace('</head>', link + '\n</head>', 1))
        links.append(link)
    asset = output / "assets" / name
    asset.parent.mkdir(exist_ok=True)
    if asset.exists():
        raise ValueError("Reader asset unexpectedly overlaps source output")
    asset.write_bytes(css)
    for page, link in zip(pages, links):
        if page.read_text().count(link) != 1:
            raise ValueError(f"Missing reader stylesheet: {page}")
    if hashlib.sha256(asset.read_bytes()).hexdigest() != digest:
        raise ValueError("Reader stylesheet copy changed")
    return {"asset": f"assets/{name}", "sha256": digest, "pages": len(pages)}


def add_portfolio_home(output):
    nav = '<nav class="site-nav" aria-label="Main navigation">'
    home = '<a class="portfolio-home" href="https://itsdavis.com/">Home</a>'
    for page in output.rglob("*.html"):
        text = page.read_text()
        if text.count(nav) != 1 or home in text:
            raise ValueError(f"Unrecognized catalogue navigation: {page}")
        page.write_text(text.replace(nav, f"{nav}\n      {home}", 1))


def promote(staged, output):
    # Only replace generated catalogue output, never an unrelated directory.
    if output.is_symlink():
        raise ValueError("Output cannot be a symlink")
    if output.exists():
        marker = output / "build-manifest.json"
        if not marker.exists() or json.loads(marker.read_text()).get("source_repository") != REPOSITORY:
            raise ValueError("Existing output is not a generated catalogue")
        backup = staged.parent / "previous-output"
        output.rename(backup)
        try:
            staged.rename(output)
        except BaseException:
            backup.rename(output)
            raise
        shutil.rmtree(backup)
    else:
        staged.rename(output)


def release(current, fallback, output, base_url, config, run_url=None):
    if output.is_symlink():
        raise ValueError("Output cannot be a symlink")
    current, fallback, output = current.resolve(), fallback.resolve(), output.resolve()
    if any(output.is_relative_to(source) or source.is_relative_to(output) for source in (current, fallback)):
        raise ValueError("Output and research checkouts must be separate")
    attempted = identity(current)
    fallback_identity = identity(fallback)
    if (config.get("source_repository") != REPOSITORY
            or fallback_identity["commit"] != config["source_commit"]
            or utc(fallback_identity["date"]) != utc(config["source_commit_date"])):
        raise ValueError("Fallback checkout does not match the reviewed snapshot")
    if not config["validation_run"].startswith("https://github.com/1337isnot1337/1337isnot1337.github.io/actions/runs/"):
        raise ValueError("Snapshot must identify its successful website validation")
    if utc(config["validated_at"]) < utc(config["source_commit_date"]):
        raise ValueError("Snapshot validation cannot precede its source commit")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".catalogue-release-", dir=output.parent) as temporary:
        staging = Path(temporary)
        selected, selected_source, rendered = staging / "current", current, attempted
        mode = "current"
        try:
            run_builder(current, selected, base_url)
            verify_manifest(selected, attempted)
        except subprocess.CalledProcessError:
            print("::warning::Current catalogue sync did not pass; validating the explicitly dated snapshot.")
            mode = "snapshot"
            selected, selected_source, rendered = staging / "snapshot", fallback, fallback_identity
            run_builder(fallback, selected, base_url)
            verify_manifest(selected, rendered)
        provenance = {"mode": mode, "source_repository": REPOSITORY,
                      "attempted_source": attempted, "rendered_source": rendered,
                      "current_catalogue_validation": "passed" if mode == "current" else "failed",
                      "rendered_catalogue_validation": "passed", "website_run": run_url,
                      "checked_at": datetime.now(timezone.utc).isoformat()}
        if mode == "snapshot":
            provenance["snapshot_previous_validation"] = {"at": config["validated_at"], "run": config["validation_run"]}
            provenance["notice_pages"] = annotate_snapshot(selected, provenance, config)
        verify_annotation(selected, provenance)
        provenance["website_reader"] = apply_reader_skin(selected)
        add_portfolio_home(selected)
        provenance["breadcrumb_schema_pages"] = add_breadcrumb_schema(selected)
        (selected / "catalogue-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
        check_output(selected_source, selected)
        verify_manifest(selected, rendered)
        if identity(current) != attempted or identity(fallback) != fallback_identity:
            raise ValueError("Research input changed during the build")
        promote(selected, output)
    print(json.dumps(provenance, indent=2))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
            summary.write(f"## Catalogue: {mode}\n\n")
            summary.write(f"Attempted source: [{attempted['commit'][:7]}]({REPOSITORY}/commit/{attempted['commit']}).\n\n")
            summary.write(f"Rendered source: [{rendered['commit'][:7]}]({REPOSITORY}/commit/{rendered['commit']}), {readable(rendered['date'])}.\n\n")
            if mode == "snapshot":
                summary.write("Current catalogue validation did not pass. Every published catalogue page and its search/social metadata identify the dated snapshot. The snapshot was independently rebuilt and checked; no failed current-build files are included.\n")
    return provenance


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--fallback-source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--config", type=Path, default=HERE / "catalogue_snapshot.json")
    args = parser.parse_args()
    run_url = None
    if os.environ.get("GITHUB_RUN_ID"):
        run_url = f'https://github.com/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'
    release(args.source, args.fallback_source, args.output, args.base_url,
            json.loads(args.config.read_text()), run_url)


if __name__ == "__main__":
    main()
