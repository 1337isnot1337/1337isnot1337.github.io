from io import BytesIO
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import catalogue_watchdog as watch


class MonitorTests(unittest.TestCase):
    def setUp(self):
        directory = self.enterContext(tempfile.TemporaryDirectory())
        self.path = Path(directory) / "freshness.json"
        self.observe = self.enterContext(patch.object(watch, "observe", return_value=(False, "a", "behind")))
        self.gh = self.enterContext(patch.object(watch, "gh", return_value="https://example.test/issues/42"))
        self.active = self.enterContext(patch.object(watch, "active_run", return_value=False))
        self.issue = self.enterContext(patch.object(watch, "tracking_issue", return_value=None))

    def tick(self, minute):
        watch.check(self.path, 100000 + minute * 60)

    def test_late_deployment_retries_alerts_once_and_closes_on_recovery(self):
        for minute in (0, 15, 30, 45, 60, 75):
            self.tick(minute)
        self.assertEqual([call.args[:2] for call in self.gh.call_args_list],
                         [("workflow", "run"), ("issue", "create"), ("workflow", "run")])
        self.observe.return_value = (True, "b", "healthy")
        self.tick(90)
        self.assertEqual(self.gh.call_args.args[:3], ("issue", "close", "42"))
        self.assertFalse(self.path.exists())
        self.tick(105)
        self.assertEqual(self.gh.call_count, 4)

    def test_active_run_and_recent_progress(self):
        self.active.return_value = True
        self.tick(0)
        self.tick(15)
        self.observe.return_value = (False, "b", "advancing")
        self.tick(45)
        self.tick(60)
        self.gh.assert_not_called()

    def test_outage_reuses_existing_issue_without_dispatch(self):
        self.issue.return_value = 17
        self.observe.side_effect = TimeoutError("manifest unavailable")
        self.tick(0)
        self.tick(60)
        self.assertEqual(json.loads(self.path.read_text())["issue"], 17)
        self.gh.assert_not_called()


class LiveEvidenceTests(unittest.TestCase):
    def test_homepage_manifest_and_provenance_must_agree(self):
        website, research = "b" * 40, "a" * 40
        provenance = {"mode": "current", "current_catalogue_validation": "passed",
                      "attempted_source": {"commit": research}, "rendered_source": {"commit": research},
                      "website_commit": website}
        manifest = {"source_commit": research, "source_dirty": False}
        footer = f'<a href="https://github.com/{watch.RESEARCH}/commit/{research}">Source abc</a>'.encode()
        for mode, manifest_sha, html, expected in [
            ("current", research, footer, True), ("snapshot", research, footer, False),
            ("current", website, footer, False), ("current", research, b"older homepage", False),
        ]:
            with self.subTest(mode=mode, manifest=manifest_sha, html=html):
                provenance["mode"] = mode
                manifest["source_commit"] = manifest_sha
                responses = [BytesIO(json.dumps(item).encode()) for item in (provenance, manifest)]
                with patch.object(watch, "gh", side_effect=[research, website]), \
                     patch.object(watch, "urlopen", side_effect=[*responses, BytesIO(html)]):
                    self.assertEqual(watch.observe(100)[0], expected)


if __name__ == "__main__":
    unittest.main()
