#!/usr/bin/env python3
"""Run the upstream reader with a strict, website-owned status-format adapter.

No research files are changed. Mathematical scope and the independent status
report checks remain entirely with the upstream builder.
"""
from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
import re
import sys

MARKER = re.compile(r"(?im)^(?:\*\*Lean status:\*\*|Lean status:)[ \t]*(.*)$")
# This is format compatibility, not a classifier for arbitrary research prose.
# Any new qualified declaration requires explicit review and a regression test.
QUALIFIED_ABELIAN_STATUS = (
    "Lean status: complete for the stated abelian voltage-cover theorem and its "
    "sharpness example. The general minimum-degree-three conjecture remains "
    "outside this result."
)
PREVIEW = "https://itsdavis.com/assets/conjectures-preview.jpg"
PREVIEW_ALT = "Solved conjectures, with illustrated playing cards beside the title."
PLAIN_STATUSES = {
    ("Lean status: " + token + ending).casefold(): canonical
    for token, canonical in [("full", "full"), ("complete", "full"),
                             ("partial", "partial"), ("none", "none")]
    for ending in ("", ".")
}
PLAIN_STATUSES[QUALIFIED_ABELIAN_STATUS.casefold()] = "full"


def compatible_status(text, upstream_parser):
    markers = list(MARKER.finditer(text))
    if len(markers) > 1:
        raise ValueError("Multiple Lean status declarations require source reconciliation")
    if not markers or markers[0].group().startswith("**"):
        return upstream_parser(text)
    marker = markers[0]
    paragraph = re.split(r"\r?\n[ \t]*\r?\n", text[marker.start():], maxsplit=1)[0]
    normalized_paragraph = " ".join(paragraph.split()).casefold()
    if normalized_paragraph not in PLAIN_STATUSES:
        raise ValueError("Unknown or qualified Lean status requires explicit source review")
    canonical = PLAIN_STATUSES[normalized_paragraph]
    declaration = marker.group(1).strip()
    token = re.match(r"\w+", declaration)
    tail = declaration[token.end():]
    normalized = (text[:marker.start()] + "**Lean status:** " + canonical
                  + tail + text[marker.end():])
    return upstream_parser(normalized)


def load_builder(source):
    script = Path(source).resolve() / "scripts" / "build_site.py"
    spec = importlib.util.spec_from_file_location("upstream_catalogue_builder", script)
    if spec is None or spec.loader is None:
        raise ValueError(f"Cannot load catalogue builder: {script}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    previous = sys.dont_write_bytecode
    sys.dont_write_bytecode = True
    try:
        spec.loader.exec_module(module)
    finally:
        sys.dont_write_bytecode = previous
    return module


def install_adapter(module):
    upstream_parser = module.landing_lean_status
    module.landing_lean_status = lambda text: compatible_status(text, upstream_parser)
    upstream_head = module.Builder.head

    def collection_head(builder, title, description, route, *, noindex=False):
        head = upstream_head(builder, title, description, route, noindex=noindex)
        if noindex or 'property="og:image"' in head:
            return head
        head = head.replace('content="index,follow"', 'content="index,follow,max-image-preview:large"')
        head = head.replace('name="twitter:card" content="summary"',
                            'name="twitter:card" content="summary_large_image"')
        return head + f'''
<meta property="og:image" content="{PREVIEW}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{PREVIEW_ALT}">
<meta name="twitter:image" content="{PREVIEW}">
<meta name="twitter:image:alt" content="{PREVIEW_ALT}">'''

    module.Builder.head = collection_head


def main():
    parser = argparse.ArgumentParser(description=__doc__, add_help=False)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args, remaining = parser.parse_known_args()
    if args.output.resolve().is_relative_to(args.source.resolve()):
        raise ValueError("Catalogue output must be outside the read-only research checkout")
    module = load_builder(args.source)
    install_adapter(module)
    # The upstream CLI keeps ownership of output, URL and worker validation.
    sys.argv = [str(args.source / "scripts" / "build_site.py"), "--output", str(args.output), *remaining]
    module.main()


if __name__ == "__main__":
    main()
