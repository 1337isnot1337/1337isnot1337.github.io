"""Release boundary checks, independent of Pandoc and changing research data."""
import json
import contextlib
import io
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import release_catalogue as release


class CatalogueRelease(unittest.TestCase):
    def setUp(self):
        # Fixture failures must not create real workflow summaries or warnings.
        environment = patch.dict(os.environ, {k: v for k, v in os.environ.items() if k != 'GITHUB_STEP_SUMMARY'}, clear=True)
        environment.start(); self.addCleanup(environment.stop)
        silence = contextlib.redirect_stdout(io.StringIO())
        silence.__enter__(); self.addCleanup(silence.__exit__, None, None, None)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.current, self.fallback, self.output = root / 'current-source', root / 'fallback-source', root / 'published'
        self.current.mkdir(); self.fallback.mkdir()
        self.current_id = {"commit": "a" * 40, "date": "2026-11-19T12:00:00Z"}
        self.fallback_id = {"commit": "b" * 40, "date": "2026-11-19T11:00:00Z"}
        self.config = {"source_repository": release.REPOSITORY, "source_commit": "b" * 40,
                       "source_commit_date": self.fallback_id["date"], "validated_at": "2026-11-19T11:30:00Z",
                       "validation_run": "https://github.com/1337isnot1337/1337isnot1337.github.io/actions/runs/123"}
        self.fail_current = False
        self.fail_fallback = False
        self.calls = []
        self.ids = {self.current: self.current_id, self.fallback: self.fallback_id}
        for name, replacement in [("identity", lambda p: dict(self.ids[p])), ("run_builder", self.build), ("check_output", lambda *args: None)]:
            mocker = patch.object(release, name, replacement)
            mocker.start(); self.addCleanup(mocker.stop)

    def build(self, source, output, base):
        self.calls.append(source)
        output.mkdir()
        identity = self.ids[source]
        manifest = {"source_repository": release.REPOSITORY, "source_commit": identity["commit"],
                    "source_commit_date": identity["date"], "source_dirty": False,
                    "pages": [{"file": file, "title": "Test", "description": "Test description"} for file in ("index.html", "detail/index.html")]}
        (output / 'build-manifest.json').write_text(json.dumps(manifest))
        text = ('<!doctype html><html><head><title>Test</title>'
                '<link rel="stylesheet" href="/assets/site.css">'
                '<meta name="description" content="Test description">'
                '<meta property="og:title" content="Test">'
                '<meta property="og:description" content="Test description">'
                '<meta name="twitter:title" content="Test">'
                '<meta name="twitter:description" content="Test description">'
                '<script type="application/ld+json">{"name":"Test","description":"Test description"}</script></head><body>'
                '<main id="main" class="container"><h1>Partial result on an open problem</h1>'
                '<p>Lean: formalized stated result. The general conjecture remains open.</p>'
                f'<a href="{release.REPOSITORY}/blob/main/results/test/README.md">View source</a>'
                '</main></body></html>')
        (output / 'index.html').write_text(text)
        (output / 'detail').mkdir(); (output / 'detail/index.html').write_text(text)
        (output / 'search.json').write_text(json.dumps({"source": identity["commit"]}))
        if (source == self.current and self.fail_current) or (source == self.fallback and self.fail_fallback):
            (output / 'unvalidated-current-file.html').write_text('must never reach publication')
            raise subprocess.CalledProcessError(1, ['builder'])

    def run_release(self):
        return release.release(self.current, self.fallback, self.output, 'https://example.test/', self.config)

    def test_reader_skin_copies_hashed_site_style_without_changing_body(self):
        staged = Path(self.temp.name) / 'reader-preview'
        self.build(self.current, staged, 'https://example.test/')
        before = {page: page.read_text().split('</head>', 1)[1] for page in staged.rglob('*.html')}
        info = release.apply_reader_skin(staged)
        self.assertEqual(info['pages'], 2)
        self.assertEqual((staged / info['asset']).read_bytes(), (release.HERE.parent / 'site/research-reader.css').read_bytes())
        for page, body in before.items():
            text = page.read_text()
            self.assertEqual(text.split('</head>', 1)[1], body)
            self.assertEqual(text.count('id="website-reader-style"'), 1)
            self.assertIn('/' + info['asset'], text)
        with self.assertRaisesRegex(ValueError, 'Unrecognized reader stylesheet shell'):
            release.apply_reader_skin(staged)

    def test_unknown_reader_shell_does_not_replace_existing_release(self):
        self.run_release()
        previous = (self.output / 'index.html').read_text()
        original = self.build
        def changed_shell(source, output, base):
            original(source, output, base)
            page = output / 'index.html'
            page.write_text(page.read_text().replace('/assets/site.css', '/styles/unknown.css'))
        with patch.object(release, 'run_builder', changed_shell):
            with self.assertRaisesRegex(ValueError, 'Unrecognized reader stylesheet shell'):
                self.run_release()
        self.assertEqual((self.output / 'index.html').read_text(), previous)

    def test_current_success_never_uses_snapshot(self):
        provenance = self.run_release()
        self.assertEqual(provenance['mode'], 'current')
        self.assertEqual(self.calls, [self.current])
        self.assertNotIn('catalogue-snapshot', (self.output / 'index.html').read_text())
        self.assertEqual(provenance['attempted_source'], provenance['rendered_source'])

    def test_failure_publishes_only_dated_pinned_checked_snapshot(self):
        self.fail_current = True
        provenance = self.run_release()
        self.assertEqual(provenance['mode'], 'snapshot')
        self.assertEqual(provenance['attempted_source']['commit'], 'a' * 40)
        self.assertEqual(provenance['rendered_source']['commit'], 'b' * 40)
        self.assertFalse((self.output / 'unvalidated-current-file.html').exists())
        self.assertEqual(json.loads((self.output / 'search.json').read_text())['source'], 'b' * 40)
        for page in self.output.rglob('*.html'):
            text = page.read_text()
            self.assertEqual(text.count('class="catalogue-snapshot"'), 1)
            self.assertIn('19 Nov 2026, 11:00 UTC', text)
            self.assertIn('validated 19 Nov 2026, 11:30 UTC', text)
            self.assertIn('Newer repository changes are not included because catalogue validation has not passed.', text)
            self.assertIn('/blob/' + 'b' * 40 + '/', text)
            self.assertNotIn('/blob/main/', text)
            self.assertIn('Partial result on an open problem', text)
            self.assertIn('The general conjecture remains open.', text)
            self.assertIn('<title>Snapshot 19 Nov 2026 · Test</title>', text)
            self.assertIn('Catalogue snapshot (19 Nov 2026, 11:00 UTC). Test description', text)

    def test_current_recovery_removes_every_snapshot_annotation(self):
        self.fail_current = True
        self.run_release()
        self.fail_current = False
        provenance = self.run_release()
        self.assertEqual(provenance['mode'], 'current')
        for page in self.output.rglob('*.html'):
            self.assertNotIn('catalogue-snapshot', page.read_text())
            self.assertNotIn('Catalogue snapshot (', page.read_text())
        self.assertEqual(json.loads((self.output / 'search.json').read_text())['source'], 'a' * 40)

    def test_wrong_built_provenance_is_not_silently_fallen_back(self):
        build = self.build
        def mismatched(source, output, base):
            build(source, output, base)
            marker = output / 'build-manifest.json'
            manifest = json.loads(marker.read_text()); manifest['source_dirty'] = True
            marker.write_text(json.dumps(manifest))
        with patch.object(release, 'run_builder', mismatched):
            with self.assertRaisesRegex(ValueError, 'provenance'): self.run_release()
        self.assertEqual(self.calls, [self.current])
        self.assertFalse(self.output.exists())

    def test_invalid_fallback_preserves_previous_output(self):
        self.fail_current = self.fail_fallback = True
        self.output.mkdir(); (self.output / 'keep').write_text('previous release')
        with self.assertRaises(subprocess.CalledProcessError): self.run_release()
        self.assertEqual((self.output / 'keep').read_text(), 'previous release')

    def test_failed_promotion_restores_existing_generated_output(self):
        self.build(self.fallback, self.output, '')
        (self.output / 'keep').write_text('previous release')
        original = Path.rename
        def rename(path, target):
            if path.name == 'current' and Path(target) == self.output:
                raise OSError('simulated promotion failure')
            return original(path, target)
        with patch.object(Path, 'rename', rename):
            with self.assertRaisesRegex(OSError, 'promotion failure'): self.run_release()
        self.assertEqual((self.output / 'keep').read_text(), 'previous release')

    def test_wrong_snapshot_sha_aborts_before_build(self):
        self.config['source_commit'] = 'c' * 40
        with self.assertRaisesRegex(ValueError, 'reviewed snapshot'): self.run_release()
        self.assertEqual(self.calls, [])

    def test_post_annotation_failure_does_not_publish(self):
        self.fail_current = True
        with patch.object(release, 'check_output', side_effect=subprocess.CalledProcessError(1, ['check'])):
            with self.assertRaises(subprocess.CalledProcessError): self.run_release()
        self.assertFalse(self.output.exists())

    def test_unknown_html_shell_rejected(self):
        self.build(self.fallback, self.output, '')
        (self.output / 'index.html').write_text('<html><head></head><body>No expected main</body></html>')
        with self.assertRaisesRegex(ValueError, 'Unrecognized catalogue shell'):
            release.annotate_snapshot(self.output, {"rendered_source": self.fallback_id}, self.config)

    def test_missing_notice_and_moving_source_link_rejected(self):
        self.fail_current = True; provenance = self.run_release()
        page = self.output / 'detail/index.html'
        text = page.read_text()
        page.write_text(text.replace('class="catalogue-snapshot"', 'class="missing"'))
        with self.assertRaisesRegex(ValueError, 'notice coverage'): release.verify_annotation(self.output, provenance)
        page.write_text(text.replace('/blob/' + 'b' * 40 + '/', '/blob/main/'))
        with self.assertRaisesRegex(ValueError, 'moving main'): release.verify_annotation(self.output, provenance)

    def test_research_output_overlap_rejected(self):
        self.output = self.current / 'output'
        with self.assertRaisesRegex(ValueError, 'separate'): self.run_release()

    def test_unrelated_output_and_symlink_are_not_replaced(self):
        self.output.mkdir(); (self.output / 'personal.txt').write_text('keep')
        with self.assertRaisesRegex(ValueError, 'not a generated catalogue'): self.run_release()
        self.assertEqual((self.output / 'personal.txt').read_text(), 'keep')
        link = self.output.parent / 'output-link'; link.symlink_to(self.output, target_is_directory=True)
        self.output = link
        with self.assertRaisesRegex(ValueError, 'symlink'): self.run_release()

    def test_changed_or_dirty_source_aborts(self):
        with patch.object(release, 'identity', side_effect=ValueError('dirty checkout')):
            with self.assertRaisesRegex(ValueError, 'dirty'): self.run_release()
        self.assertEqual(self.calls, [])
        calls = 0
        def changing_identity(source):
            nonlocal calls
            calls += 1
            return dict(self.ids[source]) if calls <= 2 else dict(self.ids[source], commit='c' * 40)
        with patch.object(release, 'identity', changing_identity):
            with self.assertRaisesRegex(ValueError, 'changed during'): self.run_release()
        self.assertFalse(self.output.exists())


    def test_breadcrumb_schema_follows_existing_result_hierarchy(self):
        self.output.mkdir()
        base = "https://1337isnot1337.github.io/solved-conjectures/"
        pages = [
            ("index.html", "All results", base),
            ("results/example/index.html", "Example result", base + "results/example/"),
            ("results/example/proof/index.html", "Example proof", base + "results/example/proof/"),
            ("docs/formalization/index.html", "Lean formalization", base + "docs/formalization/"),
        ]
        (self.output / "build-manifest.json").write_text(json.dumps({
            "pages": [{"file": filename, "title": title, "canonical": url}
                      for filename, title, url in pages]
        }))
        for filename, title, url in pages:
            page = self.output / filename
            page.parent.mkdir(parents=True, exist_ok=True)
            data = json.dumps({"@context": "https://schema.org", "@type": "WebPage",
                               "url": url, "name": title})
            page.write_text(f'<html><head><script type="application/ld+json">{data}</script></head></html>')
        self.assertEqual(release.add_breadcrumb_schema(self.output), 3)
        proof = (self.output / "results/example/proof/index.html").read_text()
        graph = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', proof).group(1))
        self.assertEqual(graph["@type"], "WebPage")
        self.assertEqual(graph["url"], base + "results/example/proof/")
        self.assertEqual([node["item"] for node in graph["breadcrumb"]["itemListElement"]],
                         [base, base + "results/example/", base + "results/example/proof/"])
        self.assertNotIn('"breadcrumb"', (self.output / "index.html").read_text())




if __name__ == '__main__': unittest.main()
