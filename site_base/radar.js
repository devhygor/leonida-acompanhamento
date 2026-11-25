/* Radar VI: desenha a página a partir de corrida.json (gerado a cada poucos minutos pelo GitHub Actions). */
(function () {
  var I18N = {
    pt: {
      loc: 'pt-BR', nav_corrida: 'Corrida', nav_mudou: 'O que mudou', nav_comunidade: 'Comunidade', nav_golpes: 'Golpes', nav_como: 'Como funciona',
      online: 'online', online_agora: 'online agora', visitas: 'visitas', selo: 'Radar ao vivo · ports de GTA VI para PC', pergunta: 'GTA VI já roda no PC?',
      nao: 'Ainda não.', sim: 'Sim, dá para jogar.',
      sub: 'Acompanhamos todos os projetos que tentam rodar a versão de Xbox Series do GTA VI nativamente no PC, conferidos direto no GitHub a cada poucos minutos.',
      sub_nao: function (l, m) { return 'Ninguém chegou à parte jogável. O mais avançado é o ' + l + ', que chegou em "' + m + '".'; },
      sub_sim: function (l) { return l + ' diz que já dá para jogar. Confira os detalhes antes de acreditar em qualquer download: nenhum projeto distribui o jogo.'; },
      lider_k: 'Mais perto de rodar agora', placar_k: 'Progresso do projeto mais avançado',
      placar_txt: function (l, m) { return 'Líder: ' + l + ', no marco "' + m + '".'; },
      c_marco: 'marco mais avançado', c_exe: 'já rodam o exe do GTA VI', c_proj: 'projetos no radar', c_commits: 'commits nas últimas 24 h',
      graf_k: 'Pontuação do líder ao longo do tempo', mudou_k: 'Atualizado sozinho', mudou_t: 'O que mudou',
      agora_t: 'Agora nos repositórios', agora_sub: 'Os commits mais recentes dos projetos mais ativos, direto da branch principal.',
      corrida_k: 'Ranking', corrida_t: 'A corrida',
      corrida_sub: 'Cada projeto conferido direto na branch principal do GitHub. O marco vem do que o próprio projeto publica (README e commits), lido por uma IA; quando não há prova pública, aparece como autodeclarado.',
      f_todos: 'Todos', f_gta: 'Só GTA VI', f_geral: 'Qualquer jogo', o_pontos: 'Progresso', o_atividade: 'Atividade', o_estrelas: 'Estrelas',
      com_k: 'Ao vivo', com_t: 'Comunidade', com_sub: 'Vídeos e conversa de quem está acompanhando.',
      vid_t: 'Vídeos', vid_sub: 'Viu um vídeo de algum projeto rodando o GTA VI (no X, YouTube...)? Cole o link: uma IA assiste o vídeo e, se ele mostrar o GTA VI rodando no PC, publica sozinha. Também buscamos vídeos nos READMEs dos projetos. Só links: nada de vídeo do jogo é hospedado aqui.',
      dono: 'Área do dono', entrar: 'Entrar', dono_t: 'Modo dono: vídeos sugeridos', dono_sair: 'Sair do modo dono',
      chat_t: 'Chat', chat_sub: 'Sem links e sem flood; uma mensagem a cada poucos segundos. As mensagens somem depois de 7 dias.',
      golpe_t: 'Não existe download do GTA VI para PC',
      golpe_1: 'Nenhum projeto daqui hospeda o jogo, chaves ou um executável, e este site nunca aponta para nada disso.',
      golpe_2: 'Repositórios e sites com "instalador", "versão PC" ou "emulador pronto" do GTA VI são golpe: trate como vírus.',
      golpe_3: 'Vídeo de "GTA VI rodando liso no PC" quase sempre é falso: confira no ranking até onde cada projeto chegou de verdade.',
      como_k: 'Metodologia', como_t: 'Como funciona',
      como_sub: 'Uma régua única para todos. A cada poucos minutos o Radar VI procura projetos novos no GitHub, confere cada um na branch principal (estrelas, commits, README) e uma IA lê o que o projeto publica para dizer em que marco ele está. Tudo automático; nada é escrito à mão.',
      m_preparacao: 'Preparação', m_exe: 'Executável roda', m_imagem: 'Primeira imagem', m_menu: 'Menu', m_jogo: 'Jogável', m_estavel: 'Estável',
      m_preparacao_d: 'A base ainda está sendo montada: carregador, sistema do console, shaders, gráficos.',
      m_exe_d: 'O código do próprio GTA VI começa a rodar no PC; a tela ainda fica preta ou trava cedo.',
      m_imagem_d: 'Aparece algo do jogo: logos, vídeo de abertura, tela de carregamento.', m_menu_d: 'Os menus do jogo aparecem e respondem ao controle.',
      m_jogo_d: 'Dá para entrar no mundo e jogar.', m_estavel_d: 'Roda por longos períodos, com desempenho aceitável.',
      rodape_1: 'Radar VI é um rastreador independente e não oficial, sem ligação com a Rockstar Games, a Take-Two ou qualquer projeto listado. Arte própria; nenhuma imagem do jogo.',
      atualizado: 'atualizado ', ia_on: function (m) { return 'Avaliações escritas por IA (' + m + ') a partir do README e dos commits de cada projeto.'; },
      ia_off: 'Avaliação por IA desligada no momento: os marcos são estimados por palavras-chave e aparecem como "estimativa automática".',
      tipo: {'camada de compatibilidade': 'camada de compatibilidade', 'emulador': 'emulador', 'recompilação estática': 'recompilação estática', 'ferramenta': 'ferramenta', 'continuação de outro projeto': 'continuação de outro projeto', 'outro': 'outro'},
      alvo_gta: 'só GTA VI', alvo_geral: 'qualquer jogo de Xbox Series', autodecl: 'autodeclarado', estimativa: 'estimativa automática', removido: 'removido do GitHub',
      roda: 'roda: ', funciona: 'O que funciona', travando: 'O que está travando', estrelas: 'estrelas', commits24: 'commits em 24 h', ultimo: 'último commit',
      det_prep: 'Detalhes da preparação', p_loader: 'Loader e bibliotecas do sistema', p_shaders: 'Tradução de shaders', p_graficos: 'Camada gráfica', p_outro: 'Comprovado em outro jogo', comprovado: 'Comprovado em: ', ver_det: 'Ver detalhes', ocultar_det: 'Ocultar detalhes', aval_ia: 'Avaliado pela IA ', aval_reg: 'Estimativa automática ', sem_det: 'A IA ainda não avaliou este projeto.',
      verificado: 'conferido na branch principal ', github: 'Ver no GitHub', mais: function (n) { return 'Ver todos (' + n + ')'; }, menos: 'Mostrar menos',
      ev_novo: function (p) { return p + ' entrou no radar'; }, ev_removido: function (p) { return p + ' saiu do GitHub'; }, ev_voltou: function (p) { return p + ' voltou ao GitHub'; },
      ev_marco: function (p, m) { return p + ' chegou em "' + m + '"'; }, ev_novidade: function (p) { return 'Novidade no ' + p; }, ev_video: function (p) { return p ? 'Vídeo novo do ' + p : 'Vídeo novo'; },
      ev_vazio: 'Nenhuma mudança registrada ainda. Assim que um projeto avançar de marco, entrar ou sair do radar, aparece aqui.',
      sem_dados: 'Carregando os dados do radar…', erro_dados: 'Não deu para carregar os dados agora. Tentando de novo em instantes.'
    },
    en: {
      loc: 'en-US', nav_corrida: 'Race', nav_mudou: 'What changed', nav_comunidade: 'Community', nav_golpes: 'Scams', nav_como: 'How it works',
      online: 'online', online_agora: 'online now', visitas: 'visits', selo: 'Live radar · GTA VI PC ports', pergunta: 'Does GTA VI run on PC yet?',
      nao: 'Not yet.', sim: 'Yes, it is playable.',
      sub: 'We follow every project trying to run the Xbox Series version of GTA VI natively on PC, checked straight on GitHub every few minutes.',
      sub_nao: function (l, m) { return 'Nobody has reached gameplay. The furthest is ' + l + ', which reached "' + m + '".'; },
      sub_sim: function (l) { return l + ' says it is playable. Check the details before trusting any download: no project distributes the game.'; },
      lider_k: 'Closest to running right now', placar_k: 'Progress of the furthest project',
      placar_txt: function (l, m) { return 'Leader: ' + l + ', at the "' + m + '" milestone.'; },
      c_marco: 'furthest milestone', c_exe: "already run GTA VI's exe", c_proj: 'projects on the radar', c_commits: 'commits in the last 24 h',
      graf_k: "Leader's score over time", mudou_k: 'Updated automatically', mudou_t: 'What changed',
      agora_t: 'Right now in the repositories', agora_sub: 'Latest commits from the most active projects, straight from the main branch.',
      corrida_k: 'Ranking', corrida_t: 'The race',
      corrida_sub: 'Every project checked straight on its GitHub main branch. The milestone comes from what the project itself publishes (README and commits), read by an AI; without public proof it is marked self-reported.',
      f_todos: 'All', f_gta: 'GTA VI only', f_geral: 'Any game', o_pontos: 'Progress', o_atividade: 'Activity', o_estrelas: 'Stars',
      com_k: 'Live', com_t: 'Community', com_sub: 'Videos and chat from people following along.',
      vid_t: 'Videos', vid_sub: 'Saw a video of a project running GTA VI (on X, YouTube...)? Paste the link: an AI watches it and, if it shows GTA VI running on PC, publishes it on its own. We also pick up videos from project READMEs. Links only: no game footage is hosted here.',
      dono: 'Owner area', entrar: 'Enter', dono_t: 'Owner mode: suggested videos', dono_sair: 'Leave owner mode',
      chat_t: 'Chat', chat_sub: 'No links, no flooding; one message every few seconds. Messages disappear after 7 days.',
      golpe_t: 'There is no GTA VI download for PC',
      golpe_1: 'No project listed here hosts the game, keys or an executable, and this site never links to any of that.',
      golpe_2: 'Repositories and sites offering a GTA VI "installer", "PC version" or "ready emulator" are scams: treat them as malware.',
      golpe_3: 'Videos of "GTA VI running smoothly on PC" are almost always fake: check in the ranking how far each project really got.',
      como_k: 'Methodology', como_t: 'How it works',
      como_sub: 'One scale for everyone. Every few minutes Radar VI looks for new projects on GitHub, checks each one on its main branch (stars, commits, README) and an AI reads what the project publishes to place it on a milestone. Fully automatic; nothing is written by hand.',
      m_preparacao: 'Groundwork', m_exe: 'Game code runs', m_imagem: 'First picture', m_menu: 'Menus', m_jogo: 'Playable', m_estavel: 'Stable',
      m_preparacao_d: 'The base is still being built: loader, console system, shaders, graphics.',
      m_exe_d: "GTA VI's own code starts running on PC; the screen is still black or it crashes early.",
      m_imagem_d: 'Something from the game appears: logos, intro video, loading screen.', m_menu_d: "The game's menus show up and respond to the controller.",
      m_jogo_d: 'You can get into the world and play.', m_estavel_d: 'Runs for long sessions with acceptable performance.',
      rodape_1: 'Radar VI is an independent, unofficial tracker, not affiliated with Rockstar Games, Take-Two or any listed project. Original artwork; no game imagery.',
      atualizado: 'updated ', ia_on: function (m) { return 'Assessments written by AI (' + m + ') from each project\'s README and commits.'; },
      ia_off: 'AI assessment is off right now: milestones are estimated from keywords and shown as "automatic estimate".',
      tipo: {'camada de compatibilidade': 'compatibility layer', 'emulador': 'emulator', 'recompilação estática': 'static recompilation', 'ferramenta': 'tool', 'continuação de outro projeto': 'continuation of another project', 'outro': 'other'},
      alvo_gta: 'GTA VI only', alvo_geral: 'any Xbox Series game', autodecl: 'self-reported', estimativa: 'automatic estimate', removido: 'removed from GitHub',
      roda: 'runs: ', funciona: 'What works', travando: "What's blocking", estrelas: 'stars', commits24: 'commits in 24 h', ultimo: 'last commit',
      det_prep: 'Preparation details', p_loader: 'Loader and system libraries', p_shaders: 'Shader translation', p_graficos: 'Graphics layer', p_outro: 'Proven on another game', comprovado: 'Proven on: ', ver_det: 'Show details', ocultar_det: 'Hide details', aval_ia: 'Assessed by AI ', aval_reg: 'Automatic estimate ', sem_det: 'The AI has not assessed this project yet.',
      verificado: 'checked on the main branch ', github: 'View on GitHub', mais: function (n) { return 'See all (' + n + ')'; }, menos: 'Show less',
      ev_novo: function (p) { return p + ' joined the radar'; }, ev_removido: function (p) { return p + ' is gone from GitHub'; }, ev_voltou: function (p) { return p + ' is back on GitHub'; },
      ev_marco: function (p, m) { return p + ' reached "' + m + '"'; }, ev_novidade: function (p) { return 'News from ' + p; }, ev_video: function (p) { return p ? 'New video of ' + p : 'New video'; },
      ev_vazio: 'No changes recorded yet. As soon as a project reaches a milestone, joins or leaves the radar, it shows up here.',
      sem_dados: 'Loading radar data…', erro_dados: 'Could not load the data right now. Trying again shortly.'
    },
    es: {
      loc: 'es-ES', nav_corrida: 'Carrera', nav_mudou: 'Qué cambió', nav_comunidade: 'Comunidad', nav_golpes: 'Estafas', nav_como: 'Cómo funciona',
      online: 'en línea', online_agora: 'en línea ahora', visitas: 'visitas', selo: 'Radar en vivo · ports de GTA VI para PC', pergunta: '¿GTA VI ya funciona en PC?',
      nao: 'Todavía no.', sim: 'Sí, ya se puede jugar.',
      sub: 'Seguimos todos los proyectos que intentan ejecutar la versión de Xbox Series de GTA VI de forma nativa en PC, comprobados directamente en GitHub cada pocos minutos.',
      sub_nao: function (l, m) { return 'Nadie ha llegado a la parte jugable. El más avanzado es ' + l + ', que llegó a "' + m + '".'; },
      sub_sim: function (l) { return l + ' dice que ya se puede jugar. Revisa los detalles antes de fiarte de cualquier descarga: ningún proyecto distribuye el juego.'; },
      lider_k: 'Más cerca de funcionar ahora', placar_k: 'Progreso del proyecto más avanzado',
      placar_txt: function (l, m) { return 'Líder: ' + l + ', en el hito "' + m + '".'; },
      c_marco: 'hito más avanzado', c_exe: 'ya ejecutan el exe de GTA VI', c_proj: 'proyectos en el radar', c_commits: 'commits en las últimas 24 h',
      graf_k: 'Puntuación del líder a lo largo del tiempo', mudou_k: 'Actualizado solo', mudou_t: 'Qué cambió',
      agora_t: 'Ahora en los repositorios', agora_sub: 'Los commits más recientes de los proyectos más activos, directamente de la rama principal.',
      corrida_k: 'Ranking', corrida_t: 'La carrera',
      corrida_sub: 'Cada proyecto comprobado directamente en la rama principal de GitHub. El hito sale de lo que publica el propio proyecto (README y commits), leído por una IA; sin prueba pública, aparece como autodeclarado.',
      f_todos: 'Todos', f_gta: 'Solo GTA VI', f_geral: 'Cualquier juego', o_pontos: 'Progreso', o_atividade: 'Actividad', o_estrelas: 'Estrellas',
      com_k: 'En vivo', com_t: 'Comunidad', com_sub: 'Videos y conversación de quienes lo siguen.',
      vid_t: 'Videos', vid_sub: '¿Viste un video de algún proyecto ejecutando GTA VI (en X, YouTube...)? Pega el enlace: una IA ve el video y, si muestra GTA VI corriendo en PC, lo publica sola. También buscamos videos en los README de los proyectos. Solo enlaces: aquí no se aloja ningún video del juego.',
      dono: 'Área del dueño', entrar: 'Entrar', dono_t: 'Modo dueño: videos sugeridos', dono_sair: 'Salir del modo dueño',
      chat_t: 'Chat', chat_sub: 'Sin enlaces y sin flood; un mensaje cada pocos segundos. Los mensajes desaparecen a los 7 días.',
      golpe_t: 'No existe descarga de GTA VI para PC',
      golpe_1: 'Ningún proyecto de aquí aloja el juego, claves ni un ejecutable, y este sitio nunca enlaza a nada de eso.',
      golpe_2: 'Repositorios y sitios con "instalador", "versión PC" o "emulador listo" de GTA VI son estafas: trátalos como virus.',
      golpe_3: 'Los videos de "GTA VI funcionando fluido en PC" casi siempre son falsos: mira en el ranking hasta dónde llegó cada proyecto de verdad.',
      como_k: 'Metodología', como_t: 'Cómo funciona',
      como_sub: 'Una sola escala para todos. Cada pocos minutos Radar VI busca proyectos nuevos en GitHub, revisa cada uno en su rama principal (estrellas, commits, README) y una IA lee lo que publica el proyecto para ubicarlo en un hito. Todo automático; nada se escribe a mano.',
      m_preparacao: 'Preparación', m_exe: 'El ejecutable corre', m_imagem: 'Primera imagen', m_menu: 'Menú', m_jogo: 'Jugable', m_estavel: 'Estable',
      m_preparacao_d: 'La base aún se está montando: cargador, sistema de la consola, shaders, gráficos.',
      m_exe_d: 'El código del propio GTA VI empieza a correr en PC; la pantalla sigue negra o se cuelga pronto.',
      m_imagem_d: 'Aparece algo del juego: logos, video de introducción, pantalla de carga.', m_menu_d: 'Los menús del juego aparecen y responden al mando.',
      m_jogo_d: 'Se puede entrar al mundo y jugar.', m_estavel_d: 'Funciona durante sesiones largas con rendimiento aceptable.',
      rodape_1: 'Radar VI es un rastreador independiente y no oficial, sin relación con Rockstar Games, Take-Two ni ningún proyecto listado. Arte propio; ninguna imagen del juego.',
      atualizado: 'actualizado ', ia_on: function (m) { return 'Evaluaciones escritas por IA (' + m + ') a partir del README y los commits de cada proyecto.'; },
      ia_off: 'La evaluación por IA está apagada ahora: los hitos se estiman por palabras clave y aparecen como "estimación automática".',
      tipo: {'camada de compatibilidade': 'capa de compatibilidad', 'emulador': 'emulador', 'recompilação estática': 'recompilación estática', 'ferramenta': 'herramienta', 'continuação de outro projeto': 'continuación de otro proyecto', 'outro': 'otro'},
      alvo_gta: 'solo GTA VI', alvo_geral: 'cualquier juego de Xbox Series', autodecl: 'autodeclarado', estimativa: 'estimación automática', removido: 'eliminado de GitHub',
      roda: 'corre: ', funciona: 'Qué funciona', travando: 'Qué lo frena', estrelas: 'estrellas', commits24: 'commits en 24 h', ultimo: 'último commit',
      det_prep: 'Detalles de la preparación', p_loader: 'Loader y bibliotecas del sistema', p_shaders: 'Traducción de shaders', p_graficos: 'Capa gráfica', p_outro: 'Probado en otro juego', comprovado: 'Probado en: ', ver_det: 'Ver detalles', ocultar_det: 'Ocultar detalles', aval_ia: 'Evaluado por IA ', aval_reg: 'Estimación automática ', sem_det: 'La IA aún no evaluó este proyecto.',
      verificado: 'comprobado en la rama principal ', github: 'Ver en GitHub', mais: function (n) { return 'Ver todos (' + n + ')'; }, menos: 'Mostrar menos',
      ev_novo: function (p) { return p + ' entró en el radar'; }, ev_removido: function (p) { return p + ' salió de GitHub'; }, ev_voltou: function (p) { return p + ' volvió a GitHub'; },
      ev_marco: function (p, m) { return p + ' llegó a "' + m + '"'; }, ev_novidade: function (p) { return 'Novedad en ' + p; }, ev_video: function (p) { return p ? 'Video nuevo de ' + p : 'Video nuevo'; },
      ev_vazio: 'Aún no hay cambios registrados. En cuanto un proyecto avance de hito, entre o salga del radar, aparecerá aquí.',
      sem_dados: 'Cargando los datos del radar…', erro_dados: 'No se pudieron cargar los datos ahora. Reintentando en breve.'
    }
  };
  // Escala em duas partes: entrar no jogo é uma escada até 50; jogar bem (quatro barras) vale os outros 50.
  var EXTRA = {
    pt: {
      quase: 'Quase.', sim: 'Sim, dá para jogar.',
      sub_quase: function (l, fps) { return l + ' já é jogável' + (fps ? ', mas a uns ' + fps + ' fps' : '') + '. Ainda falta muito para jogar de verdade: veja as quatro barras de cada projeto. Nenhum projeto distribui o jogo.'; },
      m_mundo: 'No mundo', m_mundo_d: 'O modo história carrega o mundo do jogo e desenha algo dele, mesmo quebrado.',
      m_jogo_d: 'Dá para controlar um personagem no mundo, mesmo a poucos fps. Vale 50%: o resto vem de jogar bem.',
      m_completo: 'Completo', jogar_bem: 'Jogar bem', trilha_barras: 'História · Gráficos · Desempenho · Estabilidade',
      b_historia: 'História', b_graficos: 'Gráficos', b_desempenho: 'Desempenho', b_estabilidade: 'Estabilidade',
      b_historia_d: 'Até onde dá para jogar a história.', b_graficos_d: 'O quanto a imagem se parece com a do console.',
      b_desempenho_d: 'FPS médio ÷ 30, segundo o próprio projeto.', b_estabilidade_d: 'De travar o tempo todo a estável em sessões longas.',
      n_historia: ['Preso no início', 'Prólogo concluído', 'Primeiras missões', 'Primeiro ato', 'Metade da história', 'Até os créditos', '100% concluído'],
      n_graficos: ['Preto ou quebrado', 'Formas quase sem luz', 'Iluminado, faltam efeitos', 'Quase igual ao console', 'Igual ao console'],
      n_estabilidade: ['Trava o tempo todo', 'Trava com frequência', 'Trava às vezes', 'Raramente trava', 'Estável'],
      sem_dado: 'sem dado', antes_jogavel: 'conta depois de Jogável', pts: 'pts',
      como_sub: 'Uma régua única para todos, em duas partes. Entrar no jogo é uma escada até 50%: a preparação vale até 10% e cada marco depende do anterior. Jogar bem vale os outros 50%, em quatro barras, e 100% é o jogo inteiro terminado. A cada poucos minutos o Radar VI confere cada projeto no GitHub e uma IA lê o README e os commits para dizer onde ele está. Tudo automático; nada é escrito à mão.',
      como_nota: 'Marco alcançado pela metade (um menu que aparece mas não responde, por exemplo) vale metade. As quatro barras só contam depois de Jogável: não dá para julgar como um jogo roda antes de dar para jogá-lo. A preparação soma loader (2), shaders (2,8), camada gráfica (3,2) e outro jogo comprovado (2).'
    },
    en: {
      quase: 'Almost.', sim: 'Yes, it is playable.',
      sub_quase: function (l, fps) { return l + ' is playable' + (fps ? ', but at about ' + fps + ' fps' : '') + '. Real gameplay is still far off: check the four bars on each project. No project distributes the game.'; },
      m_mundo: 'In the world', m_mundo_d: 'Story mode loads the game world and draws some of it, even if broken.',
      m_jogo_d: 'You can control a character in the world, even at a few fps. Worth 50%: the rest comes from playing well.',
      m_completo: 'Complete', jogar_bem: 'Playing well', trilha_barras: 'Story · Graphics · Performance · Stability',
      b_historia: 'Story', b_graficos: 'Graphics', b_desempenho: 'Performance', b_estabilidade: 'Stability',
      b_historia_d: 'How far into the story you can play.', b_graficos_d: 'How close the picture looks to the console.',
      b_desempenho_d: 'Average FPS ÷ 30, as reported by the project.', b_estabilidade_d: 'From crashing all the time to stable over long sessions.',
      n_historia: ['Stuck at the start', 'Prologue cleared', 'First missions', 'First act', 'Halfway', 'To the credits', '100% complete'],
      n_graficos: ['Black or broken', 'Shapes, barely lit', 'Lit, missing effects', 'Close to console', 'Same as console'],
      n_estabilidade: ['Crashes constantly', 'Crashes often', 'Crashes sometimes', 'Rarely crashes', 'Stable'],
      sem_dado: 'no data', antes_jogavel: 'counts after Playable', pts: 'pts',
      como_sub: 'One scale for everyone, in two parts. Getting into the game is a ladder up to 50%: groundwork is worth up to 10% and each milestone depends on the one before. Playing well is worth the other 50%, across four bars, and 100% is the whole game finished. Every few minutes Radar VI checks each project on GitHub and an AI reads its README and commits to say where it stands. Fully automatic; nothing is written by hand.',
      como_nota: 'A milestone only half reached (a menu that shows but does not respond, say) is worth half. The four bars only count after Playable: you cannot judge how a game runs before you can play it. Groundwork adds loader (2), shaders (2.8), graphics layer (3.2) and proven on another game (2).'
    },
    es: {
      quase: 'Casi.', sim: 'Sí, ya se puede jugar.',
      sub_quase: function (l, fps) { return l + ' ya es jugable' + (fps ? ', pero a unos ' + fps + ' fps' : '') + '. Aún falta mucho para jugar de verdad: mira las cuatro barras de cada proyecto. Ningún proyecto distribuye el juego.'; },
      m_mundo: 'En el mundo', m_mundo_d: 'El modo historia carga el mundo del juego y dibuja algo de él, aunque esté roto.',
      m_jogo_d: 'Se puede controlar un personaje en el mundo, aunque sea a pocos fps. Vale 50%: el resto viene de jugar bien.',
      m_completo: 'Completo', jogar_bem: 'Jugar bien', trilha_barras: 'Historia · Gráficos · Rendimiento · Estabilidad',
      b_historia: 'Historia', b_graficos: 'Gráficos', b_desempenho: 'Rendimiento', b_estabilidade: 'Estabilidad',
      b_historia_d: 'Hasta dónde se puede jugar la historia.', b_graficos_d: 'Cuánto se parece la imagen a la de consola.',
      b_desempenho_d: 'FPS medio ÷ 30, según el propio proyecto.', b_estabilidade_d: 'De cerrarse todo el tiempo a estable en sesiones largas.',
      n_historia: ['Atascado al inicio', 'Prólogo superado', 'Primeras misiones', 'Primer acto', 'Mitad de la historia', 'Hasta los créditos', '100% completado'],
      n_graficos: ['Negro o roto', 'Formas casi sin luz', 'Iluminado, faltan efectos', 'Casi como en consola', 'Igual que en consola'],
      n_estabilidade: ['Se cierra todo el tiempo', 'Se cierra a menudo', 'Se cierra a veces', 'Rara vez se cierra', 'Estable'],
      sem_dado: 'sin datos', antes_jogavel: 'cuenta tras Jugable', pts: 'pts',
      como_sub: 'Una sola escala para todos, en dos partes. Entrar al juego es una escalera hasta 50%: la preparación vale hasta 10% y cada hito depende del anterior. Jugar bien vale el otro 50%, en cuatro barras, y 100% es el juego entero terminado. Cada pocos minutos Radar VI revisa cada proyecto en GitHub y una IA lee su README y sus commits para decir dónde está. Todo automático; nada escrito a mano.',
      como_nota: 'Un hito alcanzado a medias (un menú que aparece pero no responde, por ejemplo) vale la mitad. Las cuatro barras solo cuentan después de Jugable: no se puede juzgar cómo corre un juego antes de poder jugarlo. La preparación suma loader (2), shaders (2,8), capa gráfica (3,2) y probado en otro juego (2).'
    }
  };
  Object.keys(EXTRA).forEach(function (k) { Object.keys(EXTRA[k]).forEach(function (c) { I18N[k][c] = EXTRA[k][c]; }); });
  var MARCOS = ['preparacao', 'exe', 'imagem', 'menu', 'mundo', 'jogo'];
  var PONTOS = {preparacao: 0, exe: 10, imagem: 20, menu: 30, mundo: 40, jogo: 50};
  // barras de "jogar bem": [chave no aval.jogar, pontos, nível máximo, lista de nomes]
  var BARRAS = [['historia', 17.5, 6, 'n_historia'], ['graficos', 12.5, 4, 'n_graficos'], ['desempenho', 10, 30, null], ['estabilidade', 10, 4, 'n_estabilidade']];

  var ls = {get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }};
  var lang = ls.get('rv-lang');
  if (!I18N[lang]) { var nv = ((navigator.languages && navigator.languages[0]) || navigator.language || 'pt').toLowerCase(); lang = nv.indexOf('pt') === 0 ? 'pt' : nv.indexOf('es') === 0 ? 'es' : 'en'; }
  window.ltLang = lang;
  var T = function () { return I18N[window.ltLang] || I18N.pt; };
  window.ltT = function () { return {loc: T().loc}; };
  window.ltData = function (iso) { var d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleString(T().loc, {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}); };
  window.ltQuando = function (iso) {
    var dif = (new Date(iso) - Date.now()) / 1000; if (isNaN(dif)) return '';
    try {
      var r = new Intl.RelativeTimeFormat(T().loc, {numeric: 'auto'}), a = Math.abs(dif);
      if (a < 60) return r.format(Math.round(dif), 'second');
      if (a < 3600) return r.format(Math.round(dif / 60), 'minute');
      if (a < 86400) return r.format(Math.round(dif / 3600), 'hour');
      return r.format(Math.round(dif / 86400), 'day');
    } catch (e) { return window.ltData(iso); }
  };

  var D = null, filtroAlvo = 'todos', ordem = 'pontos', mostrarTodos = false;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function link(href, cls, txt) { var a = el('a', cls, txt); if (/^https:\/\//.test(href || '')) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; } return a; }
  function fmt(n) { try { return new Intl.NumberFormat(T().loc).format(n); } catch (e) { return String(n); } }
  function nomeCurto(n) { return (n || '').split('/').pop(); }
  function marcoNome(m) { if (m === 'estavel') m = 'jogo'; return T()['m_' + (m || 'preparacao')] || m; }
  function tr(obj) { if (!obj) return ''; if (typeof obj === 'string') return obj; return obj[window.ltLang] || obj.en || obj.pt || ''; }
  function trLista(obj) { if (!obj) return []; if (Array.isArray(obj)) return obj; return obj[window.ltLang] || obj.en || obj.pt || []; }
  function pct(p) { return (Math.round((p || 0) * 10) / 10).toString().replace('.', T().loc === 'en-US' ? '.' : ','); }
  function avatar(p, cls) {
    if (p.dono_avatar && /^https:\/\//.test(p.dono_avatar)) { var i = el('img', cls); i.src = p.dono_avatar + (p.dono_avatar.indexOf('?') > 0 ? '&' : '?') + 's=80'; i.alt = ''; i.loading = 'lazy'; return i; }
    return el('span', 'ini ' + (cls || ''), nomeCurto(p.nome).slice(0, 2).toUpperCase());
  }

  function aplicaTextos() {
    document.documentElement.lang = T().loc;
    document.querySelectorAll('[data-i18n]').forEach(function (e) { var v = T()[e.getAttribute('data-i18n')]; if (typeof v === 'string') e.textContent = v; });
    var s = $('lt-lang'); if (s) s.value = window.ltLang;
  }

  function topo() {
    var r = D.resumo;
    $('atualizado').textContent = T().atualizado + window.ltQuando(r.gerado_em);
    var lider = (D.projetos || []).find(function (p) { return r.lider && p.nome === r.lider.nome; });
    var marco = r.lider && r.lider.marco;
    var est = !r.jogavel ? 'nao' : (lider && lider.pontos >= 80 ? 'sim' : 'quase');
    $('resposta').textContent = T()[est];
    $('resposta').className = 'resposta ' + est;
    var fps = r.fps_lider ? String(Math.round(r.fps_lider * 10) / 10).replace('.', T().loc === 'en-US' ? '.' : ',') : '';
    $('resposta-sub').textContent = !lider ? T().sub : est === 'nao' ? T().sub_nao(nomeCurto(lider.nome), marcoNome(marco))
      : est === 'quase' ? T().sub_quase(nomeCurto(lider.nome), fps) : T().sub_sim(nomeCurto(lider.nome));
    if (lider) {
      $('lider-nome').textContent = nomeCurto(lider.nome);
      $('lider-repo').textContent = lider.nome;
      $('lider-pct').textContent = pct(lider.pontos) + '%';
      $('lider-marco').textContent = marcoNome(marco);
      var u = lider.ultimo_commit;
      $('lider-ultimo').textContent = u ? T().ultimo + ' ' + window.ltQuando(u.em) + ': ' + u.titulo : '';
      $('placar-pct').innerHTML = '';
      $('placar-pct').appendChild(document.createTextNode(pct(lider.pontos)));
      $('placar-pct').appendChild(el('small', null, '%'));
      $('placar-txt').textContent = T().placar_txt(nomeCurto(lider.nome), marcoNome(marco));
      $('c-marco').textContent = marcoNome(marco);
    }
    $('c-exe').textContent = fmt(r.rodam_exe) + ' / ' + fmt(r.projetos);
    $('c-proj').textContent = fmt(r.projetos);
    $('c-commits').textContent = fmt(r.commits_24h);
    $('rodape-ia').textContent = r.ia ? T().ia_on(r.modelo) : T().ia_off;
  }

  function trilha() {
    var t = $('trilha'); t.replaceChildren();
    t.appendChild(el('div', 'base'));
    var ativos = (D.projetos || []).filter(function (p) { return !p.removido; });
    var lider = ativos[0];
    var f = el('div', 'feito'); f.style.width = (lider ? lider.pontos : 0) + '%'; t.appendChild(f);
    [10, 20, 30, 40, 50].forEach(function (x) { var dv = el('div', 'div-t'); dv.style.left = x + '%'; t.appendChild(dv); });
    MARCOS.concat(['completo']).forEach(function (m, i) {
      var v = m === 'completo' ? 100 : PONTOS[m];
      var mk = el('div', 'marca-t m-' + m + (i % 2 ? ' baixo' : '') + (m === 'completo' ? ' fim' : '') + (i === 0 ? ' ini' : ''));
      mk.style.left = v + '%'; mk.appendChild(el('b', null, v + '%')); mk.appendChild(document.createTextNode(m === 'completo' ? T().m_completo : marcoNome(m))); t.appendChild(mk);
    });
    var jb = el('div', 'marca-jb', T().trilha_barras); t.appendChild(jb);
    var usados = {};
    ativos.slice(0, 7).forEach(function (p, i) {
      var pos = Math.max(2, Math.min(98, p.pontos));
      var chave = Math.round(pos / 3); while (usados[chave]) { chave++; pos += 3; } usados[chave] = 1;
      var pin = el('div', 'pin' + (i === 0 ? ' primeiro' : '')); pin.style.left = Math.min(98, pos) + '%';
      pin.title = nomeCurto(p.nome) + ' · ' + pct(p.pontos) + '%';
      pin.appendChild(avatar(p, ''));
      t.appendChild(pin);
    });
  }

  function grafico() {
    var g = $('graf'); g.querySelectorAll('svg,.dica').forEach(function (x) { x.remove(); });
    var h = (D.lider_hist || []).filter(function (x) { return x && x[1] != null; });
    if (h.length < 2) { g.hidden = true; return; }
    g.hidden = false;
    var W = Math.max(300, g.clientWidth || 600), H = 90, pad = 6;
    var ts = h.map(function (x) { return new Date(x[0]).getTime(); }), t0 = Math.min.apply(null, ts), t1 = Math.max.apply(null, ts.concat([t0 + 1]));
    var X = function (t) { return pad + (W - 2 * pad) * (t - t0) / (t1 - t0); }, Y = function (v) { return H - pad - (H - 2 * pad) * v / 100; };
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', T().graf_k);
    var dl = '', da = '';
    h.forEach(function (x, i) { var px = X(ts[i]), py = Y(x[1]); dl += (i ? ' L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1); });
    da = dl + ' L' + X(ts[ts.length - 1]).toFixed(1) + ' ' + (H - pad) + ' L' + X(ts[0]).toFixed(1) + ' ' + (H - pad) + ' Z';
    var defs = document.createElementNS(ns, 'defs'); defs.innerHTML = '<linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#8b3dff"/><stop offset="1" stop-color="#ff9a3c"/></linearGradient><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff3d8b" stop-opacity=".25"/><stop offset="1" stop-color="#ff3d8b" stop-opacity="0"/></linearGradient>';
    svg.appendChild(defs);
    var a = document.createElementNS(ns, 'path'); a.setAttribute('d', da); a.setAttribute('fill', 'url(#ga)'); svg.appendChild(a);
    var l = document.createElementNS(ns, 'path'); l.setAttribute('d', dl); l.setAttribute('fill', 'none'); l.setAttribute('stroke', 'url(#gl)'); l.setAttribute('stroke-width', '2.5'); svg.appendChild(l);
    g.appendChild(svg);
    var dica = el('div', 'dica'); dica.hidden = true; g.appendChild(dica);
    svg.addEventListener('pointermove', function (ev) {
      var b = svg.getBoundingClientRect(), x = (ev.clientX - b.left) * W / b.width, t = t0 + (x - pad) / (W - 2 * pad) * (t1 - t0), mi = 0;
      ts.forEach(function (tt, i) { if (Math.abs(tt - t) < Math.abs(ts[mi] - t)) mi = i; });
      dica.textContent = window.ltData(h[mi][0]) + ' · ' + nomeCurto(h[mi][2]) + ' · ' + pct(h[mi][1]) + '%';
      dica.hidden = false; dica.style.left = Math.min(ev.clientX - g.getBoundingClientRect().left + 10, g.clientWidth - 180) + 'px'; dica.style.top = '10px';
    });
    svg.addEventListener('pointerleave', function () { dica.hidden = true; });
  }

  function eventos() {
    var box = $('eventos'); box.replaceChildren();
    var evs = (D.eventos || []).slice(0, 20);
    if (!evs.length) { box.appendChild(el('p', 'mut', T().ev_vazio)); }
    evs.forEach(function (e) {
      var p = nomeCurto(e.projeto), titulo, texto = tr(e.texto);
      if (e.tipo === 'novo') titulo = T().ev_novo(p); else if (e.tipo === 'removido') titulo = T().ev_removido(p);
      else if (e.tipo === 'voltou') titulo = T().ev_voltou(p); else if (e.tipo === 'marco') titulo = T().ev_marco(p, marcoNome(e.para)); else if (e.tipo === 'video') titulo = T().ev_video(e.projeto ? p : ''); else titulo = T().ev_novidade(p);
      var c = link(e.tipo === 'video' && e.url ? e.url : 'https://github.com/' + e.projeto, 'ev ' + e.tipo);
      if (e.tipo === 'video') c.rel = 'noopener nofollow ugc';
      var q = el('span', 'q'); q.appendChild(el('span', 'bola')); q.appendChild(document.createTextNode(window.ltQuando(e.em))); q.title = window.ltData(e.em);
      c.appendChild(q); c.appendChild(el('b', null, titulo)); if (texto) c.appendChild(el('p', null, texto));
      box.appendChild(c);
    });
    var agora = $('agora'); agora.replaceChildren();
    (D.projetos || []).filter(function (p) { return !p.removido && p.ultimo_commit; })
      .sort(function (a, b) { return a.ultimo_commit.em < b.ultimo_commit.em ? 1 : -1; }).slice(0, 8)
      .forEach(function (p) {
        var a = link(p.ultimo_commit.url, null);
        a.appendChild(el('span', 'q', window.ltQuando(p.ultimo_commit.em)));
        a.appendChild(el('span', 'p', nomeCurto(p.nome)));
        a.appendChild(el('span', 't', p.ultimo_commit.titulo));
        agora.appendChild(a);
      });
  }

  function cartao(p, pos) {
    var a = p.aval || {}, c = el('article', 'card proj' + (p.removido ? ' fora' : ''));
    c.appendChild(el('div', 'pos', p.removido ? '×' : String(pos)));
    var cab = el('div', 'cab'); cab.appendChild(avatar(p, ''));
    var nm = el('div'); nm.appendChild(el('h3', null, nomeCurto(p.nome))); nm.appendChild(link(p.url || ('https://github.com/' + p.nome), 'repo', p.nome)); cab.appendChild(nm);
    c.appendChild(cab);
    var nota = el('div', 'nota'); var b = el('b', 'num', pct(p.pontos)); b.appendChild(el('small', null, '%')); nota.appendChild(b); nota.appendChild(el('span', null, marcoNome(a.marco))); c.appendChild(nota);
    var corpo = el('div', 'corpo'), tags = el('div', 'tags');
    if (p.removido) tags.appendChild(el('span', 'tag fora', T().removido));
    if (a.tipo && a.tipo !== 'outro') tags.appendChild(el('span', 'tag', T().tipo[a.tipo] || a.tipo));
    tags.appendChild(el('span', 'tag', a.alvo === 'GTA VI' ? T().alvo_gta : T().alvo_geral));
    if (a.fonte === 'regras') tags.appendChild(el('span', 'tag est', T().estimativa));
    else if (a.autodeclarado) tags.appendChild(el('span', 'tag auto', T().autodecl));
    if (a.roda_outros) tags.appendChild(el('span', 'tag roda', T().roda + a.roda_outros));
    corpo.appendChild(tags);
    var resumo = tr(a.resumo) || p.descricao; if (resumo) corpo.appendChild(el('p', null, resumo));
    // régua única: cheia até a pontuação real; divisões nos marcos (10 a 50)
    var idx = MARCOS.indexOf(a.marco === 'estavel' ? 'jogo' : (a.marco || 'preparacao'));
    var mk = el('div', 'escada'), cheio = el('b'); var w = Math.max(0.5, Math.min(100, p.pontos || 0)); cheio.style.width = w + '%'; cheio.style.backgroundSize = (10000 / w) + '% 100%'; mk.appendChild(cheio);
    [10, 20, 30, 40, 50].forEach(function (x) { var dv = el('i'); dv.style.left = x + '%'; mk.appendChild(dv); });
    mk.title = pct(p.pontos) + '%';
    var nomes = el('div', 'escada-nomes');
    MARCOS.forEach(function (m, i) { nomes.appendChild(el('span', i < idx || (i === idx && (i === 0 || !a.marco_parcial)) ? 'ok' : (i === idx ? 'meio' : ''), marcoNome(m))); });
    corpo.appendChild(mk); corpo.appendChild(nomes);
    corpo.appendChild(jogarBem(p, a));
    var fn = trLista(a.funciona), tv = trLista(a.travando), pt = a.partes || {};
    var pecas = [['loader', 'p_loader'], ['shaders', 'p_shaders'], ['graficos', 'p_graficos'], ['outro_jogo', 'p_outro']]
      .filter(function (x) { return typeof pt[x[0]] === 'number'; });
    var det = null;
    if (fn.length || tv.length || pecas.length) {
      det = el('div', 'detalhes'); det.hidden = pos > 3 || !!p.removido;
      var g = el('div', 'tres');
      if (pecas.length) {
        var bx = el('div', 'prep'); bx.appendChild(el('h4', null, T().det_prep));
        pecas.forEach(function (x) {
          var v = Math.max(0, Math.min(100, Math.round(pt[x[0]]))), lin = el('div', 'peca');
          var top = el('div', 'peca-t'); top.appendChild(el('span', null, T()[x[1]])); top.appendChild(el('b', 'num', v + '%')); lin.appendChild(top);
          var br = el('i'); br.style.setProperty('--p', v + '%'); lin.appendChild(br); bx.appendChild(lin);
        });
        if (a.roda_outros) bx.appendChild(el('p', 'obs', T().comprovado + a.roda_outros));
        g.appendChild(bx);
      }
      [[fn, 'bom', T().funciona, '✓'], [tv, 'ruim', T().travando, '–']].forEach(function (x) {
        if (!x[0].length) return; var d = el('div', x[1]); d.appendChild(el('h4', null, x[2])); var ul = el('ul');
        x[0].forEach(function (s) { var li = el('li'); li.appendChild(el('span', 'm', x[3])); li.appendChild(el('span', null, s)); ul.appendChild(li); });
        d.appendChild(ul); g.appendChild(d);
      });
      det.appendChild(g); corpo.appendChild(det);
    }
    var st = el('div', 'stats');
    var s1 = el('span'); s1.appendChild(el('b', 'num', '★ ' + fmt(p.estrelas || 0))); if (p.estrelas_24h > 0) s1.appendChild(document.createTextNode(' (+' + fmt(p.estrelas_24h) + ' 24 h)')); st.appendChild(s1);
    if (!p.removido) {
      var s2 = el('span'); s2.appendChild(el('b', 'num', (p.commits_cheio && p.commits_24h >= 60 ? '60+' : fmt(p.commits_24h || 0)))); s2.appendChild(document.createTextNode(' ' + T().commits24)); st.appendChild(s2);
      if (p.ultimo_commit) { var s3 = el('span'); s3.appendChild(document.createTextNode(T().ultimo + ' ')); s3.appendChild(link(p.ultimo_commit.url, null, window.ltQuando(p.ultimo_commit.em))); st.appendChild(s3); }
      if (p.verificado_em) st.appendChild(el('span', null, T().verificado + window.ltQuando(p.verificado_em)));
    } else if (p.removido_em) st.appendChild(el('span', null, T().removido + ' ' + window.ltQuando(p.removido_em)));
    corpo.appendChild(st);
    var rod = el('div', 'rodcard');
    rod.appendChild(el('span', 'avl', (a.fonte === 'ia' ? T().aval_ia : T().aval_reg) + (p.aval_em ? window.ltQuando(p.aval_em) : '')));
    if (det) {
      var bt = el('button', 'btn-det', det.hidden ? T().ver_det : T().ocultar_det); bt.type = 'button';
      bt.onclick = function () { det.hidden = !det.hidden; bt.textContent = det.hidden ? T().ver_det : T().ocultar_det; };
      rod.appendChild(bt);
    }
    rod.appendChild(link(p.url || ('https://github.com/' + p.nome), 'btn-gh', T().github));
    corpo.appendChild(rod);
    c.appendChild(corpo);
    return c;
  }

  function jogarBem(p, a) {
    var jg = a.jogar || {}, bs = p.barras, box = el('div', 'jogar' + (bs ? '' : ' antes'));
    if (!bs) box.title = T().antes_jogavel;
    BARRAS.forEach(function (b) {
      var k = b[0], v = k === 'desempenho' ? jg.fps : jg[k], txt;
      if (v == null || isNaN(+v)) txt = bs ? T().sem_dado : '–';
      else if (k === 'desempenho') txt = (Math.round(v * 10) / 10) + ' FPS';
      else txt = (T()[b[3]] || [])[Math.max(0, Math.min(b[2], Math.round(v)))] || '';
      var pts = bs && bs[k] != null ? bs[k] : 0;
      var c = el('div', 'jb'), top = el('div', 'jb-t');
      top.appendChild(el('b', null, T()['b_' + k])); top.appendChild(el('span', null, txt)); c.appendChild(top);
      var br = el('i'); br.style.setProperty('--p', (100 * pts / b[1]) + '%'); c.appendChild(br);
      c.title = T()['b_' + k + '_d'] + ' (' + pct(pts) + ' / ' + pct(b[1]) + ' ' + T().pts + ')';
      box.appendChild(c);
    });
    return box;
  }

  function ranking() {
    var box = $('lista'); box.replaceChildren();
    var ps = (D.projetos || []).filter(function (p) {
      var a = p.aval || {};
      if (filtroAlvo === 'gta') return a.alvo === 'GTA VI';
      if (filtroAlvo === 'geral') return a.alvo !== 'GTA VI';
      return true;
    });
    var ativos = ps.filter(function (p) { return !p.removido; }), fora = ps.filter(function (p) { return p.removido; });
    var chave = {pontos: function (p) { return [p.pontos || 0, p.estrelas || 0]; }, atividade: function (p) { return [p.commits_24h || 0, p.pontos || 0]; }, estrelas: function (p) { return [p.estrelas || 0, p.pontos || 0]; }}[ordem];
    ativos.sort(function (a, b) { var x = chave(a), y = chave(b); return (y[0] - x[0]) || (y[1] - x[1]); });
    var lim = mostrarTodos ? ativos.length : Math.min(ativos.length, 12);
    ativos.slice(0, lim).forEach(function (p, i) { box.appendChild(cartao(p, i + 1)); });
    if (ativos.length > 12) {
      var bt = el('button', 'mais', mostrarTodos ? T().menos : T().mais(ativos.length)); bt.type = 'button';
      bt.addEventListener('click', function () { mostrarTodos = !mostrarTodos; ranking(); });
      box.appendChild(bt);
    }
    fora.forEach(function (p) { box.appendChild(cartao(p, 0)); });
  }

  function desenha() { if (!D) return; aplicaTextos(); topo(); trilha(); grafico(); eventos(); ranking(); }

  function carrega() {
    return fetch('corrida.json?t=' + Date.now(), {cache: 'no-store'}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { D = j; desenha(); })
      .catch(function () { if (!D) $('lista').textContent = T().erro_dados; });
  }

  function seg(id, fn) {
    var s = $(id); if (!s) return;
    s.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      s.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      fn(b.getAttribute('data-v')); ranking();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    aplicaTextos();
    $('lista').textContent = T().sem_dados;
    var s = $('lt-lang');
    if (s) s.addEventListener('change', function () { window.ltLang = s.value; ls.set('rv-lang', s.value); desenha(); aplicaTextos(); });
    seg('f-alvo', function (v) { filtroAlvo = v; mostrarTodos = false; });
    seg('f-ordem', function (v) { ordem = v; mostrarTodos = false; });
    carrega();
    setInterval(carrega, 120000);
    setInterval(function () { if (D) { $('atualizado').textContent = T().atualizado + window.ltQuando(D.resumo.gerado_em); } }, 30000);
    var w = window.innerWidth; window.addEventListener('resize', function () { if (window.innerWidth !== w) { w = window.innerWidth; if (D) grafico(); } });
  });
})();
