"""Regression tests for the research notes navigation index."""
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest

HERE = Path(__file__).resolve().parents[1] / "scripts/build_research_notes_index.py"
spec = importlib.util.spec_from_file_location("build_research_notes_index", HERE)
notes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notes)


class ResearchNotesIndexTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name) / "published"
        self.source.mkdir()
        self.entries = []

    def add(self, route, title, *, noindex=False, canonical=None, lastmod="2026-11-19T08:10:00Z"):
        file = route + "index.html"
        f = self.source / file
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text("<html><head><title>Test</title></head><body></body></html>")
        record = dict(route=route, file=file, title=title,
                      canonical=canonical or notes.SITE + "/solved-conjectures/" + route,
                      source=route.rstrip("/") + ".md", lastmod=lastmod, noindex=noindex)
        self.entries.append(record)
        return record

    def manifest(self):
        return {"base_url": notes.SITE + "/solved-conjectures/",
                "pages": self.entries + [
                    {"route": "results/example/", "file": "results/example/index.html",
                     "title": "A result", "canonical": notes.SITE + "/solved-conjectures/results/example/"}
                ]}

    def test_nested_notes_and_noindex_filter(self):
        self.add("docs/five-speed-candidates/", "A finite search | Solved conjectures")
        self.add("docs/verification/receipt/", "A verification record | Solved conjectures")
        self.add("docs/not-public/", "Excluded page | Solved conjectures", noindex=True)
        listed = notes.note_entries(self.manifest(), self.source)
        self.assertEqual({x["title"] for x in listed}, {"A finite search", "A verification record"})
        self.assertEqual({x["kind"] for x in listed}, {"candidate", "verification"})
        rendered = notes.render(listed)
        self.assertEqual(rendered.count('<h1>'), 1)
        self.assertIn('href="https://1337isnot1337.github.io/solved-conjectures/docs/five-speed-candidates/"', rendered)
        self.assertNotIn("Excluded page", rendered)
        self.assertIn('2026-11-19', rendered)
        self.assertEqual(rendered.count('<script type="application/ld+json">'), 1)
        data = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', rendered, re.S).group(1))
        self.assertEqual(data["@graph"][0]["@type"], "CollectionPage")
        self.assertEqual(data["@graph"][0]["url"], notes.INDEX_URL)

    def test_escapes_untrusted_titles_and_source_names(self):
        self.add("docs/a-candidate/", "<script>alert(1)</script> | Solved conjectures")
        listed = notes.note_entries(self.manifest(), self.source)
        html = notes.render(listed)
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", html)
        self.assertNotIn("<script>alert(1)</script>", html)

    def test_rejects_wrong_origin_and_missing_document(self):
        self.add("docs/alpha/", "Example", canonical="https://example.org/fake/")
        with self.assertRaises(ValueError):
            notes.note_entries(self.manifest(), self.source)
        self.entries[0]["canonical"] = notes.SITE + "/solved-conjectures/docs/alpha/"
        (self.source / "docs/alpha/index.html").unlink()
        with self.assertRaises(ValueError):
            notes.note_entries(self.manifest(), self.source)

    def test_rejects_duplicate_document_routes(self):
        self.add("docs/alpha/", "A")
        self.entries.append(dict(self.entries[0]))
        with self.assertRaises(ValueError):
            notes.note_entries(self.manifest(), self.source)

    def test_unknown_page_types_are_not_included(self):
        self.add("docs/alpha/", "Alpha")
        listed = notes.note_entries(self.manifest(), self.source)
        self.assertEqual(len(listed), 1)
        self.assertTrue(all(x["url"].startswith(notes.CATALOGUE_PREFIX) for x in listed))


if __name__ == "__main__":
    unittest.main()
