/* ═══════════════════════════════════════════════════════════════════════
   WITH US ONE — scocca a tre barre
   ───────────────────────────────────────────────────────────────────────
   BARRA 1  intestazione bianca: logo, ricerca globale, utente
   BARRA 2  barra scura: menu orizzontale con tendine e mega-menu prodotti
   BARRA 3  riga del titolo: titolo, briciole di pane, azioni

   Due principi, che valgono per ogni riga di questo file:

   1. NON SI PERDE NIENTE. Le funzioni restano quelle di IAM: questo file
      non le riscrive, le richiama. La vecchia intestazione e la vecchia
      barra a icone restano nel DOM (solo nascoste) perché la logica dei
      permessi continua a scriverci sopra, e noi la rileggiamo da lì.

   2. UNA SOLA APPLICAZIONE. Il preventivatore non è più un indirizzo dove
      si va: è una pagina che si apre dentro questa scocca. Nessun salto,
      nessuna schermata di passaggio, nessun cambio di indirizzo.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Il preventivatore vive sotto lo stesso indirizzo di IAM: la riscrittura
     in vercel.json manda /nuovo-preventivo/ al server delle quotazioni.
     Stessa origine significa sessione condivisa e pagina ospitabile. */
  var QUOTO = 'https://quoto.withusassicurazioni.it/';

  var ANIA = 'https://amlogin.allianz.it/nidp/idff/sso?id=6&sid=8&option=credential&sid=8&target=https%3A%2F%2Fportaleagenzie.allianz.it%2FAuto%2FInquiryAnia%2FRicerca.aspx';
  var ASSIEASY = 'https://withus.assieasy.com/assieasy/';

  var SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true"><defs><symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol><symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></symbol><symbol id="i-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></symbol><symbol id="i-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></symbol><symbol id="i-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol><symbol id="i-case" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></symbol><symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></symbol><symbol id="i-warn" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></symbol><symbol id="i-euro" viewBox="0 0 24 24"><path d="M18 6.5A7 7 0 0 0 7.5 12a7 7 0 0 0 10.5 5.5M4 10h9M4 14h9"/></symbol><symbol id="i-calc" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4"/></symbol><symbol id="i-hour" viewBox="0 0 24 24"><path d="M6 2h12M6 22h12M6 2c0 5 6 5 6 10s-6 5-6 10M18 2c0 5-6 5-6 10s6 5 6 10"/></symbol><symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol><symbol id="i-checkc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/></symbol><symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol><symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol><symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></symbol><symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol><symbol id="i-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol><symbol id="i-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol><symbol id="i-dl" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></symbol><symbol id="i-up" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></symbol><symbol id="i-refresh" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></symbol><symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></symbol><symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></symbol><symbol id="i-car" viewBox="0 0 24 24"><path d="M5 17h14M3 17v-4.5L5.4 7A2 2 0 0 1 7.3 6h9.4a2 2 0 0 1 1.9 1L21 12.5V17M3 12.5h18"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/></symbol><symbol id="i-moto" viewBox="0 0 24 24"><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M8 17h6l3-6h-4l-2-3H8M14 11 12 8"/></symbol><symbol id="i-truck" viewBox="0 0 24 24"><path d="M1 4h12v12H1zM13 8h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></symbol><symbol id="i-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></symbol><symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></symbol><symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></symbol><symbol id="i-plane" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-1 1.6l5.4 4-2.6 2.6-2.4-.6a1 1 0 0 0-1 1.6L6.6 18l2.6 3.4a1 1 0 0 0 1.6-1l-.6-2.4 2.6-2.6 4 5.4a1 1 0 0 0 1-1.6z"/></symbol><symbol id="i-paw" viewBox="0 0 24 24"><circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="19" cy="13" r="1.8"/><path d="M12 12c-2.5 0-5 2-5 4.5S9 21 12 21s5-2 5-4.5S14.5 12 12 12z"/></symbol><symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol><symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 3v18M7 21h10M12 6 4 9l3 5a3.2 3.2 0 0 0 6 0zM12 6l8 3-3 5a3.2 3.2 0 0 1-6 0z"/></symbol><symbol id="i-build" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h4a2 2 0 0 1 2 2v10"/><path d="M9 7h2M9 11h2M9 15h2"/></symbol><symbol id="i-bank" viewBox="0 0 24 24"><path d="M3 10 12 4l9 6M4 10v9M20 10v9M8 10v9M16 10v9M12 10v9M2 21h20"/></symbol><symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></symbol><symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="14" r="4"/><path d="m11 11 8-8 3 3-2 2-2-2-2 2 2 2-3 3"/></symbol><symbol id="i-db" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></symbol><symbol id="i-plug" viewBox="0 0 24 24"><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/></symbol><symbol id="i-cog" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></symbol><symbol id="i-chart" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 14 3-4 3 3 5-7"/></symbol><symbol id="i-trend" viewBox="0 0 24 24"><path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/></symbol><symbol id="i-book" viewBox="0 0 24 24"><path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19"/></symbol><symbol id="i-flask" viewBox="0 0 24 24"><path d="M9 3h6M10 3v7l-4.6 8.6A1.4 1.4 0 0 0 6.6 21h10.8a1.4 1.4 0 0 0 1.2-2.4L14 10V3"/><path d="M7.5 15h9"/></symbol><symbol id="i-tick" viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 6v2M13 11v2M13 16v2"/></symbol><symbol id="i-ext" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></symbol><symbol id="i-sign" viewBox="0 0 24 24"><path d="M3 19c3 0 3-9 6-9s3 6 6 6 3-4 6-4"/><path d="M3 22h18"/></symbol><symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></symbol><symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></symbol><symbol id="i-note" viewBox="0 0 24 24"><path d="M4 4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M15 2v5h5M8 12h8M8 16h5"/></symbol><symbol id="i-net" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-2h14v2"/></symbol><symbol id="i-act" viewBox="0 0 24 24"><path d="M3 12h4l3 8 4-16 3 8h4"/></symbol><symbol id="i-fold" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></symbol><symbol id="i-bot" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 2h6"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M2 13v3M22 13v3"/></symbol><symbol id="i-ombr" viewBox="0 0 24 24"><path d="M12 2v2M2 12a10 10 0 0 1 20 0z"/><path d="M12 12v7a3 3 0 0 0 5 2"/></symbol><symbol id="i-arrup" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></symbol><symbol id="i-arrdn" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></symbol><symbol id="i-swap" viewBox="0 0 24 24"><path d="M7 3v14M3 13l4 4 4-4M17 21V7M13 11l4-4 4 4"/></symbol><symbol id="i-doc2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></symbol><symbol id="i-star" viewBox="0 0 24 24"><path d="m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z"/></symbol><symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></symbol><symbol id="i-med" viewBox="0 0 24 24"><path d="M12 3v18M3 12h18" stroke-width="3"/></symbol><symbol id="i-boxes" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="8" y="13" width="8" height="8" rx="1"/></symbol></defs></svg>';

  /* ═══ utilità ═══════════════════════════════════════════════════════ */

  function ico(id, cls) {
    return '<svg class="w1-i' + (cls ? ' ' + cls : '') + '"><use href="#' + id + '"/></svg>';
  }

  function tryCall(fn) {
    if (typeof window[fn] === 'function') { window[fn](); return true; }
    return false;
  }

  function vai(t) { if (typeof window.goTab === 'function') window.goTab(t); }

  function soon(titolo) {
    var v = document.getElementById('w1-soon');
    if (v) v.remove();
    v = document.createElement('div');
    v.id = 'w1-soon';
    v.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(10,20,30,.55);display:flex;align-items:center;justify-content:center;padding:20px;';
    v.innerHTML =
      '<div style="background:var(--surf,#fff);border:1px solid var(--bord2,#dde3e9);border-radius:6px;max-width:400px;width:100%;padding:22px 24px;box-shadow:0 20px 50px rgba(0,0,0,.3);">' +
      '<div style="font-size:15px;font-weight:600;color:var(--txt,#1f2a37);margin-bottom:8px;">' + titolo + '</div>' +
      '<div style="font-size:13px;line-height:1.55;color:var(--txt2,#5a6b7c);">Questa sezione è prevista e già collocata nel menu, ma non è ancora attiva. Resta qui come promemoria: quando la funzione sarà pronta si aprirà da questa voce, senza spostare nulla.</div>' +
      '<div style="text-align:right;margin-top:18px;"><button class="w1-b p" id="w1-soon-ok">Ho capito</button></div>' +
      '</div>';
    v.addEventListener('click', function (e) { if (e.target === v) v.remove(); });
    document.body.appendChild(v);
    var ok = document.getElementById('w1-soon-ok');
    if (ok) ok.onclick = function () { v.remove(); };
  }

  /* ═══ il preventivatore dentro la scocca ════════════════════════════
     Prima: "Nuovo preventivo" faceva una schermata di passaggio e poi
     cambiava indirizzo, portando l'utente dentro Quoto con il suo menu.
     Adesso: si apre un riquadro dentro questa stessa pagina. L'indirizzo
     in alto non cambia mai, il menu resta questo, la sessione è la stessa.
     ═════════════════════════════════════════════════════════════════ */

  var FRAME_PRONTO = false;

  function riquadro() {
    var p = document.getElementById('panel-quoto-live');
    if (p) return p;
    var panels = document.querySelector('#app .panels');
    if (!panels) return null;
    p = document.createElement('div');
    p.className = 'panel';
    p.id = 'panel-quoto-live';
    p.innerHTML =
      '<div class="w1-stage">' +
      '<div class="w1-load" id="w1-qload"><span class="w1-spin"></span> Apertura preventivatore…</div>' +
      '<iframe class="w1-frame" id="w1-qframe" title="Preventivatore With Us"></iframe>' +
      '</div>';
    panels.appendChild(p);
    return p;
  }

  /* Dentro il riquadro il preventivatore non deve mostrare la sua barra:
     la navigazione è quella di With Us One. Stessa origine, quindi
     possiamo scrivere una regola di stile dentro il riquadro. */
  function vestiFrame(fr) {
    try {
      var d = fr.contentDocument;
      if (!d || !d.body) return false;
      if (!d.getElementById('w1-embed-css')) {
        var s = d.createElement('style');
        s.id = 'w1-embed-css';
        s.textContent = '.topbar{display:none !important;}';
        (d.head || d.documentElement).appendChild(s);
      }
      return true;
    } catch (e) { return false; }
  }

  function vaiPagina(fr, page, cerca) {
    if (!page) return;
    try {
      var w = fr.contentWindow;
      if (w && typeof w.showPage === 'function' && w.document.getElementById('page-' + page)) {
        w.showPage(page);
        if (cerca) applicaRicerca(w, cerca);
        return;
      }
    } catch (e) { /* se non si può leggere dentro, si ricarica con il parametro */ }
    caricaFrame(fr, page, cerca);
  }

  /* Scrive il testo nel campo di ricerca del preventivatore e lancia la ricerca.
     Prima la lente in alto apriva l'elenco clienti e buttava via quello che era
     stato digitato: si ripartiva da capo. (bug del 30/07/2026) */
  function applicaRicerca(w, testo) {
    try {
      var campo = w.document.getElementById('anag-q');
      if (!campo) return;
      campo.value = testo;
      if (typeof w.cercaAnagrafica === 'function') w.cercaAnagrafica();
    } catch (e) { /* riquadro su un altro dominio: ci pensa il parametro q= */ }
  }

  function caricaFrame(fr, page, cerca) {
    var load = document.getElementById('w1-qload');
    if (load) load.style.display = '';
    FRAME_PRONTO = false;

    var applica = function (u) {
      var i = u.indexOf('#');
      var base = i < 0 ? u : u.slice(0, i);
      var hash = i < 0 ? '' : u.slice(i);
      if (page) base += (base.indexOf('?') < 0 ? '?' : '&') + 'page=' + encodeURIComponent(page);
      /* Il testo cercato viaggia nell'indirizzo perche' il riquadro puo' stare
         su un altro dominio: da fuori non si puo' scrivere dentro. Cosi'
         funziona sia a dominio unico sia a domini separati. */
      if (cerca) base += (base.indexOf('?') < 0 ? '?' : '&') + 'q=' + encodeURIComponent(cerca);
      fr.src = base + hash;
    };

    if (typeof window.quotoUrl === 'function') {
      try {
        window.quotoUrl().then(applica).catch(function () {
          applica(QUOTO + '?from=iam');
        });
        return;
      } catch (e) { /* si prosegue con l'indirizzo semplice */ }
    }
    applica(QUOTO + '?from=iam');
  }

  /* opz = { titolo: ['Titolo','Area'], cerca: 'testo' } */
  function aprireQuoto(page, opz) {
    opz = opz || {};
    var p = riquadro();
    if (!p) { setTimeout(function () { aprireQuoto(page, opz); }, 200); return; }

    var pan = document.querySelectorAll('#app .panel');
    for (var i = 0; i < pan.length; i++) pan[i].classList.remove('act');
    var nb = document.querySelectorAll('#app .nav .nbtn');
    for (var j = 0; j < nb.length; j++) nb[j].classList.remove('act');
    p.classList.add('act');
    try { sessionStorage.setItem('iam_last_tab', 'quoto'); } catch (e) {}

    var fr = document.getElementById('w1-qframe');
    if (!fr) return;

    if (!fr.src) {
      fr.onload = function () {
        FRAME_PRONTO = true;
        vestiFrame(fr);
        var l = document.getElementById('w1-qload');
        if (l) l.style.display = 'none';
      };
      caricaFrame(fr, page, opz.cerca);
    } else if (FRAME_PRONTO) {
      vestiFrame(fr);
      vaiPagina(fr, page, opz.cerca);
    }

    setActive('quoto', page, opz.titolo);
  }

  function Q(page, titolo) { return function () { aprireQuoto(page, { titolo: titolo }); }; }

  /* ═══ il mega-menu dei prodotti ═════════════════════════════════════
     Quattro colonne, come nel modello approvato. Ogni voce apre una
     pagina del preventivatore dentro la scocca.                        */
  var MEGA = {
    cols: [
      { t: 'Motor', v: [
        { l: 'RC Auto', p: 'rca', i: 'i-car' },
        { l: 'Moto e ciclomotori', p: 'rca', i: 'i-moto' },
        { l: 'Autocarri', p: 'rca', i: 'i-truck' },
        { l: 'Voltura e recupero classe', p: 'rca', i: 'i-swap' },
        { l: 'CVT e ARD', p: 'cvtard', i: 'i-shield' },
        { l: "Auto d'epoca", p: 'saravintage', i: 'i-star' }
      ] },
      { t: 'Persona', v: [
        { l: 'Infortuni', p: 'infortuni', i: 'i-heart' },
        { l: 'Infortuni famiglia e LTC', p: 'persona', i: 'i-users' },
        { l: 'Infortuni del conducente', p: 'infcirc', i: 'i-car' },
        { l: 'Malattia', p: 'malattia', i: 'i-med' },
        { l: 'Vita e TCM', p: 'vita', i: 'i-shield' },
        { l: 'Viaggio', p: 'viaggio', i: 'i-plane' }
      ] },
      { t: 'Casa e patrimonio', v: [
        { l: 'Casa', p: 'casa', i: 'i-home' },
        { l: 'RC vita privata', p: 'rcvp', i: 'i-user' },
        { l: 'Tutela legale', p: 'tutela', i: 'i-scale' },
        { l: 'Animali domestici', p: 'animali', i: 'i-paw' },
        { l: 'Fotovoltaico', p: 'fotovoltaico', i: 'i-sun' },
        { l: 'Beni e oggetti di valore', p: 'beni', i: 'i-boxes' }
      ] },
      { t: 'Impresa e cauzioni', v: [
        { l: 'Multirischio impresa', p: 'impresa', i: 'i-build' },
        { l: 'Polizza medici', p: 'impresa', i: 'i-med' },
        { l: 'RC professionale', p: 'rcprof', i: 'i-case' },
        { l: 'RC rischi diversi', p: 'rcrd', i: 'i-shield' },
        { l: 'Cauzioni appalti', p: 'cauzioni-appalti', i: 'i-bank' },
        { l: 'Cauzioni privati', p: 'cauzioni-privati', i: 'i-lock' },
        { l: 'Fideiussioni', p: 'cauzioni', i: 'i-sign' }
      ] }
    ],
    foot: [
      /* Sono scorciatoie verso pagine che hanno un altro nome altrove: la
         briciola deve dire da dove sei passato, non contraddire il menu che
         hai appena usato. (bug del 30/07/2026) */
      { l: 'Preventivi salvati', p: 'storico', i: 'i-list', titolo: ['Preventivi salvati', 'Preventivatore'] },
      { l: 'Stato collegamenti compagnie', p: 'fonti', i: 'i-plug', titolo: ['Stato collegamenti compagnie', 'Preventivatore'] }
    ]
  };

  /* ═══ il menu della barra scura ═════════════════════════════════════
     mirror     : id del vecchio pulsante da cui si eredita la visibilità
     mirrorAny  : visibile se almeno uno di questi id è visibile
     act        : chiave usata da goTab() per l'evidenziazione            */
  var MENU = [
    { key: 'dashboard', l: 'Scrivania', i: 'i-grid', mirror: 'nb-dashboard',
      go: function () { vai('dashboard'); } },

    { key: 'quoto', l: 'Nuovo preventivo', i: 'i-plus', mirror: 'nb-quoto',
      nuovo: true, mega: true },

    /* Il capo-menu apre la PRIMA voce del suo elenco, non una a caso in mezzo:
       prima «Clienti» portava alle Trattative. (bug del 30/07/2026) */
    { key: 'clienti', l: 'Clienti', i: 'i-users', go: Q('anagrafiche'),
      sub: [
        { l: 'Anagrafiche', i: 'i-user', go: Q('anagrafiche') },
        { l: 'Trattative', i: 'i-trend', act: 'pipeline', mirror: 'nb-pipeline', go: function () { vai('pipeline'); } },
        { l: 'Lead', i: 'i-bolt', act: 'lead', go: function () { vai('lead'); } },
        { l: 'Documenti', i: 'i-file', go: Q('documenti') },
        { hr: true },
        { l: 'Posta', i: 'i-mail', mirror: 'nb-posta', go: function () { tryCall('openPosta'); setActive('posta'); } }
      ] },

    { key: 'portafoglio', l: 'Portafoglio', i: 'i-case', go: Q('portafoglio'),
      sub: [
        { l: 'Polizze', i: 'i-doc2', go: Q('portafoglio') },
        { l: 'Scadenzario', i: 'i-cal', go: Q('scadenzario') },
        { l: 'Titoli e quietanze', i: 'i-euro', go: Q('titoli') },
        { hr: true },
        { l: 'Sinistri', i: 'i-warn', go: Q('sinistri') }
      ] },

    { key: 'carica', l: 'Contabilità', i: 'i-calc', mirror: 'nb-carica',
      go: function () { vai('carica'); },
      sub: [
        { l: 'Carica documenti', i: 'i-up', act: 'carica', go: function () { vai('carica'); } },
        { l: 'Anomalie', i: 'i-warn', go: function () { vai('anomalie'); } },
        { l: 'Sospesi', i: 'i-hour', go: function () { vai('sospesi'); } },
        { l: 'Storico movimenti', i: 'i-list', go: function () { vai('storico'); } },
        { l: 'Conto', i: 'i-bank', go: function () { vai('conto'); } },
        { hr: true },
        { l: 'Estratto conto', i: 'i-dl', go: function () { tryCall('openEstrattoConto'); } },
        { l: 'Quadratura di giornata', i: 'i-check', tag: 'in arrivo', go: function () { soon('Quadratura di giornata'); } }
      ] },

    { key: 'agenzia', l: 'Agenzia', i: 'i-build', go: function () { vai('team'); },
      sub: [
        { l: 'Collaboratori', i: 'i-users', act: 'team', mirror: 'nb-team', go: function () { vai('team'); } },
        { l: 'Agenda', i: 'i-cal', go: function () { vai('dashboard'); tryCall('openAgendaModal'); setActive('agenda'); } },
        { l: 'Diario di lavoro', i: 'i-note', act: 'workdiary', mirror: 'nb-workdiary', go: function () { vai('workdiary'); } },
        { l: 'KPI e gare', i: 'i-chart', act: 'performance', mirror: 'nb-performance', go: function () { vai('performance'); } },
        { hr: true },
        { l: 'Produzione e storico', i: 'i-trend', go: Q('storico') },
        { l: 'Emissioni', i: 'i-checkc', go: Q('emissioni') },
        { l: 'Richieste all\'ufficio', i: 'i-tick', go: Q('richieste') }
      ] },

    { key: 'strumenti', l: 'Strumenti', i: 'i-cog', go: Q('fonti'),
      sub: [
        { l: 'Fonti e collegamenti compagnie', i: 'i-plug', go: Q('fonti') },
        { l: 'Campagne email', i: 'i-mail', go: Q('campagne') },
        { l: 'Lab — analisi e previdenza', i: 'i-flask', mirror: 'nb-lab', act: 'lab', go: function () { vai('lab'); } },
        { hr: true },
        { l: 'Banca dati ANIA', i: 'i-db', ext: ANIA },
        { l: 'AssiEasy', i: 'i-ext', ext: ASSIEASY }
      ] },

    { key: 'ticket', l: 'Ticket', i: 'i-tick', tick: true, go: function () { vai('dashboard'); setActive('ticket'); } },

    { spacer: true },

    { key: 'admin', l: 'Amministrazione', i: 'i-cog', destra: true, mirrorAny: ['um-btn-utenti'],
      go: function () { vai('utenti'); },
      sub: [
        { l: 'Utenti e permessi', i: 'i-key', act: 'utenti', go: function () { vai('utenti'); } },
        { l: 'Azienda', i: 'i-build', act: 'azienda', go: function () { vai('azienda'); } },
        { l: 'Agenti AI', i: 'i-bot', act: 'agenti', mirror: 'nb-agenti', go: function () { vai('agenti'); } },
        { hr: true },
        { l: 'Esci dall\'account', i: 'i-lock', go: function () { tryCall('doLogout'); } }
      ] }
  ];

  /* Titolo e briciole di pane della terza barra */
  var TITOLI = {
    dashboard:   ['Scrivania', 'Scrivania'],
    carica:      ['Contabilità', 'Contabilità'],
    team:        ['Collaboratori', 'Agenzia'],
    pipeline:    ['Trattative', 'Clienti'],
    lead:        ['Lead', 'Clienti'],
    workdiary:   ['Diario di lavoro', 'Agenzia'],
    performance: ['KPI e gare', 'Agenzia'],
    lab:         ['Lab', 'Strumenti'],
    utenti:      ['Utenti e permessi', 'Amministrazione'],
    azienda:     ['Azienda', 'Amministrazione'],
    agenti:      ['Agenti AI', 'Amministrazione'],
    profilo:     ['Il mio profilo', 'Account'],
    quoto:       ['Nuovo preventivo', 'Preventivatore'],
    /* Mancavano: senza la loro riga il titolo restava quello della schermata
       precedente, e la briciola diceva un posto in cui non eri più.
       (bug del 30/07/2026) */
    anomalie:    ['Anomalie', 'Contabilità'],
    sospesi:     ['Sospesi', 'Contabilità'],
    storico:     ['Storico movimenti', 'Contabilità'],
    conto:       ['Conto', 'Contabilità'],
    ticket:      ['Ticket', 'Richieste'],
    posta:       ['Posta', 'Clienti'],
    agenda:      ['Agenda', 'Agenzia']
  };

  var TITOLI_QUOTO = {
    home:        ['Nuovo preventivo', 'Preventivatore'],
    rca:         ['RC Auto e veicoli', 'Preventivatore'],
    cvtard:      ['CVT e ARD', 'Preventivatore'],
    saravintage: ["Auto d'epoca", 'Preventivatore'],
    infortuni:   ['Infortuni', 'Preventivatore'],
    persona:     ['Infortuni famiglia e LTC', 'Preventivatore'],
    infcirc:     ['Infortuni del conducente', 'Preventivatore'],
    malattia:    ['Malattia', 'Preventivatore'],
    vita:        ['Vita e TCM', 'Preventivatore'],
    viaggio:     ['Viaggio', 'Preventivatore'],
    casa:        ['Casa', 'Preventivatore'],
    rcvp:        ['RC vita privata', 'Preventivatore'],
    tutela:      ['Tutela legale', 'Preventivatore'],
    animali:     ['Animali domestici', 'Preventivatore'],
    fotovoltaico:['Fotovoltaico', 'Preventivatore'],
    beni:        ['Beni e oggetti di valore', 'Preventivatore'],
    impresa:     ['Multirischio impresa', 'Preventivatore'],
    rcprof:      ['RC professionale', 'Preventivatore'],
    rcrd:        ['RC rischi diversi', 'Preventivatore'],
    'cauzioni-appalti': ['Cauzioni appalti', 'Preventivatore'],
    'cauzioni-privati': ['Cauzioni privati', 'Preventivatore'],
    cauzioni:    ['Fideiussioni', 'Preventivatore'],
    anagrafiche: ['Anagrafiche clienti', 'Clienti'],
    documenti:   ['Documenti', 'Clienti'],
    portafoglio: ['Portafoglio polizze', 'Portafoglio'],
    scadenzario: ['Scadenzario e rinnovi', 'Portafoglio'],
    titoli:      ['Titoli e quietanze', 'Portafoglio'],
    campagne:    ['Campagne email', 'Strumenti'],
    sinistri:    ['Sinistri', 'Portafoglio'],
    storico:     ['Produzione e storico', 'Agenzia'],
    emissioni:   ['Emissioni', 'Agenzia'],
    richieste:   ["Richieste all'ufficio", 'Agenzia'],
    performance: ['Performance', 'Agenzia'],
    estratto:    ['Estratto conto', 'Contabilità'],
    fonti:       ['Fonti e collegamenti compagnie', 'Strumenti']
  };

  /* Da quale voce di menu dipende una scheda di IAM */
  var TAB2MENU = {
    dashboard: 'dashboard', carica: 'carica', anomalie: 'carica', sospesi: 'carica',
    storico: 'carica', conto: 'carica', team: 'agenzia', workdiary: 'agenzia',
    performance: 'agenzia', pipeline: 'clienti', lead: 'clienti', lab: 'strumenti',
    utenti: 'admin', azienda: 'admin', agenti: 'admin', quoto: 'quoto'
  };

  /* ═══ costruzione delle tre barre ═══════════════════════════════════ */

  function chiudiTendine() {
    var a = document.querySelectorAll('.w1-m.open');
    for (var i = 0; i < a.length; i++) a[i].classList.remove('open');
  }

  function chiudiCassetto() {
    var b = document.querySelector('.w1-mbar');
    if (b) b.classList.remove('open');
    var s = document.getElementById('w1-scrim');
    if (s) s.classList.remove('open');
  }

  function voceLink(v) {
    if (v.hr) return '<hr>';
    var mir = v.mirror ? ' data-mirror="' + v.mirror + '"' : '';
    return '<a href="javascript:void(0)"' + mir + '>' +
      ico(v.i || 'i-right', 'sm') + '<span>' + v.l + '</span>' +
      (v.tag ? '<span class="w1-tag c">' + v.tag + '</span>' : '') +
      '</a>';
  }

  function costruisciTendina(m) {
    var d = document.createElement('div');
    d.className = 'w1-dd' + (m.destra ? ' right' : '');
    var h = '';
    for (var i = 0; i < m.sub.length; i++) h += voceLink(m.sub[i]);
    d.innerHTML = h;
    var a = d.querySelectorAll('a');
    var idx = 0;
    for (var j = 0; j < m.sub.length; j++) {
      if (m.sub[j].hr) continue;
      (function (v, el) {
        el.onclick = function (e) {
          e.preventDefault(); e.stopPropagation();
          chiudiTendine(); chiudiCassetto();
          if (v.ext) { window.open(v.ext, '_blank', 'noopener'); return; }
          if (typeof v.go === 'function') v.go();
        };
      })(m.sub[j], a[idx++]);
    }
    return d;
  }

  function costruisciMega() {
    var d = document.createElement('div');
    d.className = 'w1-mega';
    var h = '<div class="w1-cols">';
    for (var c = 0; c < MEGA.cols.length; c++) {
      h += '<div><h5>' + MEGA.cols[c].t + '</h5>';
      for (var v = 0; v < MEGA.cols[c].v.length; v++) {
        var x = MEGA.cols[c].v[v];
        h += '<a href="javascript:void(0)" data-p="' + x.p + '">' + ico(x.i, 'sm') + '<span>' + x.l + '</span></a>';
      }
      h += '</div>';
    }
    h += '</div><div class="w1-foot">';
    for (var f = 0; f < MEGA.foot.length; f++) {
      var ft = MEGA.foot[f].titolo ? ' data-t="' + MEGA.foot[f].titolo.join('|') + '"' : '';
      h += '<a href="javascript:void(0)" data-p="' + MEGA.foot[f].p + '"' + ft + '>' + ico(MEGA.foot[f].i, 'sm') + '<span>' + MEGA.foot[f].l + '</span></a>';
    }
    h += '</div>';
    d.innerHTML = h;
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-p]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      chiudiTendine(); chiudiCassetto();
      var t = a.getAttribute('data-t');
      aprireQuoto(a.getAttribute('data-p'), { titolo: t ? t.split('|') : null });
    });
    return d;
  }

  function costruisciBarra2() {
    var bar = document.createElement('nav');
    bar.className = 'w1-mbar';
    bar.id = 'w1-mbar';

    for (var i = 0; i < MENU.length; i++) {
      var m = MENU[i];
      if (m.spacer) {
        var sp = document.createElement('div');
        sp.className = 'w1-spacer';
        bar.appendChild(sp);
        continue;
      }
      var w = document.createElement('div');
      w.className = 'w1-m' + (m.nuovo ? ' nuovo' : '') + (m.tick ? ' w1-mtick' : '');
      w.setAttribute('data-key', m.key);
      if (m.mirror) w.setAttribute('data-mirror', m.mirror);
      if (m.mirrorAny) w.setAttribute('data-mirror-any', m.mirrorAny.join(','));

      var a = document.createElement('a');
      a.href = 'javascript:void(0)';
      a.innerHTML = ico(m.i) + '<span>' + m.l + '</span>' +
        ((m.sub || m.mega) ? '<svg class="w1-i sm w1-ch"><use href="#i-down"/></svg>' : '');
      w.appendChild(a);

      if (m.mega) w.appendChild(costruisciMega());
      else if (m.sub) w.appendChild(costruisciTendina(m));

      (function (m, w, a) {
        a.onclick = function (e) {
          e.preventDefault(); e.stopPropagation();
          var aperta = w.classList.contains('open');
          chiudiTendine();
          if (m.sub || m.mega) { if (!aperta) w.classList.add('open'); }
          if (typeof m.go === 'function') m.go();
          if (!m.sub && !m.mega) chiudiCassetto();
        };
      })(m, w, a);

      bar.appendChild(w);
    }
    return bar;
  }

  function costruisciBarra1() {
    var top = document.createElement('header');
    top.className = 'w1-top';
    top.innerHTML =
      '<button class="w1-burger" id="w1-burger" aria-label="Menu">' + ico('i-list') + '</button>' +
      '<img class="w1-logo" src="withus-logo.png" alt="With Us">' +
      '<div class="w1-sep"></div>' +
      '<div class="w1-appname">Piattaforma<b>WITH US ONE</b></div>' +
      '<div class="w1-gsearch">' +
        '<svg class="w1-i sm w1-si"><use href="#i-search"/></svg>' +
        '<input id="w1-cerca" type="text" autocomplete="off" placeholder="Cerca cliente, targa, polizza o preventivo">' +
        '<span class="w1-kbd">Ctrl K</span>' +
      '</div>' +
      '<div class="w1-tright">' +
        '<button class="w1-ibtn" id="w1-b-agenda" title="Agenda">' + ico('i-cal') + '</button>' +
        '<button class="w1-ibtn" id="w1-b-posta" title="Posta" data-mirror="nb-posta">' + ico('i-mail') + '</button>' +
        '<button class="w1-ibtn" id="w1-b-ticket" title="Ticket">' + ico('i-tick') + '</button>' +
        '<span class="w1-pill" id="w1-pill">In attesa</span>' +
        '<div class="w1-user" id="w1-user">' +
          '<div class="w1-av" id="w1-av">?</div>' +
          '<div class="w1-uinfo"><b id="w1-uname">Utente</b><span id="w1-urole">—</span></div>' +
          '<svg class="w1-i sm"><use href="#i-down"/></svg>' +
        '</div>' +
      '</div>';

    top.querySelector('#w1-burger').onclick = function (e) {
      e.stopPropagation();
      var b = document.getElementById('w1-mbar');
      var s = document.getElementById('w1-scrim');
      if (b) b.classList.toggle('open');
      if (s) s.classList.toggle('open');
    };
    top.querySelector('#w1-b-agenda').onclick = function () { vai('dashboard'); tryCall('openAgendaModal'); };
    top.querySelector('#w1-b-posta').onclick = function () { tryCall('openPosta'); };
    top.querySelector('#w1-b-ticket').onclick = function () { vai('dashboard'); };
    /* Il menu utente è quello di IAM: si apre lo stesso pannello di prima.
       Serve fermare la propagazione, altrimenti il gestore di IAM che
       chiude il menu al click fuori lo richiuderebbe subito. */
    top.querySelector('#w1-user').onclick = function (e) {
      e.stopPropagation();
      tryCall('toggleUMenu');
    };
    var q = top.querySelector('#w1-cerca');
    q.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var testo = q.value.trim();
      if (!testo) return;
      aprireQuoto('anagrafiche', { cerca: testo, titolo: ['Ricerca: ' + testo, 'Clienti'] });
    });
    return top;
  }

  function costruisciBarra3() {
    var p = document.createElement('div');
    p.className = 'w1-pbar';
    p.innerHTML =
      '<div><h1 id="w1-titolo">Scrivania</h1>' +
      '<div class="w1-crumb" id="w1-crumb">With Us One</div></div>' +
      '<div class="w1-az"><button class="w1-b p" id="w1-nuovo">' + ico('i-plus', 'sm') + ' Nuovo preventivo</button></div>';
    /* Come Plurima: il tasto verde apre la TENDINA dei prodotti, non una griglia.
       Se la voce di menu non e' visibile (permessi), si ripiega sull'elenco prodotti. */
    p.querySelector('#w1-nuovo').onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      var voce = document.querySelector('.w1-m[data-key="quoto"]');
      if (voce && voce.querySelector('.w1-mega')) {
        var aperta = voce.classList.contains('open');
        chiudiTendine();
        if (!aperta) voce.classList.add('open');
        return;
      }
      aprireQuoto('home');
    };
    return p;
  }

  /* ═══ evidenziazione, titolo e briciole ════════════════════════════ */

  function setActive(tab, page, titolo) {
    var k = TAB2MENU[tab] || tab;
    var v = document.querySelectorAll('.w1-m');
    for (var i = 0; i < v.length; i++) {
      v[i].classList.toggle('act', v[i].getAttribute('data-key') === k);
    }
    var t = document.getElementById('w1-titolo');
    var c = document.getElementById('w1-crumb');
    if (!t || !c) return;
    /* Ordine: il titolo dichiarato dalla voce di menu (che sa da dove sei
       passato), poi la pagina del preventivatore, poi la scheda di IAM. */
    var voce = titolo
      || ((tab === 'quoto' && page && TITOLI_QUOTO[page]) ? TITOLI_QUOTO[page] : TITOLI[tab]);
    /* Se non si sa che titolo mettere si scrive almeno il nome della voce di
       menu: lasciare quello di prima e' peggio, perche' dice il falso. */
    if (!voce) {
      var m = null;
      for (var z = 0; z < MENU.length; z++) if (MENU[z].key === k) m = MENU[z];
      voce = m ? [m.l, m.l] : ['With Us One', 'With Us One'];
    }
    t.textContent = voce[0];
    c.innerHTML = 'With Us One <svg class="w1-i sm"><use href="#i-right"/></svg> ' + voce[1] +
      (voce[1] !== voce[0] ? ' <svg class="w1-i sm"><use href="#i-right"/></svg> ' + voce[0] : '');
  }

  /* ═══ permessi: si rileggono dai vecchi pulsanti, non si reinventano ═ */

  function nascosto(id) {
    var e = document.getElementById(id);
    if (!e) return true;
    if (e.style.display === 'none') return true;
    return false;
  }

  function syncPerms() {
    var el = document.querySelectorAll('[data-mirror]');
    for (var i = 0; i < el.length; i++) {
      el[i].style.display = nascosto(el[i].getAttribute('data-mirror')) ? 'none' : '';
    }
    var any = document.querySelectorAll('[data-mirror-any]');
    for (var j = 0; j < any.length; j++) {
      var ids = any[j].getAttribute('data-mirror-any').split(',');
      var vis = false;
      for (var z = 0; z < ids.length; z++) if (!nascosto(ids[z])) vis = true;
      any[j].style.display = vis ? '' : 'none';
    }
    /* Una voce del menu con sole sotto-voci nascoste sparisce a sua volta */
    var gr = document.querySelectorAll('.w1-m');
    for (var g = 0; g < gr.length; g++) {
      if (gr[g].hasAttribute('data-mirror') || gr[g].hasAttribute('data-mirror-any')) continue;
      var link = gr[g].querySelectorAll('.w1-dd a');
      if (!link.length) continue;
      var visibili = 0;
      for (var l = 0; l < link.length; l++) if (link[l].style.display !== 'none') visibili++;
      gr[g].style.display = visibili ? '' : 'none';
    }
  }

  function watchPerms() {
    var obs = new MutationObserver(syncPerms);
    var nav = document.querySelector('#app .nav');
    var um = document.getElementById('umenu');
    if (nav) obs.observe(nav, { attributes: true, attributeFilter: ['style'], subtree: true });
    if (um) obs.observe(um, { attributes: true, attributeFilter: ['style'], subtree: true });
    syncPerms();
    setTimeout(syncPerms, 800);
    setTimeout(syncPerms, 2500);
  }

  /* ═══ stato dell'utente e delle spie, letto dalla vecchia testata ═══ */

  function mirrorHeader() {
    function sync() {
      var pill = document.getElementById('s-pill');
      var w1p = document.getElementById('w1-pill');
      if (pill && w1p) {
        w1p.textContent = pill.textContent.trim();
        w1p.className = 'w1-pill' + (pill.classList.contains('warn') ? ' warn' :
          (/pront|attiv|online|ok|collegat/i.test(pill.textContent) ? ' ok' : ''));
      }
      var av = document.getElementById('u-av');
      var w1a = document.getElementById('w1-av');
      if (av && w1a) {
        w1a.textContent = av.textContent.trim();
        if (av.style.backgroundImage) {
          w1a.style.backgroundImage = av.style.backgroundImage;
          w1a.style.backgroundSize = 'cover';
          w1a.textContent = '';
        }
      }
      var n = document.getElementById('um-name');
      var w1n = document.getElementById('w1-uname');
      if (n && w1n && n.textContent.trim()) w1n.textContent = n.textContent.trim();
      var r = document.getElementById('um-ruolo-badge');
      var w1r = document.getElementById('w1-urole');
      if (r && w1r && r.textContent.trim()) w1r.textContent = r.textContent.trim();
      var pb = document.getElementById('posta-badge');
      var bp = document.getElementById('w1-b-posta');
      if (bp) {
        var attivo = pb && pb.style.display !== 'none' && (pb.textContent || '').trim() !== '';
        var d = bp.querySelector('.w1-dot');
        if (attivo && !d) {
          d = document.createElement('span'); d.className = 'w1-dot'; bp.appendChild(d);
        } else if (!attivo && d) { d.remove(); }
      }
    }
    sync();
    var obs = new MutationObserver(sync);
    var h = document.querySelector('#app .hdr');
    var um = document.getElementById('umenu');
    if (h) obs.observe(h, { childList: true, characterData: true, subtree: true, attributes: true });
    if (um) obs.observe(um, { childList: true, characterData: true, subtree: true, attributes: true });
    setInterval(sync, 4000);
  }

  /* ═══ avvio ════════════════════════════════════════════════════════ */

  function start() {
    var app = document.getElementById('app');
    if (!app || app.classList.contains('w1')) return;
    if (typeof window.goTab !== 'function') { setTimeout(start, 200); return; }

    app.classList.add('w1');

    /* libreria di icone: nessuna emoji, solo vettoriali */
    if (!document.getElementById('w1-sprite')) {
      var sp = document.createElement('div');
      sp.id = 'w1-sprite';
      sp.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      sp.innerHTML = SPRITE;
      document.body.appendChild(sp);
    }

    var scrim = document.createElement('div');
    scrim.className = 'w1-scrim';
    scrim.id = 'w1-scrim';
    scrim.onclick = chiudiCassetto;
    document.body.appendChild(scrim);

    /* le tre barre in testa a #app, nell'ordine giusto */
    app.insertBefore(costruisciBarra3(), app.firstChild);
    app.insertBefore(costruisciBarra2(), app.firstChild);
    app.insertBefore(costruisciBarra1(), app.firstChild);

    document.addEventListener('click', chiudiTendine);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        var i = document.getElementById('w1-cerca');
        if (i) i.focus();
      }
      if (e.key === 'Escape') { chiudiTendine(); chiudiCassetto(); }
    });

    watchPerms();
    mirrorHeader();

    /* Il preventivatore non porta più fuori: si apre qui dentro.
       Si intercetta prima di IAM, così la vecchia schermata di passaggio
       e il cambio di indirizzo non partono nemmeno. */
    var _goTab = window.goTab;
    window.goTab = function (t) {
      if (t === 'quoto') { aprireQuoto('home'); return; }
      var r = _goTab.apply(this, arguments);
      try { setActive(t); } catch (e) {}
      return r;
    };
    /* Non si tocca apriQuoto() di IAM: serve a un caso solo, il
       collaboratore che ha accesso al preventivatore ma non a IAM. Per lui
       il salto diretto resta la cosa giusta, perché la scocca non avrebbe
       nessuna voce da mostrargli. */
    window.withusOneApri = aprireQuoto;

    try { setActive(sessionStorage.getItem('iam_last_tab') || 'carica'); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 60); });
  } else {
    setTimeout(start, 60);
  }
})();
