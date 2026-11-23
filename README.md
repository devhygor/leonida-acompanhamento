# Leonida em andamento

Painel não oficial que acompanha o [ProjectLeonida/Leonida](https://github.com/ProjectLeonida/Leonida), o port de GTA VI (Xbox Series) para rodar nativo no PC: o que já funciona, o que falta e quão perto o jogo está de rodar.

**Página:** https://devhygor.github.io/leonida-acompanhamento/ (português, English, español)

## Como funciona

- `.github/workflows/atualizar.yml` roda a cada 5 minutos (o GitHub pode atrasar alguns minutos nos horários cheios).
- `coletar.py` lê a API do GitHub, o histórico da branch `main` do Leonida e o texto das issues de coordenação (#7154, roadmap e escada do boot; #313, camada D3D12 → Vulkan) e grava `dados/leonida.json` e `dados/historico.json`.
- `montar_site.py` junta `site_base/` + `pagina/index.html` + os dados em `site/`, que o workflow publica no GitHub Pages.
- A página recarrega os dados sozinha a cada 2 minutos.

Rodar localmente:

```
python -I coletar.py
python -I montar_site.py
python -m http.server --directory site
```

Sem ligação com a Rockstar Games, a Take-Two ou o projeto Leonida. O visual é próprio e não usa arte nem marcas do jogo.
