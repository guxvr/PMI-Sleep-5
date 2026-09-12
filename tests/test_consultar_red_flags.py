"""Exercise the actual tool logic without installing or invoking the IBM SDK."""
import ast
import csv
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "consultar_red_flags.py"


def load_tool_logic():
    tree = ast.parse(SOURCE.read_text())
    tree.body = [node for node in tree.body if not (
        isinstance(node, ast.ImportFrom) and node.module.startswith("ibm_watsonx")
    )]
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            node.decorator_list = []
    namespace = {"__file__": str(SOURCE)}
    exec(compile(tree, str(SOURCE), "exec"), namespace)
    return namespace


class NormalizedSourcesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ns = load_tool_logic()

    def test_all_declared_files_exist_and_rows_load(self):
        self.assertGreater(len(self.ns["_DIVIDAS"]) + len(self.ns["_AUTO_INFRACAO"]), 3000)
        for source in self.ns["FONTES_DIVIDA"]:
            with self.subTest(source=source["arquivo"]):
                path = ROOT / source["arquivo"]
                self.assertTrue(path.is_file())
                with path.open(encoding="utf-8-sig", newline="") as stream:
                    rows = list(csv.DictReader(stream, delimiter=";"))
                row = next(row for row in rows if row["CNPJ_NORMALIZADO"])
                self.assertIn(source["flag"], self.ns["_DIVIDAS"][row["CNPJ_NORMALIZADO"]])

    def test_masked_identifiers_never_become_partial_keys(self):
        self.assertTrue(all(len(key) == 14 for key in {**self.ns["_DIVIDAS"], **self.ns["_AUTO_INFRACAO"]}))
        response = self.ns["consultar_red_flags"]("XXX100.000XX")
        self.assertIn("dado insuficiente", response)

    def test_cancelled_auto_does_not_generate_environmental_flag(self):
        self.assertNotIn("EMBARGO_AMBIENTAL", self.ns["_AUTO_INFRACAO"].get("93000000000172", set()))

    def test_plain_infraction_is_not_mapped_to_embargo(self):
        flags=self.ns["_AUTO_INFRACAO"]["93000001000117"]
        self.assertIn("INFRACAO_AMBIENTAL_SEM_EMBARGO",flags)
        self.assertNotIn("EMBARGO_AMBIENTAL",flags)

    def test_normalization_preserves_alphanumeric_cnpj(self):
        self.assertEqual(self.ns["_so_digitos"]("ab.cde.123/0001-42"), "ABCDE123000142")
        self.assertIn("dado insuficiente", self.ns["consultar_red_flags"]("ab.cde.123/0001-42"))

    def test_current_fixtures_keep_their_ratings(self):
        for identifier, expected in [("11222333000181", "A"), ("22333444000192", "D"), ("33444555000103", "D"), ("44555666000114", "B")]:
            self.assertIn(f"Rating (ja calculado, NAO recalcule): {expected}", self.ns["consultar_red_flags"](identifier, "prazo"))


if __name__ == "__main__":
    unittest.main()
