"""Unit and upstream-integration checks; takes a read-only source checkout."""
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
from unittest.mock import patch

SOURCE = Path(sys.argv.pop(1)).resolve()
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build_catalogue import compatible_status, install_adapter, load_builder, main


class StatusCompatibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.upstream = load_builder(SOURCE)

    def parse(self, text):
        return compatible_status(text, self.upstream.landing_lean_status)

    def test_explicit_plain_tokens(self):
        for declaration, expected in [("full", "full"), ("complete", "full"),
                                      ("partial", "partial"), ("none", "none")]:
            self.assertEqual(self.parse("Lean status: " + declaration), expected)

    def test_stated_theorem_scope_is_not_general_conjecture(self):
        text = ("Lean status: complete for the stated abelian voltage-cover theorem and its\n"
                "sharpness example. The general minimum-degree-three conjecture remains\n"
                "outside this result.\n")
        self.assertEqual(self.parse(text), "full")

    def test_legacy_markers_still_use_upstream_parser(self):
        self.assertEqual(self.parse("**Lean status:** partial"), "partial")
        self.assertEqual(self.parse("This result has no Lean formalization."), "none")

    def test_unknown_ambiguous_or_duplicate_declarations_fail(self):
        for text in ["Lean status: probably complete", "Lean status: complete?",
                     "Lean status: full except the final step", "Lean status: complete for a lemma only",
                     "Lean status: complete for the stated theorem, but one case is pending.",
                     "Lean status: complete for the stated theorem?",
                     "Lean status: complete for the stated theorem if the missing lemma is proved.",
                     "Lean status: complete for the stated lemma only.",
                     "Lean status: complete for the stated theorem. This is not verified.",
                     "Lean status: full\nNot yet checked.",
                     "Lean status: full\n**Lean status:** partial",
                     "Lean status: partial\nLean status: partial"]:
            with self.subTest(text=text), self.assertRaises(ValueError):
                self.parse(text)

    def test_output_cannot_modify_research_checkout(self):
        with patch.object(sys, 'argv', ['build_catalogue.py', '--source', str(SOURCE), '--output', str(SOURCE / '_site')]):
            with self.assertRaisesRegex(ValueError, 'outside the read-only research checkout'):
                main()

    def test_adapter_preserves_independent_checks_and_partial_math_scope(self):
        module = load_builder(SOURCE)
        self.assertEqual(module.STATUS_LABELS["full"], "Lean: formalized stated result")
        checker = module.Builder.check_authoritative_statuses
        install_adapter(module)
        self.assertIs(module.Builder.check_authoritative_statuses, checker)
        # Minimal Pandoc table fixture; exercise the actual upstream checker.
        def cell(text):
            return [None, None, None, None, [{"t": "Plain", "c": [{"t": "Str", "c": text}]}]]
        row = [None, [cell("Erdős–Gyárfás abelian covers"),
                      cell("Complete for the stated theorem"), cell("General conjecture remains outside this result.")]]
        table = {"t": "Table", "c": [None, None, None, None, [[None, None, None, [row]]]]}
        builder = object.__new__(module.Builder)
        builder.documents = {"docs/lean-status.md": SimpleNamespace(ast={"blocks": [table]}),
                             "README.md": SimpleNamespace(ast={"blocks": []})}
        result = SimpleNamespace(status="full", scope="partial", checked_scope="")
        results = {"erdos-gyarfas-abelian-covers": result}
        checker(builder, results)
        self.assertEqual(result.scope, "partial")
        self.assertIn("General conjecture remains outside", result.checked_scope)
        result.status = "partial"
        with self.assertRaisesRegex(ValueError, "Stale catalogue status"):
            checker(builder, results)


if __name__ == "__main__":
    unittest.main()
