/* ═══════════════════════════════════════════════════════════════════════════
   RC PROFESSIONALE dentro IAM — primo prodotto portato fuori dal riquadro.

   COME E' FATTO, e perche' cosi'.

   Il motore di calcolo qui sotto e' quello di QUOTO, spostato IDENTICO, riga
   per riga. Non e' pigrizia: e' l'unico modo di poter dire che il premio non
   e' cambiato. Una riscrittura "piu' pulita" del calcolo di una tariffa non
   da' nessun errore quando sbaglia — emette una polizza a un prezzo storto, e
   te ne accorgi dal cliente. Il restyle e la pulizia, se serviranno, sono
   passi loro, separati e con le loro prove.

   Quello che cambia e' solo la COLLA: le nove cose che il motore chiamava
   nell'ambiente di QUOTO e che qui vengono servite dall'ambiente di IAM.
   Sono tutte qui sopra, in un posto solo, cosi' chi porta il prossimo
   prodotto sa esattamente che cosa deve fornire.

        QUOTO                      IAM
        ─────────────────────      ────────────────────────────────────
        currentUser {id,name}      ME + PROFILO
        savePreventivo(rec)        stessa tabella quote_preventivi
        logMovimento(t,tipo,c)     iam_audit
        notifyEmail(stato,id)      Edge Function notify-email
        showPage(nome)             goTab(nome)
        esc(s)                     esc(s) — IAM ce l'ha gia', si riusa
        db                         db — stessa istanza Supabase
        loadStorico()              rinfresca l'elenco preventivi se aperto
        openPagamentoPreventivo()  NON portato: vedi sotto

   IL PAGAMENTO NON E' STATO PORTATO, ed e' voluto. "Procedi all'emissione"
   passa dalle rotte /pay del server sulla VPS, che sono infrastruttura
   comune a tutti i prodotti e non hanno niente a che vedere con questa
   tariffa. Portarle qui adesso vorrebbe dire far parlare IAM con la VPS —
   cioe' rimettere dentro l'accoppiamento che stiamo togliendo. Il pulsante
   resta, ma salva il preventivo e lo dice: l'emissione si fa dal
   preventivo salvato. Quando i pagamenti saranno un pezzo comune di IAM,
   si ricollega qui in due righe.
   ═══════════════════════════════════════════════════════════════════════════ */
/* Niente contenitore (IIFE): il motore genera HTML con onclick inline, che
   cercano le funzioni su window. Chiuse dentro un contenitore non sarebbero
   raggiungibili e ogni pulsante della schermata sarebbe muto — senza errori
   in console, perche' un onclick verso una funzione inesistente non urla.
   Verificato prima di scegliere: le 99 dichiarazioni di questo file non
   collidono con nessun nome di IAM. */

/* ── la colla ─────────────────────────────────────────────────────────── */

  /* QUOTO leggeva currentUser.id / .name. In IAM l'utente e' ME (sessione
     Supabase) piu' PROFILO (la riga di iam_utenti col nome e il ruolo). Si
     legge al momento dell'uso, non all'avvio: al caricamento del file il
     login puo' non essere ancora avvenuto. */
  function utenteCorrente() {
    return {
      id: (typeof ME !== 'undefined' && ME) ? ME.id : null,
      name: (typeof PROFILO !== 'undefined' && PROFILO && (PROFILO.nome_completo || PROFILO.nome))
        || (typeof ME !== 'undefined' && ME && (ME.user_metadata?.full_name || ME.email))
        || null,
    };
  }
  Object.defineProperty(window, 'currentUser', { get: utenteCorrente, configurable: true });

  /* Le stesse colonne che scriveva QUOTO, sulla stessa tabella dello stesso
     progetto Supabase: un preventivo fatto qui e uno fatto nel riquadro
     devono essere indistinguibili nello storico. Il ripiego su cliente_id
     serve perche' quella colonna e' arrivata con una migrazione: se non c'e'
     ancora, si salva lo stesso invece di perdere il preventivo. */
  window.savePreventivo = async function (rec) {
    const u = utenteCorrente();
    if (!db || !u.id) return null;
    try {
      const emessa = !!(rec.dati && rec.dati.stato === 'emessa');
      const row = {
        modulo: rec.modulo || null, prodotto: rec.prodotto || null,
        compagnia: rec.compagnia || null, premio: rec.premio != null ? rec.premio : null,
        cliente: rec.cliente || null, dati: rec.dati || null,
        polizza_emessa: emessa, polizza_il: emessa ? new Date().toISOString() : null,
        creato_da: u.id, creato_nome: u.name,
      };
      const cid = rec.clienteId || (rec.dati && rec.dati.contraente && rec.dati.contraente.clienteId) || null;
      if (cid) row.cliente_id = cid;
      let { data, error } = await db.from('quote_preventivi').insert(row).select('id, numero').single();
      if (error && /cliente_id|numero|column/i.test(error.message || '')) {
        delete row.cliente_id;
        ({ data, error } = await db.from('quote_preventivi').insert(row).select('id').single());
      }
      if (error) throw error;
      window.logMovimento('Nuovo preventivo · ' + (rec.prodotto || rec.modulo || ''), 'preventivo', rec.cliente || '');
      return (data && data.id) || null;
    } catch (e) {
      alert('Il preventivo NON e\' stato salvato: ' + (e.message || e) + '\n\nRiprova; se si ripete, segnalalo prima di rifare il lavoro.');
      return null;
    }
  };

  /* Traccia sul registro di IAM. Se fallisce non si ferma niente: un
     preventivo salvato e un movimento non scritto sono meglio di un
     preventivo perso per colpa del registro. */
  window.logMovimento = async function (testo, tipo, cliente) {
    try {
      const u = utenteCorrente();
      if (!db || !u.id) return;
      await db.from('iam_audit').insert({
        utente_id: u.id, utente_nome: u.name,
        azione: tipo || 'preventivo', dettaglio: testo + (cliente ? ' · ' + cliente : ''),
      });
    } catch (e) { /* il registro non blocca il lavoro */ }
  };

  /* La stessa Edge Function che usa QUOTO. Silenziosa: se l'avviso non parte,
     il preventivo resta salvato e l'utente non deve saperlo da un errore. */
  window.notifyEmail = async function (stato, preventivoId) {
    try {
      if (!db || !preventivoId) return;
      await db.functions.invoke('notify-email', { body: { stato, preventivo_id: preventivoId } });
    } catch (e) { /* l'avviso non blocca il lavoro */ }
  };

  /* QUOTO aveva il suo router (showPage). In IAM si naviga con goTab. */
  window.showPage = function (nome) {
    if (typeof goTab === 'function') goTab(nome === 'home' ? 'dashboard' : nome);
  };

  window.loadStorico = async function () {
    /* L'elenco preventivi di IAM si ridisegna da solo quando lo si apre.
       Qui basta non far fallire la chiamata del motore. */
    try { if (typeof renderEmissioni === 'function') await renderEmissioni(); } catch (e) {}
  };

  window.openPagamentoPreventivo = function () {
    alert('Il preventivo e\' salvato.\n\nL\'emissione e il pagamento si fanno dal preventivo salvato: ' +
          'li trovi in Contabilita\' > Preventivi.');
    window.showPage('home');
  };

  /* ── il motore, spostato identico da QUOTO ────────────────────────────── */
/* RC Professionale — quotazione data-driven (tariffe/rc_professionale.json) */
let RC_PROF=null, rcProfLoading=null;
function ensureRcProf(){ if(RC_PROF) return Promise.resolve(RC_PROF); if(!rcProfLoading) rcProfLoading=fetch('tariffe/rc_professionale.json').then(r=>r.json()).then(d=>{RC_PROF=d;return d;}).catch(()=>{RC_PROF={};return {};}); return rcProfLoading; }
let RC_NONREG=null, rcNonRegLoading=null;
function ensureRcNonReg(){ if(RC_NONREG) return Promise.resolve(RC_NONREG); if(!rcNonRegLoading) rcNonRegLoading=fetch('tariffe/rc_non_regolamentate.json').then(r=>r.json()).then(d=>{RC_NONREG=d;return d;}).catch(()=>{RC_NONREG={categorie:{},professioni:[]};return RC_NONREG;}); return rcNonRegLoading; }
const RCP_META={'TECNICI':{label:'Tecnici',icon:'ti-ruler-2'},'AVVOCATI':{label:'Avvocati',icon:'ti-gavel'},'A.FISCALE':{label:'Area Fiscale',icon:'ti-calculator'},'VARIE':{label:'Varie professioni',icon:'ti-briefcase'},'SPECIAL MISCELLANEOUS':{label:'Special Miscellaneous',icon:'ti-dots'},'MISCELLANEO':{label:'Miscellaneo',icon:'ti-list-details'},'MEDICI':{label:'Medici',icon:'ti-stethoscope'},'PARAMEDICI':{label:'Paramedici',icon:'ti-medical-cross'}};
const RC_LOAD=1.10, RC_IMPOSTE=1.2225;   // netto x1,10 (caricamento) x1,2225 (imposte 22,25%)
function rcLordo(netto, flag10){ let l=netto*RC_LOAD*RC_IMPOSTE; if(flag10) l*=1.10; return l; }
// Categorie con prodotto unico + opzioni che selezionano la tariffa (es. Avvocati)
const RC_OPT_CONFIG = {
  'AVVOCATI': {
    nome:'Avvocati',
    opzioni:[
      {key:'associato',  label:'È uno studio associato?'},
      {key:'estensione', label:'Estensione per Sindaco, Revisore e Amministratore?'}
    ],
    map:(o)=>{
      if(!o.associato && !o.estensione) return 'LAWYERS (AVVOCATI';
      if(!o.associato &&  o.estensione) return 'LAWYERS STATUTOR AUDITORS (AVVOCATO SINDACO';
      if( o.associato && !o.estensione) return 'LEGAL OFFICES (STUDIO ASSOCIATO)';
      return 'LEGAL OFFICES STATUTOR AUDITORS (STUDIO ASSOCIATO)';
    }
  }
};
function rcCatLabel(k){ return (RCP_META[k]&&RCP_META[k].label)||k; }
function rcCatIcon(k){ return (RCP_META[k]&&RCP_META[k].icon)||'ti-briefcase'; }
function rcNomeIt(n){ const m=String(n).match(/\(([^)]*)/); return (m&&m[1].trim())||n; }
let RCP={view:'cats',cat:null,subIdx:null};
async function renderRcprof(){ RCP={view:'cats',cat:null,subIdx:null}; await ensureRcProf(); rcpRender(); }
function rcpRender(){
  const el=document.getElementById('rcprof-view'); if(!el) return;
  if(RCP.view==='cats') return el.innerHTML=rcpCatsHTML();
  if(RCP.view==='subs') return el.innerHTML=rcpSubsHTML();
  if(RCP.view==='nonreg') return el.innerHTML=rcpNonRegHTML();
  if(RCP.view==='amtlist') return el.innerHTML=amtListHTML();
  if(RCP.view==='amtquote'){ el.innerHTML=amtQuoteHTML(); amtCompute(); return; }
  if(RCP.view==='medquote'){ el.innerHTML=rcpMedHTML(); rcpMedCompute(); return; }
  el.innerHTML=rcpQuoteHTML(); rcpCompute();
}
function rcpCatsHTML(){
  const cats=Object.keys(RC_PROF||{}).filter(c=>c!=='MISCELLANEO'&&c!=='SPECIAL MISCELLANEOUS');
  let html=`<button class="back-link" onclick="showPage('home')"><i class="ti ti-arrow-left"></i> Moduli</button>
    <div class="page-title">RC Professionale</div><div class="page-sub">Seleziona la categoria professionale da quotare</div>
    <div class="mod-grid">`;
  html+=cats.map(c=>`<div class="mod-card" onclick="rcpOpenCat('${esc(c).replace(/'/g,"\\'")}')"><div class="mod-ic"><i class="ti ${rcCatIcon(c)}"></i></div><div class="mod-name">${esc(rcCatLabel(c))}</div><span class="mod-badge badge-quot">In quotazione</span></div>`).join('');
  html+=`<div class="mod-card" onclick="rcpOpenNonReg()"><div class="mod-ic"><i class="ti ti-list-search"></i></div><div class="mod-name">Professioni non regolamentate</div><span class="mod-badge badge-quot">In quotazione</span></div>`;
  html+=`<div class="mod-card" onclick="amtOpenList()"><div class="mod-ic" style="background:#fff;border:1px solid var(--line);padding:8px"><img src="${esc(AMT_LOGO)}" alt="AmTrust" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'ti ti-shield-half'}))"></div><div class="mod-name">AMTRUST</div><span class="mod-badge badge-quot">In quotazione</span></div>`;
  html+=`</div>`;
  return html;
}
async function rcpOpenNonReg(){ await ensureRcNonReg(); RCP.cat='__nonreg'; RCP.optCfg=null; RCP.cliente=null; RCP.prof=null; RCP.nrcat=null; RCP.view='nonreg'; rcpRender(); }
function rcpNonRegHTML(){
  const profs=(RC_NONREG.professioni||[]);
  return `<button class="back-link" onclick="RCP.view='cats';rcpRender()"><i class="ti ti-arrow-left"></i> RC Professionale</button>
    <div class="page-title">Professioni non regolamentate</div>
    <div class="page-sub">Scegli la professione/settore: la categoria di tariffa viene determinata in automatico.</div>
    <div class="aw-card" style="max-width:700px">
      <div class="aw-field"><label>Professione / settore *</label><input id="rcnr-prof" list="rcnr-list" placeholder="Cerca la professione…" oninput="rcnrSelectProf()"><datalist id="rcnr-list">${profs.map(p=>`<option value="${esc(p.nome)}">`).join('')}</datalist></div>
      <div id="rcnr-catinfo" style="font-size:13px;margin:-.4rem 0 .6rem;color:var(--muted)">Inizia a digitare e seleziona una professione dall'elenco.</div>
      <div class="aw-row2">
        <div class="aw-field"><label>Massimale *</label><select id="rcp-mass" onchange="rcpComputeNR()"><option value="">Selezionare una voce</option></select></div>
        <div class="aw-field"><label>Fatturato (€) *</label><input id="rcp-fatt" type="number" min="0" step="1000" placeholder="es. 200000" oninput="rcpComputeNR()"></div>
      </div>
      <div id="rcp-result"></div>
      <div class="aw-sec" style="text-align:left;color:var(--blue)">Contraente</div>
      <div class="pet-cli-mode">
        <button class="pet-cli-tab on" id="rcp-tab-cerca" onclick="rcpCliMode('cerca')"><i class="ti ti-search"></i> Cerca cliente esistente</button>
        <button class="pet-cli-tab" id="rcp-tab-nuovo" onclick="rcpCliMode('nuovo')"><i class="ti ti-user-plus"></i> Nuovo cliente</button>
      </div>
      <div class="aw-field geo-wrap" id="rcp-search-wrap"><label>Cerca cliente già censito</label><input id="rcp-search" placeholder="Nominativo, codice fiscale, P.IVA…" autocomplete="off" oninput="rcpClienteSearch(this.value)"><div id="rcp-search-res" class="geo-res"></div></div>
      <div class="aw-row2">
        <div class="aw-field"><label>Cognome Nome / Ragione sociale *</label><input id="rcp-nominativo"></div>
        <div class="aw-field"><label>Codice fiscale / Partita IVA *</label><input id="rcp-cfPiva" style="text-transform:uppercase"></div>
      </div>
      <div class="aw-field"><label>Note</label><textarea id="rcp-note" style="width:100%;min-height:60px;padding:11px;border:1px solid var(--line);border-radius:11px;font-family:inherit;font-size:15px"></textarea></div>
      <label class="aw-coincide" style="margin-bottom:.8rem"><input type="checkbox" id="rcp-nosin"> <span>Dichiaro che il cliente non ha avuto sinistri negli ultimi cinque anni.</span></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="aw-btn-dark" onclick="rcnrSalva()"><i class="ti ti-device-floppy"></i> SALVA PREVENTIVO</button></div>
    </div>`;
}
function rcnrSelectProf(){
  const name=(document.getElementById('rcnr-prof')?.value||'').trim();
  const p=(RC_NONREG.professioni||[]).find(x=>x.nome.toLowerCase()===name.toLowerCase());
  const info=document.getElementById('rcnr-catinfo'); const massSel=document.getElementById('rcp-mass');
  if(!p){ RCP.nrcat=null; if(info){info.textContent='Seleziona una professione dall\'elenco.';info.style.color='var(--muted)';} if(massSel) massSel.innerHTML='<option value="">Selezionare una voce</option>'; rcpComputeNR(); return; }
  RCP.nrcat=p.cat; RCP.prof=p.nome;
  const cat=(RC_NONREG.categorie||{})[p.cat]||{};
  const catLbl=(p.cat.length<=1)?('Categoria '+p.cat):p.cat;
  if(info){ info.innerHTML='<span style="color:#1c8a52;font-weight:600"><i class="ti ti-check"></i> '+esc(p.nome)+' → <b>'+esc(catLbl)+'</b></span>'; }
  if(massSel){ const cur=massSel.value; massSel.innerHTML='<option value="">Selezionare una voce</option>'+(cat.massimali||[]).map(m=>`<option ${m===cur?'selected':''}>${esc(m)}</option>`).join(''); }
  rcpComputeNR();
}
function rcpComputeNR(){
  const res=document.getElementById('rcp-result'); if(!res) return;
  const cat=(RC_NONREG.categorie||{})[RCP.nrcat];
  const fatt=parseFloat(document.getElementById('rcp-fatt')?.value)||0;
  const mass=document.getElementById('rcp-mass')?.value;
  if(!cat||!fatt||!mass){ res.innerHTML='<div class="cl-empty" style="margin:.6rem 0">Seleziona professione, massimale e fatturato.</div>'; RCP.quote=null; return; }
  const turns=cat.righe.map(r=>r.t).sort((a,b)=>a-b);
  let band=turns.find(t=>t>=fatt); let overflow=false;
  if(band==null){ band=turns[turns.length-1]; overflow=true; }
  const row=cat.righe.find(r=>r.t===band);
  const netto=row&&row.p?row.p[mass]:null;
  if(netto==null){ res.innerHTML='<div class="cl-empty" style="margin:.6rem 0">Combinazione non disponibile.</div>'; RCP.quote=null; return; }
  const lordo=rcLordo(netto,cat.flag10);
  RCP.quote={netto,lordo,mass,band,fatt,flag10:!!cat.flag10};
  const eur=n=>Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
  res.innerHTML=`<div class="rc-quote-card">
    <div class="rc-qc-top"><div class="rc-qc-name">RC Professionale · ${esc(RCP.prof||'')}</div><div class="rc-qc-annual">Premio Annuale</div></div>
    <div class="rc-qc-firma"><i class="ti ti-writing-sign"></i> Firma Elettronica</div>
    <div class="rc-qc-grid"><div class="rc-qc-left"><div><span>Massimale per Anno:</span><b>${esc(mass)}</b></div><div><span>Fatturato fino a:</span><b>€ ${band.toLocaleString('it-IT')}</b></div></div>
      <div class="rc-qc-right"><div class="rc-qc-totlbl">TOTALE</div><div class="rc-qc-tot">${eur(lordo)}</div></div></div>
  </div>${overflow?'<div style="font-size:12.5px;color:#c77a14;margin:.2rem 0 .6rem"><i class="ti ti-alert-triangle"></i> Fatturato oltre la soglia massima: applicata la fascia più alta, verifica con l\'ufficio.</div>':''}`;
}
async function rcnrSalva(){
  const q=RCP.quote;
  if(!RCP.nrcat||!q){ alert('Seleziona professione, massimale e fatturato.'); return; }
  if(!document.getElementById('rcp-nosin')?.checked){ alert('Conferma la dichiarazione sull\'assenza di sinistri negli ultimi 5 anni.'); return; }
  const nominativo=(document.getElementById('rcp-nominativo')?.value||'').trim();
  const cfPiva=(document.getElementById('rcp-cfPiva')?.value||'').trim().toUpperCase();
  if(!nominativo||!cfPiva){ alert('Inserisci contraente e Codice fiscale / Partita IVA.'); return; }
  let clienteId=RCP.cliente?.clienteId||null;
  if(cfPiva && !clienteId){ try{ const {data:ex}=await db.from('quote_anagrafiche').select('id').ilike('codice_fiscale',cfPiva).limit(1); if(ex&&ex[0]) clienteId=ex[0].id; }catch(e){} }
  if(cfPiva && !clienteId){ try{ const {data}=await db.from('quote_anagrafiche').insert({tipo:cfPiva.length===11?'giuridica':'fisica',nominativo:nominativo.toUpperCase(),codice_fiscale:cfPiva.length>11?cfPiva:null,partita_iva:cfPiva.length===11?cfPiva:null,creato_da:currentUser.id}).select('id').single(); if(data){clienteId=data.id; logMovimento('Nuovo cliente (da RC Prof) · '+nominativo,'cliente');} }catch(e){} }
  const catLbl=(RCP.nrcat.length<=1)?('Categoria '+RCP.nrcat):RCP.nrcat;
  const dati={ categoria:'Professioni non regolamentate', professione:RCP.prof, categoriaTariffa:catLbl, fatturato:q.fatt, fatturatoFinoA:q.band, massimale:q.mass, premioNetto:q.netto, flag10:q.flag10, clienteId, note:(document.getElementById('rcp-note')?.value||'').trim(), stato:'quotato' };
  const newId=await savePreventivo({ modulo:'rcprof', prodotto:'RC Professioni non regolamentate · '+RCP.prof, premio:Number(q.lordo.toFixed(2)), cliente:nominativo, dati });
  notifyEmail('quotato', newId);
  alert('✓ Preventivo RC salvato!\n\n'+RCP.prof+' ('+catLbl+')\nMassimale '+q.mass+' · Fatturato fino a € '+q.band.toLocaleString('it-IT')+'\nPremio annuo: € '+q.lordo.toFixed(2)+'\n\nLo trovi nello Storico come "Quotato".');
  showPage('home');
}
function rcpOpenCat(c){
  RCP.cat=c; RCP.cliente=null;
  if((RC_PROF[c]||{}).modello==='classi'){ RCP.optCfg=null; RCP.view='medquote'; rcpRender(); return; }
  const cfg=RC_OPT_CONFIG[c];
  if(cfg){ RCP.optCfg=cfg; RCP.opts={}; cfg.opzioni.forEach(o=>RCP.opts[o.key]=false); rcpSyncOptSub(); RCP.view='quote'; rcpRender(); return; }
  RCP.optCfg=null; RCP.view='subs'; rcpRender();
}
function rcpSyncOptSub(){ const cfg=RCP.optCfg; if(!cfg) return; const name=cfg.map(RCP.opts); const subs=(RC_PROF[RCP.cat]||{}).sottocategorie||[]; RCP.subIdx=subs.findIndex(s=>s.nome===name); }
function rcpOptChange(){
  const cfg=RCP.optCfg; if(!cfg) return;
  cfg.opzioni.forEach(o=>{ RCP.opts[o.key]=(document.querySelector('input[name="rcp-opt-'+o.key+'"]:checked')||{}).value==='Sì'; });
  rcpSyncOptSub();
  const s=rcpSub(); const massSel=document.getElementById('rcp-mass');
  if(massSel&&s){ const cur=massSel.value; massSel.innerHTML='<option value="">Selezionare una voce</option>'+s.massimali.map(m=>`<option ${m===cur?'selected':''}>${esc(m)}</option>`).join(''); }
  rcpCompute();
}
function rcpSubsHTML(){
  const subs=(RC_PROF[RCP.cat]||{}).sottocategorie||[];
  return `<button class="back-link" onclick="RCP.view='cats';rcpRender()"><i class="ti ti-arrow-left"></i> RC Professionale</button>
    <div class="page-title">${esc(rcCatLabel(RCP.cat))}</div><div class="page-sub">Seleziona la sotto-categoria</div>
    <div class="mod-grid">${subs.map((s,i)=>`<div class="mod-card" onclick="rcpOpenSub(${i})"><div class="mod-ic"><i class="ti ti-file-invoice"></i></div><div class="mod-name">${esc(rcNomeIt(s.nome))}</div><span class="mod-badge badge-quot">In quotazione</span></div>`).join('')}</div>`;
}
function rcpOpenSub(i){ RCP.view='quote'; RCP.subIdx=i; RCP.cliente=null; rcpRender(); }
function rcpSub(){ return ((RC_PROF[RCP.cat]||{}).sottocategorie||[])[RCP.subIdx]||null; }
function rcpQuoteHTML(){
  const cfg=RCP.optCfg; const s=rcpSub();
  const back = cfg ? "RCP.view='cats';rcpRender()" : "RCP.view='subs';rcpRender()";
  const backLbl = cfg ? 'RC Professionale' : rcCatLabel(RCP.cat);
  const title = cfg ? cfg.nome : (s?rcNomeIt(s.nome):'');
  const optHTML = cfg ? `<div class="aw-sec" style="text-align:left;color:var(--blue)">Opzioni prodotto</div>${cfg.opzioni.map(o=>`<div class="aw-field"><label>${esc(o.label)}</label><div class="cw-q-opts" style="flex-direction:row;gap:1.5rem;padding-top:4px"><label class="cw-radio"><input type="radio" name="rcp-opt-${o.key}" value="No" ${!RCP.opts[o.key]?'checked':''} onchange="rcpOptChange()"><span>No</span></label><label class="cw-radio"><input type="radio" name="rcp-opt-${o.key}" value="Sì" ${RCP.opts[o.key]?'checked':''} onchange="rcpOptChange()"><span>Sì</span></label></div></div>`).join('')}` : '';
  const accs=(s&&s.accessorie)||[];
  const accHTML = accs.length ? `<div class="pv2-sec">Garanzie accessorie</div>`+accs.map(a=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="rcp-acc-${a.key}" onchange="rcpCompute()"> <span>${esc(a.label)} <span style="color:var(--muted);font-weight:400">· ${a.tipo==='perc'?('+'+a.valore+'% sul netto'):('+ € '+a.valore)}</span></span></label>`).join('') : '';
  return `<button class="back-link" onclick="${back}"><i class="ti ti-arrow-left"></i> ${esc(backLbl)}</button>
    <div class="pv2-wrap">
      <div class="pv2-main">
        <div class="pv2-h">${esc(title)}</div>
        <div class="pv2-sub">${esc(rcCatLabel(RCP.cat))} · quotazione RC professionale</div>
        ${optHTML}
        <div class="pv2-sec">Massimale e fatturato</div>
      <div class="aw-row2">
        <div class="aw-field"><label>Massimale *</label><select id="rcp-mass" onchange="rcpCompute()"><option value="">Selezionare una voce</option>${s?s.massimali.map(m=>`<option>${esc(m)}</option>`).join(''):''}</select></div>
        <div class="aw-field"><label>Fatturato (€) *</label><input id="rcp-fatt" type="number" min="0" step="1000" placeholder="es. 200000" oninput="rcpCompute()"></div>
      </div>
        ${accHTML}
        <div class="pv2-sec">Contraente</div>
      <div class="pet-cli-mode">
        <button class="pet-cli-tab on" id="rcp-tab-cerca" onclick="rcpCliMode('cerca')"><i class="ti ti-search"></i> Cerca cliente esistente</button>
        <button class="pet-cli-tab" id="rcp-tab-nuovo" onclick="rcpCliMode('nuovo')"><i class="ti ti-user-plus"></i> Nuovo cliente</button>
      </div>
      <div class="aw-field geo-wrap" id="rcp-search-wrap"><label>Cerca cliente già censito</label><input id="rcp-search" placeholder="Nominativo, codice fiscale, P.IVA…" autocomplete="off" oninput="rcpClienteSearch(this.value)"><div id="rcp-search-res" class="geo-res"></div></div>
      <div class="aw-row2">
        <div class="aw-field"><label>Cognome Nome / Ragione sociale *</label><input id="rcp-nominativo"></div>
        <div class="aw-field"><label>Codice fiscale / Partita IVA *</label><input id="rcp-cfPiva" style="text-transform:uppercase"></div>
      </div>
        <div class="aw-field"><label>Note</label><textarea id="rcp-note" style="width:100%;min-height:56px;padding:11px;border:1px solid var(--line);border-radius:11px;font-family:inherit;font-size:14px"></textarea></div>
        <label class="aw-coincide"><input type="checkbox" id="rcp-nosin"> <span>Dichiaro che il cliente non ha avuto sinistri negli ultimi cinque anni.</span></label>
      </div>
      <aside class="pv2-panel">
        <div class="pv2-panel-h">Il tuo preventivo</div>
        <div class="pv2-comp"><span>Categoria</span><b style="color:var(--blue)">${esc(rcCatLabel(RCP.cat))}</b></div>
        <div id="rcp-result"></div>
        <button class="pv2-cta" onclick="rcpSalva('procedi')" style="background:linear-gradient(160deg,#2ec16a,#1c8a52);color:#fff;border:none"><i class="ti ti-cash" style="vertical-align:-2px"></i> Procedi all'emissione</button>
        <button class="pv2-cta2" onclick="rcpSalva('salva')">Salva preventivo</button>
      </aside>
    </div>`;
}
function rcpCompute(){
  const s=rcpSub(); const res=document.getElementById('rcp-result'); if(!s||!res) return;
  const fatt=parseFloat(document.getElementById('rcp-fatt')?.value)||0;
  const mass=document.getElementById('rcp-mass')?.value;
  if(!fatt||!mass){ res.innerHTML='<div style="font-size:13px;color:var(--muted);padding:6px 0 12px">Seleziona <b>massimale</b> e inserisci il <b>fatturato</b> per calcolare il premio.</div>'; RCP.quote=null; return; }
  const turns=s.righe.map(r=>r.t).sort((a,b)=>a-b);
  let band=turns.find(t=>t>=fatt); let overflow=false;
  if(band==null){ band=turns[turns.length-1]; overflow=true; }
  const row=s.righe.find(r=>r.t===band);
  const netto=row&&row.p?row.p[mass]:null;
  if(netto==null){ res.innerHTML='<div style="font-size:13px;color:#c77a14;padding:6px 0 12px">Combinazione non disponibile per fatturato fino a € '+band.toLocaleString('it-IT')+' e massimale '+esc(mass)+'. Prova un altro massimale.</div>'; RCP.quote=null; return; }
  const accs=(s.accessorie||[]); const accSel=[]; let sumPerc=0, sumEur=0;
  accs.forEach(a=>{ if(document.getElementById('rcp-acc-'+a.key)?.checked){ accSel.push(a); if(a.tipo==='perc') sumPerc+=a.valore; else sumEur+=a.valore; } });
  const nettoTot = netto + netto*sumPerc/100 + sumEur;
  const lordo=rcLordo(nettoTot,s.flag10);
  const franch=(s.franchigie||{})[mass];
  RCP.quote={netto:Number(netto.toFixed(2)),nettoTot:Number(nettoTot.toFixed(2)),accessorie:accSel.map(a=>a.label),lordo,mass,band,fatt,flag10:!!s.flag10,franchigia:franch!=null?franch:null};
  const eur=n=>'€ '+Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
  res.innerHTML=`
    <div class="pv2-panel-sub">Massimale ${esc(mass)} · fatturato fino a € ${band.toLocaleString('it-IT')}</div>
    ${RCP.optCfg?RCP.optCfg.opzioni.map(o=>`<div class="pv2-line"><span style="font-size:13px">${esc(o.label.replace(/\?\s*$/,''))}</span><b style="color:var(--blue)">${RCP.opts[o.key]?'Sì':'No'}</b></div>`).join(''):''}
    <div class="pv2-line"><span>Premio netto base</span><b>${eur(netto)}</b></div>
    ${accSel.map(a=>`<div class="pv2-line"><span>${esc(a.label)}</span><b>+ ${eur(a.tipo==='perc'?netto*a.valore/100:a.valore)}</b></div>`).join('')}
    ${franch!=null?`<div class="pv2-line"><span>Franchigia</span><b>€ ${Number(franch).toLocaleString('it-IT')}</b></div>`:''}
    <div class="pv2-div"></div>
    <div class="pv2-total"><span class="lab">Premio annuo lordo</span><div class="amt"><b>${eur(lordo)}</b><small>imposte 22,25% incl.</small></div></div>
    ${overflow?'<div style="font-size:12px;color:#c77a14;margin-top:.4rem"><i class="ti ti-alert-triangle"></i> Fatturato oltre la soglia massima: applicata la fascia più alta, verifica con l\'ufficio.</div>':''}`;
}
let rcpTimer=null;
function rcpClienteSearch(q){
  const box=document.getElementById('rcp-search-res'); clearTimeout(rcpTimer);
  if(!q||q.trim().length<2){ if(box){box.classList.remove('show');box.innerHTML='';} return; }
  rcpTimer=setTimeout(async()=>{
    try{ const {data}=await db.from('quote_anagrafiche').select('*').or(`nominativo.ilike.%${sbq(q)}%,codice_fiscale.ilike.%${sbq(q)}%,partita_iva.ilike.%${sbq(q)}%`).limit(6);
      window.__RCPC=data||[];
      box.innerHTML=(data&&data.length)?data.map((a,i)=>`<div class="geo-item" onclick="rcpApplyCliente(${i})"><b>${esc(a.nominativo)}</b> · ${esc(a.codice_fiscale||a.partita_iva||'')}</div>`).join(''):'<div class="geo-item" onclick="rcpNuovoCliente()" style="color:var(--muted);cursor:pointer">Nessun cliente trovato — premi "Nuovo cliente" per inserirlo</div>';
      box.classList.add('show');
    }catch(e){}
  },300);
}
function rcpApplyCliente(i){ const a=(window.__RCPC||[])[i]; if(!a) return;
  const n=document.getElementById('rcp-nominativo'); if(n) n.value=a.nominativo||'';
  const cf=document.getElementById('rcp-cfPiva'); if(cf) cf.value=a.codice_fiscale||a.partita_iva||'';
  RCP.cliente={clienteId:a.id};
  const box=document.getElementById('rcp-search-res'); if(box){box.classList.remove('show');box.innerHTML='';}
}
function rcpCliMode(m){
  const tC=document.getElementById('rcp-tab-cerca'), tN=document.getElementById('rcp-tab-nuovo');
  const wrap=document.getElementById('rcp-search-wrap');
  const box=document.getElementById('rcp-search-res');
  if(m==='nuovo'){
    RCP.cliente=null;
    const n=document.getElementById('rcp-nominativo'); if(n) n.value='';
    const cf=document.getElementById('rcp-cfPiva'); if(cf) cf.value='';
    if(box){box.classList.remove('show');box.innerHTML='';}
    const s=document.getElementById('rcp-search'); if(s) s.value='';
    if(wrap) wrap.style.display='none';
    if(tC) tC.classList.remove('on'); if(tN) tN.classList.add('on');
    if(n) n.focus();
  } else {
    if(wrap) wrap.style.display='';
    if(tN) tN.classList.remove('on'); if(tC) tC.classList.add('on');
  }
}
function rcpNuovoCliente(){ rcpCliMode('nuovo'); }
async function rcpSalva(mode){
  const s=rcpSub(); const q=RCP.quote;
  if(!q){ alert('Inserisci massimale e fatturato per calcolare il premio.'); return; }
  if(!document.getElementById('rcp-nosin')?.checked){ alert('Per procedere conferma la dichiarazione sull\'assenza di sinistri negli ultimi 5 anni.\n(In caso di sinistri, richiedi una quotazione personalizzata all\'ufficio.)'); return; }
  const nominativo=(document.getElementById('rcp-nominativo')?.value||'').trim();
  const cfPiva=(document.getElementById('rcp-cfPiva')?.value||'').trim().toUpperCase();
  if(!nominativo||!cfPiva){ alert('Inserisci contraente e Codice fiscale / Partita IVA.'); return; }
  let clienteId=RCP.cliente?.clienteId||null;
  if(cfPiva && !clienteId){ try{ const {data:ex}=await db.from('quote_anagrafiche').select('id').ilike('codice_fiscale',cfPiva).limit(1); if(ex&&ex[0]) clienteId=ex[0].id; }catch(e){} }
  if(cfPiva && !clienteId){ try{ const {data}=await db.from('quote_anagrafiche').insert({tipo:cfPiva.length===11?'giuridica':'fisica',nominativo:nominativo.toUpperCase(),codice_fiscale:cfPiva.length>11?cfPiva:null,partita_iva:cfPiva.length===11?cfPiva:null,creato_da:currentUser.id}).select('id').single(); if(data){clienteId=data.id; logMovimento('Nuovo cliente (da RC Prof) · '+nominativo,'cliente');} }catch(e){} }
  const dati={ categoria:RCP.cat, sottocategoria:s.nome, opzioni:RCP.optCfg?RCP.opts:null, fatturato:q.fatt, fatturatoFinoA:q.band, massimale:q.mass, franchigia:q.franchigia, premioNetto:q.netto, flag10:q.flag10, clienteId, note:(document.getElementById('rcp-note')?.value||'').trim(), stato:'quotato' };
  const newId=await savePreventivo({ modulo:'rcprof', prodotto:'RC '+rcCatLabel(RCP.cat)+' · '+rcNomeIt(s.nome), premio:Number(q.lordo.toFixed(2)), cliente:nominativo, dati });
  if(mode==='diretta' || mode==='procedi'){
    if(mode==='procedi' && !clienteId){ alert('Per procedere all\'emissione serve un cliente censito (con Codice fiscale / Partita IVA).'); return; }
    if(newId){ try{ notifyEmail('quotato', newId); }catch(e){} await loadStorico(); openPagamentoPreventivo(newId); }
    return;
  }
  notifyEmail('quotato', newId);
  alert('✓ Preventivo RC Professionale salvato!\n\n'+rcNomeIt(s.nome)+'\nMassimale '+q.mass+' · Fatturato fino a € '+q.band.toLocaleString('it-IT')+'\nPremio annuo: € '+q.lordo.toFixed(2)+'\n\nLo trovi nello Storico come "Quotato".');
  showPage('home');
}
/* ── MEDICI / PARAMEDICI · quoter a classi di rischio ── */
function rcpMedHTML(){
  const cat=RC_PROF[RCP.cat]||{}; const info=cat.info||{}; const classi=cat.classi||[];
  const nf=n=>Number(n).toLocaleString('it-IT');
  const specOpts=classi.map((c,ci)=>{
    const inv=/CON ATTI INVASIVI/i.test(c.invasivita||'')?' · atti invasivi':'';
    return `<optgroup label="Classe ${esc(c.classe)}${inv} — € ${nf(c.premio)}">`+(c.spec||[]).map(sp=>`<option value="${ci}">${esc(sp)}</option>`).join('')+`</optgroup>`;
  }).join('');
  const profili=info.profili||[];
  const profHTML=profili.length?`<div class="aw-field"><label>Profilo</label><select id="rcm-prof" onchange="rcpMedSpecToggle();rcpMedCompute()"><option value="">Medico specializzato (scegli specializzazione)</option>${profili.map((p,i)=>`<option value="${i}">${esc(p.label)} — € ${nf(p.premio)}</option>`).join('')}</select></div>`:'';
  const qual=info.qualifiche||[];
  const qualHTML=qual.length?`<div class="pv2-sec">Qualifiche direttive</div>${qual.map((q,i)=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="rcm-qual-${i}" onchange="rcpMedCompute()"> <span>${esc(q.label)} <span style="color:var(--muted);font-weight:400">· + € ${nf(q.extra)}</span></span></label>`).join('')}`:'';
  return `<button class="back-link" onclick="RCP.view='cats';rcpRender()"><i class="ti ti-arrow-left"></i> RC Professionale</button>
    <div class="pv2-wrap">
      <div class="pv2-main">
        <div class="pv2-h">${esc(rcCatLabel(RCP.cat))}</div>
        <div class="pv2-sub">RC professionale sanitaria · premio annuo lordo</div>
        ${profHTML}
        <div class="pv2-sec">Specializzazione</div>
        <div class="aw-field"><label>Specializzazione / disciplina *</label><select id="rcm-spec" onchange="rcpMedSpecPick();rcpMedCompute()"><option value="">Selezionare una voce</option>${specOpts}</select></div>
        <div class="pv2-sec">Garanzie</div>
        <div class="aw-field"><label>Retroattività</label><select id="rcm-retro" onchange="rcpMedCompute()"><option value="0">10 anni (inclusa)</option><option value="1">Illimitata (+25%)</option></select></div>
        ${qualHTML}
        <div class="pv2-sec">Contraente</div>
        <div class="pet-cli-mode">
          <button class="pet-cli-tab on" id="rcp-tab-cerca" onclick="rcpCliMode('cerca')"><i class="ti ti-search"></i> Cerca cliente esistente</button>
          <button class="pet-cli-tab" id="rcp-tab-nuovo" onclick="rcpCliMode('nuovo')"><i class="ti ti-user-plus"></i> Nuovo cliente</button>
        </div>
        <div class="aw-field geo-wrap" id="rcp-search-wrap"><label>Cerca cliente già censito</label><input id="rcp-search" placeholder="Nominativo, codice fiscale, P.IVA…" autocomplete="off" oninput="rcpClienteSearch(this.value)"><div id="rcp-search-res" class="geo-res"></div></div>
        <div class="aw-row2">
          <div class="aw-field"><label>Cognome Nome / Ragione sociale *</label><input id="rcp-nominativo"></div>
          <div class="aw-field"><label>Codice fiscale / Partita IVA *</label><input id="rcp-cfPiva" style="text-transform:uppercase"></div>
        </div>
        <div class="aw-field"><label>Note</label><textarea id="rcp-note" style="width:100%;min-height:56px;padding:11px;border:1px solid var(--line);border-radius:11px;font-family:inherit;font-size:14px"></textarea></div>
        <label class="aw-coincide"><input type="checkbox" id="rcp-nosin"> <span>Dichiaro che il cliente non ha avuto sinistri negli ultimi cinque anni.</span></label>
      </div>
      <aside class="pv2-panel">
        <div class="pv2-panel-h">Il tuo preventivo</div>
        <div class="pv2-comp"><span>Categoria</span><b style="color:var(--blue)">${esc(rcCatLabel(RCP.cat))}</b></div>
        <div id="rcp-result"></div>
        <button class="pv2-cta" onclick="rcpMedSalva('procedi')" style="background:linear-gradient(160deg,#2ec16a,#1c8a52);color:#fff;border:none"><i class="ti ti-cash" style="vertical-align:-2px"></i> Procedi all'emissione</button>
        <button class="pv2-cta2" onclick="rcpMedSalva('salva')">Salva preventivo</button>
      </aside>
    </div>`;
}
function rcpMedSpecToggle(){ const sp=document.getElementById('rcm-spec'); const pr=document.getElementById('rcm-prof'); if(sp&&pr&&pr.value!==''){ sp.value=''; } }
function rcpMedSpecPick(){ const sp=document.getElementById('rcm-spec'); const pr=document.getElementById('rcm-prof'); if(sp&&pr&&sp.value!==''){ pr.value=''; } }
function rcpMedCompute(){
  const cat=RC_PROF[RCP.cat]||{}; const info=cat.info||{}; const classi=cat.classi||[];
  const res=document.getElementById('rcp-result'); if(!res) return;
  const profSel=document.getElementById('rcm-prof')?.value;
  const specEl=document.getElementById('rcm-spec'); const specSel=specEl?specEl.value:'';
  const retro=document.getElementById('rcm-retro')?.value==='1';
  let base=null, etich='', franch=info.franchigia!=null?info.franchigia:null, profilo=null, classe=null, spec=null;
  if(profSel!==''&&profSel!=null){ const p=(info.profili||[])[+profSel]; if(p){ base=p.premio; etich=p.label; franch=p.franchigia; profilo=p.label; } }
  else if(specSel!==''&&specSel!=null){ const c=classi[+specSel]; if(c){ base=c.premio; classe=c.classe; etich='Classe '+c.classe; spec=specEl.options[specEl.selectedIndex]?.text||null; } }
  if(base==null){ res.innerHTML='<div style="font-size:13px;color:var(--muted);padding:6px 0 12px">Seleziona una <b>specializzazione</b> (o un profilo) per calcolare il premio.</div>'; RCP.medQuote=null; return; }
  const qual=info.qualifiche||[]; const qSel=[]; let qSum=0;
  qual.forEach((q,i)=>{ if(document.getElementById('rcm-qual-'+i)?.checked){ qSel.push(q); qSum+=q.extra; } });
  const retroPerc=info.retro_illimitata||0; const retroImporto=retro?base*retroPerc:0;
  const lordo=base+retroImporto+qSum;
  RCP.medQuote={base,profilo,classe,spec,etich,retro,qualifiche:qSel.map(q=>q.label),lordo,franchigia:franch,massimale_sinistro:info.massimale_sinistro,massimale_anno:info.massimale_anno};
  const eur=n=>'€ '+Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
  const nf=n=>Number(n).toLocaleString('it-IT');
  res.innerHTML=`
    <div class="pv2-panel-sub">Massimale € ${nf(info.massimale_sinistro)}/sinistro · € ${nf(info.massimale_anno)}/anno</div>
    <div class="pv2-line"><span>${esc(spec||profilo||etich)}</span><b style="color:var(--blue);text-align:right">${esc(etich)}</b></div>
    <div class="pv2-line"><span>Premio base</span><b>${eur(base)}</b></div>
    ${retro?`<div class="pv2-line"><span>Retroattività illimitata (+${Math.round(retroPerc*100)}%)</span><b>+ ${eur(retroImporto)}</b></div>`:`<div class="pv2-line"><span>Retroattività 10 anni</span><b>inclusa</b></div>`}
    ${qSel.map(q=>`<div class="pv2-line"><span>${esc(q.label)}</span><b>+ ${eur(q.extra)}</b></div>`).join('')}
    ${franch!=null?`<div class="pv2-line"><span>Franchigia</span><b>${franch>0?'€ '+nf(franch):'nessuna'}</b></div>`:''}
    <div class="pv2-div"></div>
    <div class="pv2-total"><span class="lab">Premio annuo lordo</span><div class="amt"><b>${eur(lordo)}</b><small>imposte incluse</small></div></div>`;
}
async function rcpMedSalva(mode){
  const q=RCP.medQuote;
  if(!q){ alert('Seleziona una specializzazione (o un profilo) per calcolare il premio.'); return; }
  if(!document.getElementById('rcp-nosin')?.checked){ alert('Per procedere conferma la dichiarazione sull\'assenza di sinistri negli ultimi 5 anni.\n(In caso di sinistri, richiedi una quotazione personalizzata all\'ufficio.)'); return; }
  const nominativo=(document.getElementById('rcp-nominativo')?.value||'').trim();
  const cfPiva=(document.getElementById('rcp-cfPiva')?.value||'').trim().toUpperCase();
  if(!nominativo||!cfPiva){ alert('Inserisci contraente e Codice fiscale / Partita IVA.'); return; }
  let clienteId=RCP.cliente?.clienteId||null;
  if(cfPiva && !clienteId){ try{ const {data:ex}=await db.from('quote_anagrafiche').select('id').ilike('codice_fiscale',cfPiva).limit(1); if(ex&&ex[0]) clienteId=ex[0].id; }catch(e){} }
  if(cfPiva && !clienteId){ try{ const {data}=await db.from('quote_anagrafiche').insert({tipo:cfPiva.length===11?'giuridica':'fisica',nominativo:nominativo.toUpperCase(),codice_fiscale:cfPiva.length>11?cfPiva:null,partita_iva:cfPiva.length===11?cfPiva:null,creato_da:currentUser.id}).select('id').single(); if(data){clienteId=data.id; logMovimento('Nuovo cliente (da RC Prof) · '+nominativo,'cliente');} }catch(e){} }
  const etich=q.spec||q.profilo||q.etich||'';
  const dati={ categoria:RCP.cat, profilo:q.profilo, classe:q.classe, specializzazione:q.spec, retroattivita:q.retro?'illimitata (+25%)':'10 anni', qualifiche:q.qualifiche, massimale:'€ '+Number(q.massimale_sinistro).toLocaleString('it-IT')+' / sinistro · € '+Number(q.massimale_anno).toLocaleString('it-IT')+' / anno', franchigia:q.franchigia, premioBase:q.base, clienteId, note:(document.getElementById('rcp-note')?.value||'').trim(), stato:'quotato' };
  const newId=await savePreventivo({ modulo:'rcprof', prodotto:'RC '+rcCatLabel(RCP.cat)+' · '+(q.profilo||q.etich), premio:Number(q.lordo.toFixed(2)), cliente:nominativo, dati });
  if(mode==='procedi'){
    if(!clienteId){ alert('Per procedere all\'emissione serve un cliente censito (con Codice fiscale / Partita IVA).'); return; }
    if(newId){ try{ notifyEmail('quotato', newId); }catch(e){} await loadStorico(); openPagamentoPreventivo(newId); }
    return;
  }
  notifyEmail('quotato', newId);
  alert('✓ Preventivo RC '+rcCatLabel(RCP.cat)+' salvato!\n\n'+etich+'\nPremio annuo: € '+q.lordo.toFixed(2)+'\n\nLo trovi nello Storico come "Quotato".');
  showPage('home');
}

/* ══════════════════════════════════════════════════════════════════
   AMTRUST — RC Professionale (Professione Protetta) · premi GIÀ LORDI
   Prima ondata "Professionisti": commercialista_protetto, ingegno_protetto,
   professioni_intellettuali (Avvocati), pubblico_impiego.
   NB: i premi in amtrust.json sono lordi → NON si applica rcLordo.
   ══════════════════════════════════════════════════════════════════ */
let AMTRUST=null, amtLoading=null;
const AMT_LOGO='logo-AMtrust.png'; // logo AmTrust (root del repo, come gli altri loghi compagnia)
function ensureAmtrust(){ if(AMTRUST) return Promise.resolve(AMTRUST); if(!amtLoading) amtLoading=fetch('tariffe/amtrust.json').then(r=>r.json()).then(d=>{AMTRUST=d;return d;}).catch(()=>{AMTRUST={prodotti:{}};return AMTRUST;}); return amtLoading; }
const AMT_KEYS=['commercialista_protetto','ingegno_protetto','professioni_intellettuali','pubblico_impiego',
  'medico_protetto','dentista_protetto','farmacista_protetto',
  'studi_dentistici','poliambulatori','residenze_sanitarie','farmacie'];
// Seconda ondata · classificazione per logica di quotazione
const AMT_SPEC=['medico_protetto','dentista_protetto'];          // per specializzazione/attività
const AMT_COMBO=['farmacista_protetto'];                          // per combinazione copertura×massimale
const AMT_RATE=['studi_dentistici','poliambulatori','residenze_sanitarie','farmacie']; // a tasso/per-unità
let AMT={key:null,cat:0,retro:null,sogg:'singolo',frazionamento:'Annuale'};
function amtProd(){ return ((AMTRUST&&AMTRUST.prodotti)||{})[AMT.key]||null; }
function amtProducts(){ const p=(AMTRUST&&AMTRUST.prodotti)||{}; return AMT_KEYS.filter(k=>p[k]&&p[k].tipo==='rc_professionale').map(k=>p[k]); }
function amtEur(n){ return '€ '+Number(n).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function amtNf(n){ return Number(n).toLocaleString('it-IT'); }
function amtHint(t){ return '<div style="font-size:13px;color:var(--muted);padding:6px 0 12px">'+t+'</div>'; }
function amtVarLabel(){ return AMT.key==='professioni_intellettuali'?'Compensi (€)':'Fatturato / Compensi (€)'; }
/* Frazionamento AMTRUST · divisione secca senza maggiorazione: rata = totale annuo ÷ n_rate */
const AMT_FRAZ_RATE={'Annuale':1,'Semestrale':2,'Quadrimestrale':3};
function amtFrazNRate(){ return AMT_FRAZ_RATE[AMT.frazionamento]||1; }
function amtFrazChange(){ AMT.frazionamento=document.getElementById('amt-fraz')?.value||'Annuale'; amtCompute(); }
function amtFrazSelectHTML(){
  const cur=AMT.frazionamento||'Annuale';
  return `<div class="pv2-sec">Frazionamento</div>
    <div class="aw-field" style="max-width:260px"><label>Frazionamento premio</label><select id="amt-fraz" onchange="amtFrazChange()">
      <option ${cur==='Annuale'?'selected':''}>Annuale</option>
      <option ${cur==='Semestrale'?'selected':''}>Semestrale</option>
      <option ${cur==='Quadrimestrale'?'selected':''}>Quadrimestrale</option>
    </select></div>
    <div style="font-size:12px;color:var(--muted);margin-top:.2rem">Divisione secca del premio annuo, senza interessi né maggiorazioni.</div>`;
}
// Blocco totale del preventivo: se frazionato mostra la RATA in evidenza e il premio annuo come dettaglio (nessuna maggiorazione)
function amtTotalBlock(totale, smallTxt){
  smallTxt = smallTxt || 'premi già lordi (imposte incl.)';
  const n = amtFrazNRate();
  if(n<=1){
    return `<div class="pv2-total"><span class="lab">Premio annuo lordo</span><div class="amt"><b>${amtEur(totale)}</b><small>${smallTxt}</small></div></div>`;
  }
  const rata = Math.round(totale/n); // il portale AmTrust arrotonda la rata all'euro (es. 2000/3 → 667)
  const lbl = n===2 ? 'Rata semestrale (2 rate)' : 'Rata quadrimestrale (3 rate)';
  return `<div class="pv2-total"><span class="lab">${lbl}</span><div class="amt"><b>${amtEur(rata)}</b><small>× ${n} rate · premio annuo ${amtEur(totale)}</small></div></div>`;
}
async function amtOpenList(){ await ensureAmtrust(); RCP.cat='__amtrust'; RCP.cliente=null; RCP.view='amtlist'; rcpRender(); }
async function amtOpenProd(key){ await ensureAmtrust(); const prod=(AMTRUST.prodotti||{})[key]; if(!prod) return; AMT={key,cat:0,sogg:'singolo',retro:null,frazionamento:'Annuale'}; const g=amtGrid(); AMT.retro=g.retro; RCP.cat='__amtrust'; RCP.cliente=null; RCP.view='amtquote'; rcpRender(); }
function amtListHTML(){
  const prods=amtProducts();
  const icons={commercialista_protetto:'ti-calculator',ingegno_protetto:'ti-ruler-2',professioni_intellettuali:'ti-gavel',pubblico_impiego:'ti-building-bank',
    medico_protetto:'ti-stethoscope',dentista_protetto:'ti-dental',farmacista_protetto:'ti-vaccine',
    studi_dentistici:'ti-dental-broken',poliambulatori:'ti-building-hospital',residenze_sanitarie:'ti-bed',farmacie:'ti-prescription'};
  return `<button class="back-link" onclick="RCP.view='cats';rcpRender()"><i class="ti ti-arrow-left"></i> RC Professionale</button>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:.2rem">
      <img src="${esc(AMT_LOGO)}" alt="AmTrust" style="height:40px;max-width:180px;object-fit:contain" onerror="this.style.display='none'">
      <div class="page-title" style="margin:0">Professione Protetta</div>
    </div>
    <div class="page-sub">AmTrust · RC Professionale — premi già lordi. Seleziona il prodotto.</div>
    <div class="mod-grid">${prods.map(p=>`<div class="mod-card" onclick="amtOpenProd('${p.key}')"><div class="mod-ic"><i class="ti ${icons[p.key]||'ti-briefcase'}"></i></div><div class="mod-name">${esc(p.nome)}</div><span class="mod-badge badge-quot">In quotazione</span></div>`).join('')}</div>`;
}
// Restituisce la griglia (righe/massimali/retro) per la combinazione corrente
function amtGrid(){
  const prod=amtProd(); if(!prod) return {rows:[],massimali:[],retros:[],retro:null};
  if(AMT.key==='ingegno_protetto'){
    const cat=(prod.categorie||[])[AMT.cat||0]||{dati:{}};
    const retros=Object.keys(cat.dati||{});
    const retro=(AMT.retro&&retros.includes(AMT.retro))?AMT.retro:retros[0];
    return {rows:(cat.dati||{})[retro]||[], massimali:prod.massimali||[], retro, retros, extraLbl:cat.nome};
  }
  if(AMT.key==='professioni_intellettuali'){
    if(AMT.sogg==='associato'){ const sz=(prod.sezioni_extra||[])[0]||{dati:{}}; return {rows:(sz.dati||{})['unica']||[], massimali:sz.massimali||[], retro:'unica', retros:['unica'], extraLbl:'Studio Associato / STP'}; }
    return {rows:(prod.rc_base||{})['unica']||[], massimali:prod.massimali||[], retro:'unica', retros:['unica'], extraLbl:'Avvocato singolo'};
  }
  const retros=prod.retroattivita||['unica'];
  const retro=(AMT.retro&&retros.includes(AMT.retro))?AMT.retro:retros[0];
  const rb=prod.rc_base||{};
  return {rows:rb[retro]||rb['unica']||[], massimali:prod.massimali||[], retro, retros};
}
// Raggruppa sconti/aumenti per tipologia di controllo UI
function amtCorr(prod){
  const all=[...((prod.sconti||[]).map(x=>({desc:x.desc,pct:x.pct}))), ...((prod.aumenti||[]).map(x=>({desc:x.desc,pct:x.pct})))];
  const g={franchigia:[],albo:[],highrisk:[],sinistri:[],tl:[],altro:[]};
  all.forEach((x,i)=>{ x.i=i; const d=x.desc||'';
    if(/tutela legale/i.test(d)) g.tl.push(x);
    else if(/iscrizione albo/i.test(d)) g.albo.push(x);
    else if(/high risk/i.test(d)) g.highrisk.push(x);
    else if(/franchigia|raddoppio|dimezzamento/i.test(d)) g.franchigia.push(x);
    else if(/sinistr/i.test(d)) g.sinistri.push(x);
    else g.altro.push(x);
  });
  return {all,g};
}
// Fascia testuale (Tutela Legale): estrae il limite superiore dal testo
function amtFasciaUpper(f){ const nums=(String(f).match(/[\d.]+/g)||[]).map(x=>parseInt(x.replace(/\./g,''),10)).filter(n=>!isNaN(n)); return nums.length?Math.max.apply(null,nums):Infinity; }
function amtFasciaRow(righe,val){ for(const r of righe){ if(val<=amtFasciaUpper(r.fascia)) return r; } return righe[righe.length-1]; }
function amtContraenteHTML(){
  return `<div class="pv2-sec">Contraente</div>
      <div class="pet-cli-mode">
        <button class="pet-cli-tab on" id="rcp-tab-cerca" onclick="rcpCliMode('cerca')"><i class="ti ti-search"></i> Cerca cliente esistente</button>
        <button class="pet-cli-tab" id="rcp-tab-nuovo" onclick="rcpCliMode('nuovo')"><i class="ti ti-user-plus"></i> Nuovo cliente</button>
      </div>
      <div class="aw-field geo-wrap" id="rcp-search-wrap"><label>Cerca cliente già censito</label><input id="rcp-search" placeholder="Nominativo, codice fiscale, P.IVA…" autocomplete="off" oninput="rcpClienteSearch(this.value)"><div id="rcp-search-res" class="geo-res"></div></div>
      <div class="aw-row2">
        <div class="aw-field"><label>Cognome Nome / Ragione sociale *</label><input id="rcp-nominativo"></div>
        <div class="aw-field"><label>Codice fiscale / Partita IVA *</label><input id="rcp-cfPiva" style="text-transform:uppercase"></div>
      </div>
      <div class="aw-field"><label>Note</label><textarea id="rcp-note" style="width:100%;min-height:56px;padding:11px;border:1px solid var(--line);border-radius:11px;font-family:inherit;font-size:14px"></textarea></div>
      <label class="aw-coincide"><input type="checkbox" id="rcp-nosin"> <span>Dichiaro che il cliente non ha avuto sinistri negli ultimi cinque anni.</span></label>`;
}
function amtQuoteHTML(){
  const prod=amtProd(); if(!prod){ return amtListHTML(); }
  let mainInner;
  if(AMT.key==='pubblico_impiego') mainInner=amtPiMainHTML(prod);
  else if(AMT_SPEC.includes(AMT.key)) mainInner=amtSpecMainHTML(prod);
  else if(AMT_COMBO.includes(AMT.key)) mainInner=amtComboMainHTML(prod);
  else if(AMT_RATE.includes(AMT.key)) mainInner=amtRateMainHTML(prod);
  else mainInner=amtGenMainHTML(prod);
  return `<button class="back-link" onclick="amtOpenList()"><i class="ti ti-arrow-left"></i> AMTRUST — Professione Protetta</button>
    <div class="pv2-wrap">
      <div class="pv2-main">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <img src="${esc(AMT_LOGO)}" alt="AmTrust" style="height:34px;max-width:150px;object-fit:contain" onerror="this.style.display='none'">
          <div class="pv2-h" style="margin:0">${esc(prod.nome)}</div>
        </div>
        <div class="pv2-sub">AMTRUST · quotazione RC professionale (premi già lordi)</div>
        ${mainInner}
        ${amtFrazSelectHTML()}
        ${amtContraenteHTML()}
      </div>
      <aside class="pv2-panel">
        <div class="pv2-panel-h">Il tuo preventivo</div>
        <div class="pv2-comp"><span>Prodotto</span><b style="color:var(--blue)">${esc(prod.nome)}</b></div>
        <div id="rcp-result"></div>
        <button class="pv2-cta" onclick="amtSalva('procedi')" style="background:linear-gradient(160deg,#2ec16a,#1c8a52);color:#fff;border:none"><i class="ti ti-cash" style="vertical-align:-2px"></i> Procedi all'emissione</button>
        <button class="pv2-cta2" onclick="amtSalva('salva')">Salva preventivo</button>
      </aside>
    </div>`;
}
function amtGaranzieHTML(prod){
  let h='';
  if(AMT.key==='commercialista_protetto'||AMT.key==='ingegno_protetto'){
    const gs=prod.garanzie_aggiuntive||[];
    if(gs.length){ h+='<div class="pv2-sec">Garanzie aggiuntive (premio fisso)</div>'+gs.map((ga,i)=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-g-${i}" onchange="amtCompute()"> <span>${esc(ga.nome)} <span style="color:var(--muted);font-weight:400">· + € ${amtNf(ga.premio)}</span></span></label>`).join(''); }
    if(AMT.key==='commercialista_protetto' && (prod.sezioni_extra||[]).length){
      h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-sez0" onchange="amtCompute()"> <span>Estensione Sindaco / Revisore / CdA / Membro OdV <span style="color:var(--muted);font-weight:400">· premio da tabella (fino a € 100.000)</span></span></label>`;
    }
  }
  if(AMT.key==='professioni_intellettuali'){
    const sz=(prod.sezioni_extra||[])[AMT.sogg==='associato'?2:1]||{massimali:[]};
    h+='<div class="pv2-sec">Garanzie aggiuntive opzionali (premio per fascia compensi)</div>'+(sz.massimali||[]).map((k,i)=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pg-${i}" onchange="amtCompute()"> <span>${esc(k)}</span></label>`).join('');
    const inf=(prod.sezioni_extra||[])[3];
    if(inf&&inf.dati){ h+='<div class="pv2-sec">Sezione Infortuni / RSM (pro capite)</div><div class="aw-field"><select id="amt-inf" onchange="amtCompute()"><option value="">Nessuna</option>'+inf.dati.map((o,i)=>`<option value="${i}">${esc(o.opzione)} · € ${amtNf(o.totale)}</option>`).join('')+'</select></div>'; }
  }
  return h;
}
function amtCorrHTML(prod){
  const {g}=amtCorr(prod);
  const items=g.franchigia.length+g.albo.length+g.highrisk.length+g.sinistri.length+g.altro.length;
  if(!items) return '';
  let h='<div class="pv2-sec">Correzioni di premio (RC)</div>';
  const selOf=(id,label,placeholder,arr)=>`<div class="aw-field"><label>${label}</label><select id="${id}" onchange="amtCompute()"><option value="">${placeholder}</option>${arr.map(c=>`<option value="${c.i}">${esc(c.desc)} (${c.pct>0?'+':''}${c.pct}%)</option>`).join('')}</select></div>`;
  if(g.franchigia.length) h+=selOf('amt-fr','Franchigia','Franchigia standard',g.franchigia);
  if(g.albo.length) h+=selOf('amt-albo','Anzianità iscrizione Albo','—',g.albo);
  if(g.highrisk.length) h+=selOf('amt-hr','Profilo High Risk','Standard',g.highrisk);
  if(g.sinistri.length) h+=selOf('amt-sin','Sinistri pregressi (RC)','Nessuno',g.sinistri);
  if(g.altro.length) h+=g.altro.map(c=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-corr-${c.i}" onchange="amtCompute()"> <span>${esc(c.desc)} <span style="color:var(--muted);font-weight:400">· ${c.pct>0?'+':''}${c.pct}%</span></span></label>`).join('');
  return h;
}
function amtTlHTML(prod){
  const tl=prod.tutela_legale; if(!tl||!tl.massimali) return '';
  const {g}=amtCorr(prod);
  let h='<div class="pv2-sec">Tutela Legale (opzionale)</div>';
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-tl-on" onchange="amtCompute()"> <span>Includi Tutela Legale</span></label>`;
  h+=`<div class="aw-row2"><div class="aw-field"><label>Massimale TL</label><select id="amt-tl-mass" onchange="amtCompute()"><option value="">Selezionare</option>${tl.massimali.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div>`;
  if(g.tl.length){ h+=`<div class="aw-field"><label>Sinistri pregressi TL</label><select id="amt-tl-sin" onchange="amtCompute()"><option value="">Nessuno</option>${g.tl.map(c=>`<option value="${c.i}">${esc(c.desc)} (${c.pct>0?'+':''}${c.pct}%)</option>`).join('')}</select></div>`; }
  h+='</div>';
  if(tl.vertenze_passive) h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-tl-vert" onchange="amtCompute()"> <span>Vertenze passive (premio da tabella)</span></label>`;
  return h;
}
function amtGenMainHTML(prod){
  const grid=amtGrid();
  let h='<div class="pv2-sec">Configurazione</div>';
  if(AMT.key==='ingegno_protetto'){
    h+=`<div class="aw-field"><label>Categoria professionale *</label><select id="amt-cat" onchange="amtCatChange()">${(prod.categorie||[]).map((c,i)=>`<option value="${i}" ${i===(AMT.cat||0)?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div>`;
  }
  if(AMT.key==='professioni_intellettuali'){
    h+=`<div class="aw-field"><label>Soggetto *</label><select id="amt-sogg" onchange="amtSoggChange()"><option value="singolo" ${AMT.sogg!=='associato'?'selected':''}>Avvocato singolo</option><option value="associato" ${AMT.sogg==='associato'?'selected':''}>Studio Associato / STP</option></select></div>`;
  }
  if(grid.retros&&grid.retros.length>1){
    h+=`<div class="aw-field"><label>Retroattività *</label><select id="amt-retro" onchange="amtRetroChange()">${grid.retros.map(r=>`<option ${r===grid.retro?'selected':''}>${esc(r)}</option>`).join('')}</select></div>`;
  }
  h+=`<div class="aw-row2">
    <div class="aw-field"><label>Massimale *</label><select id="amt-mass" onchange="amtCompute()"><option value="">Selezionare una voce</option>${grid.massimali.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div>
    <div class="aw-field"><label>${amtVarLabel()} *</label><input id="amt-var" type="number" min="0" step="1000" placeholder="es. 100000" oninput="amtCompute()"></div>
  </div>`;
  h+=amtGaranzieHTML(prod);
  h+=amtCorrHTML(prod);
  h+=amtTlHTML(prod);
  return h;
}
function amtRefreshMass(){ const sel=document.getElementById('amt-mass'); if(!sel) return; const grid=amtGrid(); const cur=sel.value; sel.innerHTML='<option value="">Selezionare una voce</option>'+grid.massimali.map(m=>`<option ${m===cur?'selected':''}>${esc(m)}</option>`).join(''); }
function amtCatChange(){ AMT.cat=+(document.getElementById('amt-cat')?.value||0); amtCompute(); }
function amtRetroChange(){ AMT.retro=document.getElementById('amt-retro')?.value||null; amtCompute(); }
function amtSoggChange(){ AMT.sogg=document.getElementById('amt-sogg')?.value||'singolo'; amtRefreshMass(); amtCompute(); }
function amtCompute(){
  if(AMT.key==='pubblico_impiego') return amtPiCompute();
  if(AMT_SPEC.includes(AMT.key)) return amtSpecCompute();
  if(AMT_COMBO.includes(AMT.key)) return amtComboCompute();
  if(AMT_RATE.includes(AMT.key)) return amtRateCompute();
  return amtGenCompute();
}
function amtGenCompute(){
  const prod=amtProd(); const res=document.getElementById('rcp-result'); if(!prod||!res) return;
  const grid=amtGrid();
  const mass=document.getElementById('amt-mass')?.value;
  const val=parseFloat(document.getElementById('amt-var')?.value)||0;
  if(!mass||!val){ res.innerHTML=amtHint('Seleziona il <b>massimale</b> e inserisci '+amtVarLabel().replace(' (€)','').toLowerCase()+'.'); RCP.amtQuote=null; return; }
  const turns=grid.rows.map(r=>r.t).sort((a,b)=>a-b);
  let band=turns.find(t=>t>=val); let overflow=false;
  if(band==null){ band=turns[turns.length-1]; overflow=true; }
  const row=grid.rows.find(r=>r.t===band);
  const base=row&&row.p?row.p[mass]:null;
  if(base==null){ res.innerHTML='<div style="font-size:13px;color:#c77a14;padding:6px 0 12px"><i class="ti ti-alert-triangle"></i> Combinazione non disponibile per massimale '+esc(mass)+' (quotazione riservata alla Direzione). Prova un altro massimale.</div>'; RCP.amtQuote=null; return; }
  // Correzioni %
  const {all,g}=amtCorr(prod);
  let corrPct=0; const corrLbl=[];
  ['amt-fr','amt-albo','amt-hr','amt-sin'].forEach(id=>{ const v=document.getElementById(id)?.value; if(v!==''&&v!=null&&v!==undefined){ const c=all[+v]; if(c){ corrPct+=c.pct; corrLbl.push(c.desc+' ('+(c.pct>0?'+':'')+c.pct+'%)'); } } });
  g.altro.forEach(c=>{ if(document.getElementById('amt-corr-'+c.i)?.checked){ corrPct+=c.pct; corrLbl.push(c.desc+' ('+(c.pct>0?'+':'')+c.pct+'%)'); } });
  const premioRC=base*(1+corrPct/100);
  // Garanzie a premio fisso
  const garSel=[];
  if(AMT.key==='commercialista_protetto'||AMT.key==='ingegno_protetto'){
    (prod.garanzie_aggiuntive||[]).forEach((ga,i)=>{ if(document.getElementById('amt-g-'+i)?.checked) garSel.push({nome:ga.nome,premio:ga.premio}); });
    if(AMT.key==='commercialista_protetto' && document.getElementById('amt-sez0')?.checked){
      const sz=(prod.sezioni_extra||[])[0]; const rows=(sz&&sz.dati?sz.dati[grid.retro]:null)||[];
      const t2=rows.map(r=>r.t).sort((a,b)=>a-b); let b2=t2.find(t=>t>=val); if(b2==null) b2=t2[t2.length-1];
      const r2=rows.find(r=>r.t===b2); const pr=r2&&r2.p?r2.p[mass]:null;
      if(pr!=null) garSel.push({nome:'Estensione Sindaco/Revisore/CdA/OdV',premio:pr});
      else garSel.push({nome:'Estensione Sindaco/Revisore/CdA/OdV — non disponibile per questa combinazione',premio:0});
    }
  }
  if(AMT.key==='professioni_intellettuali'){
    const sz=(prod.sezioni_extra||[])[AMT.sogg==='associato'?2:1]; const keys=(sz&&sz.massimali)||[]; const rows=(sz&&sz.dati?sz.dati['unica']:null)||[];
    const t2=rows.map(r=>r.t).sort((a,b)=>a-b); let b2=t2.find(t=>t>=val); if(b2==null) b2=t2[t2.length-1];
    const r2=rows.find(r=>r.t===b2);
    keys.forEach((k,i)=>{ if(document.getElementById('amt-pg-'+i)?.checked){ const pr=r2&&r2.p?r2.p[k]:null; if(pr!=null) garSel.push({nome:k,premio:pr}); } });
    const inf=(prod.sezioni_extra||[])[3]; const infV=document.getElementById('amt-inf')?.value;
    if(inf&&inf.dati&&infV!==''&&infV!=null){ const o=inf.dati[+infV]; if(o) garSel.push({nome:o.opzione,premio:o.totale}); }
  }
  // Tutela Legale
  let tlPremio=0, tlDett=null;
  const tl=prod.tutela_legale;
  if(tl&&tl.massimali&&document.getElementById('amt-tl-on')?.checked){
    const tlMass=document.getElementById('amt-tl-mass')?.value;
    if(tlMass){
      const trow=amtFasciaRow(tl.righe||[],val); const tlBase=trow&&trow.p?trow.p[tlMass]:null;
      if(tlBase!=null){
        let tlPct=0; const sinV=document.getElementById('amt-tl-sin')?.value; if(sinV!==''&&sinV!=null){ const c=all[+sinV]; if(c) tlPct+=c.pct; }
        const tlRC=tlBase*(1+tlPct/100);
        let vert=0; if(document.getElementById('amt-tl-vert')?.checked && tl.vertenze_passive){ const vi=(tl.righe||[]).indexOf(trow); vert=((tl.vertenze_passive[vi]||{}).premio)||0; }
        tlPremio=tlRC+vert; tlDett={mass:tlMass,fascia:trow.fascia,base:tlBase,pct:tlPct,vert};
      } else { tlDett={mass:tlMass,unavailable:true}; }
    }
  }
  const garTot=garSel.reduce((s,x)=>s+x.premio,0);
  const totale=premioRC+garTot+tlPremio;
  RCP.amtQuote={key:AMT.key,prodNome:prod.nome,mass,variabile:val,band,retro:grid.retro,extraLbl:grid.extraLbl||null,sogg:AMT.key==='professioni_intellettuali'?AMT.sogg:null,base,corrPct,corrLbl,premioRC,garanzie:garSel,tl:tlDett,tlPremio,totale,overflow};
  const tlLine=tlDett?(tlDett.unavailable?`<div class="pv2-line" style="color:#c77a14"><span>Tutela Legale (${esc(tlDett.mass)})</span><b>non disp.</b></div>`:`<div class="pv2-line"><span>Tutela Legale (${esc(tlDett.mass)})</span><b>+ ${amtEur(tlPremio)}</b></div>`):'';
  res.innerHTML=`
    <div class="pv2-panel-sub">${esc(prod.nome)}${grid.extraLbl?(' · '+esc(grid.extraLbl)):''}</div>
    <div class="pv2-line"><span>Massimale</span><b>${esc(mass)}</b></div>
    <div class="pv2-line"><span>${esc(amtVarLabel().replace(' (€)',''))} fino a</span><b>€ ${amtNf(band)}</b></div>
    ${grid.retro&&grid.retro!=='unica'?`<div class="pv2-line"><span>Retroattività</span><b>${esc(grid.retro)}</b></div>`:''}
    <div class="pv2-line"><span>Premio RC base (lordo)</span><b>${amtEur(base)}</b></div>
    ${corrPct!==0?`<div class="pv2-line"><span>Correzioni (${corrPct>0?'+':''}${corrPct}%)</span><b>${(premioRC-base>=0?'+ ':'- ')+amtEur(Math.abs(premioRC-base))}</b></div>`:''}
    ${garSel.map(gg=>`<div class="pv2-line"><span>${esc(gg.nome)}</span><b>+ ${amtEur(gg.premio)}</b></div>`).join('')}
    ${tlLine}
    <div class="pv2-div"></div>
    ${amtTotalBlock(totale)}
    ${overflow?'<div style="font-size:12px;color:#c77a14;margin-top:.4rem"><i class="ti ti-alert-triangle"></i> Valore oltre la soglia massima della tabella: applicata la fascia più alta, verifica con l\'ufficio.</div>':''}`;
}
/* ── PUBBLICO IMPIEGO · struttura a fasce di carica (semplificata: singola carica) ── */
function amtPiMainHTML(prod){
  const S=prod.sezioni||{};
  const A=S.A_responsabilita_amministrativa||{massimali:[]};
  const Aopt=S.A_opzioni||[]; const Avar=S.A_variazioni_per_ente||[];
  const B=S.B_tutela_legale||{righe:[]}; const Bopt=S.B_opzioni||[];
  const C=S.C_infortuni||{garanzie:[]}; const cTot=(C.garanzie||[]).reduce((s,x)=>s+x.premio,0);
  const bkeys=Object.keys(((B.righe||[]).find(r=>r.p&&Object.keys(r.p).length)||{p:{}}).p);
  let h='<div class="pv2-sec">Sezione A · Responsabilità Amministrativo/Contabile</div>';
  h+=`<div class="aw-row2"><div class="aw-field"><label>Fascia di carica *</label><select id="amt-pi-fascia" onchange="amtCompute()"><option value="">Selezionare</option><option>Fascia 1</option><option>Fascia 2</option><option>Fascia 3</option></select></div>
    <div class="aw-field"><label>Massimale *</label><select id="amt-mass" onchange="amtCompute()"><option value="">Selezionare</option>${(A.massimali||[]).map(m=>`<option>${esc(m)}</option>`).join('')}</select></div></div>`;
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-a1" onchange="amtCompute()"> <span>A.1) Estensione danni materiali (senza qualifica tecnica)</span></label>`;
  h+=Aopt.map((o,i)=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-aopt-${i}" onchange="amtCompute()"> <span>${esc(o.desc)} <span style="color:var(--muted);font-weight:400">· ${o.pct>0?'+':''}${o.pct}%</span></span></label>`).join('');
  h+=`<div class="aw-field"><label>Variazione per Ente</label><select id="amt-pi-var" onchange="amtCompute()"><option value="">Nessuna</option>${Avar.map((v,i)=>`<option value="${i}">${esc(v.desc)} (${v.pct>0?'+':''}${v.pct}%)</option>`).join('')}</select></div>`;
  h+='<div class="pv2-sec">Sezione B · Tutela Legale (opzionale)</div>';
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-b-on" onchange="amtCompute()"> <span>Includi Sezione B</span></label>`;
  h+=`<div class="aw-field"><label>Cariche</label><select id="amt-pi-b-tipo" onchange="amtCompute()">${bkeys.map(k=>`<option>${esc(k)}</option>`).join('')}</select></div>`;
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-b1" onchange="amtCompute()"> <span>B.1) Eliminazione della franchigia</span></label>`;
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-b2" onchange="amtCompute()"> <span>B.2) Vertenze lavoro/circolazione/vita privata (solo con B.1)</span></label>`;
  h+=Bopt.map((o,i)=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-bopt-${i}" onchange="amtCompute()"> <span>${esc(o.desc)} <span style="color:var(--muted);font-weight:400">· ${o.pct>0?'+':''}${o.pct}%</span></span></label>`).join('');
  h+='<div class="pv2-sec">Sezione C · Infortuni (opzionale)</div>';
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-pi-c" onchange="amtCompute()"> <span>Morte + Invalidità permanente (SA € 50.000) <span style="color:var(--muted);font-weight:400">· + € ${amtNf(cTot)}</span></span></label>`;
  h+='<div style="font-size:12px;color:var(--muted);margin-top:.4rem">Calcolo su singola carica. Per più cariche (stesso ente / enti diversi) verifica le regole con l\'ufficio.</div>';
  return h;
}
function amtPiCompute(){
  const prod=amtProd(); const res=document.getElementById('rcp-result'); if(!prod||!res) return;
  const S=prod.sezioni||{};
  const fascia=document.getElementById('amt-pi-fascia')?.value;
  const mass=document.getElementById('amt-mass')?.value;
  if(!fascia||!mass){ res.innerHTML=amtHint('Seleziona <b>fascia di carica</b> e <b>massimale</b>.'); RCP.amtQuote=null; return; }
  const A=S.A_responsabilita_amministrativa||{righe:[]};
  const arow=(A.righe||[]).find(r=>r.fascia===fascia);
  const aBase=arow&&arow.p?arow.p[mass]:null;
  if(aBase==null){ res.innerHTML='<div style="font-size:13px;color:#c77a14;padding:6px 0 12px"><i class="ti ti-alert-triangle"></i> '+esc(fascia)+' · massimale '+esc(mass)+': quotazione riservata alla Direzione.</div>'; RCP.amtQuote=null; return; }
  let a1=0; if(document.getElementById('amt-pi-a1')?.checked){ const v=((S.A1_estensione_danni_materiali||{valori:[]}).valori.find(x=>x.fascia===fascia)||{}); a1=v.importo||0; }
  const aAA=aBase+a1;
  let apct=0; const albl=[];
  (S.A_opzioni||[]).forEach((o,i)=>{ if(document.getElementById('amt-pi-aopt-'+i)?.checked){ apct+=o.pct; albl.push(o.desc+' ('+(o.pct>0?'+':'')+o.pct+'%)'); } });
  const varSel=document.getElementById('amt-pi-var')?.value; if(varSel!==''&&varSel!=null){ const v=(S.A_variazioni_per_ente||[])[+varSel]; if(v){ apct+=v.pct; albl.push(v.desc+' ('+(v.pct>0?'+':'')+v.pct+'%)'); } }
  const premioA=aAA*(1+apct/100);
  let premioB=0, bDett=null;
  if(document.getElementById('amt-pi-b-on')?.checked){
    const B=S.B_tutela_legale||{righe:[]}; const tipo=document.getElementById('amt-pi-b-tipo')?.value;
    const brow=(B.righe||[]).find(r=>r.fascia===fascia); const bBase=brow&&brow.p?brow.p[tipo]:null;
    if(bBase!=null){
      let b1=0; if(document.getElementById('amt-pi-b1')?.checked){ const B1r=((S.B1_eliminazione_franchigia||{righe:[]}).righe.find(r=>r.fascia===fascia)); b1=(B1r&&B1r.p?B1r.p[tipo]:0)||0; }
      let b2=0; if(document.getElementById('amt-pi-b2')?.checked && b1>0){ const v=((S.B2_vertenze||{valori:[]}).valori.find(x=>x.fascia===fascia)||{}); b2=v.importo||0; }
      let bpct=0; (S.B_opzioni||[]).forEach((o,i)=>{ if(document.getElementById('amt-pi-bopt-'+i)?.checked) bpct+=o.pct; });
      premioB=(bBase+b1)*(1+bpct/100)+b2; bDett={tipo,base:bBase,b1,b2,bpct};
    } else { bDett={unavailable:true}; }
  }
  let premioC=0; if(document.getElementById('amt-pi-c')?.checked){ premioC=((S.C_infortuni||{garanzie:[]}).garanzie||[]).reduce((s,x)=>s+x.premio,0); }
  const totale=premioA+premioB+premioC;
  RCP.amtQuote={key:AMT.key,prodNome:prod.nome,fascia,mass,aBase,a1,apct,albl,premioA,premioB,bDett,premioC,totale};
  res.innerHTML=`
    <div class="pv2-panel-sub">${esc(prod.nome)} · ${esc(fascia)}</div>
    <div class="pv2-line"><span>Massimale</span><b>${esc(mass)}</b></div>
    <div class="pv2-line"><span>Sez. A base</span><b>${amtEur(aBase)}</b></div>
    ${a1?`<div class="pv2-line"><span>A.1 Estensione danni materiali</span><b>+ ${amtEur(a1)}</b></div>`:''}
    ${apct?`<div class="pv2-line"><span>Opzioni/Variazioni A (${apct>0?'+':''}${apct}%)</span><b>${(premioA-aAA>=0?'+ ':'- ')+amtEur(Math.abs(premioA-aAA))}</b></div>`:''}
    <div class="pv2-line"><span>Premio Sezione A</span><b>${amtEur(premioA)}</b></div>
    ${premioB?`<div class="pv2-line"><span>Sezione B (Tutela Legale)</span><b>+ ${amtEur(premioB)}</b></div>`:(bDett&&bDett.unavailable?`<div class="pv2-line" style="color:#c77a14"><span>Sezione B</span><b>Direzione</b></div>`:'')}
    ${premioC?`<div class="pv2-line"><span>Sezione C (Infortuni)</span><b>+ ${amtEur(premioC)}</b></div>`:''}
    <div class="pv2-div"></div>
    ${amtTotalBlock(totale,'premi già lordi')}`;
}
/* ══════════════════════════════════════════════════════════════════
   AMTRUST — SECONDA ONDATA (Sanità/Farmacie) · premi GIÀ LORDI
   Tre logiche di quotazione aggiuntive:
   · SPECIALIZZAZIONE  → medico_protetto, dentista_protetto
   · COMBINAZIONE      → farmacista_protetto
   · TASSO / PER-UNITÀ → studi_dentistici, poliambulatori,
                          residenze_sanitarie, farmacie
   Tutti i numeri vengono da tariffe/amtrust.json (mai hard-coded).
   ══════════════════════════════════════════════════════════════════ */
function amtMoney(m){ const n=Number(String(m).replace(/[^\d]/g,'')); return isFinite(n)&&n?('€ '+n.toLocaleString('it-IT')):esc(m); }
function amtPct(n){ return (n>0?'+':'')+String(n).replace('.',',')+'%'; }
function amtUnavail(res,msg){ res.innerHTML='<div style="font-size:13px;color:#c77a14;padding:6px 0 12px"><i class="ti ti-alert-triangle"></i> '+msg+'</div>'; RCP.amtQuote=null; }

/* ── SPECIALIZZAZIONE (medico/dentista) ─────────────────────────── */
function amtSpecRows(prod){
  const rows=((prod.rc_base||{})['10_anni'])||[];
  if(AMT.key==='medico_protetto'){ const area=AMT.area||'non_chirurgica'; return rows.filter(r=>r.area===area); }
  return rows;
}
function amtSpecMassimali(prod){
  let m=prod.massimali||[];
  if(AMT.key==='medico_protetto' && AMT.area==='chirurgica') m=m.filter(x=>x!=='1.000.000');
  return m;
}
function amtSpecRetroEur(prod){
  const se=(prod.sezioni_extra||[]).find(s=>/illimitata/i.test(s.titolo||'')); const d=(se&&se.dati)||{};
  if(AMT.key==='medico_protetto') return (AMT.area==='chirurgica')?d.aree_mediche_chirurgiche:d.aree_mediche_non_chirurgiche;
  return d.sovrappremio;
}
function amtSpecMainHTML(prod){
  let h='<div class="pv2-sec">Configurazione</div>';
  if(AMT.key==='medico_protetto'){
    h+=`<div class="aw-field"><label>Area medica *</label><select id="amt-area" onchange="amtAreaChange()"><option value="non_chirurgica" ${AMT.area!=='chirurgica'?'selected':''}>Area non chirurgica</option><option value="chirurgica" ${AMT.area==='chirurgica'?'selected':''}>Area chirurgica</option></select></div>`;
  }
  const rows=amtSpecRows(prod);
  h+=`<div class="aw-field"><label>Specializzazione / attività *</label><input id="amt-spec" list="amt-spec-list" placeholder="Digita per cercare…" autocomplete="off" oninput="amtCompute()"><datalist id="amt-spec-list">${rows.map(r=>`<option value="${esc(r.specializzazione)}">`).join('')}</datalist></div>`;
  const mm=amtSpecMassimali(prod);
  h+=`<div class="aw-field"><label>Massimale *</label><select id="amt-mass" onchange="amtCompute()"><option value="">Selezionare</option>${mm.map(m=>`<option>${esc(m)}</option>`).join('')}</select></div>`;
  h+='<div class="pv2-sec">Retroattività</div><div style="font-size:13px;color:var(--muted);padding:2px 0 8px">Retroattività di 10 anni sempre inclusa nel premio base.</div>';
  const rE=amtSpecRetroEur(prod);
  h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-retroill" onchange="amtCompute()"> <span>Retroattività illimitata <span style="color:var(--muted);font-weight:400">· ${rE!=null?('+ € '+amtNf(rE)):'n.d.'}</span></span></label>`;
  const gs=prod.garanzie_aggiuntive||[];
  if(gs.length){ h+='<div class="pv2-sec">Garanzie aggiuntive (premio fisso)</div>'+gs.map((ga,i)=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-g-${i}" onchange="amtCompute()"> <span>${esc(ga.nome)} <span style="color:var(--muted);font-weight:400">· + € ${amtNf(ga.premio)}</span></span></label>`).join(''); }
  h+=amtCorrHTML(prod);
  return h;
}
function amtAreaChange(){
  AMT.area=document.getElementById('amt-area')?.value||'non_chirurgica';
  const prod=amtProd(); const rows=amtSpecRows(prod);
  const dl=document.getElementById('amt-spec-list'); if(dl) dl.innerHTML=rows.map(r=>`<option value="${esc(r.specializzazione)}">`).join('');
  const si=document.getElementById('amt-spec'); if(si) si.value='';
  const ms=document.getElementById('amt-mass'); if(ms){ const mm=amtSpecMassimali(prod); ms.innerHTML='<option value="">Selezionare</option>'+mm.map(m=>`<option>${esc(m)}</option>`).join(''); }
  amtCompute();
}
function amtSpecCompute(){
  const prod=amtProd(); const res=document.getElementById('rcp-result'); if(!prod||!res) return;
  const specName=(document.getElementById('amt-spec')?.value||'').trim();
  const mass=document.getElementById('amt-mass')?.value;
  const rows=amtSpecRows(prod); const row=rows.find(r=>r.specializzazione===specName);
  if(!specName||!row){ res.innerHTML=amtHint('Scegli una <b>specializzazione</b> dall\'elenco.'); RCP.amtQuote=null; return; }
  if(!mass){ res.innerHTML=amtHint('Seleziona il <b>massimale</b>.'); RCP.amtQuote=null; return; }
  const base=row.p?row.p[mass]:null;
  if(base==null){ return amtUnavail(res,'Combinazione non disponibile per massimale '+esc(mass)+' (quotazione riservata alla Direzione). Prova un altro massimale.'); }
  const {all,g}=amtCorr(prod);
  let corrPct=0; const corrLbl=[];
  ['amt-fr','amt-albo','amt-hr','amt-sin'].forEach(id=>{ const v=document.getElementById(id)?.value; if(v!==''&&v!=null){ const c=all[+v]; if(c){ corrPct+=c.pct; corrLbl.push(c.desc+' ('+amtPct(c.pct)+')'); } } });
  g.altro.forEach(c=>{ if(document.getElementById('amt-corr-'+c.i)?.checked){ corrPct+=c.pct; corrLbl.push(c.desc+' ('+amtPct(c.pct)+')'); } });
  const premioRC=base*(1+corrPct/100);
  let retroEur=0; if(document.getElementById('amt-retroill')?.checked){ retroEur=amtSpecRetroEur(prod)||0; }
  const garSel=[];
  (prod.garanzie_aggiuntive||[]).forEach((ga,i)=>{ if(document.getElementById('amt-g-'+i)?.checked) garSel.push({nome:ga.nome,premio:ga.premio}); });
  const garTot=garSel.reduce((s,x)=>s+x.premio,0);
  const totale=premioRC+retroEur+garTot;
  RCP.amtQuote={key:AMT.key,prodNome:prod.nome,spec:specName,area:AMT.key==='medico_protetto'?(AMT.area||'non_chirurgica'):null,classe:row.classe,mass,base,corrPct,corrLbl,premioRC,retroIll:retroEur>0,retroEur,garanzie:garSel,totale};
  res.innerHTML=`
    <div class="pv2-panel-sub">${esc(prod.nome)}</div>
    <div class="pv2-line"><span>Specializzazione</span><b style="text-align:right;max-width:60%">${esc(specName)}</b></div>
    ${AMT.key==='medico_protetto'?`<div class="pv2-line"><span>Area</span><b>${AMT.area==='chirurgica'?'Chirurgica':'Non chirurgica'}</b></div>`:''}
    <div class="pv2-line"><span>Massimale</span><b>${esc(mass)}</b></div>
    <div class="pv2-line"><span>Premio RC base (lordo)</span><b>${amtEur(base)}</b></div>
    ${corrPct!==0?`<div class="pv2-line"><span>Correzioni (${amtPct(corrPct)})</span><b>${(premioRC-base>=0?'+ ':'- ')+amtEur(Math.abs(premioRC-base))}</b></div>`:''}
    ${retroEur>0?`<div class="pv2-line"><span>Retroattività illimitata</span><b>+ ${amtEur(retroEur)}</b></div>`:''}
    ${garSel.map(gg=>`<div class="pv2-line"><span>${esc(gg.nome)}</span><b>+ ${amtEur(gg.premio)}</b></div>`).join('')}
    <div class="pv2-div"></div>
    ${amtTotalBlock(totale)}
    <div style="font-size:12px;color:var(--muted);margin-top:.4rem">Franchigia base € ${amtNf(prod.franchigia_base||500)} per sinistro. In presenza di sinistri pregressi valuta le maggiorazioni.</div>`;
}

/* ── COMBINAZIONE (farmacista) ──────────────────────────────────── */
const AMT_COP_LBL={solo_colpa_grave:'Solo Colpa Grave',responsabilita_civile_e_colpa_grave:'RC + Colpa Grave'};
function amtComboList(prod,cop){ return (prod.combinazioni||[]).filter(c=>c.copertura===cop); }
function amtComboMainHTML(prod){
  let h='<div class="pv2-sec">Configurazione</div>';
  h+=`<div class="aw-field"><label>Tipo di copertura *</label><select id="amt-cop" onchange="amtComboCopChange()"><option value="">Selezionare</option>${(prod.coperture||[]).map(c=>`<option value="${esc(c)}">${esc(AMT_COP_LBL[c]||c)}</option>`).join('')}</select></div>`;
  h+=`<div class="aw-field"><label>Massimale (per sinistro / per periodo) *</label><select id="amt-combo-mass" onchange="amtCompute()"><option value="">Selezionare prima la copertura</option></select></div>`;
  h+='<div style="font-size:13px;color:var(--muted);padding:2px 0 8px">Retroattività di 10 anni inclusa nel premio base.</div>';
  const rIll=(prod.retroattivita||[]).find(r=>r&&r.tipo==='illimitata');
  if(rIll) h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-retroill" onchange="amtCompute()"> <span>Retroattività illimitata <span style="color:var(--muted);font-weight:400">· + € ${amtNf(rIll.premio_aggiuntivo_lordo)}</span></span></label>`;
  (prod.garanzie_aggiuntive||[]).forEach((ga,i)=>{ h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-g-${i}" onchange="amtCompute()"> <span>${esc(ga.nome)} <span style="color:var(--muted);font-weight:400">· + € ${amtNf(ga.premio_lordo)}</span></span></label>`; });
  h+='<div style="font-size:12px;color:var(--muted);margin-top:.4rem">In presenza di Fatti Noti e/o Sinistri pregressi la quotazione è riservata alla Direzione.</div>';
  return h;
}
function amtComboCopChange(){
  const cop=document.getElementById('amt-cop')?.value||''; const sel=document.getElementById('amt-combo-mass');
  const list=amtComboList(amtProd(),cop);
  if(sel) sel.innerHTML='<option value="">Selezionare</option>'+list.map((c,i)=>`<option value="${i}">€ ${amtNf(c.massimale_per_sinistro)} / € ${amtNf(c.massimale_per_periodo)}</option>`).join('');
  amtCompute();
}
function amtComboCompute(){
  const prod=amtProd(); const res=document.getElementById('rcp-result'); if(!prod||!res) return;
  const cop=document.getElementById('amt-cop')?.value||'';
  if(!cop){ res.innerHTML=amtHint('Seleziona il <b>tipo di copertura</b>.'); RCP.amtQuote=null; return; }
  const mi=document.getElementById('amt-combo-mass')?.value; const list=amtComboList(prod,cop);
  if(mi===''||mi==null){ res.innerHTML=amtHint('Seleziona il <b>massimale</b>.'); RCP.amtQuote=null; return; }
  const combo=list[+mi]; const base=combo?combo.premio_lordo:null;
  if(base==null){ return amtUnavail(res,'Combinazione non disponibile (quotazione riservata alla Direzione).'); }
  let retroEur=0; const rIll=(prod.retroattivita||[]).find(r=>r&&r.tipo==='illimitata');
  if(rIll && document.getElementById('amt-retroill')?.checked) retroEur=rIll.premio_aggiuntivo_lordo||0;
  const garSel=[];
  (prod.garanzie_aggiuntive||[]).forEach((ga,i)=>{ if(document.getElementById('amt-g-'+i)?.checked) garSel.push({nome:ga.nome,premio:ga.premio_lordo}); });
  const garTot=garSel.reduce((s,x)=>s+x.premio,0);
  const totale=base+retroEur+garTot;
  RCP.amtQuote={key:AMT.key,prodNome:prod.nome,copertura:cop,coperturaLbl:AMT_COP_LBL[cop]||cop,massSin:combo.massimale_per_sinistro,massPer:combo.massimale_per_periodo,base,retroIll:retroEur>0,retroEur,garanzie:garSel,totale};
  res.innerHTML=`
    <div class="pv2-panel-sub">${esc(prod.nome)}</div>
    <div class="pv2-line"><span>Copertura</span><b>${esc(AMT_COP_LBL[cop]||cop)}</b></div>
    <div class="pv2-line"><span>Massimale sinistro / periodo</span><b>€ ${amtNf(combo.massimale_per_sinistro)} / € ${amtNf(combo.massimale_per_periodo)}</b></div>
    <div class="pv2-line"><span>Premio RC base (lordo)</span><b>${amtEur(base)}</b></div>
    ${retroEur>0?`<div class="pv2-line"><span>Retroattività illimitata</span><b>+ ${amtEur(retroEur)}</b></div>`:''}
    ${garSel.map(gg=>`<div class="pv2-line"><span>${esc(gg.nome)}</span><b>+ ${amtEur(gg.premio)}</b></div>`).join('')}
    <div class="pv2-div"></div>
    ${amtTotalBlock(totale)}`;
}

/* ── TASSO / PER-UNITÀ (studi_dentistici, poliambulatori, residenze, farmacie) ── */
function amtRateVarLabel(){ if(AMT.key==='farmacie') return 'Numero addetti'; if(AMT.key==='residenze_sanitarie') return 'Posti letto'; return 'Fatturato (€)'; }
// Tasso pro-mille applicato PROGRESSIVAMENTE per scaglione di fatturato (vedi note JSON)
function amtProgressive(table,fatt,massBase){
  const rows=(table||[]).map(r=>({t:(r.t==null?Infinity:r.t),rate:r.p[massBase]})).sort((a,b)=>a.t-b.t);
  let prev=0,tot=0; const parts=[]; let maxFinite=0; let covered=false;
  for(const r of rows){ if(isFinite(r.t)) maxFinite=Math.max(maxFinite,r.t); const upper=r.t; const slice=Math.min(fatt,upper)-prev; if(slice>0){ tot+=slice*r.rate/1000; parts.push('€ '+amtNf(Math.round(slice))+' × '+String(r.rate).replace('.',',')+'‰'); } if(fatt<=upper){ covered=true; break; } prev=upper; }
  const over=!covered && fatt>maxFinite; // fatturato oltre l'ultimo scaglione finito
  return {premio:tot,dett:parts.join(' + '),over};
}
function amtRateMainHTML(prod){
  let h='<div class="pv2-sec">Configurazione</div>';
  if(AMT.key==='poliambulatori'){
    const cols=Object.keys(prod.rc_base||{}); const cl={base:'Base',radiologia_ginecologia:'Radiologia e/o Ginecologia'};
    h+=`<div class="aw-field"><label>Tariffa attività *</label><select id="amt-col" onchange="amtCompute()">${cols.map(c=>`<option value="${esc(c)}">${esc(cl[c]||c)}</option>`).join('')}</select></div>`;
  }
  if(AMT.key==='residenze_sanitarie'){
    const rows=((prod.rc_base||{}).unica)||[];
    h+='<div class="aw-row2">'+rows.map((r,i)=>`<div class="aw-field"><label>Posti letto · ${esc(r.descrizione||r.tipologia)} <span style="color:var(--muted);font-weight:400">(€ ${amtNf(r.p[prod.massimale_base])}/pl)</span></label><input id="amt-pl-${i}" type="number" min="0" step="1" placeholder="0" oninput="amtCompute()"></div>`).join('')+'</div>';
  } else {
    h+=`<div class="aw-field"><label>${amtRateVarLabel()} *</label><input id="amt-var" type="number" min="0" step="${AMT.key==='farmacie'?'1':'1000'}" placeholder="${AMT.key==='farmacie'?'es. 4':'es. 300000'}" oninput="amtCompute()"></div>`;
  }
  h+=`<div class="aw-field"><label>Massimale per sinistro *</label><select id="amt-mass" onchange="amtCompute()"><option value="">Selezionare</option>${(prod.massimali||[]).map(m=>`<option value="${esc(m)}" ${m===prod.massimale_base?'selected':''}>${amtMoney(m)}${m===prod.massimale_base?' (base)':''}</option>`).join('')}</select></div>`;
  if((prod.retroattivita||[]).includes('illimitata')){
    const a=(prod.aumenti||[]).find(x=>/illimitata/i.test(x.nome||'')); const pct=a?a.percentuale:0;
    h+='<div style="font-size:13px;color:var(--muted);padding:2px 0 8px">Retroattività 10 anni inclusa nel premio base.</div>';
    h+=`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-retroill" onchange="amtCompute()"> <span>Retroattività illimitata <span style="color:var(--muted);font-weight:400">· ${amtPct(pct)}</span></span></label>`;
  } else {
    h+='<div style="font-size:13px;color:var(--muted);padding:2px 0 8px">Retroattività di 10 anni inclusa (fissa).</div>';
  }
  // Aumenti facoltativi (esclusi massimale e retroattività, gestiti a parte)
  const aumOpt=(prod.aumenti||[]).map((a,i)=>({a,i})).filter(o=>!o.a.massimale && !/illimitata/i.test(o.a.nome||''));
  if(aumOpt.length){ h+='<div class="pv2-sec">Estensioni (aumenti)</div>'+aumOpt.map(o=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-aum-${o.i}" onchange="amtCompute()"> <span>${esc(o.a.nome)} <span style="color:var(--muted);font-weight:400">· ${amtPct(o.a.percentuale)}${o.a.condizione?(' — '+esc(o.a.condizione)):''}</span></span></label>`).join(''); }
  // Franchigie facoltative (sconti con campo 'franchigia') → select mutuamente esclusiva
  const scF=(prod.sconti||[]).map((s,i)=>({s,i})).filter(o=>o.s.franchigia!=null);
  const scO=(prod.sconti||[]).map((s,i)=>({s,i})).filter(o=>o.s.franchigia==null);
  if(scF.length){ h+='<div class="pv2-sec">Franchigia facoltativa <span style="color:var(--muted);font-weight:400">(solo in assenza di sinistri pregressi)</span></div><div class="aw-field"><select id="amt-frq" onchange="amtCompute()"><option value="">Franchigia base'+(prod.franchigia_base?(' € '+amtNf(prod.franchigia_base)):'')+'</option>'+scF.map(o=>`<option value="${o.i}">Franchigia € ${amtNf(o.s.franchigia)} (${amtPct(o.s.percentuale)})</option>`).join('')+'</select></div>'; }
  if(scO.length){ h+='<div class="pv2-sec">Sconti</div>'+scO.map(o=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-sc-${o.i}" onchange="amtCompute()"> <span>${esc(o.s.nome)} <span style="color:var(--muted);font-weight:400">· ${amtPct(o.s.percentuale)}</span></span></label>`).join(''); }
  // Garanzie aggiuntive a percentuale sul premio (escl. addetto supplementare farmacie, calcolato nella base)
  const garP=(prod.garanzie_aggiuntive||[]).map((g,i)=>({g,i})).filter(o=>o.g.percentuale!=null && !/addetto supplementare/i.test(o.g.nome||''));
  if(garP.length){ h+='<div class="pv2-sec">Garanzie aggiuntive (% sul premio)</div>'+garP.map(o=>`<label class="aw-coincide" style="margin-bottom:.45rem"><input type="checkbox" id="amt-gar-${o.i}" onchange="amtCompute()"> <span>${esc(o.g.nome)} <span style="color:var(--muted);font-weight:400">· +${String(o.g.percentuale).replace('.',',')}%</span></span></label>`).join(''); }
  return h;
}
function amtRateCompute(){
  const prod=amtProd(); const res=document.getElementById('rcp-result'); if(!prod||!res) return;
  const massBase=prod.massimale_base;
  const mass=document.getElementById('amt-mass')?.value;
  if(!mass){ res.innerHTML=amtHint('Seleziona il <b>massimale</b>.'); RCP.amtQuote=null; return; }
  let base=0, calcDett='', overflow=false, varDesc='';
  if(AMT.key==='residenze_sanitarie'){
    const rows=((prod.rc_base||{}).unica)||[]; let tot=0; const parts=[]; let anyN=0;
    rows.forEach((r,i)=>{ const n=parseInt(document.getElementById('amt-pl-'+i)?.value)||0; anyN+=n; if(n>0){ const eur=r.p[massBase]||0; tot+=n*eur; parts.push(n+' × € '+amtNf(eur)); } });
    if(anyN<=0){ res.innerHTML=amtHint('Inserisci il numero di <b>posti letto</b>.'); RCP.amtQuote=null; return; }
    base=tot; calcDett=parts.join(' + '); varDesc=anyN+' posti letto';
  } else if(AMT.key==='farmacie'){
    const n=parseInt(document.getElementById('amt-var')?.value)||0;
    if(n<=0){ res.innerHTML=amtHint('Inserisci il <b>numero di addetti</b>.'); RCP.amtQuote=null; return; }
    const rows=((prod.rc_base||{}).unica||[]).slice().sort((a,b)=>a.t-b.t);
    const row=rows.find(r=>n<=r.t);
    if(row){ base=row.p[massBase]||0; calcDett='Fino a '+row.t+' addetti: € '+amtNf(base); }
    else { const last=rows[rows.length-1]; const lb=last.p[massBase]||0; const extra=n-last.t; const sup=(prod.garanzie_aggiuntive||[]).find(g=>/addetto supplementare/i.test(g.nome||''))||{premio:0}; base=lb+extra*(sup.premio||0); calcDett='€ '+amtNf(lb)+' (fino a '+last.t+') + '+extra+' × € '+String(sup.premio).replace('.',',')+' (addetti oltre l\'8º)'; }
    varDesc=n+' addetti';
  } else {
    const fatt=parseFloat(document.getElementById('amt-var')?.value)||0;
    if(fatt<=0){ res.innerHTML=amtHint('Inserisci il <b>fatturato</b>.'); RCP.amtQuote=null; return; }
    let table=(prod.rc_base||{}).unica, col='unica';
    if(AMT.key==='poliambulatori'){ col=document.getElementById('amt-col')?.value||'base'; table=(prod.rc_base||{})[col]; }
    const pr=amtProgressive(table,fatt,massBase); base=pr.premio; calcDett=pr.dett; overflow=pr.over;
    varDesc='Fatturato € '+amtNf(fatt)+(AMT.key==='poliambulatori'?(' · tariffa '+(col==='radiologia_ginecologia'?'Radiologia/Ginecologia':'Base')):'');
  }
  // Premio minimo di tariffa (applicato alla base prima delle correzioni %)
  let minApplied=false;
  if(prod.premio_minimo_lordo && base<prod.premio_minimo_lordo){ base=prod.premio_minimo_lordo; minApplied=true; }
  // Correzioni percentuali (additive, coerenti con la prima ondata)
  let corrPct=0; const corrLbl=[];
  (prod.aumenti||[]).forEach(a=>{ if(a.massimale && String(a.massimale)===String(mass)){ corrPct+=a.percentuale; corrLbl.push('Massimale '+amtMoney(mass)+' ('+amtPct(a.percentuale)+')'); } });
  if(document.getElementById('amt-retroill')?.checked){ const a=(prod.aumenti||[]).find(x=>/illimitata/i.test(x.nome||'')); if(a){ corrPct+=a.percentuale; corrLbl.push('Retroattività illimitata ('+amtPct(a.percentuale)+')'); } }
  (prod.aumenti||[]).forEach((a,i)=>{ if(!a.massimale && !/illimitata/i.test(a.nome||'') && document.getElementById('amt-aum-'+i)?.checked){ corrPct+=a.percentuale; corrLbl.push(a.nome+' ('+amtPct(a.percentuale)+')'); } });
  const frq=document.getElementById('amt-frq')?.value; if(frq!==''&&frq!=null){ const s=(prod.sconti||[])[+frq]; if(s){ corrPct+=s.percentuale; corrLbl.push('Franchigia € '+amtNf(s.franchigia)+' ('+amtPct(s.percentuale)+')'); } }
  (prod.sconti||[]).forEach((s,i)=>{ if(s.franchigia==null && document.getElementById('amt-sc-'+i)?.checked){ corrPct+=s.percentuale; corrLbl.push(s.nome+' ('+amtPct(s.percentuale)+')'); } });
  const premioRC=base*(1+corrPct/100);
  // Garanzie aggiuntive a percentuale sul premio RC
  const garSel=[];
  (prod.garanzie_aggiuntive||[]).forEach((g,i)=>{ if(g.percentuale!=null && !/addetto supplementare/i.test(g.nome||'') && document.getElementById('amt-gar-'+i)?.checked){ garSel.push({nome:g.nome,premio:premioRC*g.percentuale/100,pct:g.percentuale}); } });
  const garTot=garSel.reduce((s,x)=>s+x.premio,0);
  const totale=premioRC+garTot;
  RCP.amtQuote={key:AMT.key,prodNome:prod.nome,mass,varDesc,base,minApplied,calcDett,corrPct,corrLbl,premioRC,garanzie:garSel,totale,overflow};
  res.innerHTML=`
    <div class="pv2-panel-sub">${esc(prod.nome)} · ${esc(varDesc)}</div>
    <div class="pv2-line"><span>Massimale</span><b>${amtMoney(mass)}</b></div>
    <div style="font-size:12px;color:var(--muted);padding:2px 0 6px">Calcolo base: ${esc(calcDett)}${minApplied?' → premio minimo € '+amtNf(prod.premio_minimo_lordo):''}</div>
    <div class="pv2-line"><span>Premio base (lordo)${minApplied?' · minimo':''}</span><b>${amtEur(base)}</b></div>
    ${corrPct!==0?`<div class="pv2-line"><span>Correzioni (${amtPct(corrPct)})</span><b>${(premioRC-base>=0?'+ ':'- ')+amtEur(Math.abs(premioRC-base))}</b></div>`:''}
    ${garSel.map(gg=>`<div class="pv2-line"><span>${esc(gg.nome)} (+${String(gg.pct).replace('.',',')}%)</span><b>+ ${amtEur(gg.premio)}</b></div>`).join('')}
    <div class="pv2-div"></div>
    ${amtTotalBlock(totale)}
    ${overflow?'<div style="font-size:12px;color:#c77a14;margin-top:.4rem"><i class="ti ti-alert-triangle"></i> Fatturato oltre l\'ultimo scaglione della tabella: verifica la quotazione con l\'ufficio.</div>':''}`;
}

// Normalizza le varie forme di RCP.amtQuote (5 logiche di quotazione) in un
// oggetto strutturato e uniforme, così la stampa PDF può mostrare i dettagli
// (prodotto, parametro, massimale, retroattività, correzioni, garanzie, premi)
// a prescindere dalla logica che lo ha generato.
function amtNormalize(q){
  if(!q) return null;
  const A = {
    key: q.key || null,
    prodotto: q.prodNome || '',
    variabile: '',
    massimale: '',
    retro: '',
    calcDett: q.calcDett || '',
    premioBase: null,
    premioRC: null,
    correzioniPct: (q.corrPct!=null ? q.corrPct : (q.apct!=null ? q.apct : 0)),
    correzioni: (Array.isArray(q.corrLbl) ? q.corrLbl.slice() : (Array.isArray(q.albl) ? q.albl.slice() : [])),
    garanzie: Array.isArray(q.garanzie) ? q.garanzie.map(g=>({nome:g.nome, premio:g.premio})) : [],
    retroEur: (q.retroEur!=null ? q.retroEur : 0),
    tlPremio: (q.tlPremio!=null ? q.tlPremio : 0),
    totale: (q.totale!=null ? q.totale : null)
  };
  // Massimale
  if(q.massSin!=null || q.massPer!=null) A.massimale = '€ '+amtNf(q.massSin)+' / € '+amtNf(q.massPer);
  else if(q.mass!=null && q.mass!=='') A.massimale = String(q.mass);
  // Parametro/valore e premi, per logica di quotazione
  if(q.key==='pubblico_impiego'){
    A.variabile = 'Fascia di carica: '+(q.fascia||'');
    A.premioBase = q.premioA; A.premioRC = q.premioA;
    if(q.a1) A.correzioni.unshift('A.1 Estensione danni materiali (+ '+amtEur(q.a1)+')');
    if(q.premioB) A.garanzie.push({nome:'Sezione B · Tutela Legale', premio:q.premioB});
    if(q.premioC) A.garanzie.push({nome:'Sezione C · Infortuni', premio:q.premioC});
  } else if(q.spec){
    A.variabile = q.spec + (q.area?(' · '+(q.area==='chirurgica'?'Area chirurgica':'Area non chirurgica')):'') + (q.classe?(' · classe '+q.classe):'');
    A.premioBase = q.base; A.premioRC = q.premioRC;
  } else if(q.coperturaLbl){
    A.variabile = q.coperturaLbl;
    A.premioBase = q.base; A.premioRC = q.base;
  } else if(q.varDesc){
    A.variabile = q.varDesc;
    A.premioBase = q.base; A.premioRC = (q.premioRC!=null?q.premioRC:q.base);
  } else {
    A.variabile = (q.variabile!=null && q.variabile!=='') ? (amtVarLabel().replace(' (€)','')+': € '+amtNf(q.variabile)) : '';
    A.premioBase = q.base; A.premioRC = (q.premioRC!=null?q.premioRC:q.base);
  }
  // Franchigia base per sinistro → così compare anche in stampa/email (prima solo a video).
  // Dal prodotto (prod.franchigia_base); per gli SPEC il default è € 500, come nella UI.
  const _prodFr = amtProd();
  A.franchigiaBase = (_prodFr && _prodFr.franchigia_base != null) ? _prodFr.franchigia_base : (q.spec ? 500 : null);
  // Retroattività
  if(q.retro && q.retro!=='unica') A.retro = q.retro;
  else if(q.retroIll) A.retro = 'Illimitata';
  else A.retro = '10 anni inclusa';
  // Tutela Legale (prima ondata): dettaglio massimale se disponibile
  if(q.tl && !q.tl.unavailable) A.tl = { mass: q.tl.mass||null, premio: (q.tlPremio!=null?q.tlPremio:0) };
  // Frazionamento · divisione secca del premio annuo, nessuna maggiorazione
  const nRate = amtFrazNRate();
  A.frazionamento = AMT.frazionamento || 'Annuale';
  A.numeroRate = nRate;
  A.rata = (A.totale!=null) ? Math.round(A.totale/nRate) : null; // rata arrotondata all'euro, come il portale AmTrust
  return A;
}

async function amtSalva(mode){
  const q=RCP.amtQuote;
  if(!q){ alert('Completa la quotazione per calcolare il premio.'); return; }
  if(!document.getElementById('rcp-nosin')?.checked){ alert('Per procedere conferma la dichiarazione sull\'assenza di sinistri negli ultimi 5 anni.\n(In caso di sinistri, richiedi una quotazione personalizzata all\'ufficio.)'); return; }
  const nominativo=(document.getElementById('rcp-nominativo')?.value||'').trim();
  const cfPiva=(document.getElementById('rcp-cfPiva')?.value||'').trim().toUpperCase();
  if(!nominativo||!cfPiva){ alert('Inserisci contraente e Codice fiscale / Partita IVA.'); return; }
  let clienteId=RCP.cliente?.clienteId||null;
  if(cfPiva && !clienteId){ try{ const {data:ex}=await db.from('quote_anagrafiche').select('id').ilike('codice_fiscale',cfPiva).limit(1); if(ex&&ex[0]) clienteId=ex[0].id; }catch(e){} }
  if(cfPiva && !clienteId){ try{ const {data}=await db.from('quote_anagrafiche').insert({tipo:cfPiva.length===11?'giuridica':'fisica',nominativo:nominativo.toUpperCase(),codice_fiscale:cfPiva.length>11?cfPiva:null,partita_iva:cfPiva.length===11?cfPiva:null,creato_da:currentUser.id}).select('id').single(); if(data){clienteId=data.id; logMovimento('Nuovo cliente (da RC AMTRUST) · '+nominativo,'cliente');} }catch(e){} }
  const dati=Object.assign({compagnia:'AMTRUST',categoria:'RC AMTRUST',clienteId,note:(document.getElementById('rcp-note')?.value||'').trim(),stato:'quotato'},q);
  // Oggetto strutturato e uniforme del preventivo AMTRUST, usato dalla stampa PDF.
  dati.amt=amtNormalize(q);
  const newId=await savePreventivo({ modulo:'rcprof', prodotto:'RC AMTRUST · '+q.prodNome, premio:Number(q.totale.toFixed(2)), cliente:nominativo, dati });
  if(mode==='procedi'){
    if(!clienteId){ alert('Per procedere all\'emissione serve un cliente censito (con Codice fiscale / Partita IVA).'); return; }
    if(newId){ try{ notifyEmail('quotato', newId); }catch(e){} await loadStorico(); openPagamentoPreventivo(newId); }
    return;
  }
  notifyEmail('quotato', newId);
  const _nR=amtFrazNRate();
  const _frazTxt=_nR>1?('\nFrazionamento: '+(AMT.frazionamento||'Annuale')+' → rata € '+(Math.round(q.totale/_nR*100)/100).toFixed(2)+' × '+_nR):'';
  alert('✓ Preventivo AMTRUST salvato!\n\n'+q.prodNome+'\nPremio annuo lordo: € '+q.totale.toFixed(2)+_frazTxt+'\n\nLo trovi nello Storico come "Quotato".');
  showPage('home');
}
