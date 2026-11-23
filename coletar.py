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


def busca(q):
    return gh(f"search/issues?q={q}&per_page=1")["total_count"]


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
    top = [{"autor": a, "commits": c} for a, c in autores.most_common(15)]
    return len(linhas), por_dia, horas, len(autores), top


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


def roadmap_boot():
    issue = gh(f"repos/{REPO}/issues/7154")
    body = issue["body"]
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
    # Ponto mais longe já medido
    f5 = next((f for f in fases if f["n"] == 5), None)
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


def cobertura_metodos():
    body = gh(f"repos/{REPO}/issues/313")["body"]
    rows = []
    for c in linhas_tabela(secao(body, "Method coverage")):
        if len(c) >= 5 and c[1].isdigit():
            rows.append({"interface": limpa(c[0]), "metodos": int(c[1]), "na_main": int(c[2]), "em_prs": int(c[3]), "faltam": int(c[4])})
    return rows


# ---------------------------------------------------------------- docs do repo
def componentes_readme():
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


def marcos_d3d12():
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


# ---------------------------------------------------------------- main
def main():
    agora = dt.datetime.now(UTC).replace(microsecond=0)
    repo = gh(f"repos/{REPO}")
    criado = dt.datetime.fromisoformat(repo["created_at"].replace("Z", "+00:00"))
    atualiza_clone()
    total_commits, commits_dia, horas, n_autores, top_autores = atividade_git(agora)
    fases, escada, pedidos, longe, fronteira_em, coment_7154 = roadmap_boot()
    metodos = cobertura_metodos()
    anteriores, longe_ant = {}, {}
    if OUT.exists():
        try:
            velho = json.loads(OUT.read_text("utf-8"))
            anteriores = {r["dia"]: r for r in velho.get("dias", [])}
            longe_ant = (velho.get("longe") or [{}])[0]
        except (ValueError, KeyError, IndexError):
            anteriores, longe_ant = {}, {}
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
        "autores": top_autores,
        "merges": merges_recentes(),
        "historico": hist,
        "longe": [longe],
    }
    OUT.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"ok {OUT} ({OUT.stat().st_size // 1024} KB) fases={len(fases)} escada={len(escada)} "
          f"pedidos={len(pedidos)} comps={len(dados['componentes'])} marcos={len(dados['marcos'])} metodos={len(metodos)}")


if __name__ == "__main__":
    main()
