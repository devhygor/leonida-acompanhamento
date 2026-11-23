"""Traduz para português e espanhol os textos em inglês de dados/leonida.json, de graça e offline.

Usa os modelos abertos do Argos Translate (en->pt e en->es) rodando com ctranslate2 + sentencepiece.
Só traduz o que é novo ou mudou: as traduções ficam guardadas em dados/estado.json (_trad).

Uso:  python traduzir.py          (modelos em LEONIDA_MODELOS ou ~/.cache/leonida-modelos)
Precisa: pip install ctranslate2 sentencepiece  e os modelos baixados por baixar_modelos.py
"""
import hashlib
import json
import os
import pathlib
import re
import time

BASE = pathlib.Path(__file__).resolve().parent
OUT = BASE / "dados" / "leonida.json"
EST = BASE / "dados" / "estado.json"
MODELOS = pathlib.Path(os.environ.get("LEONIDA_MODELOS") or (pathlib.Path.home() / ".cache" / "leonida-modelos"))
LIMITE = int(os.environ.get("LEONIDA_TRAD_LIMITE", "200"))  # textos novos por execução (o resto fica para a próxima)
LINGUAS = ("pt", "es")

# (lista no JSON, campo) que vêm em inglês das issues, do README e do plano D3D12
CAMPOS = [("fases", "situacao"), ("fases", "o_que_destrava"), ("escada", "para_em"), ("escada", "libera"),
          ("pedidos", "pedido"), ("pedidos", "precisa"), ("frente", "texto"), ("comentarios", "texto"),
          ("componentes", "detalhe"), ("marcos", "objetivo"), ("marcos", "escopo"), ("longe", "resumo"),
          ("resumo", "proxima_parada"), ("videos", "contexto")]

# pedaços que não devem ser traduzidos (código, PRs, nomes de funções, números com unidade, links)
PROTEGE = re.compile(
    r"https?://\S+"
    r"|#\d+"
    r"|\b[A-Za-z0-9]+(?:[_:.][A-Za-z0-9]+)+\b"            # nomes com _ : . (slot_67, gta6rt.exe, d3d12_xs)
    r"|\b[A-Za-z]*[a-z][A-Z][A-Za-z0-9]*\b"              # CamelCase (PresentX, WaitFrameEventX)
    r"|\b[A-Z0-9]{2,}[A-Za-z0-9]*\b"                     # siglas (D3D12, RDNA2, NVIDIA, PSO, VS)
    r"|\b[0-9a-f]{7,40}\b"                               # hashes de commit
    r"|\b0x[0-9a-fA-F]+\b"                               # hexadecimal
    r"|\b\d[\d,.]*\d\b"                                  # números com separador (70,038 / 4.6)
    r"|\b(?:Wine|Proton|Linux|Windows|macOS|MoltenVK|forge|main|slots?|frames?|soft assert|pacer|"
    r"shaders?|pipelines?|PRs?|ladder|ctest|stack|branch|commit|head|work folder|wave64|wave32)\b")  # jargão que fica igual


def _chave(texto):
    return hashlib.sha1(texto.encode("utf-8")).hexdigest()[:16]


def _parece_ingles(t):
    return bool(t) and len(re.findall(r"[A-Za-z]{3,}", t)) >= 1


class Tradutor:
    def __init__(self, lingua):
        import ctranslate2
        import sentencepiece as spm
        alvo = next((p.parent.parent for p in MODELOS.rglob("model.bin") if f"en_{lingua}" in str(p)), None)
        if alvo is None:
            raise FileNotFoundError(f"modelo en_{lingua} não encontrado em {MODELOS}")
        self.tr = ctranslate2.Translator(str(alvo / "model"), device="cpu", inter_threads=2, intra_threads=2)
        self.sp = spm.SentencePieceProcessor(model_file=str(alvo / "sentencepiece.model"))

    def traduz(self, textos):
        """Traduz uma lista de textos. Protege código/números e divide em frases."""
        pedacos, mapa = [], []
        for i, texto in enumerate(textos):
            guardados = []

            def _troca(m):
                guardados.append(m.group(0))
                return f"Z{len(guardados) - 1}Z"
            protegido = PROTEGE.sub(_troca, texto)
            frases = [f for f in re.split(r"(?<=[.;!?])\s+|\s+—\s+|\s+\|\s+", protegido) if f.strip()]
            for f in frases:
                pedacos.append(f)
                mapa.append((i, guardados))
        if not pedacos:
            return list(textos)
        toks = [self.sp.encode(p, out_type=str) for p in pedacos]
        res = self.tr.translate_batch(toks, beam_size=2, max_decoding_length=300, max_batch_size=32)
        saida = [[] for _ in textos]
        for (i, guardados), r in zip(mapa, res):
            t = "".join(r.hypotheses[0]).replace("▁", " ").strip()
            t = re.sub(r"\s+([,.;:)!?])", r"\1", re.sub(r"\(\s+", "(", re.sub(r"\s{2,}", " ", t)))
            t = re.sub(r"Z\s?(\d+)\s?Z", lambda m: guardados[int(m.group(1))] if int(m.group(1)) < len(guardados) else m.group(0), t)
            saida[i].append(t)
        return [" ".join(s) if s else textos[k] for k, s in enumerate(saida)]


def main():
    dados = json.loads(OUT.read_text("utf-8"))
    estado = json.loads(EST.read_text("utf-8")) if EST.exists() else {}
    trad = estado.get("_trad") or {}

    # o que precisa de tradução nesta coleta
    alvos = []  # (objeto, campo, texto, chave)
    for lista, campo in CAMPOS:
        itens = dados.get(lista) or []
        for obj in itens:
            t = obj.get(campo)
            if isinstance(t, str) and _parece_ingles(t):
                alvos.append((obj, campo, t, _chave(t)))
    faltam = []
    for _, _, t, k in alvos:
        if k not in trad and k not in {c for _, c in faltam}:
            faltam.append((t, k))
    faltam = faltam[:LIMITE]

    if faltam:
        ini = time.time()
        for lingua in LINGUAS:
            tradutor = Tradutor(lingua)
            textos = [t for t, _ in faltam]
            for j in range(0, len(textos), 24):
                lote = textos[j:j + 24]
                for (t, k), tr in zip(faltam[j:j + 24], tradutor.traduz(lote)):
                    trad.setdefault(k, {})[lingua] = tr
        print(f"traduzidos {len(faltam)} textos novos em {time.time() - ini:.0f} s")

    usados = set()
    for obj, campo, t, k in alvos:
        if k in trad and all(l in trad[k] for l in LINGUAS):
            obj[campo + "_i18n"] = {l: trad[k][l] for l in LINGUAS}
            usados.add(k)
    # guarda as usadas agora e no máximo 3000 no total
    extras = [k for k in trad if k not in usados][: max(0, 3000 - len(usados))]
    estado["_trad"] = {k: trad[k] for k in list(usados) + extras}
    OUT.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), "utf-8")
    EST.write_text(json.dumps(estado, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"ok: {len(usados)} textos com tradução, {len(faltam)} novos nesta execução")


if __name__ == "__main__":
    main()
