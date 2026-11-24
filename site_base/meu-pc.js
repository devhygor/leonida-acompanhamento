/* Radar VI — "Meu PC roda?": compara o PC da pessoa com um console (ou outro PC).
   Os índices são aproximações de desempenho em jogos (GPU: RTX 3060 = 100; CPU: Ryzen 5 3600 = 100),
   montados a partir de médias públicas de benchmarks. Servem para comparar ordens de grandeza, não FPS. */
(function () {
  'use strict';

  // [nome, índice, VRAM GB, mesh shaders/SM 6.6]
  var GPUS = {
    'NVIDIA': [
      ['GTX 1050 Ti', 33, 4, 0], ['GTX 1060 6 GB', 50, 6, 0], ['GTX 1070', 63, 8, 0], ['GTX 1080', 78, 8, 0], ['GTX 1080 Ti', 98, 11, 0],
      ['GTX 1650', 40, 4, 0], ['GTX 1650 Super', 52, 4, 0], ['GTX 1660', 58, 6, 0], ['GTX 1660 Super', 64, 6, 0], ['GTX 1660 Ti', 65, 6, 0],
      ['RTX 2060', 82, 6, 1], ['RTX 2060 Super', 94, 8, 1], ['RTX 2070', 100, 8, 1], ['RTX 2070 Super', 112, 8, 1], ['RTX 2080', 120, 8, 1],
      ['RTX 2080 Super', 126, 8, 1], ['RTX 2080 Ti', 148, 11, 1],
      ['RTX 3050', 64, 8, 1], ['RTX 3060', 100, 12, 1], ['RTX 3060 Ti', 128, 8, 1], ['RTX 3070', 145, 8, 1], ['RTX 3070 Ti', 153, 8, 1],
      ['RTX 3080', 180, 10, 1], ['RTX 3080 Ti', 197, 12, 1], ['RTX 3090', 203, 24, 1], ['RTX 3090 Ti', 222, 24, 1],
      ['RTX 4060', 118, 8, 1], ['RTX 4060 Ti', 138, 8, 1], ['RTX 4070', 175, 12, 1], ['RTX 4070 Super', 205, 12, 1], ['RTX 4070 Ti', 222, 12, 1],
      ['RTX 4070 Ti Super', 238, 16, 1], ['RTX 4080', 270, 16, 1], ['RTX 4080 Super', 278, 16, 1], ['RTX 4090', 345, 24, 1],
      ['RTX 5060', 140, 8, 1], ['RTX 5060 Ti', 160, 16, 1], ['RTX 5070', 225, 12, 1], ['RTX 5070 Ti', 275, 16, 1], ['RTX 5080', 310, 16, 1], ['RTX 5090', 440, 32, 1]
    ],
    'AMD': [
      ['RX 570', 48, 4, 0], ['RX 580', 52, 8, 0], ['RX 5500 XT', 52, 8, 0], ['RX 5600 XT', 78, 6, 0], ['RX 5700', 88, 8, 0], ['RX 5700 XT', 98, 8, 0],
      ['RX 6500 XT', 45, 4, 1], ['RX 6600', 92, 8, 1], ['RX 6600 XT', 106, 8, 1], ['RX 6650 XT', 112, 8, 1], ['RX 6700 XT', 135, 12, 1],
      ['RX 6750 XT', 142, 12, 1], ['RX 6800', 168, 16, 1], ['RX 6800 XT', 192, 16, 1], ['RX 6900 XT', 207, 16, 1], ['RX 6950 XT', 218, 16, 1],
      ['RX 7600', 115, 8, 1], ['RX 7600 XT', 120, 16, 1], ['RX 7700 XT', 162, 12, 1], ['RX 7800 XT', 190, 16, 1], ['RX 7900 GRE', 210, 16, 1],
      ['RX 7900 XT', 250, 20, 1], ['RX 7900 XTX', 285, 24, 1], ['RX 9060 XT', 150, 16, 1], ['RX 9070', 245, 16, 1], ['RX 9070 XT', 275, 16, 1]
    ],
    'Intel': [['Arc A750', 105, 8, 1], ['Arc A770', 112, 16, 1], ['Arc B570', 112, 10, 1], ['Arc B580', 125, 12, 1]]
  };

  // [nome, índice, núcleos, threads, AVX2]
  var CPUS = {
    'Intel': [
      ['Core i5-3570', 45, 4, 4, 0], ['Core i7-3770', 50, 4, 8, 0], ['Core i5-4690', 55, 4, 4, 1], ['Core i7-4790K', 65, 4, 8, 1],
      ['Core i5-6600K', 65, 4, 4, 1], ['Core i7-6700K', 75, 4, 8, 1], ['Core i5-7600K', 70, 4, 4, 1], ['Core i7-7700K', 80, 4, 8, 1],
      ['Core i5-8400', 82, 6, 6, 1], ['Core i7-8700K', 95, 6, 12, 1], ['Core i5-9400F', 85, 6, 6, 1], ['Core i7-9700K', 105, 8, 8, 1],
      ['Core i9-9900K', 108, 8, 16, 1], ['Core i3-10100', 85, 4, 8, 1], ['Core i5-10400F', 92, 6, 12, 1], ['Core i7-10700K', 115, 8, 16, 1],
      ['Core i9-10900K', 120, 10, 20, 1], ['Core i5-11400F', 108, 6, 12, 1], ['Core i7-11700K', 122, 8, 16, 1], ['Core i3-12100F', 110, 4, 8, 1],
      ['Core i5-12400F', 125, 6, 12, 1], ['Core i5-12600K', 140, 10, 16, 1], ['Core i7-12700K', 152, 12, 20, 1], ['Core i9-12900K', 160, 16, 24, 1],
      ['Core i5-13400F', 135, 10, 16, 1], ['Core i5-13600K', 160, 14, 20, 1], ['Core i7-13700K', 170, 16, 24, 1], ['Core i9-13900K', 180, 24, 32, 1],
      ['Core i5-14600K', 165, 14, 20, 1], ['Core i7-14700K', 175, 20, 28, 1], ['Core i9-14900K', 185, 24, 32, 1],
      ['Core Ultra 5 245K', 160, 14, 14, 1], ['Core Ultra 7 265K', 172, 20, 20, 1], ['Core Ultra 9 285K', 180, 24, 24, 1]
    ],
    'AMD': [
      ['FX-8350', 40, 8, 8, 0], ['Ryzen 5 1600', 65, 6, 12, 1], ['Ryzen 7 1700', 70, 8, 16, 1], ['Ryzen 5 2600', 75, 6, 12, 1],
      ['Ryzen 7 2700X', 82, 8, 16, 1], ['Ryzen 5 3600', 100, 6, 12, 1], ['Ryzen 7 3700X', 106, 8, 16, 1], ['Ryzen 9 3900X', 112, 12, 24, 1],
      ['Ryzen 5 5500', 108, 6, 12, 1], ['Ryzen 5 5600', 130, 6, 12, 1], ['Ryzen 5 5600X', 133, 6, 12, 1], ['Ryzen 7 5700X', 138, 8, 16, 1],
      ['Ryzen 7 5800X', 142, 8, 16, 1], ['Ryzen 7 5800X3D', 165, 8, 16, 1], ['Ryzen 9 5900X', 145, 12, 24, 1], ['Ryzen 9 5950X', 148, 16, 32, 1],
      ['Ryzen 5 7600', 160, 6, 12, 1], ['Ryzen 5 7600X', 163, 6, 12, 1], ['Ryzen 7 7700X', 170, 8, 16, 1], ['Ryzen 7 7800X3D', 200, 8, 16, 1],
      ['Ryzen 9 7950X', 182, 16, 32, 1], ['Ryzen 5 9600X', 172, 6, 12, 1], ['Ryzen 7 9700X', 180, 8, 16, 1], ['Ryzen 7 9800X3D', 220, 8, 16, 1],
      ['Ryzen 9 9950X', 192, 16, 32, 1]
    ]
  };

  // consoles: índices na mesma escala
  var ALVOS = {
    xsx: { nome: 'Xbox Series X', cpu: 88, gpu: 115, ram: 16, cores: 8, threads: 16,
      cpuTxt: 'AMD Zen 2 · 8 núcleos / 16 threads · 3,66 GHz', gpuTxt: 'AMD RDNA 2 · 52 CUs · 12,15 TFLOPS', ramTxt: '16 GB GDDR6' },
    xss: { nome: 'Xbox Series S', cpu: 84, gpu: 45, ram: 10, cores: 8, threads: 16,
      cpuTxt: 'AMD Zen 2 · 8 núcleos / 16 threads · 3,4 GHz', gpuTxt: 'AMD RDNA 2 · 20 CUs · 4 TFLOPS', ramTxt: '10 GB GDDR6' },
    ps5: { nome: 'PlayStation 5', cpu: 85, gpu: 100, ram: 16, cores: 8, threads: 16,
      cpuTxt: 'AMD Zen 2 · 8 núcleos / 16 threads · até 3,5 GHz', gpuTxt: 'AMD RDNA 2 · 36 CUs · 10,3 TFLOPS', ramTxt: '16 GB GDDR6' },
    ps5pro: { nome: 'PlayStation 5 Pro', cpu: 90, gpu: 150, ram: 18, cores: 8, threads: 16,
      cpuTxt: 'AMD Zen 2 · 8 núcleos / 16 threads · até 3,85 GHz', gpuTxt: 'AMD RDNA · 60 CUs · 16,7 TFLOPS', ramTxt: '16 GB GDDR6 + 2 GB DDR5' },
    pc: { nome: null }
  };

  var I = {
    pt: {
      nav: 'Meu PC roda?', k: 'Calculadora', t: 'Meu PC roda?',
      sub: 'Coloque as peças do seu PC e compare com um console (ou com outro PC). Mostramos quanto seu PC é mais forte ou mais fraco em cada parte e se ele cumpre o que as camadas de compatibilidade de hoje exigem.',
      comparar: 'Comparar com', outro_pc: 'Outro PC', seu_pc: 'Seu PC', cpu: 'Processador', gpu: 'Placa de vídeo', ram: 'Memória RAM',
      escolha: 'Escolha…', detectada: 'detectada pelo navegador', o_outro: 'O outro PC',
      forte: 'mais forte', fraco: 'mais fraco', igual: 'praticamente igual', geral: 'Poder total',
      v_bloq: 'Não roda', v_folga: 'Folgado', v_faixa: 'Na faixa', v_limite: 'No limite', v_fraco: 'Fraco demais',
      d_bloq: 'Falta algo que as camadas atuais exigem (veja abaixo). Não é questão de desempenho.',
      d_folga: 'Seu PC tem sobra em relação ao console. Quando algum port ficar jogável, deve dar conta com folga.',
      d_faixa: 'Seu PC fica na mesma faixa do console. Lembre que rodar o jogo por uma camada de compatibilidade costuma custar desempenho extra.',
      d_limite: 'Abaixo do console. Talvez rode com qualidade e resolução reduzidas.',
      d_fraco: 'Bem abaixo do console. Dificilmente vai rodar de forma aceitável.',
      d_pc: function (n) { return 'Comparação entre o seu PC e ' + n + '.'; },
      gargalo: function (p) { return 'O ponto mais fraco é ' + p + '.'; },
      req: 'Requisitos das camadas atuais', r_avx: 'Processador com AVX2', r_avx_n: 'O código do Xbox é x86-64 feito para Zen 2 e roda direto no processador: sem AVX2, não roda.',
      r_mesh: 'Placa com mesh shaders (DirectX 12 Ultimate)', r_mesh_n: 'As camadas mais avançadas (ex.: xcl) traduzem os mesh shaders do jogo; placas GTX 10/16 e RX 5000 não têm.',
      r_vram: 'Pelo menos 8 GB de memória de vídeo', r_ram: 'Pelo menos 16 GB de RAM (32 GB recomendado)',
      r_ram_n: 'O xcl relata ~15 GB em uso só nos menus.', r_cores: 'Pelo menos 6 núcleos (o console tem 8)',
      aviso: 'Estimativa não oficial. Nenhum port do GTA VI é jogável hoje; os números comparam o poder bruto das peças, não garantem FPS.',
      indice: 'Índices aproximados de benchmarks públicos (placa: RTX 3060 = 100; processador: Ryzen 5 3600 = 100).',
      vs: 'vs', gb: 'GB'
    },
    en: {
      nav: 'Can my PC run it?', k: 'Calculator', t: 'Can my PC run it?',
      sub: 'Pick your PC parts and compare them with a console (or another PC). We show how much stronger or weaker each part is and whether it meets what today\'s compatibility layers require.',
      comparar: 'Compare with', outro_pc: 'Another PC', seu_pc: 'Your PC', cpu: 'Processor', gpu: 'Graphics card', ram: 'RAM',
      escolha: 'Choose…', detectada: 'detected by your browser', o_outro: 'The other PC',
      forte: 'stronger', fraco: 'weaker', igual: 'about the same', geral: 'Overall power',
      v_bloq: "Won't run", v_folga: 'Plenty', v_faixa: 'In range', v_limite: 'Borderline', v_fraco: 'Too weak',
      d_bloq: "Something current layers require is missing (see below). It isn't about performance.",
      d_folga: 'Your PC has headroom over the console. Once a port is playable, it should handle it comfortably.',
      d_faixa: 'Your PC is in the console\'s range. Running through a compatibility layer usually costs extra performance.',
      d_limite: 'Below the console. It may run with lower quality and resolution.',
      d_fraco: 'Well below the console. Unlikely to run acceptably.',
      d_pc: function (n) { return 'Comparing your PC with ' + n + '.'; },
      gargalo: function (p) { return 'The weakest part is the ' + p + '.'; },
      req: 'What current layers require', r_avx: 'CPU with AVX2', r_avx_n: "Xbox code is x86-64 built for Zen 2 and runs directly on your CPU: without AVX2 it won't run.",
      r_mesh: 'GPU with mesh shaders (DirectX 12 Ultimate)', r_mesh_n: "The most advanced layers (e.g. xcl) translate the game's mesh shaders; GTX 10/16 and RX 5000 cards lack them.",
      r_vram: 'At least 8 GB of video memory', r_ram: 'At least 16 GB of RAM (32 GB recommended)',
      r_ram_n: 'xcl reports ~15 GB in use just in the menus.', r_cores: 'At least 6 cores (the console has 8)',
      aviso: 'Unofficial estimate. No GTA VI port is playable today; the numbers compare raw part power and do not guarantee FPS.',
      indice: 'Approximate indexes from public benchmarks (GPU: RTX 3060 = 100; CPU: Ryzen 5 3600 = 100).',
      vs: 'vs', gb: 'GB'
    },
    es: {
      nav: '¿Mi PC lo corre?', k: 'Calculadora', t: '¿Mi PC lo corre?',
      sub: 'Elige las piezas de tu PC y compáralas con una consola (u otro PC). Mostramos cuánto más fuerte o más débil es cada pieza y si cumple lo que exigen las capas de compatibilidad actuales.',
      comparar: 'Comparar con', outro_pc: 'Otro PC', seu_pc: 'Tu PC', cpu: 'Procesador', gpu: 'Tarjeta gráfica', ram: 'Memoria RAM',
      escolha: 'Elige…', detectada: 'detectada por el navegador', o_outro: 'El otro PC',
      forte: 'más fuerte', fraco: 'más débil', igual: 'prácticamente igual', geral: 'Potencia total',
      v_bloq: 'No corre', v_folga: 'Con margen', v_faixa: 'En el rango', v_limite: 'Al límite', v_fraco: 'Demasiado débil',
      d_bloq: 'Falta algo que las capas actuales exigen (mira abajo). No es cuestión de rendimiento.',
      d_folga: 'Tu PC tiene margen sobre la consola. Cuando algún port sea jugable, debería correrlo con holgura.',
      d_faixa: 'Tu PC está en el rango de la consola. Correr el juego con una capa de compatibilidad suele costar rendimiento extra.',
      d_limite: 'Por debajo de la consola. Quizá corra con calidad y resolución reducidas.',
      d_fraco: 'Muy por debajo de la consola. Difícilmente correrá de forma aceptable.',
      d_pc: function (n) { return 'Comparación entre tu PC y ' + n + '.'; },
      gargalo: function (p) { return 'La pieza más débil es ' + p + '.'; },
      req: 'Lo que exigen las capas actuales', r_avx: 'Procesador con AVX2', r_avx_n: 'El código de Xbox es x86-64 hecho para Zen 2 y corre directo en el procesador: sin AVX2 no corre.',
      r_mesh: 'Tarjeta con mesh shaders (DirectX 12 Ultimate)', r_mesh_n: 'Las capas más avanzadas (ej.: xcl) traducen los mesh shaders del juego; las GTX 10/16 y RX 5000 no los tienen.',
      r_vram: 'Al menos 8 GB de memoria de video', r_ram: 'Al menos 16 GB de RAM (32 GB recomendado)',
      r_ram_n: 'xcl reporta ~15 GB en uso solo en los menús.', r_cores: 'Al menos 6 núcleos (la consola tiene 8)',
      aviso: 'Estimación no oficial. Ningún port de GTA VI es jugable hoy; los números comparan la potencia bruta de las piezas, no garantizan FPS.',
      indice: 'Índices aproximados de benchmarks públicos (gráfica: RTX 3060 = 100; procesador: Ryzen 5 3600 = 100).',
      vs: 'vs', gb: 'GB'
    }
  };
  function T() { return I[window.ltLang] || I.pt; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  function acha(base, nome) {
    for (var m in base) for (var i = 0; i < base[m].length; i++) if (base[m][i][0] === nome) return base[m][i];
    return null;
  }

  function preencher(sel, base, rot) {
    var atual = sel.value; sel.replaceChildren(); sel.appendChild(new Option(T().escolha, ''));
    Object.keys(base).forEach(function (m) {
      var g = document.createElement('optgroup'); g.label = m;
      base[m].forEach(function (x) { g.appendChild(new Option((rot ? m + ' ' : '') + x[0], x[0])); });
      sel.appendChild(g);
    });
    sel.value = atual;
  }

  // tenta descobrir a placa pelo WebGL (só o nome do modelo, nada é enviado)
  function detectaGpu() {
    try {
      var c = document.createElement('canvas'), gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      var ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      var r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
      r = (r || '').toUpperCase().replace(/\s+/g, ' ');
      var melhor = null;
      Object.keys(GPUS).forEach(function (m) {
        GPUS[m].forEach(function (x) {
          var chave = x[0].toUpperCase().replace(' 6 GB', '');
          var rx = new RegExp('\\b' + chave.replace(/ /g, '\\s?') + '(?![\\w])(?!\\s(TI|SUPER|XT|XTX|GRE))');
          if (rx.test(r) && (!melhor || chave.length > melhor[0].length)) melhor = x;
        });
      });
      return melhor ? melhor[0] : null;
    } catch (e) { return null; }
  }

  function linhaPct(nome, meu, alvo) {
    var r = meu / alvo, pct = Math.round((r - 1) * 100);
    var lin = el('div', 'mp-linha');
    var top = el('div', 'mp-lt');
    top.appendChild(el('span', null, nome));
    var cls = Math.abs(pct) < 5 ? 'mp-igual' : pct > 0 ? 'mp-mais' : 'mp-menos';
    var txt = Math.abs(pct) < 5 ? T().igual : (pct > 0 ? '+' : '−') + Math.abs(pct) + '% ' + (pct > 0 ? T().forte : T().fraco);
    top.appendChild(el('b', 'mp-pct ' + cls, txt));
    lin.appendChild(top);
    // barra: o alvo fica na marca do meio (100%), escala até 250%
    var bar = el('div', 'mp-bar'), max = Math.max(2, r * 1.1);
    var f = el('i', cls); f.style.width = Math.min(100, (r / max) * 100) + '%'; bar.appendChild(f);
    var mk = el('em'); mk.style.left = (100 / max) + '%'; bar.appendChild(mk);
    lin.appendChild(bar);
    return { el: lin, r: r };
  }

  function calcular() {
    var t = T(), alvoId = $('mp-alvo').value, alvo = ALVOS[alvoId];
    var cpu = acha(CPUS, $('mp-cpu').value), gpu = acha(GPUS, $('mp-gpu').value), ram = +$('mp-ram').value;
    $('mp-ram-v').textContent = ram + ' ' + t.gb;
    var outro = $('mp-outro'); outro.hidden = alvoId !== 'pc';
    if (alvoId === 'pc') {
      var oc = acha(CPUS, $('mp-ocpu').value), og = acha(GPUS, $('mp-ogpu').value), or_ = +$('mp-oram').value;
      $('mp-oram-v').textContent = or_ + ' ' + t.gb;
      alvo = oc && og ? { nome: t.o_outro, cpu: oc[1], gpu: og[1], ram: or_, cpuTxt: oc[0], gpuTxt: og[0] + ' · ' + og[2] + ' GB', ramTxt: or_ + ' GB' } : null;
    }
    ['mp-cpu', 'mp-gpu', 'mp-ram', 'mp-alvo', 'mp-ocpu', 'mp-ogpu', 'mp-oram'].forEach(function (id) { ls.set('rv-' + id, $(id).value); });
    var box = $('mp-res'); box.replaceChildren();
    if (!cpu || !gpu || !alvo) { box.appendChild(el('p', 'mp-vazio', t.escolha)); return; }

    var a = linhaPct(t.gpu, gpu[1], alvo.gpu), b = linhaPct(t.cpu, cpu[1], alvo.cpu), c = linhaPct(t.ram, ram, alvo.ram);
    // poder total: média geométrica ponderada (placa pesa mais em jogo)
    var total = Math.pow(a.r, 0.6) * Math.pow(b.r, 0.4), pt = Math.round((total - 1) * 100);

    var bloqueios = [];
    var reqs = [
      [t.r_avx, !!cpu[4], t.r_avx_n, true],
      [t.r_mesh, !!gpu[3], t.r_mesh_n, true],
      [t.r_vram, gpu[2] >= 8, null, false],
      [t.r_ram, ram >= 16, t.r_ram_n, ram < 12],
      [t.r_cores, cpu[2] >= 6, null, false]
    ];
    reqs.forEach(function (r) { if (!r[1] && r[3]) bloqueios.push(r[0]); });

    var v, d, cls;
    if (alvoId === 'pc') {
      v = (pt >= 0 ? '+' : '−') + Math.abs(pt) + '%'; d = t.d_pc(t.o_outro.toLowerCase()); cls = pt >= 0 ? 'ok' : 'warn';
    } else if (bloqueios.length) { v = t.v_bloq; d = t.d_bloq; cls = 'bad'; }
    else if (total >= 1.25 && ram >= 32) { v = t.v_folga; d = t.d_folga; cls = 'ok'; }
    else if (total >= 0.95) { v = t.v_faixa; d = t.d_faixa; cls = 'teal'; }
    else if (total >= 0.7) { v = t.v_limite; d = t.d_limite; cls = 'warn'; }
    else { v = t.v_fraco; d = t.d_fraco; cls = 'bad'; }

    var topo = el('div', 'mp-topo');
    var esq = el('div');
    esq.appendChild(el('div', 'rotulo', t.seu_pc + ' ' + t.vs + ' ' + alvo.nome));
    esq.appendChild(el('div', 'mp-veredito ' + cls, v));
    esq.appendChild(el('p', 'mp-desc', d));
    topo.appendChild(esq);
    var dir = el('div', 'mp-total');
    dir.appendChild(el('b', 'num ' + (Math.abs(pt) < 5 ? 'mp-igual' : pt >= 0 ? 'mp-mais' : 'mp-menos'), (pt >= 0 ? '+' : '−') + Math.abs(pt) + '%'));
    dir.appendChild(el('span', null, t.geral + ' · ' + (Math.abs(pt) < 5 ? t.igual : pt > 0 ? t.forte : t.fraco)));
    topo.appendChild(dir);
    box.appendChild(topo);

    var linhas = el('div', 'mp-linhas');
    [[a, gpu[0] + ' · ' + gpu[2] + ' GB', alvo.gpuTxt], [b, cpu[0] + ' · ' + cpu[2] + 'c/' + cpu[3] + 't', alvo.cpuTxt], [c, ram + ' GB', alvo.ramTxt]].forEach(function (x) {
      var cmp = el('div', 'mp-cmp'); cmp.appendChild(el('span', null, x[1])); cmp.appendChild(el('span', 'mut', t.vs + ' ' + x[2]));
      x[0].el.appendChild(cmp); linhas.appendChild(x[0].el);
    });
    box.appendChild(linhas);
    var fraca = [[a.r, t.gpu], [b.r, t.cpu]].sort(function (x, y) { return x[0] - y[0]; })[0];
    if (fraca[0] < 1 && Math.abs(a.r - b.r) > 0.15) box.appendChild(el('p', 'mp-gargalo', t.gargalo(fraca[1].toLowerCase())));

    var rq = el('div', 'mp-req'); rq.appendChild(el('h4', null, t.req));
    var ul = el('ul');
    reqs.forEach(function (r) {
      var li = el('li', r[1] ? 'ok' : (r[3] ? 'bad' : 'warn'));
      li.appendChild(el('span', 'm', r[1] ? '✓' : (r[3] ? '✕' : '!')));
      var tx = el('span'); tx.appendChild(el('b', null, r[0])); if (r[2] && (!r[1] || r[0] === t.r_ram)) tx.appendChild(el('small', null, r[2]));
      li.appendChild(tx); ul.appendChild(li);
    });
    rq.appendChild(ul); box.appendChild(rq);
  }

  function textos() {
    var t = T();
    document.querySelectorAll('[data-mp]').forEach(function (e) { var v = t[e.getAttribute('data-mp')]; if (typeof v === 'string') e.textContent = v; });
    var o = $('mp-alvo').querySelector('option[value="pc"]'); if (o) o.textContent = t.outro_pc;
    ['mp-cpu', 'mp-ocpu'].forEach(function (id) { preencher($(id), CPUS, true); });
    ['mp-gpu', 'mp-ogpu'].forEach(function (id) { preencher($(id), GPUS, true); });
    ['mp-cpu', 'mp-gpu', 'mp-ram', 'mp-alvo', 'mp-ocpu', 'mp-ogpu', 'mp-oram'].forEach(function (id) { var v = ls.get('rv-' + id); if (v && !$(id).dataset.ok) { $(id).value = v; } $(id).dataset.ok = 1; });
    calcular();
  }

  function iniciar() {
    if (!$('mp-alvo')) return;
    var sel = $('mp-alvo');
    Object.keys(ALVOS).forEach(function (k) { sel.appendChild(new Option(ALVOS[k].nome || T().outro_pc, k)); });
    textos();
    var g = detectaGpu();
    if (g && !$('mp-gpu').value) { $('mp-gpu').value = g; calcular(); }
    var marca = function () { $('mp-gpu-det').hidden = !g || $('mp-gpu').value !== g; };
    marca(); $('mp-gpu').addEventListener('change', marca);
    ['mp-cpu', 'mp-gpu', 'mp-ram', 'mp-alvo', 'mp-ocpu', 'mp-ogpu', 'mp-oram'].forEach(function (id) {
      $(id).addEventListener('input', calcular); $(id).addEventListener('change', calcular);
    });
    var l = $('lt-lang'); if (l) l.addEventListener('change', function () { setTimeout(textos, 0); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
