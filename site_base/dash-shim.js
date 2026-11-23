/* Implementação mínima da API `dash` usada por pagina/index.html, para a página rodar sozinha (GitHub Pages).
   Lê leonida.json ao lado da página e recarrega a cada 2 minutos. */
(function () {
  var raw = null, status = 'loading', memo = {};
  var calcs = {}, draws = new Map();

  function get(id) {
    if (id === 'leonida') return {status: status, data: raw};
    var c = calcs[id];
    if (!c) return {status: 'missing', data: []};
    if (status !== 'ok') return {status: status, data: []};
    try {
      var args = c.inputs.map(function (i) { return window.dash.data(i).data; });
      return {status: 'ok', data: c.fn.apply(null, args)};
    } catch (e) { console.error('calc', id, e); return {status: 'error', data: []}; }
  }

  function run(name) {
    var fn = draws.get(name);
    if (!fn) return;
    document.querySelectorAll('[data-draw="' + name + '"]').forEach(function (el) {
      if (el.closest('[hidden]')) return;
      try { fn(el); } catch (e) { console.error('draw', name, e); }
    });
  }

  function runAll() { memo = {}; draws.forEach(function (_, n) { run(n); }); }

  window.dash = {
    data: function (id) { if (!(id in memo)) memo[id] = get(id); return memo[id]; },
    calc: function (id, def) { calcs[id] = def; },
    loader: function () {},
    draw: function (name, fn) { if (typeof fn === 'function') draws.set(name, fn); else run(name); },
    onData: function () {},
    colors: ['var(--n-teal)', 'var(--n-pink)', 'var(--n-yellow)', 'var(--n-orange)'],
    setLink: function (id) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignora */ } },
    params: function () { return {}; }, setParams: function () {}, resetParams: function () {},
    refresh: function () { carrega(); }
  };

  function carrega() {
    return fetch('leonida.json?t=' + Date.now(), {cache: 'no-store'})
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { raw = j; status = 'ok'; })
      .catch(function (e) { console.error(e); if (raw === null) status = 'error'; })
      .then(runAll);
  }

  document.addEventListener('DOMContentLoaded', function () {
    runAll();
    carrega();
    setInterval(carrega, 120000);
    var w = window.innerWidth, t = null;
    window.addEventListener('resize', function () {
      if (window.innerWidth === w) return;
      w = window.innerWidth; clearTimeout(t); t = setTimeout(runAll, 150);
    });
    /* Ao trocar de aba, desenha o que estava escondido. Só observa as abas (tooltips também usam hidden). */
    var mo = new MutationObserver(function () { runAll(); });
    document.querySelectorAll('.lt-pane').forEach(function (p) { mo.observe(p, {attributes: true, attributeFilter: ['hidden']}); });
  });
})();
