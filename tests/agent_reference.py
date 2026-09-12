"""Independent test-time execution of current Python against frontend clients."""
import hashlib
import json
from test_consultar_red_flags import ROOT, SOURCE, load_tool_logic

agent = load_tool_logic()
clients = json.loads((ROOT / "frontend/src/data/demo.json").read_text())["clients"]
cases = []
for client in clients:
    identifier = client["id"]
    present = identifier in agent["MOCK_OVERRIDES"] or identifier in agent["_DIVIDAS"] or identifier in agent["_AUTO_INFRACAO"]
    flags = dict(agent["MOCK_OVERRIDES"][identifier]) if identifier in agent["MOCK_OVERRIDES"] else {**agent["_DIVIDAS"].get(identifier, {}), **agent["_AUTO_INFRACAO"].get(identifier, {})}
    for modality in ["a_vista", "prazo", "barter", "cpr"]:
        result = agent["_calcular_score"](flags, modality, "producao") if present else None
        cases.append({"id":identifier,"modality":modality,"score":result["score"] if result else None,"rating":result["rating"] if result else "NC"})
print(json.dumps({"sourceHash":hashlib.sha256(SOURCE.read_bytes()).hexdigest(),"cases":cases}))
