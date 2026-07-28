/* ═══════════════════════════════════════════════════════════════════
   WITH US ONE — Shell unificata (Scaglione 1)
   ───────────────────────────────────────────────────────────────────
   Cosa fa: sostituisce l'intestazione e la barra di navigazione di IAM
   con la shell in stile Plurima (barra scura in alto + menu laterale ad
   accordion), lasciando INTATTI tutti i pannelli, tutte le funzioni e
   tutta la logica dei permessi.

   Come lo fa senza rompere nulla:
   - non tocca goTab(): lo avvolge, così ogni voce del nuovo menu chiama
     esattamente la stessa funzione di prima;
   - non tocca applicaPermessi(): osserva i vecchi pulsanti .nbtn e
     rispecchia la loro visibilità sulle nuove voci di menu;
   - su schermo piccolo rimette in campo la barra originale.

   Per tornare indietro: togliere <link withus-one.css> e questo script.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Indirizzo unico: il preventivatore non è più un sito a parte, è un percorso
  // di iam.withusassicurazioni.it. La riscrittura sta in vercel.json e manda
  // /nuovo-preventivo/* al server OVH. Per tornare indietro: rimettere qui
  // 'https://quoto.withusassicurazioni.it/' e togliere le righe da vercel.json.
  var QUOTO = '/nuovo-preventivo/';

  /* ── Definizione del menu ────────────────────────────────────────
     mirror : id del vecchio pulsante da cui ereditare la visibilità
     act    : chiave usata da goTab() per l'evidenziazione
     do     : cosa fa il click
     tag    : etichetta di stato (es. "in arrivo")
  */
  var MENU = [
    { cap: 'Operatività' },

    { key: 'dashboard', label: 'Scrivania', icon: 'ti-layout-dashboard', mirror: 'nb-dashboard',
      do: function () { goTab('dashboard'); },
      sub: [
        { label: 'Dashboard',        do: function () { goTab('dashboard'); }, act: 'dashboard' },
        { label: 'Agenda',           do: function () { goTab('dashboard'); tryCall('openAgendaModal'); } },
        { label: 'Diario di lavoro', do: function () { goTab('workdiary'); }, act: 'workdiary', mirror: 'nb-workdiary' },
        { label: 'KPI e gare',       do: function () { goTab('performance'); }, act: 'performance', mirror: 'nb-performance' }
      ] },

    { key: 'quoto', label: 'Nuovo preventivo', icon: 'ti-bolt', mirror: 'nb-quoto', hero: true,
      do: function () { goTab('quoto'); },
      sub: [
        { label: 'Auto, moto, autocarri', do: function () { goTab('quoto'); } },
        { label: 'Rami elementari',       do: function () { goTab('quoto'); } },
        { label: 'Vita e TCM',            do: function () { goTab('quoto'); } },
        { label: 'Richieste all\'ufficio', do: function () { openQuoto('richieste'); } }
      ] },

    { key: 'clienti', label: 'Clienti', icon: 'ti-users', mirror: 'nb-pipeline',
      do: function () { goTab('pipeline'); },
      sub: [
        { label: 'Anagrafiche',  do: function () { openQuoto('anagrafiche'); } },
        { label: 'Trattative',   do: function () { goTab('pipeline'); }, act: 'pipeline' },
        { label: 'Lead',         do: function () { goTab('lead'); }, act: 'lead' },
        { label: 'Documenti',    do: function () { openQuoto('documenti'); } },
        { label: 'Posta',        do: function () { tryCall('openPosta'); }, mirror: 'nb-posta' }
      ] },

    { key: 'portafoglio', label: 'Portafoglio', icon: 'ti-folders',
      do: function () { openQuoto('portafoglio'); },
      sub: [
        { label: 'Polizze',      do: function () { openQuoto('portafoglio'); } },
        { label: 'Scadenzario',  do: function () { openQuoto('portafoglio'); } },
        // I titoli (quietanze e incassi) arrivano dalla contabilità e non
        // esistono ancora come archivio a sé: la voce resta segnata.
        { label: 'Titoli e quietanze', do: function () { soon('Titoli e quietanze'); }, tag: 'in arrivo' },
        { label: 'Sinistri',     do: function () { openQuoto('sinistri'); } }
      ] },

    { key: 'carica', label: 'Contabilità', icon: 'ti-calculator', mirror: 'nb-carica',
      do: function () { goTab('carica'); },
      sub: [
        { label: 'Carica documenti', do: function () { goTab('carica'); }, act: 'carica' },
        { label: 'Anomalie',         do: function () { goTab('anomalie'); }, mirror: 'ctab-anomalie' },
        { label: 'Sospesi',          do: function () { goTab('sospesi'); }, mirror: 'ctab-sospesi' },
        { label: 'Storico movimenti', do: function () { goTab('storico'); }, mirror: 'ctab-storico' },
        { label: 'Conto',            do: function () { goTab('conto'); }, mirror: 'ctab-conto' },
        { label: 'Estratto conto',   do: function () { tryCall('openEstrattoConto'); } },
        { label: 'Quadratura di giornata', do: function () { soon('Quadratura di giornata'); }, tag: 'in arrivo' }
      ] },

    /* Coda unica: i ticket aperti dentro QUOTO compaiono in questo stesso
       elenco (withus-ticket-uno.js). Non serve più una seconda voce. */
    { key: 'ticket', label: 'Ticket', icon: 'ti-lifebuoy',
      do: function () { goTab('dashboard'); } },

    { cap: 'Quotazioni' },

    { key: 'fonti', label: 'Fonti compagnie', icon: 'ti-plug-connected',
      do: function () { openQuoto('fonti'); } },

    { key: 'storico', label: 'Storico e produzione', icon: 'ti-report-analytics',
      do: function () { openQuoto('storico'); },
      sub: [
        { label: 'Preventivi',     do: function () { openQuoto('storico'); } },
        { label: 'Emissioni',      do: function () { openQuoto('emissioni'); } },
        { label: 'Richieste',      do: function () { openQuoto('richieste'); } },
        { label: 'Performance',    do: function () { openQuoto('performance'); } },
        { label: 'Estratto conto', do: function () { openQuoto('estratto'); } }
      ] },

    { cap: 'Agenzia' },

    { key: 'team', label: 'Collaboratori', icon: 'ti-id-badge-2', mirror: 'nb-team',
      do: function () { goTab('team'); } },

    { key: 'lab', label: 'Lab', icon: 'ti-flask', mirror: 'nb-lab',
      do: function () { goTab('lab'); } },

    { key: 'admin', label: 'Amministrazione', icon: 'ti-shield-lock', mirrorAny: ['um-btn-utenti'],
      do: function () { goTab('utenti'); },
      sub: [
        { label: 'Utenti e permessi', do: function () { goTab('utenti'); }, act: 'utenti' },
        { label: 'Azienda',           do: function () { goTab('azienda'); }, act: 'azienda' },
        { label: 'Agenti AI',         do: function () { goTab('agenti'); }, act: 'agenti', mirror: 'nb-agenti' }
      ] },

    { key: 'assieasy', label: 'AssiEasy', icon: 'ti-external-link',
      do: function () { window.open('https://withus.assieasy.com/assieasy/', '_blank'); } }
  ];

  /* ── Utilità ─────────────────────────────────────────────────── */
  function tryCall(fn) { if (typeof window[fn] === 'function') window[fn](); }

  function openQuoto(page) {
    try { sessionStorage.setItem('iam_last_tab', 'dashboard'); } catch (e) {}
    if (typeof window.quotoUrl === 'function') {
      window.quotoUrl().then(function (u) {
        var i = u.indexOf('#');
        var base = i < 0 ? u : u.slice(0, i);
        var hash = i < 0 ? '' : u.slice(i);
        window.location.href = base + '&page=' + encodeURIComponent(page) + hash;
      });
    } else {
      window.location.href = QUOTO + '?from=iam&page=' + encodeURIComponent(page);
    }
  }

  function soon(titolo) {
    var old = document.getElementById('w1-soon');
    if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'w1-soon';
    ov.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML =
      '<div style="background:var(--surf);border:1px solid var(--bord2);border-radius:6px;max-width:440px;width:100%;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.45);">' +
      '<div style="font-size:16px;font-weight:800;color:var(--txt);margin-bottom:8px;">' + titolo + '</div>' +
      '<div style="font-size:13px;line-height:1.55;color:var(--txt2);">Questa sezione è prevista e ha già il suo posto nel menu, ma non è ancora attiva: verrà costruita sul modello del portafoglio e della contabilità di AssiEasy.<br><br>' +
      'La voce resta visibile di proposito, così sai che è in lavorazione e non pensata come dimenticata. Nessun dato viene salvato o perso da qui.</div>' +
      '<div style="text-align:right;margin-top:16px;">' +
      '<button onclick="document.getElementById(\'w1-soon\').remove()" style="padding:8px 16px;border:none;border-radius:4px;background:var(--acc);color:#fff;font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;">Ho capito</button>' +
      '</div></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  /* ── Costruzione della shell ─────────────────────────────────── */
  function buildTop(app) {
    var top = document.createElement('div');
    top.className = 'w1-top';
    top.innerHTML =
      '<button class="w1-burger" id="w1-burger" aria-label="Menu"><i class="ti ti-menu-2"></i></button>' +
      '<div class="w1-brand">' +
        '<img src="withus-logo.png" alt="With Us">' +
        '<span class="w1-brand-txt">One</span>' +
      '</div>' +
      '<div class="w1-search">' +
        '<i class="ti ti-search"></i>' +
        '<input id="w1-q" type="text" placeholder="Cerca cliente, targa, preventivo, polizza…" autocomplete="off">' +
      '</div>' +
      '<div class="w1-top-right">' +
        '<span class="w1-pill" id="w1-pill">In attesa</span>' +
        '<button class="w1-cta" id="w1-cta"><i class="ti ti-plus"></i><span class="w1-cta-lbl">Nuovo preventivo</span></button>' +
        '<button class="w1-ico" id="w1-bell" aria-label="Notifiche"><i class="ti ti-bell"></i></button>' +
        '<div class="uavatar" id="w1-av">?</div>' +
      '</div>';
    app.insertBefore(top, app.firstChild);

    document.getElementById('w1-cta').addEventListener('click', function () { goTab('quoto'); });
    document.getElementById('w1-bell').addEventListener('click', function () { goTab('dashboard'); });
    document.getElementById('w1-av').addEventListener('click', function () { tryCall('toggleUMenu'); });
    document.getElementById('w1-burger').addEventListener('click', function () {
      document.querySelector('.w1-side').classList.toggle('open');
      document.querySelector('.w1-scrim').classList.toggle('open');
    });
    var q = document.getElementById('w1-q');
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && q.value.trim()) openQuoto('anagrafiche');
    });
  }

  function buildSide(app) {
    var side = document.createElement('aside');
    side.className = 'w1-side';
    var html = '';

    MENU.forEach(function (g, gi) {
      if (g.cap) { html += '<div class="w1-cap">' + g.cap + '</div>'; return; }
      var mir = g.mirror ? ' data-mirror="' + g.mirror + '"' : '';
      html += '<div class="w1-grp" data-key="' + g.key + '"' + mir + '>';
      html += '<button class="w1-item" data-gi="' + gi + '" data-key="' + g.key + '">' +
                '<i class="ti ' + g.icon + ' w1-i"></i>' +
                '<span class="w1-lbl">' + g.label + '</span>' +
                (g.tag ? '<span class="w1-tag">' + g.tag + '</span>' : '') +
                (g.sub ? '<i class="ti ti-chevron-right w1-chev"></i>' : '') +
              '</button>';
      if (g.sub) {
        html += '<div class="w1-sub" data-sub="' + g.key + '">';
        g.sub.forEach(function (s, si) {
          var sm = s.mirror ? ' data-mirror="' + s.mirror + '"' : '';
          html += '<button data-gi="' + gi + '" data-si="' + si + '"' + sm + '>' +
                    '<span>' + s.label + '</span>' +
                    (s.tag ? '<span class="w1-tag">' + s.tag + '</span>' : '') +
                  '</button>';
        });
        html += '</div>';
      }
      html += '</div>';
    });

    side.innerHTML = html;
    app.appendChild(side);

    var scrim = document.createElement('div');
    scrim.className = 'w1-scrim';
    scrim.addEventListener('click', closeDrawer);
    app.appendChild(scrim);

    side.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var gi = +btn.getAttribute('data-gi');
      var si = btn.getAttribute('data-si');
      var g = MENU[gi];
      if (si === null) {
        // Voce di primo livello: apre/chiude il sottomenu e lancia l'azione
        if (g.sub) {
          var wasOpen = btn.classList.contains('open');
          side.querySelectorAll('.w1-item.open').forEach(function (b) { b.classList.remove('open'); });
          side.querySelectorAll('.w1-sub.open').forEach(function (b) { b.classList.remove('open'); });
          if (!wasOpen) {
            btn.classList.add('open');
            btn.parentNode.querySelector('.w1-sub').classList.add('open');
          }
        }
        g.do();
      } else {
        g.sub[+si].do();
        closeDrawer();
      }
    });
  }

  function closeDrawer() {
    var s = document.querySelector('.w1-side'); if (s) s.classList.remove('open');
    var c = document.querySelector('.w1-scrim'); if (c) c.classList.remove('open');
  }

  /* ── Evidenziazione della voce attiva ────────────────────────── */
  function setActive(tab) {
    var side = document.querySelector('.w1-side'); if (!side) return;
    side.querySelectorAll('.w1-item.act').forEach(function (b) { b.classList.remove('act'); });
    side.querySelectorAll('.w1-sub button.act').forEach(function (b) { b.classList.remove('act'); });
    MENU.forEach(function (g, gi) {
      if (g.cap) return;
      var hit = (g.key === tab);
      if (!hit && g.sub) hit = g.sub.some(function (s) { return s.act === tab; });
      if (hit) {
        var b = side.querySelector('.w1-item[data-gi="' + gi + '"]');
        if (b) b.classList.add('act');
        if (g.sub) g.sub.forEach(function (s, si) {
          if (s.act === tab) {
            var sb = side.querySelector('button[data-gi="' + gi + '"][data-si="' + si + '"]');
            if (sb) sb.classList.add('act');
          }
        });
      }
    });
  }

  /* ── Rispecchia i permessi dai vecchi pulsanti ───────────────── */
  function syncPerms() {
    document.querySelectorAll('.w1-side [data-mirror]').forEach(function (el) {
      var src = document.getElementById(el.getAttribute('data-mirror'));
      var hidden = !src || src.style.display === 'none';
      el.style.display = hidden ? 'none' : '';
    });
    // Le voci senza specchio ma con sottomenu: se tutte le sotto-voci sono
    // nascoste, si nasconde anche il gruppo.
    document.querySelectorAll('.w1-side .w1-grp').forEach(function (grp) {
      var subs = grp.querySelectorAll('.w1-sub [data-mirror]');
      if (!subs.length || grp.hasAttribute('data-mirror')) return;
      var visibili = 0;
      subs.forEach(function (s) { if (s.style.display !== 'none') visibili++; });
      if (subs.length && visibili === 0 && subs.length === grp.querySelectorAll('.w1-sub button').length) {
        grp.style.display = 'none';
      }
    });
  }

  function watchPerms() {
    var ids = [];
    document.querySelectorAll('.w1-side [data-mirror]').forEach(function (el) {
      ids.push(el.getAttribute('data-mirror'));
    });
    var obs = new MutationObserver(syncPerms);
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el, { attributes: true, attributeFilter: ['style'] });
    });
    syncPerms();
    setTimeout(syncPerms, 800);
    setTimeout(syncPerms, 2500);
  }

  /* ── Ponte con lo stato della vecchia intestazione ───────────── */
  function mirrorHeader() {
    var pill = document.getElementById('s-pill');
    var w1p = document.getElementById('w1-pill');
    var av = document.getElementById('u-av');
    var w1a = document.getElementById('w1-av');
    function sync() {
      if (pill && w1p) {
        w1p.textContent = pill.textContent;
        w1p.className = 'w1-pill' + (pill.classList.contains('warn') ? ' warn' :
                        (/pront|attiv|online|ok/i.test(pill.textContent) ? ' ok' : ''));
      }
      if (av && w1a) {
        w1a.textContent = av.textContent;
        if (av.style.backgroundImage) w1a.style.backgroundImage = av.style.backgroundImage;
      }
    }
    sync();
    var obs = new MutationObserver(sync);
    if (pill) obs.observe(pill, { childList: true, characterData: true, subtree: true, attributes: true });
    if (av) obs.observe(av, { childList: true, characterData: true, subtree: true, attributes: true });
    setInterval(sync, 4000);
  }

  /* ── Avvio ───────────────────────────────────────────────────── */
  function start() {
    var app = document.getElementById('app');
    if (!app || app.classList.contains('w1')) return;
    if (typeof window.goTab !== 'function') { setTimeout(start, 200); return; }

    app.classList.add('w1');
    buildTop(app);
    buildSide(app);
    watchPerms();
    mirrorHeader();

    // Avvolge goTab senza modificarne il comportamento
    var _goTab = window.goTab;
    window.goTab = function (t) {
      var r = _goTab.apply(this, arguments);
      try { setActive(t); } catch (e) {}
      return r;
    };
    try { setActive(sessionStorage.getItem('iam_last_tab') || 'carica'); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 60); });
  } else {
    setTimeout(start, 60);
  }
})();
