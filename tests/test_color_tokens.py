"""Colour tokens (Color Intelligence Engine decisions): measured contrast, one source of truth, no stray hex in the page script.
Run from the project folder:  python -X utf8 -m unittest discover -s tests -v"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "_build"


def lum(hex_):
    r, g, b = (int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda v: v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


def contrast(a, b):
    x, y = lum(a), lum(b)
    return (max(x, y) + .05) / (min(x, y) + .05)


class ColourTokens(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c = json.loads((BUILD / "color94.json").read_text(encoding="utf-8"))
        cls.tokens, cls.surf = cls.c["tokens"], cls.c["surfaces"]

    def test_surfaces_are_the_ones_in_the_stylesheet(self):
        css = (BUILD / "style94.css").read_text(encoding="utf-8")
        for name, token in (("card", "bg-card"), ("page", "bg"), ("alt", "bg-alt")):
            self.assertRegex(css, rf"--{token}:\s*{re.escape(self.surf[name])}", f"surface {name} differs from the stylesheet: rerun node _build/color_decisions94.js")

    def test_data_marks_reach_3_to_1_on_every_surface(self):
        for k, v in self.tokens.items():
            if k.startswith("c-"):
                for s, bg in self.surf.items():
                    self.assertGreaterEqual(contrast(v, bg), 3, f"{k} {v} on {s} {bg}")

    def test_text_colours_reach_4_5_to_1(self):
        for k in ("c-up", "c-down", "s-success", "s-warning", "s-danger", "s-info", "s-neutral", "n-series"):
            for s, bg in self.surf.items():
                self.assertGreaterEqual(contrast(self.tokens[k], bg), 4.5, f"{k} {self.tokens[k]} on {s}")

    def test_the_decision_record_measured_its_chips(self):
        chk = next(d for d in self.c["decisions"] if d["id"] == "COL-CHECK-TEXT")
        self.assertTrue(all(c["passes"] for c in chk["chips"]), [c for c in chk["chips"] if not c["passes"]])

    def test_every_variable_has_a_decision_with_source_and_status(self):
        ids = {d["id"] for d in self.c["decisions"]}
        self.assertTrue({"COL-DATA-SUBJECT", "COL-DATA-REGION", "COL-DATA-LANE", "COL-DATA-CHANGE", "COL-SEM-STATUS", "COL-NEU-SERIES"} <= ids)
        for d in self.c["decisions"]:
            if d["id"] != "COL-CHECK-TEXT":
                self.assertTrue(d.get("status"), d["id"])
        self.assertIn("MIT", self.c["catalog"]["license"])

    def test_categorical_variables_do_not_share_a_colour(self):
        seen = {}
        for k, v in self.tokens.items():
            if k.startswith("c-") and k not in ("c-up", "c-down"):
                self.assertNotIn(v, seen, f"{k} and {seen.get(v)} share {v}")
                seen[v] = k

    def test_page_carries_the_generated_block_and_no_old_tokens(self):
        page = (ROOT / "index_94.html").read_text(encoding="utf-8")
        self.assertIn(self.c["css"], page)
        self.assertNotRegex(page, r"var\(--(h-[a-z]+|up|down)\)")

    def test_page_script_has_no_literal_colours(self):
        js = (BUILD / "app94.js").read_text(encoding="utf-8")
        self.assertEqual(re.findall(r"#[0-9A-Fa-f]{6}\b|rgba?\(", js), [])

    def test_credit_for_the_palettes_is_in_the_footer_in_both_languages(self):
        for lang in ("en", "es"):
            self.assertIn("Crameri", (BUILD / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        self.assertTrue((BUILD / "vendor" / "SCM9-LICENSE.txt").exists())


if __name__ == "__main__":
    unittest.main()
