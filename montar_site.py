"""Monta o site Radar VI em site/ (publicado no GitHub Pages).

Copia site_base/ (index.html, radar.js, ao-vivo.js) e os dados da corrida (dados/corrida.json e o estado,
que o workflow baixa de volta na próxima execução para não perder histórico).
"""
import pathlib
import shutil

BASE = pathlib.Path(__file__).resolve().parent
SITE = BASE / "site"


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    for nome in ("index.html", "radar.js", "ao-vivo.js", "meu-pc.js"):
        shutil.copy(BASE / "site_base" / nome, SITE / nome)
    for nome in ("corrida.json", "estado_corrida.json"):
        if (BASE / "dados" / nome).exists():
            shutil.copy(BASE / "dados" / nome, SITE / nome)
    (SITE / ".nojekyll").write_text("", "utf-8")
    print("site montado em", SITE)


if __name__ == "__main__":
    main()
