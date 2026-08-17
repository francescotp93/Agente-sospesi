// ═══════════════════════════════════════════════════════════════════════════════
//  RC PROFESSIONALE DENTRO IAM — il primo prodotto uscito dal riquadro
//
//  Che cosa sorveglia, e perché queste cose e non altre.
//
//  1. IL MOTORE NON DEVE CAMBIARE. Il calcolo della tariffa è stato spostato
//     da QUOTO identico, riga per riga. È l'unico modo di poter affermare che
//     il premio non è cambiato spostandolo. Una riscrittura «più pulita» di una
//     tariffa non dà nessun errore quando sbaglia: emette una polizza a un
//     prezzo storto, e lo si scopre da un cliente. Qui si controlla che il
//     confine fra la colla (che si può cambiare) e il motore (che no) esista
//     ancora e sia dichiarato.
//
//  2. LA VOCE DI MENU NON DEVE APRIRE IL RIQUADRO. È tutto il punto dello
//     spostamento: se qualcuno toglie rcprof da IN_IAM, la schermata torna
//     nell'iframe e nessuno se ne accorge, perché continua a funzionare.
//
//  3. LO STILE NON DEVE USCIRE DALLA SUA PAGINA. Le regole arrivano da QUOTO,
//     dove nomi come .lab, .amt, .badge-quot o .page-title sono di casa. In IAM
//     quegli stessi nomi esistono altrove: una sola regola non circoscritta
//     ridipinge pezzi di gestionale lontani, e il guasto non si collega mai
//     alla causa.
// ═══════════════════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { RADICE, esiti, deve } from './banco.mjs';

const e = esiti('RC PROFESSIONALE — dentro IAM, non nel riquadro');
const leggi = (f) => fs.readFileSync(path.join(RADICE, f), 'utf8');

const mod = leggi('rc-professionale.js');
const css = leggi('rc-professionale.css');
const one = leggi('withus-one.js');
const idx = leggi('index.html');

const SEP = '/* ── il motore, spostato identico da QUOTO';

// ── 1. Il confine fra colla e motore ─────────────────────────────────────────
e.prova('il file dichiara dove finisce la colla e comincia il motore', () => {
  deve(mod.includes(SEP),
    'manca la riga che separa la colla dal motore: senza, non si sa più quale metà si può toccare');
  const [colla, motore] = mod.split(SEP);
  deve(colla.length > 500, 'la colla è sparita');
  deve(motore.length > 50000, 'il motore è sparito o è stato accorciato: ' + motore.length + ' caratteri');
  return Math.round(motore.length / 1024) + ' KB di motore, ' + Math.round(colla.length / 1024) + ' KB di colla';
});

e.prova('il motore non chiama piu\' l\'ambiente di QUOTO senza passare dalla colla', () => {
  /* Le nove cose che il motore si aspettava da QUOTO. Devono essere TUTTE
     fornite dalla colla: se una manca, la schermata non fallisce all'avvio —
     fallisce quando l'utente preme Salva, cioè dopo aver fatto il lavoro. */
  const colla = mod.split(SEP)[0];
  for (const f of ['savePreventivo', 'logMovimento', 'notifyEmail', 'showPage', 'loadStorico', 'openPagamentoPreventivo', 'currentUser']) {
    deve(new RegExp('window\\.' + f + '|window, \'' + f + '\'').test(colla),
      'la colla non fornisce «' + f + '»: il motore lo chiama e troverebbe il vuoto');
  }
  return '7 agganci forniti';
});

e.prova('il preventivo finisce nella stessa tabella di QUOTO', () => {
  /* Un preventivo fatto qui e uno fatto nel riquadro devono essere
     indistinguibili nello storico: stessa tabella, stesse colonne. Se questa
     cambia, si ottengono due archivi che sembrano uno solo. */
  const colla = mod.split(SEP)[0];
  deve(/quote_preventivi/.test(colla), 'non scrive più su quote_preventivi');
  for (const c of ['modulo', 'prodotto', 'compagnia', 'premio', 'cliente', 'dati', 'creato_da', 'creato_nome']) {
    deve(new RegExp('\\b' + c + ':').test(colla), 'manca la colonna «' + c + '»');
  }
});

// ── 2. La voce di menu ───────────────────────────────────────────────────────
e.prova('la voce del menu non apre piu\' il riquadro', () => {
  deve(/var IN_IAM = \[/.test(one), 'manca l\'elenco IN_IAM dei prodotti già portati dentro');
  const elenco = (one.match(/var IN_IAM = \[([^\]]*)\]/) || [])[1] || '';
  deve(/'rcprof'/.test(elenco), 'rcprof non è nell\'elenco: la voce tornerebbe ad aprire l\'iframe');
  /* E l'elenco dev'essere davvero consultato prima di aprire il riquadro. */
  const gestore = one.slice(one.indexOf("a[data-p]"), one.indexOf("a[data-p]") + 800);
  deve(/IN_IAM\.indexOf\(/.test(gestore), 'l\'elenco esiste ma il menu non lo guarda');
  deve(gestore.indexOf('IN_IAM') < gestore.indexOf('aprireQuoto'),
    'guarda l\'elenco DOPO aver già aperto il riquadro');
});

e.prova('la scheda esiste in IAM ed e\' agganciata alla navigazione', () => {
  deve(/id="panel-rcprof"/.test(idx), 'manca il pannello panel-rcprof in IAM');
  deve(/id="rcprof-view"/.test(idx), 'manca il contenitore che il motore riempie');
  deve(/rc-professionale\.js/.test(idx), 'il modulo non viene caricato');
  deve(/rc-professionale\.css/.test(idx), 'il foglio di stile non viene caricato');
  deve(/t === 'rcprof'/.test(idx), 'goTab non chiama renderRcprof: la scheda si aprirebbe vuota');
});

e.prova('la scheda ha un titolo suo fra quelli di IAM', () => {
  /* rcprof non è più una pagina del preventivatore: se il titolo resta in
     TITOLI_QUOTO non dà errore, dà la barra col nome della schermata
     precedente. È già successo con le Fonti. */
  const t = one.slice(one.indexOf('var TITOLI = {'), one.indexOf('var TITOLI_QUOTO'));
  deve(/rcprof:/.test(t), 'il titolo di rcprof non è fra quelli di IAM');
});

// ── 3. Lo stile resta a casa sua ─────────────────────────────────────────────
e.prova('nessuna regola di stile esce dalla sua pagina', () => {
  /* Ogni selettore dev'essere circoscritto a #panel-rcprof. Le regole
     arrivano da QUOTO e usano nomi comuni (.lab, .amt, .page-title): una sola
     riga libera ridipinge parti di IAM lontanissime da qui. */
  const righe = css.split('\n');
  const fuori = [];
  for (const r of righe) {
    const m = r.match(/^([^{@/][^{]*)\{/);
    if (!m) continue;
    for (const sel of m[1].split(',')) {
      const s = sel.trim();
      if (s && !s.startsWith('#panel-rcprof')) fuori.push(s);
    }
  }
  deve(fuori.length === 0, fuori.length + ' selettori non circoscritti: ' + fuori.slice(0, 4).join(' | '));
  return righe.filter(r => /^#panel-rcprof/.test(r)).length + ' regole, tutte dentro la pagina';
});

e.prova('i colori si prendono in prestito, non si riscrivono', () => {
  /* QUOTO chiama i suoi colori --blue/--ink/--line. Dentro IAM la pelle li
     traduceva sul verde With Us. Qui quel ponte è rifatto sulla sola pagina:
     scriverli a mano vorrebbe dire due tavolozze che divergono al primo
     ritocco del marchio. */
  const ponte = css.slice(css.indexOf('#panel-rcprof{'), css.indexOf('}', css.indexOf('#panel-rcprof{')));
  deve(/--blue:var\(--w1-/.test(ponte), 'il verde non arriva più dai token di IAM');
  deve(!/--blue:\s*#/.test(ponte), 'c\'è un colore scritto a mano al posto del token');
});

e.stampa();
process.exit(e.ko === 0 ? 0 : 1);
