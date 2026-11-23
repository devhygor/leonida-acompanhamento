/* Ao vivo: contador de visitas, pessoas online agora (Supabase Realtime Presence) e chat.
   A chave abaixo é a chave pública (anon) do projeto Supabase "leonida": feita para ficar no navegador.
   As tabelas são fechadas; só as funções leonida_visita() e leonida_enviar() aceitam chamadas, com travas anti-spam no banco. */
(function () {
  var SUPA_URL = 'https://gsacerihsbalosqgnraw.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYWNlcmloc2JhbG9zcWducmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NTczNDMsImV4cCI6MjExMTAzMzM0M30.dUWa_UaPVh4kTdrb4mZi7kGWvXLvX3UfJZgCMweHMN4';

  var TXT = {
    pt: {enviar: 'Enviar', nick: 'Seu apelido', msg: 'Escreva uma mensagem…', vazio: 'Escreva algo antes de enviar.', rapido: 'Calma: espere alguns segundos entre mensagens.',
      limite: 'Muitas mensagens seguidas. Espere um pouco.', mudo: 'Você enviou mensagens demais e ficou 15 minutos sem poder escrever.', repetido: 'Essa mensagem é igual à anterior.',
      link: 'Links não são permitidos no chat.', flood: 'Muitas letras repetidas. Escreva normalmente.', caps: 'Evite escrever tudo em maiúsculas.',
      apelido: 'Esse apelido é reservado. Escolha outro.', banido: 'Você foi bloqueado no chat.', erro: 'Não deu para enviar. Tente de novo.', semMsg: 'Nenhuma mensagem ainda. Comece a conversa!',
      offline: 'Chat indisponível no momento.'},
    en: {enviar: 'Send', nick: 'Your nickname', msg: 'Write a message…', vazio: 'Write something before sending.', rapido: 'Easy: wait a few seconds between messages.',
      limite: 'Too many messages in a row. Wait a bit.', mudo: 'You sent too many messages and are muted for 15 minutes.', repetido: 'That message is the same as your last one.',
      link: 'Links are not allowed in the chat.', flood: 'Too many repeated characters. Write normally.', caps: 'Please avoid writing in all caps.',
      apelido: 'That nickname is reserved. Pick another one.', banido: 'You have been blocked from the chat.', erro: 'Could not send. Try again.', semMsg: 'No messages yet. Start the conversation!',
      offline: 'Chat is unavailable right now.'},
    es: {enviar: 'Enviar', nick: 'Tu apodo', msg: 'Escribe un mensaje…', vazio: 'Escribe algo antes de enviar.', rapido: 'Tranquilo: espera unos segundos entre mensajes.',
      limite: 'Demasiados mensajes seguidos. Espera un poco.', mudo: 'Enviaste demasiados mensajes y quedaste 15 minutos sin poder escribir.', repetido: 'Ese mensaje es igual al anterior.',
      link: 'No se permiten enlaces en el chat.', flood: 'Demasiadas letras repetidas. Escribe con normalidad.', caps: 'Evita escribir todo en mayúsculas.',
      apelido: 'Ese apodo está reservado. Elige otro.', banido: 'Fuiste bloqueado en el chat.', erro: 'No se pudo enviar. Inténtalo de nuevo.', semMsg: 'Aún no hay mensajes. ¡Empieza la conversación!',
      offline: 'El chat no está disponible ahora.'}
  };
  var CORES = ['#2de2e6', '#ff3d8b', '#ffd23f', '#ff9a3c', '#39e6a0', '#b18cff', '#7dd3fc', '#f9a8d4'];
  var t = function () { return TXT[window.ltLang] || TXT.pt; };
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { try { return new Intl.NumberFormat((window.ltT && window.ltT().loc) || 'pt-BR').format(n); } catch (e) { return String(n); } };
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  };
  function corDe(nome) { var h = 0; for (var i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0; return h % CORES.length; }

  function poeTodos(sel, txt) { document.querySelectorAll(sel).forEach(function (e) { e.textContent = txt; }); }

  function textos() {
    var n = $('lt-chat-nick'), m = $('lt-chat-texto'), b = $('lt-chat-enviar');
    if (n) n.placeholder = t().nick;
    if (m) m.placeholder = t().msg;
    if (b) b.textContent = t().enviar;
    var vazio = $('lt-chat-vazio'); if (vazio) vazio.textContent = t().semMsg;
  }

  var VT = {
    pt: {url: 'Link do vídeo (X, YouTube, Streamable, Twitch, Vimeo, Medal)', com: 'O que aparece no vídeo? (opcional)', enviar: 'Sugerir',
      ok: 'Obrigado! O link aparece aqui depois de aprovado.', vazio: 'Cole o link do vídeo.', link: 'Esse link não é de um vídeo aceito (X, YouTube, Streamable, Twitch, Vimeo ou Medal).',
      link_texto: 'Não coloque links no comentário.', repetido: 'Esse vídeo já foi sugerido.', rapido: 'Espere uns segundos antes de sugerir outro.',
      limite: 'Você já sugeriu 10 vídeos hoje.', apelido: 'Esse apelido é reservado.', banido: 'Você foi bloqueado.', erro: 'Não deu para enviar. Tente de novo.',
      nenhum: 'Nenhum vídeo aprovado ainda.', pend: function (n) { return n === 1 ? '1 sugestão aguardando aprovação.' : n + ' sugestões aguardando aprovação.'; },
      abrir: 'Abrir vídeo no ', por: 'sugerido por '},
    en: {url: 'Video link (X, YouTube, Streamable, Twitch, Vimeo, Medal)', com: 'What does the video show? (optional)', enviar: 'Suggest',
      ok: 'Thanks! The link shows up here once approved.', vazio: 'Paste the video link.', link: 'That is not an accepted video link (X, YouTube, Streamable, Twitch, Vimeo or Medal).',
      link_texto: 'Please do not put links in the comment.', repetido: 'That video was already suggested.', rapido: 'Wait a few seconds before suggesting another one.',
      limite: 'You already suggested 10 videos today.', apelido: 'That nickname is reserved.', banido: 'You have been blocked.', erro: 'Could not send. Try again.',
      nenhum: 'No approved videos yet.', pend: function (n) { return n === 1 ? '1 suggestion waiting for approval.' : n + ' suggestions waiting for approval.'; },
      abrir: 'Open video on ', por: 'suggested by '},
    es: {url: 'Enlace del video (X, YouTube, Streamable, Twitch, Vimeo, Medal)', com: '¿Qué muestra el video? (opcional)', enviar: 'Sugerir',
      ok: '¡Gracias! El enlace aparece aquí cuando se apruebe.', vazio: 'Pega el enlace del video.', link: 'Ese enlace no es de un video aceptado (X, YouTube, Streamable, Twitch, Vimeo o Medal).',
      link_texto: 'No pongas enlaces en el comentario.', repetido: 'Ese video ya fue sugerido.', rapido: 'Espera unos segundos antes de sugerir otro.',
      limite: 'Ya sugeriste 10 videos hoy.', apelido: 'Ese apodo está reservado.', banido: 'Fuiste bloqueado.', erro: 'No se pudo enviar. Inténtalo de nuevo.',
      nenhum: 'Aún no hay videos aprobados.', pend: function (n) { return n === 1 ? '1 sugerencia esperando aprobación.' : n + ' sugerencias esperando aprobación.'; },
      abrir: 'Abrir video en ', por: 'sugerido por '}
  };
  var vt = function () { return VT[window.ltLang] || VT.pt; };

  function hostDe(u) {
    var m = /^https:\/\/(?:www\.|m\.|mobile\.|clips\.)?([^\/]+)/i.exec(u || ''); var h = m ? m[1].toLowerCase() : '';
    return {'x.com': 'X', 'twitter.com': 'X', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube', 'streamable.com': 'Streamable',
      'twitch.tv': 'Twitch', 'vimeo.com': 'Vimeo', 'medal.tv': 'Medal'}[h] || h;
  }

  function videosComunidade(sb) {
    var lista = $('lt-vid-lista'), form = $('lt-vid-form'), url = $('lt-vid-url'), com = $('lt-vid-com'), btn = $('lt-vid-enviar'), st = $('lt-vid-status');
    if (!lista || !form) return;
    var ultimo = null;
    function textosV() { url.placeholder = vt().url; com.placeholder = vt().com; btn.textContent = vt().enviar; desenha(); }
    function desenha() {
      if (!ultimo) return;
      var aprov = ultimo.filter(function (v) { return v.url; });
      var pend = ultimo.length ? (ultimo[0].pendentes || 0) : 0;
      var itens = aprov.map(function (v) {
        var li = document.createElement('li');
        var q = document.createElement('span'); q.className = 'q';
        q.textContent = window.ltQuando ? window.ltQuando(v.criado_em) : new Date(v.criado_em).toLocaleDateString();
        var cab = document.createElement('span'); cab.className = 'cab';
        var tag = document.createElement('span'); tag.className = 'lt-tag destaque'; tag.textContent = hostDe(v.url); cab.appendChild(tag);
        if (v.apelido) { var b = document.createElement('b'); b.textContent = vt().por + v.apelido; cab.appendChild(b); }
        var tx = document.createElement('span'); tx.className = 'tx';
        var a = document.createElement('a'); a.className = 'lk'; a.target = '_blank'; a.rel = 'noopener nofollow ugc';
        if (/^https:\/\//i.test(v.url)) a.href = v.url;
        a.textContent = vt().abrir + hostDe(v.url) + ' ↗'; tx.appendChild(a);
        if (v.comentario) tx.appendChild(document.createTextNode(' — ' + v.comentario));
        li.appendChild(q); li.appendChild(cab); li.appendChild(tx);
        return li;
      });
      if (!itens.length) { var vz = document.createElement('li'); vz.className = 'muted'; vz.textContent = vt().nenhum; itens.push(vz); }
      if (pend) { var pp = document.createElement('li'); pp.className = 'muted'; pp.textContent = vt().pend(pend); itens.push(pp); }
      lista.replaceChildren.apply(lista, itens);
    }
    function carrega() {
      sb.rpc('leonida_videos_aprovados').then(function (r) { if (!r.error) { ultimo = r.data || []; desenha(); } });
    }
    textosV();
    carrega();
    setInterval(carrega, 120000);
    var lang = $('lt-lang'); if (lang) lang.addEventListener('change', textosV);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var u = url.value.trim();
      st.className = 'muted';
      if (!u) { st.textContent = vt().vazio; return; }
      btn.disabled = true; st.textContent = '';
      var nick = $('lt-chat-nick') ? $('lt-chat-nick').value.trim().slice(0, 24) : '';
      sb.rpc('leonida_sugerir_video', {url: u, comentario: com.value.trim().slice(0, 200), apelido: nick}).then(function (r) {
        btn.disabled = false;
        if (r.error) { st.textContent = vt().erro; return; }
        if (r.data === 'ok') { url.value = ''; com.value = ''; st.className = 'muted ok'; st.textContent = vt().ok; carrega(); return; }
        st.textContent = vt()[r.data] || vt().erro;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.supabase || !window.supabase.createClient) { poeTodos('.lt-online-n', '—'); var st0 = $('lt-chat-status'); if (st0) st0.textContent = t().offline; return; }
    var sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {auth: {persistSession: false}});

    // Visitas
    sb.rpc('leonida_visita').then(function (r) { if (!r.error && r.data != null) poeTodos('.lt-visitas-n', fmt(r.data)); });

    // Vídeos sugeridos pela comunidade (só aparecem depois de aprovados no Supabase)
    videosComunidade(sb);

    // Online agora
    var meuId = ls.get('lt-id'); if (!meuId) { meuId = Math.random().toString(36).slice(2) + Date.now().toString(36); ls.set('lt-id', meuId); }
    var canal = sb.channel('leonida-online', {config: {presence: {key: meuId + '-' + Math.random().toString(36).slice(2, 6)}}});
    canal.on('presence', {event: 'sync'}, function () { poeTodos('.lt-online-n', fmt(Object.keys(canal.presenceState()).length)); })
      .subscribe(function (s) { if (s === 'SUBSCRIBED') canal.track({em: new Date().toISOString()}); });

    // Chat
    var lista = $('lt-chat-lista'), form = $('lt-chat-form'), nick = $('lt-chat-nick'), texto = $('lt-chat-texto'), st = $('lt-chat-status'), btn = $('lt-chat-enviar');
    if (!lista || !form) return;
    textos();
    var lang = $('lt-lang'); if (lang) lang.addEventListener('change', textos);
    var salvo = ls.get('lt-nick');
    nick.value = salvo || ('Turista' + Math.floor(1000 + Math.random() * 9000));
    var vistos = {};

    function hora(iso) { return new Date(iso).toLocaleTimeString((window.ltT && window.ltT().loc) || 'pt-BR', {hour: '2-digit', minute: '2-digit'}); }
    function rolaSePerto(forcar) { var perto = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 120; if (forcar || perto) lista.scrollTop = lista.scrollHeight; }
    function poe(m, forcar) {
      if (vistos[m.id]) return; vistos[m.id] = true;
      var v = $('lt-chat-vazio'); if (v) v.remove();
      var li = document.createElement('li'); li.dataset.id = m.id;
      var h = document.createElement('span'); h.className = 'h'; h.textContent = hora(m.criado_em);
      var a = document.createElement('b'); a.textContent = m.apelido; a.style.color = CORES[m.cor] || CORES[0];
      var x = document.createElement('span'); x.className = 'x'; x.textContent = m.texto;
      li.appendChild(h); li.appendChild(a); li.appendChild(x);
      lista.appendChild(li);
      while (lista.children.length > 200) lista.removeChild(lista.firstChild);
      rolaSePerto(forcar);
    }

    sb.from('leonida_chat').select('id,criado_em,apelido,texto,cor').order('id', {ascending: false}).limit(60).then(function (r) {
      if (r.error) { st.textContent = t().offline; return; }
      if (!r.data.length) { var v = document.createElement('li'); v.id = 'lt-chat-vazio'; v.className = 'vazio'; v.textContent = t().semMsg; lista.appendChild(v); }
      r.data.reverse().forEach(function (m) { poe(m, true); });
    });

    sb.channel('leonida-chat')
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'leonida_chat'}, function (p) { poe(p.new, false); })
      .on('postgres_changes', {event: 'DELETE', schema: 'public', table: 'leonida_chat'}, function (p) {
        var el = p.old && lista.querySelector('li[data-id="' + p.old.id + '"]'); if (el) el.remove();
      })
      .subscribe();

    var espera = 0;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = nick.value.trim().slice(0, 24), m = texto.value.trim().slice(0, 280);
      if (!n || !m) { st.textContent = t().vazio; return; }
      if (Date.now() < espera) { st.textContent = t().rapido; return; }
      ls.set('lt-nick', n);
      btn.disabled = true; st.textContent = '';
      sb.rpc('leonida_enviar', {apelido: n, texto: m, cor: corDe(n)}).then(function (r) {
        btn.disabled = false;
        if (r.error) { st.textContent = t().erro; return; }
        if (r.data === 'ok') { texto.value = ''; espera = Date.now() + 4000; texto.focus(); rolaSePerto(true); return; }
        st.textContent = t()[r.data] || t().erro;
      });
    });
  });
})();
