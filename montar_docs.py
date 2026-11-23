"""Gera os documentos do painel (dash/meta, datasets/*, files/index.html) em saida_docs/.

Uso: python montar_docs.py <id do blob (32 hex)>
Depois, o Claude envia esses JSON ao painel com ArtifactData batch.
"""
import datetime as dt
import json
import pathlib
import sys

BASE = pathlib.Path(__file__).resolve().parent
OUT = BASE / "saida_docs"
blob = "/_blob/" + sys.argv[1].split("_blob/")[-1].strip("/")
agora = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

DATASETS = {
    "leonida": ("Andamento do Leonida (coletor)", "Arquivo gerado por coletar.py com a API do GitHub, o histórico da main e as issues de coordenação #7154 e #313. Cada parte da página é um cálculo que lê uma lista dele."),
}

OUT.mkdir(exist_ok=True)
docs = [("dash", "meta", {"title": "Leonida em andamento", "lang": "pt-BR"})]
for i, (t, desc) in DATASETS.items():
    docs.append(("datasets", i, {
        "title": t, "description": desc, "link": "https://github.com/ItsNotRexed/Leonida",
        "source": {"kind": "file", "url": blob, "name": "leonida.json", "format": "json"},
        "updated": {"at": agora, "by": "coletar.py"},
        "schedule": "Atualizado quando o coletor (coletar.py) roda e o arquivo é reenviado.",
        "staleAfterHours": 48,
    }))
docs.append(("files", "index.html", {"text": (BASE / "pagina" / "index.html").read_text("utf-8")}))

writes = []
for col, did, data in docs:
    p = OUT / f"{col}__{did}.json"
    p.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
    writes.append({"op": "set", "collection": col, "doc_id": did, "file_path": str(p)})
(OUT / "_writes.json").write_text(json.dumps(writes, ensure_ascii=False, indent=1), "utf-8")
print(len(writes), "docs em", OUT)
