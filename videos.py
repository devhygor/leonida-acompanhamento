"""Vídeos do Radar VI sem aprovação manual.

1. Descobre vídeos sozinho: links de vídeo nos READMEs dos projetos da corrida (guardados pelo corrida.py em
   `videos_readme`) entram na fila com origem "readme".
2. A IA (Gemini) avalia cada vídeo da fila — os sugeridos pela comunidade e os achados no README:
   - YouTube: o Gemini ASSISTE o vídeo (file_data com a URL do YouTube, resolução baixa para gastar pouco);
   - X/Twitter, Streamable, Vimeo, Twitch, Medal: lê título/texto pelo oEmbed público (sem ver o vídeo).
   Aprova se mostra o GTA VI rodando num port/camada de PC; recusa golpe, gameplay de console, trailer,
   reação sem a tela do jogo, outro jogo etc.; fica em "dúvida" quando não dá para saber (tenta de novo em 1 dia).
3. Vídeo aprovado vira evento "vídeo novo" em "O que mudou".

Precisa de GEMINI_API_KEY e ROBO_VIDEOS_KEY (chave do robô no Supabase; só o hash fica no banco).
"""
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # python -I não põe a pasta do script no path
import corrida as C  # noqa: E402

ROBO = os.environ.get("ROBO_VIDEOS_KEY", "").strip().lstrip("﻿").strip()
MAX_POR_RODADA = int(os.environ.get("VIDEOS_MAX", "4"))
_ao_vivo = (C.BASE / "site_base" / "ao-vivo.js").read_text("utf-8")
SUPA_URL = re.search(r"SUPA_URL = '([^']+)'", _ao_vivo).group(1)
SUPA_KEY = re.search(r"SUPA_KEY = '([^']+)'", _ao_vivo).group(1)

extrair_videos = C.extrair_videos


def rpc(nome, corpo):
    req = urllib.request.Request(f"{SUPA_URL}/rest/v1/rpc/{nome}", data=json.dumps(corpo).encode(),
                                 headers={"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}",
                                          "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode() or "null")


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (RadarVI)"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def youtube_id(u):
    m = re.search(r"(?:v=|youtu\.be/|shorts/|live/)([A-Za-z0-9_-]{6,20})", u)
    return m.group(1) if m else None


def metadados(u):
    """Título, autor e texto do post pelo oEmbed público de cada site (sem chave)."""
    q = urllib.parse.quote(u, safe="")
    try:
        if "youtu" in u:
            d = get_json(f"https://www.youtube.com/oembed?url={q}&format=json")
            return {"titulo": d.get("title"), "autor": d.get("author_name"),
                    "_thumb": f"https://i.ytimg.com/vi/{youtube_id(u)}/hqdefault.jpg" if youtube_id(u) else d.get("thumbnail_url")}
        if "x.com/" in u:
            m = re.search(r"x\.com/([A-Za-z0-9_]{1,15})/status/(\d+)", u)
            d = get_json(f"https://api.fxtwitter.com/{m.group(1)}/status/{m.group(2)}")
            tw = d.get("tweet") or {}
            vids = (tw.get("media") or {}).get("videos") or []
            return {"titulo": None, "autor": (tw.get("author") or {}).get("screen_name"), "texto": (tw.get("text") or "")[:600],
                    "postado_em": tw.get("created_at"), "_mp4": vids[0].get("url") if vids else None,
                    "_thumb": vids[0].get("thumbnail_url") if vids else None,
                    "duracao_s": vids[0].get("duration") if vids else None, "sem_video_no_post": not vids}
        if "streamable.com" in u:
            d = get_json(f"https://api.streamable.com/oembed.json?url={q}")
            return {"titulo": d.get("title"), "autor": d.get("author_name"), "_thumb": d.get("thumbnail_url")}
        if "vimeo.com" in u:
            d = get_json(f"https://vimeo.com/api/oembed.json?url={q}")
            return {"titulo": d.get("title"), "autor": d.get("author_name"), "texto": (d.get("description") or "")[:600], "_thumb": d.get("thumbnail_url")}
    except Exception as e:
        return {"erro": str(e)[:120]}
    return {}


def sobe_video(mp4):
    """Baixa o mp4 (até 60 MB) e manda para a File API do Gemini; devolve (uri, nome) já pronto para uso."""
    req = urllib.request.Request(mp4, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dados = r.read(60 * 1024 * 1024 + 1)
    if len(dados) > 60 * 1024 * 1024:
        raise RuntimeError("vídeo grande demais")
    base = "https://generativelanguage.googleapis.com"
    ini = urllib.request.Request(f"{base}/upload/v1beta/files", data=json.dumps({"file": {"display_name": "radar-vi"}}).encode(),
                                 headers={"x-goog-api-key": C.GEMINI, "Content-Type": "application/json",
                                          "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
                                          "X-Goog-Upload-Header-Content-Length": str(len(dados)),
                                          "X-Goog-Upload-Header-Content-Type": "video/mp4"})
    with urllib.request.urlopen(ini, timeout=30) as r:
        destino = r.headers["X-Goog-Upload-URL"]
    up = urllib.request.Request(destino, data=dados, headers={"X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize",
                                                               "Content-Type": "video/mp4"})
    with urllib.request.urlopen(up, timeout=120) as r:
        f = json.loads(r.read().decode())["file"]
    for _ in range(30):  # o Gemini processa o vídeo antes de deixar usar
        if f.get("state") == "ACTIVE":
            return f["uri"], f["name"]
        if f.get("state") == "FAILED":
            raise RuntimeError("Gemini não processou o vídeo")
        time.sleep(4)
        with urllib.request.urlopen(urllib.request.Request(f"{base}/v1beta/{f['name']}", headers={"x-goog-api-key": C.GEMINI}), timeout=30) as r:
            f = json.loads(r.read().decode())
    raise RuntimeError("vídeo demorou demais para processar")


def apaga_video(nome):
    try:
        urllib.request.urlopen(urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/{nome}", method="DELETE",
                                                      headers={"x-goog-api-key": C.GEMINI}), timeout=30)
    except Exception:
        pass


PROMPT = """Você modera os vídeos de um site que acompanha os projetos que tentam rodar o GTA VI (build de Xbox Series
vazada) nativamente no PC. Decida se o vídeo deve aparecer no site. Responda SÓ com JSON:
{
 "mostra_gta_vi": true|false,        // aparece imagem do próprio GTA VI (não GTA V, não trailer oficial, não outro jogo)
 "rodando_no_pc": true|false,        // a imagem vem de um port/camada/recompilação rodando no PC (janela do Windows, console de debug,
                                     // overlay de FPS, nome do projeto, log) e não de um console, trailer ou edição
 "enganoso": true|false,             // golpe, "download", montagem, IA, clickbait que promete o que o vídeo não mostra
 "projeto": "dono/repo da lista abaixo ou null",
 "marco_visto": "exe"|"imagem"|"menu"|"jogo"|null,   // até onde o jogo chega no vídeo
 "confianca": 0.0-1.0,
 "titulo": "título curto e neutro em português (até 70 caracteres)",
 "resumo": {"pt": "...", "en": "...", "es": "..."},   // 1 frase: o que o vídeo mostra de fato
 "motivo": "frase curta explicando a decisão"
}
Regras: seja cético — se o vídeo promete "gameplay no PC" mas mostra só o console, o trailer ou uma tela de reação sem o jogo,
"rodando_no_pc" é false. Use a lista de projetos para saber até onde cada um chegou: alguém mostrando gameplay livre no PC
quando nenhum projeto passou do menu é muito suspeito. Reação ao vivo que MOSTRA a tela do jogo rodando no PC conta.
"""


def avaliar(v, projetos_txt, meta):
    partes, enviado = [], None
    vid = youtube_id(v["url"]) if "youtu" in v["url"] else None
    if vid:
        partes.append({"file_data": {"file_uri": f"https://www.youtube.com/watch?v={vid}"}})
    elif meta.get("_mp4"):
        uri, enviado = sobe_video(meta["_mp4"])
        partes.append({"file_data": {"mime_type": "video/mp4", "file_uri": uri}})
        vid = True
    meta = {k: x for k, x in meta.items() if not k.startswith("_")}
    contexto = (f"URL: {v['url']}\nCOMENTÁRIO DE QUEM SUGERIU: {v.get('comentario') or '(nenhum)'}\n"
                f"ORIGEM: {v.get('origem')}\nMETADADOS: {json.dumps(meta, ensure_ascii=False)}\n"
                f"{'VOCÊ ESTÁ VENDO O VÍDEO (ele vem junto desta mensagem).' if vid else 'VOCÊ NÃO VÊ O VÍDEO: decida só pelo texto; sem prova no texto, confianca baixa.'}\n\n"
                f"PROJETOS DA CORRIDA (marco atual no GTA VI):\n{projetos_txt}")
    partes.append({"text": PROMPT + "\n\n" + contexto})
    corpo = {"contents": [{"role": "user", "parts": partes}],
             "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json",
                                  **({"mediaResolution": "MEDIA_RESOLUTION_LOW"} if vid else {})}}
    d, erro = None, None
    try:
        for tentativa in range(3):  # o flash vive dando 503 (sobrecarga): tenta de novo e cai para o lite
            for m in C.MODELOS_IA:
                try:
                    d = C._gerar(m, corpo)
                    break
                except urllib.error.HTTPError as e:
                    erro = e
                    if e.code not in (429, 500, 503):
                        raise
            if d:
                break
            time.sleep(10)
    finally:
        if enviado:
            apaga_video(enviado)
    if not d:
        raise erro or RuntimeError("sem resposta")
    txt = d["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(re.sub(r"^```(json)?|```$", "", txt.strip()).strip()), bool(vid)


def decidir(a, viu):
    conf = float(a.get("confianca") or 0)
    bom = a.get("mostra_gta_vi") and a.get("rodando_no_pc") and not a.get("enganoso")
    if bom and conf >= (0.7 if viu else 0.6):
        return "aprovado"
    if not bom and conf >= 0.7:
        return "recusado"
    return "duvida"


def main():
    if not (ROBO and C.GEMINI):
        print("videos: sem ROBO_VIDEOS_KEY ou GEMINI_API_KEY; nada a fazer")
        return
    est = json.loads(C.EST.read_text("utf-8")) if C.EST.exists() else {"projetos": {}}
    projetos = est.get("projetos", {})
    # 1. descobrir vídeos nos READMEs
    novos = 0
    for nome, p in projetos.items():
        a = p.get("aval") or {}
        if p.get("removido") or a.get("relevante") is False:
            continue
        for u in p.get("videos_readme") or []:
            if u in (p.get("videos_enviados") or []):
                continue
            r = rpc("leonida_robo_inserir", {"chave": ROBO, "url": u, "comentario": f"Do README do {nome.split('/')[-1]}",
                                             "apelido": "Radar VI", "origem": "readme"})
            p.setdefault("videos_enviados", []).append(u)
            novos += r == "ok"
    # 2. avaliar a fila
    fila = rpc("leonida_robo_pendentes", {"chave": ROBO}) or []
    lista = sorted(((n, p) for n, p in projetos.items() if not p.get("removido") and (p.get("aval") or {}).get("relevante") is not False),
                   key=lambda x: -C.pontuacao(x[1].get("aval")))[:25]
    projetos_txt = "\n".join(f"- {n}: {(p.get('aval') or {}).get('marco', 'preparacao')}" for n, p in lista)
    eventos, feitos = [], 0
    for v in fila[:MAX_POR_RODADA]:
        meta = metadados(v["url"])
        if meta.get("sem_video_no_post") or "404" in (meta.get("erro") or ""):
            rpc("leonida_robo_decide", {"chave": ROBO, "video": v["id"], "status": "recusado", "resumo": None,
                                        "projeto": None, "marco": None, "titulo": None})
            print(f"vídeo {v['id']}: recusado (post sem vídeo ou apagado)")
            continue
        try:
            a, viu = avaliar(v, projetos_txt, meta)
        except Exception as e:
            print("aviso: vídeo", v["id"], "não avaliado:", str(e)[:120])
            rpc("leonida_robo_decide", {"chave": ROBO, "video": v["id"], "status": "erro", "resumo": None,
                                        "projeto": None, "marco": None, "titulo": None})
            continue
        st = decidir(a, viu)
        proj = a.get("projeto") if a.get("projeto") in projetos else None
        rpc("leonida_robo_decide", {"chave": ROBO, "video": v["id"], "status": st, "resumo": a.get("resumo"),
                                    "projeto": proj, "marco": a.get("marco_visto"), "titulo": (a.get("titulo") or "")[:90] or None,
                                    "thumb": meta.get("_thumb"), "mp4": meta.get("_mp4")})
        feitos += 1
        print(f"vídeo {v['id']} ({'viu' if viu else 'texto'}): {st} conf={a.get('confianca')} | {a.get('motivo', '')[:140]}")
        if st == "aprovado" and v.get("ia_status") != "aprovado":
            eventos.append({"em": C.iso(C.agora()), "tipo": "video", "projeto": proj or "", "url": v["url"],
                            "titulo": a.get("titulo"), "texto": a.get("resumo")})
    C.EST.write_text(json.dumps(est, ensure_ascii=False), "utf-8")
    if eventos and C.OUT.exists():
        d = json.loads(C.OUT.read_text("utf-8"))
        d["eventos"] = (eventos + d.get("eventos", []))[:60]
        C.OUT.write_text(json.dumps(d, ensure_ascii=False), "utf-8")
        est["eventos"] = (eventos + est.get("eventos", []))[:200]
        C.EST.write_text(json.dumps(est, ensure_ascii=False), "utf-8")
    print(f"videos: {novos} achados nos READMEs, {len(fila)} na fila, {feitos} avaliados, {len(eventos)} aprovados agora")


if __name__ == "__main__":
    sys.exit(main())
