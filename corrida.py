"""Coletor da corrida: todos os projetos que tentam rodar GTA VI (build de Xbox Series) no PC.

Para cada projeto, conferido direto na branch principal do GitHub: estrelas, commits recentes, último commit,
README. Uma IA (Gemini, chave grátis em GEMINI_API_KEY) lê o README e os commits e diz em que marco o projeto
está, o que funciona e o que trava, em pt/en/es. Sem a chave, usa regras por palavras-chave (marcado como estimativa).

Grava dados/corrida.json (lido pela página) e guarda o estado em dados/estado_corrida.json.
Uso:  python corrida.py
"""
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import subprocess
import time
import urllib.error
import urllib.request

BASE = pathlib.Path(__file__).resolve().parent
OUT = BASE / "dados" / "corrida.json"
EST = BASE / "dados" / "estado_corrida.json"
UTC = dt.timezone.utc
GEMINI = os.environ.get("GEMINI_API_KEY", "").strip().lstrip("\ufeff").strip()
MAX_AVALIA = int(os.environ.get("CORRIDA_MAX_AVALIA", "8"))      # avaliações por IA por execução
REAVALIA_HORAS = float(os.environ.get("CORRIDA_REAVALIA_H", "4"))  # só reavalia se mudou e passou esse tempo

# Marcos, na nossa escala (0-100)
MARCOS = ["preparacao", "exe", "imagem", "menu", "jogo", "estavel"]
PONTOS = {"preparacao": 0, "exe": 20, "imagem": 40, "menu": 60, "jogo": 80, "estavel": 100}

BUSCAS = [
    "gta+vi+xbox+in:name,description,readme", "gta6+port+in:name,description", "gta+6+pc+in:name,description",
    "xbox+series+compatibility+layer", "scarlett+gdk+in:name,description", "xbox+series+emulator+in:name,description",
    "rdna2+spirv+in:description,readme", "rdna2+dxil+in:description,readme", "d3d12_xs+in:readme", "xgameruntime+in:readme",
    "leonida+gta+in:name,description,readme", "xbox+series+recompilation+in:name,description",
]
# sempre acompanhados (inclusive o Leonida, que saiu do ar em 23/11/2026)
FIXOS = ["ItsNotRexed/Leonida", "Marvisak/VIctory", "ivall/xcl", "brcly/TuxBox", "ThatRecompDev/five-star-recomp"]
# o que se sabia de um projeto que já tinha saído do ar quando o Radar começou (fonte: nosso próprio acompanhamento)
CONHECIDOS = {
    "ItsNotRexed/Leonida": {
        "descricao": "Native PC recompilation of the Xbox Series version of GTA VI. Repository deleted on Nov 23, 2026.",
        "estrelas": 34000, "removido_em": "2026-11-23T23:40:00Z",
        "aval": {"relevante": True, "tipo": "recompilação estática", "alvo": "GTA VI", "marco": "exe", "preparacao_pct": 90,
                 "gta_testado": True, "autodeclarado": True, "fonte": "historico",
                 "resumo": {"pt": "Era o maior projeto da corrida. O executável do GTA VI rodava por vários minutos e chegou a mostrar um primeiro frame, mas o repositório foi apagado em 23/11 e o criador desistiu.",
                            "en": "It was the biggest project in the race. GTA VI's executable ran for several minutes and showed a first frame, but the repository was deleted on Nov 23 and its creator quit.",
                            "es": "Era el proyecto más grande de la carrera. El ejecutable de GTA VI corría varios minutos y llegó a mostrar un primer frame, pero el repositorio fue borrado el 23/11 y su creador abandonó."}},
    },
}

INCLUI = re.compile(r"gta ?(vi|6)|scarlett|xbox ?(series|one|x\|s)|durango|\bgdk\b|rdna ?2|d3d12[_.]?xs|xgameruntime|leonida|xbox.?(to|2).?(windows|pc)", re.I)
TIPO_OK = re.compile(r"compat|layer|emulat|\bport|recomp|runtime|translat|loader|\bhle\b|wrapper|shim|continuation|reimplement|"
                     r"running gta|run gta|attempt|natively", re.I)
EXCLUI = re.compile(r"tracker|awesome|watch(er)?\b|curated|\buwp\b|dev ?mode|android|shizuku|switch version|launcher\b|frame ?gen|"
                    r"wii ?u|dolphin|cemu|eden|rpcs3|wakfu|steamos|sing-box|anyps5-live|\bvr\b|ps5 to pc|"
                    r"original|top-?down|\b2d\b|\b3d\b|browser|crime game|performance setup|kytyps5|cyber ?le+k|"
                    r"stable (version|build)|pc version|technical test|makefun|meridian|solan[ao]|gta6-01|install|download|"
                    r"\bfree\b|mod menu|cheat|trainer|vibeslop|leak|companion|clipper|clips|portfolio|guide|countdown|"
                    r"fan (site|atlas|utility)|spoiler|meme|news|checker|can i run|pc-check|pc check|flipper|subtit|"
                    r"dashboard|explorer|atlas|vice ?city recompil|your portal|\bsite\b|website|pc[- ]?version|"
                    r"gta-?6-pc-emulator|gta6_pc|play gta ?6 on|for (android|ios|mobile)", re.I)


def aceita(nome, desc, estrelas):
    """Filtro de relevância (antes da IA). Cópias do Leonida só entram se forem continuações com alguma tração."""
    texto = f"{nome} {desc or ''}"
    if nome in FIXOS:
        return True
    if not desc or len(desc) < 25 or EXCLUI.search(texto) or not INCLUI.search(texto) or not TIPO_OK.search(texto):
        return False
    if re.search(r"leonida", texto, re.I) or re.match(r"fork of", desc, re.I):
        return (estrelas or 0) >= 8 and bool(re.search(r"continu|reforge|maintain|successor", desc, re.I))
    return True


def agora():
    return dt.datetime.now(UTC).replace(microsecond=0)


def iso(t):
    return t.isoformat().replace("+00:00", "Z")


def sh(args):
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError(f"{' '.join(args)}\n{r.stderr}")
    return r.stdout


_BUSCAS_T = []


def gh(path, raw=False):
    if path.startswith("search/"):
        while len(_BUSCAS_T) >= 20 and time.time() - _BUSCAS_T[-20] < 61:
            time.sleep(61 - (time.time() - _BUSCAS_T[-20]))
        _BUSCAS_T.append(time.time())
    args = ["gh", "api", path] + (["-H", "Accept: application/vnd.github.raw"] if raw else [])
    out = sh(args)
    return out if raw else json.loads(out)


def corta(s, n):
    s = re.sub(r"\s+", " ", s or "").strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


# ---------------------------------------------------------------- descoberta
def descobrir(estado):
    achados = {}
    for q in BUSCAS:
        try:
            res = gh(f"search/repositories?q={q}+pushed:>{(agora() - dt.timedelta(days=21)).date()}&sort=updated&per_page=40")
        except RuntimeError as e:
            print("aviso: busca falhou", q, str(e).splitlines()[-1][:100])
            continue
        for it in res.get("items", []):
            achados[it["full_name"]] = it
    novos = []
    for nome, it in achados.items():
        if not aceita(nome, it.get("description"), it.get("stargazers_count")):
            continue
        if it.get("stargazers_count", 0) < 1 and not it.get("language"):
            continue
        if nome not in estado["projetos"]:
            novos.append(nome)
            estado["projetos"][nome] = {"nome": nome, "descoberto_em": iso(agora())}
    return novos


# ---------------------------------------------------------------- dados de cada projeto
def coletar_repo(nome, p):
    """Atualiza p com dados do GitHub. Marca removido se der 404."""
    try:
        r = gh(f"repos/{nome}")
    except RuntimeError as e:
        if "404" in str(e) or "Not Found" in str(e):
            if not p.get("removido"):
                p["removido"] = True
                p["removido_em"] = CONHECIDOS.get(nome, {}).get("removido_em") or iso(agora())
            for k, v in CONHECIDOS.get(nome, {}).items():
                p.setdefault(k, v)
            p.setdefault("url", f"https://github.com/{nome}")
            p["verificado_em"] = iso(agora())
            return p
        raise
    if r.get("full_name") and r["full_name"] != nome:
        p["renomeado_para"] = r["full_name"]
    p["removido"] = False
    p.pop("removido_em", None)
    ant = p.get("estrelas")
    p.update({
        "url": r["html_url"], "descricao": corta(r.get("description") or "", 240), "linguagem": r.get("language"),
        "estrelas": r.get("stargazers_count", 0), "forks": r.get("forks_count", 0), "push": r.get("pushed_at"),
        "criado": r.get("created_at"), "fork_de": (r.get("parent") or {}).get("full_name") if r.get("fork") else None,
        "branch": r.get("default_branch", "main"), "dono_avatar": (r.get("owner") or {}).get("avatar_url"),
    })
    hist = p.setdefault("estrelas_hist", [])
    hist.append([iso(agora()), p["estrelas"]])
    p["estrelas_hist"] = hist[-200:]
    dia = [h for h in hist if h[0] >= iso(agora() - dt.timedelta(hours=24))]
    p["estrelas_24h"] = p["estrelas"] - dia[0][1] if dia else 0
    if p.get("push_visto") == p.get("push") and p.get("readme_hash"):
        # nada novo desde a última olhada: só recalcula as janelas de tempo
        lim6, lim24 = iso(agora() - dt.timedelta(hours=6)), iso(agora() - dt.timedelta(hours=24))
        datas = p.get("commit_datas", [])
        p["commits_6h"] = sum(d >= lim6 for d in datas)
        p["commits_24h"] = sum(d >= lim24 for d in datas)
        p["verificado_em"] = iso(agora())
        return p
    p["push_visto"] = p.get("push")
    try:
        commits = gh(f"repos/{nome}/commits?sha={p['branch']}&per_page=60")
    except RuntimeError:
        commits = []
    if commits:
        c0 = commits[0]
        p["ultimo_commit"] = {"sha": c0["sha"][:10], "em": c0["commit"]["committer"]["date"],
                              "titulo": corta(c0["commit"]["message"].splitlines()[0], 160), "url": c0["html_url"]}
        lim6, lim24 = iso(agora() - dt.timedelta(hours=6)), iso(agora() - dt.timedelta(hours=24))
        datas = [c["commit"]["committer"]["date"] for c in commits]
        p["commits_6h"] = sum(d >= lim6 for d in datas)
        p["commits_24h"] = sum(d >= lim24 for d in datas)
        p["commits_recentes"] = [corta(c["commit"]["message"].splitlines()[0], 140) for c in commits[:30]]
        p["commit_datas"] = datas
        p["commits_cheio"] = len(commits) >= 60
    try:
        readme = gh(f"repos/{nome}/readme", raw=True)
    except RuntimeError:
        readme = ""
    p["_readme"] = readme[:16000]
    p["_readme_novo"] = True
    p["readme_hash"] = hashlib.sha1(readme.encode("utf-8")).hexdigest()[:12]
    p["verificado_em"] = iso(agora())
    return p


# ---------------------------------------------------------------- avaliação
PROMPT = """Você avalia projetos open-source que tentam rodar o GTA VI (build de Xbox Series vazada) nativamente no PC,
ou camadas de compatibilidade para jogos de Xbox Series em geral. Leia o README e os títulos dos commits recentes
e responda SOMENTE com um JSON válido, sem markdown, com estes campos:
{
 "relevante": true|false,            // é um esforço real (código) para rodar jogos de Xbox Series/GTA VI no PC? false para listas, trackers, golpes, repositórios vazios
 "tipo": "camada de compatibilidade"|"emulador"|"recompilação estática"|"ferramenta"|"continuação de outro projeto"|"outro",
 "alvo": "GTA VI"|"qualquer jogo de Xbox Series",
 "marco": "preparacao"|"exe"|"imagem"|"menu"|"jogo"|"estavel",  // o mais avançado ALCANÇADO no GTA VI, segundo o próprio projeto
 "preparacao_pct": 0-100,            // quanto da base (loader, shaders, gráficos) está pronta, se ainda em preparação
 "partes": {"loader": 0-100, "shaders": 0-100, "graficos": 0-100, "outro_jogo": 0-100},
   // quão pronta está cada peça da base, segundo o README/commits: loader = carregar o executável e as bibliotecas do sistema
   // do Xbox; shaders = tradução dos shaders; graficos = camada gráfica (D3D12/Vulkan); outro_jogo = já roda algum outro
   // jogo de Xbox Series (0 se nenhum). Use null na peça que o projeto não menciona.
 "gta_testado": true|false,
 "autodeclarado": true|false,        // true se não há prova (vídeo, print, reprodução por terceiros), só o relato
 "roda_outros": "texto curto em inglês ou null",   // outros jogos de Xbox que o projeto diz rodar
 "resumo": {"pt": "...", "en": "...", "es": "..."},           // 1-2 frases simples sobre o estado atual
 "funciona": {"pt": ["..."], "en": ["..."], "es": ["..."]},   // até 3 itens concretos (o que já roda, com números quando houver)
 "travando": {"pt": ["..."], "en": ["..."], "es": ["..."]},   // até 3 itens: o que impede o próximo marco
 "novidade": {"pt": "...", "en": "...", "es": "..."} | null    // o que mudou desde o resumo anterior abaixo; null se nada importante
}
Significado dos marcos: preparacao = ainda montando a base, o executável do GTA VI não roda; exe = o código do jogo roda
(janela abre, frames pretos ou travamento cedo); imagem = aparece algo do jogo na tela (logos, intro, tela de carregamento);
menu = menus/tela inicial aparecem e respondem; jogo = dá para jogar/andar no mundo; estavel = jogável por longos períodos.
Seja conservador: na dúvida, o marco menor. Escreva em linguagem simples, para quem não é programador.
"""


# aliases que o Google mantém apontando para o flash atual; o "lite" é o reserva quando o principal dá 503 (sobrecarga)
MODELOS_IA = ["models/gemini-flash-latest", "models/gemini-flash-lite-latest"]
_modelos_ruins = set()


def _gemini_modelo():
    return MODELOS_IA[0] if GEMINI else None


def _gerar(modelo, corpo):
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/{modelo}:generateContent",
                                 data=json.dumps(corpo).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": GEMINI})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


def avaliar_ia(modelo, p):
    entrada = (f"PROJETO: {p['nome']}\nDESCRIÇÃO: {p.get('descricao', '')}\nESTRELAS: {p.get('estrelas')}\n"
               f"RESUMO ANTERIOR: {((p.get('aval') or {}).get('resumo') or {}).get('pt', '(nenhum)')}\n"
               f"COMMITS RECENTES:\n- " + "\n- ".join(p.get("commits_recentes", [])[:30]) +
               f"\n\nREADME:\n{p.get('_readme', '')[:14000]}")
    corpo = {"contents": [{"role": "user", "parts": [{"text": PROMPT + "\n\n" + entrada}]}],
             "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}}
    d, erro = None, None
    for tentativa in range(2):
        for m in MODELOS_IA:
            if m in _modelos_ruins:
                continue
            try:
                d = _gerar(m, corpo)
                usado = m
                break
            except urllib.error.HTTPError as e:
                erro = e
                if e.code in (400, 403, 404):
                    _modelos_ruins.add(m)
        if d:
            break
        time.sleep(8)
    if not d:
        raise erro or RuntimeError("nenhum modelo respondeu")
    txt = d["candidates"][0]["content"]["parts"][0]["text"]
    txt = re.sub(r"^```(json)?|```$", "", txt.strip()).strip()
    a = json.loads(txt)
    if a.get("marco") not in MARCOS:
        a["marco"] = "preparacao"
    a["fonte"] = "ia"
    a["modelo"] = usado.replace("models/", "")
    return a


MARCO_RE = [
    ("jogo", r"\b(gameplay (is )?(working|works)|drives? around|walk(s|ing)? around the (world|map)|in-game and playable)\b"),
    ("menu", r"\b(main menu|title screen|start screen|menus? (at|run|show|appear|render)|settings menu|press start)\b"),
    ("imagem", r"\b(intro (video|movie|plays)|logos? (show|appear|render)|loading screen|title card|first (real |visible )?(image|picture|frame shown))\b"),
    ("exe", r"\b(exe (runs|running|boots)|boots? to|frame loop|presentx|black (frames|screen)|reaches? the (first )?(frame|present)|runs? the (game'?s? )?(own )?code)\b"),
]


NEGA = re.compile(r"\b(not|no|yet|never|todo|planned|plan|goal|target|will|won'?t|doesn'?t|isn'?t|cannot|can'?t|until|before|"
                  r"aim|hope|eventually|future|roadmap|wip)\b", re.I)


def avaliar_regras(p):
    texto = (p.get("_readme", "") + "\n" + "\n".join(p.get("commits_recentes", []))).lower()
    gta = bool(re.search(r"gta ?(vi|6)|grand theft auto vi", texto))
    marco = "preparacao"
    if gta:
        # só frases que falam do GTA VI e afirmam algo (sem "ainda não", "planejado"...)
        dedicado = bool(re.search(r"gta ?(vi|6)|grand theft auto|leonida", f"{p['nome']} {p.get('descricao') or ''}", re.I))
        frases = [f for f in re.split(r"(?<=[.!?\n])\s+|\n", p.get("_readme", ""))
                  if (dedicado or re.search(r"gta ?(vi|6)|grand theft auto vi|the game'?s? (exe|executable)", f, re.I))
                  and not NEGA.search(f)]
        alvo = "\n".join(frases).lower()
        for m, rx in MARCO_RE:
            if re.search(rx, alvo):
                marco = m
                break
    prep = min(100, 10 * sum(bool(re.search(k, texto)) for k in (
        r"pe loader|loader", r"shader", r"spir-?v|dxil", r"d3d12|vulkan", r"xgameruntime|gdk", r"xmem|kernelx",
        r"audio|xaudio|xma", r"input|gameinput", r"directstorage", r"present")))
    def tem(*ks):
        return sum(bool(re.search(k, texto)) for k in ks)
    partes = {"loader": min(100, 35 * tem(r"pe loader|loader", r"xgameruntime|gdk|kernelx", r"xmem|import(s|ed)? (table|stub)")) or None,
              "shaders": min(100, 35 * tem(r"shader", r"spir-?v|dxil|hlsl", r"rdna|gcn|isa")) or None,
              "graficos": min(100, 35 * tem(r"d3d12|direct3d", r"vulkan", r"present|swapchain")) or None,
              "outro_jogo": None}
    desc = p.get("descricao") or ""
    return {"partes": partes, "relevante": True, "tipo": "outro", "alvo": "GTA VI" if re.search(r"gta ?(vi|6)", desc, re.I) else "qualquer jogo de Xbox Series",
            "marco": marco, "preparacao_pct": prep, "gta_testado": gta, "autodeclarado": True, "roda_outros": None,
            "resumo": {"en": desc}, "funciona": {}, "travando": {}, "novidade": None, "fonte": "regras"}


def pontuacao(a):
    if not a:
        return 0
    m = a.get("marco", "preparacao")
    if m == "preparacao":
        return round(PONTOS["exe"] * min(100, max(0, a.get("preparacao_pct") or 0)) / 100, 1)
    return PONTOS[m]


# ---------------------------------------------------------------- main
def main():
    t0 = agora()
    estado = json.loads(EST.read_text("utf-8")) if EST.exists() else {}
    estado.setdefault("projetos", {})
    estado.setdefault("eventos", [])
    for f in FIXOS:
        estado["projetos"].setdefault(f, {"nome": f, "descoberto_em": iso(t0)})
    for nome in [n for n, p in estado["projetos"].items() if "descricao" in p and not aceita(n, p.get("descricao"), p.get("estrelas"))]:
        del estado["projetos"][nome]  # não passa mais no filtro
    novos = descobrir(estado) if not estado.get("ultima_busca") or estado["ultima_busca"] < iso(t0 - dt.timedelta(minutes=55)) else []
    if novos or not estado.get("ultima_busca") or estado["ultima_busca"] < iso(t0 - dt.timedelta(minutes=55)):
        estado["ultima_busca"] = iso(t0)
    eventos = estado["eventos"]
    for n in novos:
        if estado.get("ja_rodou"):
            eventos.append({"em": iso(t0), "tipo": "novo", "projeto": n})

    modelo = _gemini_modelo()
    avaliados = 0
    # mais promissores primeiro: os que já estão mais longe e os mais ativos
    ordem = sorted(estado["projetos"].values(), key=lambda p: (-(pontuacao(p.get("aval"))), -(p.get("estrelas") or 0)))
    for p in ordem:
        nome = p["nome"]
        antes_marco = (p.get("aval") or {}).get("marco")
        antes_removido = p.get("removido")
        try:
            coletar_repo(nome, p)
        except RuntimeError as e:
            print("aviso:", nome, str(e).splitlines()[-1][:120])
            continue
        if p.get("removido"):
            if not antes_removido:
                eventos.append({"em": p["removido_em"], "tipo": "removido", "projeto": nome})
            continue
        if antes_removido:
            eventos.append({"em": iso(t0), "tipo": "voltou", "projeto": nome})
        if not p.get("_readme_novo") and p.get("aval") and not (modelo and p["aval"].get("fonte") == "regras"):
            continue  # nada novo desde a última olhada
        if not p.get("_readme_novo") and modelo:
            # avaliação por IA precisa do README: baixa agora
            p["push_visto"] = None
            coletar_repo(nome, p)
        mudou = (p.get("readme_hash") != p.get("aval_readme")) or ((p.get("ultimo_commit") or {}).get("sha") != p.get("aval_commit"))
        velha = not p.get("aval_em") or p["aval_em"] < iso(t0 - dt.timedelta(hours=REAVALIA_HORAS))
        precisa = not p.get("aval") or (mudou and velha) or (modelo and (p.get("aval") or {}).get("fonte") == "regras")
        if precisa:
            try:
                if modelo and avaliados < MAX_AVALIA:
                    a = avaliar_ia(modelo, p)
                    avaliados += 1
                elif not p.get("aval") or (p.get("aval") or {}).get("fonte") == "regras":
                    a = avaliar_regras(p)
                else:
                    a = None
            except Exception as e:
                print("aviso: avaliação de", nome, "falhou:", str(e)[:160])
                a = p.get("aval") or avaliar_regras(p)
            if a:
                p["aval"], p["aval_em"] = a, iso(t0)
                p["aval_readme"], p["aval_commit"] = p.get("readme_hash"), (p.get("ultimo_commit") or {}).get("sha")
                novo_marco = a.get("marco")
                if antes_marco and novo_marco and MARCOS.index(novo_marco) > MARCOS.index(antes_marco) and a.get("relevante", True):
                    eventos.append({"em": iso(t0), "tipo": "marco", "projeto": nome, "de": antes_marco, "para": novo_marco,
                                    "texto": a.get("novidade") or a.get("resumo")})
                elif a.get("novidade") and a.get("relevante", True) and a.get("fonte") == "ia" and antes_marco:
                    eventos.append({"em": iso(t0), "tipo": "novidade", "projeto": nome, "texto": a["novidade"]})
        p.pop("_readme", None)
        p.pop("_readme_novo", None)

    estado["ja_rodou"] = True
    estado["eventos"] = sorted(eventos, key=lambda e: e["em"], reverse=True)[:200]

    # saída para a página
    lista = []
    for p in estado["projetos"].values():
        a = p.get("aval") or {}
        if a and a.get("relevante") is False:
            continue
        if not p.get("verificado_em"):
            continue
        q = {k: v for k, v in p.items() if not k.startswith("_") and k not in ("estrelas_hist", "aval_readme", "aval_commit", "commits_recentes")}
        q["pontos"] = pontuacao(a)
        q["spark"] = [h[1] for h in p.get("estrelas_hist", [])][-48:]
        lista.append(q)
    lista.sort(key=lambda q: (q.get("removido", False), -q["pontos"], -(q.get("estrelas") or 0)))
    ativos = [q for q in lista if not q.get("removido")]
    lider = ativos[0] if ativos else None
    resumo = {
        "gerado_em": iso(t0), "projetos": len(ativos), "removidos": sum(1 for q in lista if q.get("removido")),
        "lider": lider and {"nome": lider["nome"], "pontos": lider["pontos"], "marco": (lider.get("aval") or {}).get("marco")},
        "jogavel": any((q.get("aval") or {}).get("marco") in ("jogo", "estavel") for q in ativos),
        "rodam_exe": sum(1 for q in ativos if (q.get("aval") or {}).get("marco") not in (None, "preparacao")),
        "commits_24h": sum(q.get("commits_24h") or 0 for q in ativos),
        "ia": bool(modelo), "modelo": (modelo or "").replace("models/", ""),
    }
    hist = estado.setdefault("lider_hist", [])
    if lider:
        if not hist or hist[-1][0][:13] != iso(t0)[:13]:
            hist.append([iso(t0), lider["pontos"], lider["nome"]])
        else:
            hist[-1] = [iso(t0), lider["pontos"], lider["nome"]]
    estado["lider_hist"] = hist[-500:]
    saida = {"resumo": resumo, "projetos": lista, "eventos": estado["eventos"][:60], "lider_hist": estado["lider_hist"]}
    OUT.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")), "utf-8")
    EST.write_text(json.dumps(estado, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"ok: {len(ativos)} projetos ativos, {resumo['removidos']} removidos, {avaliados} avaliados por IA "
          f"({resumo['modelo'] or 'sem IA'}), {len(novos)} novos, líder {resumo['lider']}")


if __name__ == "__main__":
    main()
