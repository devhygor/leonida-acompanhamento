"""Monta a versão independente da página em site/ (para o GitHub Pages).

site/index.html = site_base/cabecalho.html + pagina/index.html + rodapé
Copia também dash-shim.js e os dados (dados/leonida.json, dados/historico.json).
"""
import pathlib
import shutil

BASE = pathlib.Path(__file__).resolve().parent
SITE = BASE / "site"

RODAPE = """
</div>
<p class="lt-rodape">Painel não oficial, sem ligação com a Rockstar Games, a Take-Two ou o projeto Leonida.
Unofficial tracker, not affiliated with Rockstar Games, Take-Two or the Leonida project.
Dados: <a href="https://github.com/ProjectLeonida/Leonida" target="_blank" rel="noopener">ProjectLeonida/Leonida</a>.</p>
</body>
</html>
"""


def main():
    SITE.mkdir(exist_ok=True)
    cab = (BASE / "site_base" / "cabecalho.html").read_text("utf-8")
    pag = (BASE / "pagina" / "index.html").read_text("utf-8")
    (SITE / "index.html").write_text(cab + pag + RODAPE, "utf-8")
    shutil.copy(BASE / "site_base" / "dash-shim.js", SITE / "dash-shim.js")
    shutil.copy(BASE / "site_base" / "ao-vivo.js", SITE / "ao-vivo.js")
    for nome in ("leonida.json", "historico.json", "estado.json"):
        if (BASE / "dados" / nome).exists():
            shutil.copy(BASE / "dados" / nome, SITE / nome)
    (SITE / ".nojekyll").write_text("", "utf-8")
    print("site montado em", SITE)


if __name__ == "__main__":
    main()
