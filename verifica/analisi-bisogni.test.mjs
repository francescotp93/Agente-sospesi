// ═══════════════════════════════════════
//  ANALISI DEI BISOGNI — motore, innesto e confini
//
//  Queste prove sorvegliano una cosa sola, ed è la più delicata di tutta la
//  funzione: che il punteggio non menta.
//
//  Un'analisi dei bisogni finisce in un PDF che il cliente firma con OTP. Se
//  il motore dice «verde, nessuna criticità» dove in realtà non sapeva niente,
//  o dice «coperto» perché il cliente ha spuntato «ho una polizza casa» senza
//  che nessuno l'abbia letta, l'errore non resta sullo schermo: esce di qui
//  come consulenza scritta, con una firma sotto.
//
//  Perciò tre regole sono provate una per una, e non come dettagli:
//   - dati mancanti fanno GRIGIO, mai verde;
//   - prodotto dichiarato fa BLU «da verificare», mai verde;
//   - l'indice complessivo non pesa le categorie grigie.
//
//  L'ultima è la differenza fra il modulo di riferimento del pacchetto e il
//  prototipo nel browser: il prototipo pesava sempre 50/30/20 sulle prime tre
//  categorie, comprese quelle senza dati, e stampava un numero anche quando
//  non c'era niente su cui calcolarlo. Vale il modulo.
// ═══════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const radice = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(radice, 'index.html'), 'utf8');
const scocca = fs.readFileSync(path.join(radice, 'withus-one.js'), 'utf8');

const esiti = [];
const prova = (nome, fn) => {
  try { const m = fn(); esiti.push([true, nome, m || '']); }
  catch (e) { esiti.push([false, nome, e.message]); }
};
const deve = (c, msg) => { if (!c) throw new Error(msg); };

// Il motore è un modulo vero, non una funzione dentro index.html: si prova
// facendolo girare, non cercando stringhe. È l'unico pezzo di IAM che si può
// interrogare davvero, ed è anche quello dove un errore si vede di meno.
let M = null;
try {
  M = await import(path.join(radice, 'analisi-bisogni-rating.js'));
} catch (e) {
  esiti.push([false, 'il motore di rating esiste ed è caricabile', e.message]);
}

const oggi = new Date('2026-08-04T12:00:00Z');
const base = () => ({
  anagrafica: { nascita: '1984-06-14' },
  famiglia: 'figli',
  dipendenzaReddito: 'totale',
  casa: 'mutuo',
  patrimonio: ['prima_casa'],
  coperture: [],
  copertureConfermate: true,
  interessi: [],
});
const cat = (dati, chiave) => M.calcolaNecessita(dati, { dataRiferimento: oggi }).find(n => n.chiave === chiave);

if (M) {
  // ── 1. Le tre regole che impediscono al punteggio di mentire ────────────
  prova('senza risposte le categorie sono grigie, mai verdi', () => {
    /* Il verde è un'affermazione: «ho guardato e va bene». Su un questionario
       vuoto nessuno ha guardato niente. Il prototipo qui dava verde, perché
       il punteggio di partenza è basso e la soglia bassa vuol dire verde. */
    const r = M.calcolaNecessita({ anagrafica: {}, coperture: [], interessi: [] }, { dataRiferimento: oggi });
    deve(r.every(n => n.colore !== 'verde'), 'un questionario vuoto ha prodotto un verde');
    deve(r.find(n => n.chiave === 'famiglia').colore === 'grigio', 'famiglia senza risposte non è grigia');
    deve(r.find(n => n.chiave === 'casa').colore === 'grigio', 'casa senza risposte non è grigia');
  });

  prova('un prodotto dichiarato diventa blu «da verificare», non verde', () => {
    /* «Ho la polizza casa» non vuol dire «sono coperto»: massimali, esclusioni
       e franchigie non le ha lette nessuno. Chiudere l'area in verde qui
       significa toglierla dal colloquio proprio dove servirebbe aprirlo. */
    for (const [copertura, chiave] of [['casa', 'casa'], ['tcm', 'famiglia'], ['salute', 'salute'], ['previdenza', 'previdenza'], ['rcfam', 'responsabilita']]) {
      const d = base(); d.coperture = [copertura];
      const r = cat(d, chiave);
      deve(r.colore === 'blu', `${copertura} dichiarata non produce blu su ${chiave}: dà ${r.colore}`);
      deve(r.stato === 'Da verificare', `${chiave} in blu non dice «Da verificare»`);
      deve(r.punteggio > 0, `${chiave} in blu ha perso il punteggio: resta visibile`);
    }
  });

  prova('l\'indice complessivo non pesa le categorie grigie', () => {
    /* Se una categoria è grigia non sappiamo niente di lei: farla entrare
       nella media con punteggio basso abbassa l'indice come se fosse una
       buona notizia. Le grigie si escludono e i pesi si ridistribuiscono. */
    const conGrigio = M.calcolaIndiceComplessivo([
      { punteggio: 100, colore: 'rosso' },
      { punteggio: 50, colore: 'ambra' },
      { punteggio: 10, colore: 'grigio' },
    ]);
    const senza = M.calcolaIndiceComplessivo([
      { punteggio: 100, colore: 'rosso' },
      { punteggio: 50, colore: 'ambra' },
    ]);
    deve(conGrigio === senza, 'la categoria grigia ha spostato l\'indice: ' + conGrigio + ' invece di ' + senza);
    deve(M.calcolaIndiceComplessivo([{ punteggio: 40, colore: 'grigio' }]) === null,
      'con sole categorie grigie l\'indice non è nullo: stampa un numero senza dati');
  });

  // ── 2. Che le regole del pacchetto siano davvero quelle ─────────────────
  prova('mutuo, figli e reddito totale senza TCM sono priorità alta', () => {
    const r = cat(base(), 'famiglia');
    deve(r.colore === 'rosso', 'famiglia non è rossa: ' + r.colore);
    deve(r.motivi.some(m => m.includes('TCM')), 'non viene detto che manca la TCM');
  });

  prova('ogni categoria porta le sue motivazioni, non solo un numero', () => {
    /* Un rating senza il perché non è consulenza: è un oroscopo con la
       partita IVA. Il pacchetto lo chiede esplicitamente (06 §8). */
    for (const n of M.calcolaNecessita(base(), { dataRiferimento: oggi })) {
      deve(Array.isArray(n.motivi) && n.motivi.length, 'categoria senza motivi: ' + n.chiave);
      deve(n.prossimoPasso && n.prossimoPasso.length > 10, 'categoria senza prossimo passo: ' + n.chiave);
      deve(n.versioneRegole, 'categoria senza versione delle regole: ' + n.chiave);
    }
  });

  prova('lo snapshot è versionato e riproducibile', () => {
    /* Il PDF è una fotografia: se lo stesso questionario, riletto domani con
       regole nuove, desse un altro risultato, la firma sotto non varrebbe
       niente. Versione e data devono stare dentro il risultato. */
    const s = M.creaSnapshotRating(base(), { dataRiferimento: oggi });
    deve(s.versioneRegole === M.VERSIONE_REGOLE, 'lo snapshot non porta la versione delle regole');
    deve(s.generatoIl === oggi.toISOString(), 'lo snapshot non porta la data di generazione');
    deve(s.bisognoPrincipale === 'famiglia', 'il bisogno principale non è famiglia: ' + s.bisognoPrincipale);
    const b = M.creaSnapshotRating(base(), { dataRiferimento: oggi });
    deve(JSON.stringify(s) === JSON.stringify(b), 'due calcoli sugli stessi dati danno risultati diversi');
  });

  prova('il bisogno principale non può essere una categoria grigia', () => {
    const s = M.creaSnapshotRating({ anagrafica: {}, coperture: [], interessi: [] }, { dataRiferimento: oggi });
    deve(s.bisognoPrincipale === null, 'senza dati viene indicato un bisogno principale: ' + s.bisognoPrincipale);
  });
}

// ── 3. L'innesto in IAM ───────────────────────────────────────────────────
prova('la voce sta in Strumenti', () => {
  const i = scocca.indexOf("key: 'strumenti'");
  deve(i > 0, 'non trovo il gruppo Strumenti');
  const gruppo = scocca.slice(i, scocca.indexOf('] }', i));
  deve(/Analisi dei bisogni/.test(gruppo), 'la voce non è dentro Strumenti');
  deve(/vai\('analisi'\)/.test(gruppo), 'la voce non apre la scheda analisi');
});

prova('il titolo sta in TITOLI e non in TITOLI_QUOTO', () => {
  /* Sbagliare mappa non rompe niente e non si vede: la barra resta
     semplicemente a «IAM > IAM», perché TITOLI_QUOTO si legge solo quando la
     scheda aperta è il preventivatore. È già successo con le Fonti. */
  /* Si cerca la DICHIARAZIONE «var TITOLI_QUOTO», non la parola: il nome
     compare prima dentro un commento che spiega perché le Fonti non vanno
     lì, e tagliare la mappa su quello la troncava a metà. È lo stesso
     inciampo per cui ritaglia() in banco.mjs salta i commenti. */
  const t = scocca.indexOf('var TITOLI = {');
  const tq = scocca.indexOf('var TITOLI_QUOTO');
  const mappa = scocca.slice(t, tq > t ? tq : scocca.length);
  deve(/analisi:\s*\[/.test(mappa), 'la scheda analisi non ha titolo in TITOLI');
  deve(/analisi:\s*\['[^']*',\s*'Strumenti'\]/.test(mappa), 'la briciola non dice Strumenti');
});

prova('la scheda evidenzia la sua voce di menu', () => {
  const i = scocca.indexOf('var TAB2MENU = {');
  deve(i > 0, 'non trovo TAB2MENU');
  const mappa = scocca.slice(i, scocca.indexOf('};', i));
  deve(/analisi:\s*'strumenti'/.test(mappa), 'aprendo l\'analisi nessuna voce resta accesa');
});

prova('la schermata esiste in index.html', () => {
  deve(html.includes('id="panel-analisi"'), 'manca il pannello dell\'analisi dei bisogni');
});

// ── 4. Confini: la tavolozza non deve uscire ──────────────────────────────
prova('i colori del disegno restano dentro la schermata', () => {
  /* Il disegno consegnato è su fondo chiaro; IAM è scuro. Lasciare i token
     liberi sfonderebbe il tema in tutto il resto del gestionale — è
     esattamente quello che è successo col diario, dove una classe chiamata
     «oggi» ha ereditato lo stile di un riquadro della scrivania. */
  const i = html.indexOf('#panel-analisi{');
  deve(i > 0, 'i token dell\'analisi non sono confinati in #panel-analisi');
  const blocco = html.slice(i, html.indexOf('}', i));
  deve(/--ab-/.test(blocco), 'i token non sono dichiarati dentro il confine');
  /* Ogni classe nuova porta il suo prefisso: «ab-». Senza, prima o poi una
     collide con qualcosa di globale e il difetto sembra venire da un'altra
     parte del programma. */
  deve(!/class="(choice|panel-head|multi-card|need-ring|badge) /.test(html),
    'una classe del prototipo è entrata senza prefisso: collide col resto di IAM');
});

prova('niente dati dimostrativi del prototipo', () => {
  /* Il prototipo gira su quattro clienti finti. Un gestionale che mostra
     Mario Rossi accanto ai clienti veri non è una demo: è un errore che
     qualcuno prima o poi chiama al telefono. */
  const senzaCommenti = html.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const finto of ['RSSMRA84H14H501X', 'BNCGLI79C51F205K', 'm.rossi@example.it', 'Dati dimostrativi']) {
    deve(!senzaCommenti.includes(finto), 'è rimasto un dato dimostrativo del prototipo: ' + finto);
  }
});

prova('il PDF non viene generato da una libreria esterna', () => {
  /* Il prototipo compone il PDF nel browser con jsPDF preso da un CDN. Qui no:
     un documento che il cliente firma con OTP non può dipendere da un sito che
     non controlliamo, e soprattutto la fonte autorevole è il server — se il
     PDF nasce nel browser, nasce da dati che il browser può aver cambiato.

     Font e icone del prototipo NON sono controllati qui apposta: Inter e le
     Tabler le carica già IAM da prima (index.html righe 19-23), sono le
     stesse, e riusarle non aggiunge nessuna dipendenza nuova. Una prova che
     ne chiedesse la rimozione non alzerebbe l'asticella: cambierebbe
     argomento. */
  const senzaCommenti = html.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const esterna of ['jspdf', 'jsPDF', 'html2canvas', 'pdfmake']) {
    deve(!senzaCommenti.includes(esterna), 'è entrata una libreria PDF nel browser: ' + esterna);
  }
});

let ko = 0;
console.log('\nANALISI DEI BISOGNI — motore, innesto e confini');
for (const [ok, nome, msg] of esiti) {
  console.log(ok ? '  ok  ' + nome + (msg ? ' — ' + msg : '') : '  X   ' + nome + ' — ' + msg);
  if (!ok) ko++;
}
console.log(`\nANALISI DEI BISOGNI: ${esiti.length - ko} superate, ${ko} fallite\n`);
process.exit(ko === 0 ? 0 : 1);
