# Radar VI

Rastreador independente e não oficial de **todos os projetos que tentam rodar o GTA VI (versão de Xbox Series) nativamente no PC**.

**Site:** https://devhygor.github.io/radar-vi/ (português, English, español)

## Como funciona

- `.github/workflows/atualizar.yml` roda a cada 5 minutos no GitHub Actions.
- `corrida.py` procura projetos novos no GitHub, confere cada um direto na branch principal (estrelas, commits, último commit, README) e marca os que saíram do ar.
- Uma IA (Gemini, chave gratuita no segredo `GEMINI_API_KEY`) lê o README e os commits e diz em que marco cada projeto está (preparação, executável roda, primeira imagem, menu, jogável, estável), o que funciona e o que trava, em pt/en/es. Sem a chave, os marcos são estimados por palavras-chave e aparecem como "estimativa automática".
- `montar_site.py` junta `site_base/` com `dados/corrida.json` e o workflow publica no GitHub Pages.
- Chat, contador de visitas, "online agora" e vídeos sugeridos (com aprovação do dono) usam o Supabase (`site_base/ao-vivo.js`).

Sem ligação com a Rockstar Games, a Take-Two ou qualquer projeto listado. Arte própria; nenhuma imagem do jogo; nenhum link para downloads.
