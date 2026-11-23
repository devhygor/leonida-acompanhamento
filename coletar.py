"""Coleta o andamento do repositório ItsNotRexed/Leonida e grava dados/leonida.json.

Fontes (só leitura): API do GitHub via `gh`, um clone bare sem blobs em cache/ e o texto
das issues de coordenação (#7154 = roadmap do boot, #313 = camada D3D12 -> Vulkan).

Uso:  python coletar.py
"""
import collections
import datetime as dt
import json
import pathlib
import re
import subprocess

REPO = "ItsNotRexed/Leonida"
BASE = pathlib.Path(__file__).resolve().parent
CACHE = BASE / "cache" / "leonida.git"
OUT = BASE / "dados" / "leonida.json"
HIST = BASE / "dados" / "historico.json"
UTC = dt.timezone.utc


def sh(args, cwd=None):
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=cwd)
    if r.returncode != 0:
        raise RuntimeError(f"{' '.join(args)}\n{r.stderr}")
    return r.stdout


def gh(path):
    return json.loads(sh(["gh", "api", path]))


_BUSCAS = []


def busca(q):
    """Contagem pela API de busca, respeitando o limite de ~30 buscas por minuto."""
    import time
    for tentativa in range(4):
        agora = time.time()
        while len(_BUSCAS) >= 20 and agora - _BUSCAS[-20] < 61:
            time.sleep(61 - (agora - _BUSCAS[-20]))
            agora = time.time()
        _BUSCAS.append(agora)
        try:
            return gh(f"search/issues?q={q}&per_page=1")["total_count"]
        except RuntimeError as e:
            if "rate limit" not in str(e).lower() or tentativa == 3:
                raise
            time.sleep(62)  # o limite da busca é por minuto: espera e tenta de novo


def limpa(md):
    """Markdown -> texto simples."""
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", md or "")
    s = s.replace("**", "").replace("`", "").replace("\\|", "|")
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip()


def corta(s, n):
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def secao(body, titulo):
    m = re.search(rf"^#+ +{re.escape(titulo)}.*?$(.*?)(?=^#+ |\Z)", body, re.S | re.M)
    return m.group(1) if m else ""


def linhas_tabela(texto):
    out = []
    for ln in texto.splitlines():
        ln = ln.strip()
        if not ln.startswith("|") or re.match(r"^\|[\s:|-]+\|$", ln):
            continue
        cels = [c.strip() for c in re.split(r"(?<!\\)\|", ln.strip("|"))]
        out.append(cels)
    return out[1:]  # sem cabeçalho


def num(s):
    s = (s or "").replace(",", "")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(k)?\b", s)
    if not m:
        return None
    v = float(m.group(1)) * (1000 if m.group(2) else 1)
    return int(v)


# ---------------------------------------------------------------- git
def atualiza_clone():
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        sh(["git", "clone", "-q", "--bare", "--filter=blob:none", f"https://github.com/{REPO}", str(CACHE)])
    sh(["git", "fetch", "-q", "--filter=blob:none", "origin", "+refs/heads/main:refs/heads/main"], cwd=CACHE)


def git_show(caminho):
    return sh(["git", "show", f"main:{caminho}"], cwd=CACHE)


def atividade_git(agora):
    linhas = sh(["git", "log", "main", "--format=%ct\t%an"], cwd=CACHE).splitlines()
    por_dia, por_hora, autores = collections.Counter(), collections.Counter(), collections.Counter()
    limite_h = agora - dt.timedelta(hours=72)
    for ln in linhas:
        ts, autor = ln.split("\t", 1)
        t = min(dt.datetime.fromtimestamp(int(ts), UTC), agora)
        por_dia[t.strftime("%Y-%m-%d")] += 1
        if t >= limite_h:
            por_hora[t.strftime("%Y-%m-%dT%H:00Z")] += 1
        autores[autor] += 1
    horas = []
    h = agora.replace(minute=0, second=0, microsecond=0) - dt.timedelta(hours=71)
    while h <= agora:
        k = h.strftime("%Y-%m-%dT%H:00Z")
        horas.append({"hora": k, "commits": por_hora.get(k, 0)})
        h += dt.timedelta(hours=1)
    return len(linhas), por_dia, horas, len(autores)


def top_autores():
    """Os 15 que mais fizeram commits, pelo login do GitHub (para dar link ao perfil e aos commits)."""
    lst = gh(f"repos/{REPO}/contributors?per_page=15")
    return [{"autor": c["login"], "commits": c["contributions"], "url": c["html_url"]} for c in lst if c.get("type") == "User"]


# ---------------------------------------------------------------- issues de coordenação
NOMES_FASE = {
    1: "Do início do processo ao device D3D12",
    2: "Device, filas, listas e heaps",
    3: "Shaders e pipelines",
    4: "Inicialização do áudio",
    5: "Primeiro frame na tela",
    6: "Jogo rodando (controle, saves, rede offline, streaming)",
    7: "Juntar tudo na main",
}


def estado_fase(texto):
    t = texto.lower()
    if t.startswith("done"):
        return "concluída"
    if t.startswith("in progress"):
        return "em andamento"
    if t.startswith("not started"):
        return "não iniciada"
    return "gargalo"


def parse_boot(body):
    fases = []
    for c in linhas_tabela(secao(body, "Roadmap")):
        if len(c) < 5 or not c[0].isdigit():
            continue
        n = int(c[0])
        fases.append({
            "n": n,
            "fase": NOMES_FASE.get(n, limpa(c[1])),
            "fase_original": limpa(c[1]),
            "estado": estado_fase(limpa(c[2])),
            "situacao": corta(limpa(c[2]), 400),
            "o_que_destrava": corta(limpa(c[3]), 300),
            "quem": corta(limpa(c[4]), 160),
        })
    fronteira = secao(body, "Frontier")
    m = re.search(r"Last update: ([^.]*?UTC)", fronteira)
    fronteira_em = m.group(1) if m else None
    escada, ultimo = [], None
    for c in linhas_tabela(fronteira):
        if len(c) < 4 or not (c[0].startswith("base") or c[0].startswith("#") or "+" in c[0] or "shaders" in c[0]):
            continue
        cham = num(c[2])
        if cham is None:
            cham = ultimo
        ultimo = cham
        escada.append({
            "passo": len(escada) + 1,
            "pr": corta(limpa(c[0]), 120),
            "libera": corta(limpa(c[1]), 80),
            "chamadas_d3d12": cham,
            "para_em": corta(limpa(c[3]), 200),
        })
    pedidos = []
    for c in linhas_tabela(secao(body, "Open asks")):
        if len(c) >= 4 and re.match(r"A\d+", c[0]):
            pedidos.append({"id": c[0], "pedido": corta(limpa(c[1]), 260), "precisa": limpa(c[2]), "quem": corta(limpa(c[3]), 120)})
    return fases, escada, pedidos, fronteira_em


def roadmap_boot():
    issue = gh(f"repos/{REPO}/issues/7154")
    body = issue["body"]
    fases, escada, pedidos, fronteira_em = parse_boot(body)
    # Ponto mais longe já medido
    f5 =next((f for f in fases if f["n"] == 5), None)
    # O texto é editado à mão; pega o maior valor citado em qualquer forma conhecida.
    vivos = [int(x) for x in re.findall(r"(?:alive|about|in|runs|for) (\d+) s\b", body)]
    psos = [num(x) for x in re.findall(r"([\d,]+) graphics PSOs", body)]
    chamadas = [num(x) for x in re.findall(r"([\d,.]+k?) (?:D3D12 )?calls", body)]
    chamadas = [x for x in chamadas if x]
    longe = {
        "segundos_vivo": max(vivos) if vivos else None,
        "psos_graficos": max(p for p in psos if p) if any(psos) else None,
        "max_chamadas_d3d12": max(chamadas) if chamadas else None,
        "resumo": corta(f5["situacao"], 400) if f5 else None,
    }
    return fases, escada, pedidos, longe, fronteira_em, issue["comments"]


def cobertura_metodos(body=None):
    if body is None:
        body = gh(f"repos/{REPO}/issues/313")["body"]
    rows = []
    for c in linhas_tabela(secao(body, "Method coverage")):
        if len(c) >= 5 and c[1].isdigit():
            rows.append({"interface": limpa(c[0]), "metodos": int(c[1]), "na_main": int(c[2]), "em_prs": int(c[3]), "faltam": int(c[4])})
    return rows


# ---------------------------------------------------------------- docs do repo
def componentes_readme(readme=None):
    if readme is None:
        readme = git_show("README.md")
    rows = []
    for c in linhas_tabela(secao(readme, "Project status")):
        if len(c) < 2:
            continue
        st = c[1]
        if st.startswith("✅"):
            cat = "funciona"
        elif st.startswith("⚠"):
            cat = "parcial"
        elif st.startswith("❌"):
            cat = "não"
        else:
            cat = "medido"
        rows.append({"componente": limpa(c[0]), "estado": cat, "detalhe": corta(limpa(st.lstrip("✅⚠️❌?️ ")), 260)})
    return rows


def marcos_d3d12(doc=None):
    if doc is None:
        doc = git_show("docs/d3d12_vulkan.md")
    rows = []
    for ln in doc.splitlines():
        m = re.match(r"^\| \*\*(M\d(?:\.\d)?)\*\* \|(.*)$", ln)
        if not m:
            continue
        cels = [x.strip() for x in m.group(2).strip().strip("|").split(" | ")]
        txt = " ".join(cels)
        if "Partly met" in txt:
            est = "parcial"
        elif "Synthetic part met" in txt or "Met with stand-in" in txt:
            est = "sintético"
        elif re.search(r"\bMet (by|with)\b", txt) or "**Met" in txt:
            est = "concluído"
        else:
            est = "aberto"
        rows.append({"marco": m.group(1), "escopo": corta(limpa(cels[0]), 180), "objetivo": corta(limpa(cels[1]) if len(cels) > 1 else "", 140), "estado": est})
    return rows


# ---------------------------------------------------------------- PRs
def prs_por_dia(criado, anteriores):
    """Contagens por dia. Dias fechados (antes de ontem) vêm da coleta anterior, para poupar a API de busca."""
    dias = []
    d = criado.date()
    hoje = dt.datetime.now(UTC).date()
    d = max(d, hoje - dt.timedelta(days=13))
    while d <= hoje:
        s = d.isoformat()
        velho = anteriores.get(s)
        if velho and d < hoje - dt.timedelta(days=1):
            dias.append({k: velho[k] for k in ("dia", "prs_mergeados", "prs_abertos", "issues_abertas")})
            d += dt.timedelta(days=1)
            continue
        dias.append({
            "dia": s,
            "prs_mergeados": busca(f"repo:{REPO}+is:pr+is:merged+merged:{s}"),
            "prs_abertos": busca(f"repo:{REPO}+is:pr+created:{s}"),
            "issues_abertas": busca(f"repo:{REPO}+is:issue+created:{s}"),
        })
        d += dt.timedelta(days=1)
    return dias


def merges_recentes():
    lst = json.loads(sh(["gh", "pr", "list", "-R", REPO, "--state", "merged", "--limit", "15",
                         "--json", "number,title,author,mergedAt,url"]))
    return [{"pr": p["number"], "titulo": corta(p["title"], 140), "autor": p["author"]["login"],
             "mergeado_em": p["mergedAt"], "url": p["url"]} for p in lst]


# ---------------------------------------------------------------- ritmo (linha do tempo)
def _h(t):
    return t.strftime("%Y-%m-%dT%H:00Z")


def _ultimo_por_hora(pares):
    """[(datetime, chave)] -> {hora: chave da última versão daquela hora}."""
    out = {}
    for t, k in sorted(pares):
        out[_h(t)] = k
    return out


def versoes_git(caminho, parser, cache):
    pares = []
    for ln in sh(["git", "log", "main", "--format=%H %ct", "--", caminho], cwd=CACHE).splitlines():
        hsh, ct = ln.split()
        pares.append((dt.datetime.fromtimestamp(int(ct), UTC), hsh))
    por_hora = _ultimo_por_hora(pares)
    vals = {}
    for hora, hsh in por_hora.items():
        k = f"{caminho}@{hsh}"
        if k not in cache:
            try:
                cache[k] = parser(sh(["git", "show", f"{hsh}:{caminho}"], cwd=CACHE))
            except (RuntimeError, ValueError):
                cache[k] = {}
        vals[hora] = cache[k]
    return vals


def versoes_issue(numero, parser, cache, max_paginas=6):
    q = ('query($c:String){repository(owner:"ItsNotRexed",name:"Leonida"){issue(number:%d){'
         'userContentEdits(first:100, after:$c){pageInfo{hasNextPage endCursor} nodes{editedAt diff}}}}}' % numero)
    cursor, pares = None, []
    for _ in range(max_paginas):
        args = ["gh", "api", "graphql", "-f", f"query={q}"] + (["-f", f"c={cursor}"] if cursor else [])
        res = json.loads(sh(args))["data"]["repository"]["issue"]["userContentEdits"]
        novos = 0
        for n in res["nodes"]:
            k = f"#{numero}@{n['editedAt']}"
            if k not in cache:
                novos += 1
                try:
                    cache[k] = parser(n["diff"] or "")
                except (ValueError, KeyError, IndexError):
                    cache[k] = {}
            pares.append((dt.datetime.fromisoformat(n["editedAt"].replace("Z", "+00:00")), k))
        if not novos or not res["pageInfo"]["hasNextPage"]:
            break
        cursor = res["pageInfo"]["endCursor"]
    # edições já vistas em coletas anteriores e fora das páginas lidas agora
    for k in cache:
        if k.startswith(f"#{numero}@"):
            pares.append((dt.datetime.fromisoformat(k.split("@", 1)[1].replace("Z", "+00:00")), k))
    return {hora: cache[k] for hora, k in _ultimo_por_hora(list(set(pares))).items()}


def _p_readme(txt):
    # versões com a tabela duplicada (sobra de conflito de merge): conta cada peça uma vez
    c = list({r["componente"]: r for r in componentes_readme(txt)}.values())
    return {"pecas_ok": sum(r["estado"] in ("funciona", "medido") for r in c), "pecas_total": len(c)} if c else {}


def _p_doc(txt):
    m = list({r["marco"]: r for r in marcos_d3d12(txt)}.values())
    return {"marcos_ok": sum(r["estado"] in ("concluído", "sintético") for r in m), "marcos_total": len(m)} if m else {}


def _p_313(txt):
    m = cobertura_metodos(txt)
    return {"metodos_main": sum(r["na_main"] for r in m), "metodos_total": sum(r["metodos"] for r in m)} if m else {}


def _p_7154(txt):
    fases, escada, _, _ = parse_boot(txt)
    out = {}
    if fases:
        out["fases_ok"] = sum(f["estado"] == "concluída" for f in fases if f["n"] <= 6)
    if escada:
        out["degraus"] = len(escada)
        out["chamadas"] = max((e["chamadas_d3d12"] or 0) for e in escada)
    return out


def prs_por_hora(agora, cache):
    """PRs mergeados por hora nas últimas 72 h. Horas fechadas ficam no cache; a busca só roda para as que faltam."""
    ph = cache.setdefault("prs_hora", {})
    h = agora.replace(minute=0, second=0, microsecond=0) - dt.timedelta(hours=71)
    out = {}
    while h <= agora:
        k = _h(h)
        fechada = h + dt.timedelta(hours=1) <= agora - dt.timedelta(minutes=10)
        if k not in ph or not fechada:
            ini, fim = h.strftime("%Y-%m-%dT%H:00:00Z"), h.strftime("%Y-%m-%dT%H:59:59Z")
            n = busca(f"repo:{REPO}+is:pr+is:merged+merged:{ini}..{fim}")
            if fechada:
                ph[k] = n
            out[k] = n
        else:
            out[k] = ph[k]
        h += dt.timedelta(hours=1)
    for k in [k for k in ph if k < _h(agora - dt.timedelta(hours=96))]:
        del ph[k]
    return out


def linha_do_tempo(agora, criado, cache):
    fontes = [
        versoes_git("README.md", _p_readme, cache),
        versoes_git("docs/d3d12_vulkan.md", _p_doc, cache),
        versoes_issue(313, _p_313, cache),
        versoes_issue(7154, _p_7154, cache),
    ]
    cts = sorted(int(x) for x in sh(["git", "log", "main", "--format=%ct"], cwd=CACHE).split())
    prs = prs_por_hora(agora, cache)
    linha, atual, i, acum = [], {}, 0, 0
    h = criado.replace(minute=0, second=0, microsecond=0)
    while h <= agora:
        k = _h(h)
        for f in fontes:
            if k in f:
                atual.update(f[k])
        fim = (h + dt.timedelta(hours=1)).timestamp()
        while i < len(cts) and cts[i] < fim:
            acum += 1; i += 1
        linha.append({"hora": k, "commits_acum": acum, "prs_merg": prs.get(k), **{c: atual.get(c) for c in (
            "pecas_ok", "pecas_total", "marcos_ok", "marcos_total", "metodos_main", "metodos_total", "fases_ok", "degraus", "chamadas")}})
        h += dt.timedelta(hours=1)
    return linha


def ritmo(linha):
    """Comparação agora x 24 h atrás (ou o primeiro valor conhecido, se a série é mais nova)."""
    agora = linha[-1]
    atras = linha[-25] if len(linha) >= 25 else linha[0]
    out = {"desde": atras["hora"]}
    for c in ("commits_acum", "pecas_ok", "marcos_ok", "metodos_main", "fases_ok", "degraus", "chamadas"):
        serie = [r for r in linha if r[c] is not None]
        if not serie:
            out[c], out[c + "_antes"], out[c + "_desde"] = None, None, None
            continue
        base = next((r for r in serie if r["hora"] >= atras["hora"]), serie[0])
        out[c], out[c + "_antes"], out[c + "_desde"] = serie[-1][c], base[c], base["hora"]
    ult24 = [r["prs_merg"] for r in linha[-25:-1] if r["prs_merg"] is not None]
    out["prs_24h"] = sum(ult24) if ult24 else None
    out["prs_por_hora"] = round(sum(ult24) / len(ult24), 1) if ult24 else None
    out["commits_24h"] = (out["commits_acum"] or 0) - (out["commits_acum_antes"] or 0)
    mm, mt = agora.get("metodos_main"), agora.get("metodos_total")
    ganho = (out["metodos_main"] or 0) - (out["metodos_main_antes"] or 0)
    horas = (dt.datetime.fromisoformat(agora["hora"].replace("Z", "+00:00")) -
             dt.datetime.fromisoformat((out["metodos_main_desde"] or agora["hora"]).replace("Z", "+00:00"))).total_seconds() / 3600
    out["metodos_faltam"] = (mt - mm) if (mm is not None and mt is not None) else None
    out["metodos_por_dia"] = round(ganho / horas * 24, 1) if horas >= 1 and ganho > 0 else None
    out["metodos_dias_restantes"] = (round(out["metodos_faltam"] / out["metodos_por_dia"], 1)
                                     if out["metodos_por_dia"] and out["metodos_faltam"] is not None else None)
    return out


# ---------------------------------------------------------------- main
def main():
    agora = dt.datetime.now(UTC).replace(microsecond=0)
    repo = gh(f"repos/{REPO}")
    criado = dt.datetime.fromisoformat(repo["created_at"].replace("Z", "+00:00"))
    atualiza_clone()
    total_commits, commits_dia, horas, n_autores = atividade_git(agora)
    fases, escada, pedidos, longe, fronteira_em, coment_7154 = roadmap_boot()
    metodos = cobertura_metodos()
    anteriores, longe_ant, cache = {}, {}, {}
    if OUT.exists():
        try:
            velho = json.loads(OUT.read_text("utf-8"))
            anteriores = {r["dia"]: r for r in velho.get("dias", [])}
            longe_ant = (velho.get("longe") or [{}])[0]
            cache = velho.get("_cache") or {}
        except (ValueError, KeyError, IndexError):
            anteriores, longe_ant, cache = {}, {}, {}
    linha = linha_do_tempo(agora, criado, cache)
    rit = ritmo(linha)
    # Recordes: se o texto da issue deixou de citar um número, mantém o maior já visto.
    for k in ("segundos_vivo", "psos_graficos", "max_chamadas_d3d12"):
        vals = [v for v in (longe.get(k), longe_ant.get(k)) if v]
        longe[k] = max(vals) if vals else None
    dias = prs_por_dia(criado, anteriores)
    for d in dias:
        d["commits"] = commits_dia.get(d["dia"], 0)

    m_total = sum(r["metodos"] for r in metodos)
    m_main = sum(r["na_main"] for r in metodos)
    jogo = [f for f in fases if f["n"] <= 6]
    resumo = {
        "estrelas": repo["stargazers_count"],
        "forks": repo["forks_count"],
        "commits": total_commits,
        "autores": n_autores,
        "prs_total": busca(f"repo:{REPO}+is:pr"),
        "prs_mergeados": busca(f"repo:{REPO}+is:pr+is:merged"),
        "prs_abertos": busca(f"repo:{REPO}+is:pr+is:open"),
        "issues_abertas": busca(f"repo:{REPO}+is:issue+is:open"),
        "issues_total": busca(f"repo:{REPO}+is:issue"),
        "fases_concluidas": sum(f["estado"] == "concluída" for f in jogo),
        "fases_andamento": sum(f["estado"] == "em andamento" for f in jogo),
        "fases_total": len(jogo),
        "metodos_d3d12_main": m_main,
        "metodos_d3d12_total": m_total,
        "segundos_vivo": longe["segundos_vivo"],
        "psos_graficos": longe["psos_graficos"],
        "max_chamadas_d3d12": longe["max_chamadas_d3d12"],
        "paradas_vencidas": max(0, len(escada) - 1),
        "dias_de_projeto": (agora - criado).days + 1,
        "criado_em": repo["created_at"],
        "ultimo_push": repo["pushed_at"],
        "roadmap_atualizado": fronteira_em,
        "comentarios_boot": coment_7154,
        "gerado_em": agora.isoformat().replace("+00:00", "Z"),
    }

    try:
        hist = json.loads(HIST.read_text("utf-8")) if HIST.exists() else []
    except ValueError:
        hist = []
    hist = hist[-2000:]  # ~83 dias com uma foto por hora
    snap = {k: resumo[k] for k in ("gerado_em", "estrelas", "forks", "commits", "autores", "prs_mergeados",
                                   "issues_abertas", "fases_concluidas", "fases_andamento", "metodos_d3d12_main",
                                   "max_chamadas_d3d12")}
    if hist and hist[-1]["gerado_em"][:13] == snap["gerado_em"][:13]:
        hist[-1] = snap
    else:
        hist.append(snap)
    HIST.write_text(json.dumps(hist, ensure_ascii=False, indent=1), "utf-8")

    dados = {
        "resumo": [resumo],
        "fases": fases,
        "escada": escada,
        "pedidos": pedidos,
        "componentes": componentes_readme(),
        "marcos": marcos_d3d12(),
        "metodos": metodos,
        "dias": dias,
        "horas": horas,
        "autores": top_autores(),
        "merges": merges_recentes(),
        "historico": hist,
        "longe": [longe],
        "linha": linha,
        "ritmo": [rit],
        "_cache": cache,
    }
    OUT.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"ok {OUT} ({OUT.stat().st_size // 1024} KB) fases={len(fases)} escada={len(escada)} "
          f"pedidos={len(pedidos)} comps={len(dados['componentes'])} marcos={len(dados['marcos'])} metodos={len(metodos)}")


if __name__ == "__main__":
    main()
