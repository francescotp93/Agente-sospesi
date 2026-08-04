// ═══════════════════════════════════════════════════════════════════════════════
//  DIARIO — la vista SETTIMANA
//
//  Il diario aveva due viste: l'elenco e il calendario del mese. Il mese dice
//  QUANTE cose ci sono in un giorno, non a che ora: per sapere se il martedì è
//  pieno bisognava aprirlo. La settimana lo mostra ora per ora.
//
//  Queste prove sorvegliano gli errori che non si vedono guardando lo schermo:
//   1. la settimana che parte di domenica (getDay() parte da lì: sposterebbe
//      tutta la griglia di un giorno, e nessuno guarda la data, guarda la
//      colonna);
//   2. le attività senza un orario leggibile che spariscono dalla griglia
//      invece di finire in una fascia «senza orario»;
//   3. la coda «da gestire oggi» che mostra solo oggi e perde gli arretrati;
//   4. le tre viste che si accendono insieme o si spengono a vicenda.
// ═══════════════════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const radice = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(radice, 'index.html'), 'utf8');

const esiti = [];
const prova = (nome, fn) => {
  try { const m = fn(); esiti.push([true, nome, m || '']); }
  catch (e) { esiti.push([false, nome, e.message]); }
};
const deve = (c, msg) => { if (!c) throw new Error(msg); };

function corpoDi(firma) {
  const i = html.indexOf(firma);
  if (i < 0) return null;
  let liv = 0, j = html.indexOf('{', i);
  const inizio = j;
  for (; j < html.length; j++) {
    if (html[j] === '{') liv++;
    else if (html[j] === '}') { liv--; if (liv === 0) return html.slice(inizio, j + 1); }
  }
  return null;
}

// ── 1. La vista esiste ed è raggiungibile ────────────────────────────────────
prova('la settimana ha la sua linguetta e il suo riquadro', () => {
  deve(/id="wd-tab-sett"/.test(html), 'manca la linguetta Settimana');
  deve(/id="wd-sett"/.test(html), 'manca il riquadro della settimana');
  deve(/selWDTab\('sett'\)/.test(html), 'la linguetta non apre la vista');
  deve(/id="wds-griglia"/.test(html) && /id="wds-coda"/.test(html) && /id="wds-det"/.test(html),
    'manca una delle tre colonne (griglia, coda, dettaglio)');
});

// ── 2. Una vista alla volta ──────────────────────────────────────────────────
prova('le tre viste non si accendono mai insieme', () => {
  const f = corpoDi('function selWDTab(t)');
  deve(f, 'manca selWDTab');
  for (const id of ['wd-lista', 'wd-cal', 'wd-sett'])
    deve(f.includes(id), 'selWDTab non governa «' + id + '»: resterebbe acceso sotto le altre');
  deve(/renderWDSett\(\)/.test(f), 'aprendo la settimana non si disegna niente');
  /* Il riquadro della settimana deve nascere NASCOSTO: senza, all'apertura
     della pagina si vedrebbero due viste sovrapposte finché non si tocca una
     linguetta. */
  const div = html.match(/<div id="wd-sett"([^>]*)>/);
  deve(div && /display:none/.test(div[1]), 'il riquadro della settimana nasce visibile');
});

// ── 3. La settimana comincia di lunedì ───────────────────────────────────────
prova('la settimana comincia di lunedì, non di domenica', () => {
  /* getDay() torna 0 per domenica. Usarlo così sposta tutta la griglia di un
     giorno: le attività finiscono nella colonna sbagliata e nessuno se ne
     accorge, perché si guarda la colonna, non la data. */
  const f = corpoDi('function wdsLunedi(d)');
  deve(f, 'manca wdsLunedi');
  deve(/\(x\.getDay\(\) \+ 6\) % 7/.test(f),
    'il calcolo del lunedì non compensa la domenica di getDay()');
});

// ── 4. Un orario scritto a mano non fa sparire l'attività ────────────────────
prova('un orario storto non cancella l\'attività dalla griglia', () => {
  /* Il campo ora è testo libero: «9», «9:30», «09.30», «mattina», vuoto.
     Chi non è leggibile deve finire in una fascia «senza orario», non sparire:
     un'attività che non si vede è un'attività che non si fa. */
  const f = corpoDi('function wdsOra(w)');
  deve(f, 'manca wdsOra');
  deve(/return null/.test(f), 'un orario illeggibile non viene riconosciuto come tale');
  deve(/h < 0 \|\| h > 23/.test(f), 'accetta ore che non esistono');
  const r = corpoDi('function renderWDSett()');
  deve(/senzaOra/.test(r), 'le attività senza orario non hanno un posto dove finire');
  deve(/wds-senzora/.test(html), 'manca la fascia «senza orario» nella colonna del giorno');
});

// ── 5. La coda non perde gli arretrati ───────────────────────────────────────
prova('«da gestire oggi» comprende anche quello rimasto indietro', () => {
  /* Se la coda mostrasse solo oggi, un'attività non chiusa ieri sparirebbe
     dalla vista — e quindi dalla testa. */
  const r = corpoDi('function renderWDSett()');
  deve(/w\.data <= oggi/.test(r), 'la coda guarda solo il giorno di oggi: gli arretrati spariscono');
  deve(/stato !== 'completato'/.test(r), 'la coda mostra anche quello che è già stato fatto');
  /* L'arretrato deve distinguersi a colpo d'occhio, non solo a parole.
     La coda e' disegnata da wdsVoceCoda(), estratta da renderWDSett() quando
     la giornata ha smesso di essere l'unica vista a mostrarla. */
  const c = corpoDi('function wdsVoceCoda(w)');
  deve(c && /ritardo/.test(c), 'la voce di coda non segna l\'arretrato');
  deve(/\.wds-ci\.ritardo/.test(html), 'un arretrato non si distingue da una cosa di oggi');
});

// ── 6. Il colore non è l'unico segnale ───────────────────────────────────────
prova('ogni attività porta scritto l\'orario e il titolo, non solo un colore', () => {
  const f = corpoDi('function wdsChip(w)');
  deve(f, 'manca wdsChip');
  deve(/w\.titolo/.test(f), 'il titolo non compare: resterebbe un rettangolo colorato');
  deve(/\(senza titolo\)/.test(f), 'un\'attività senza titolo diventa un rettangolo muto');
  deve(/title="\$\{esc\(w\.titolo/.test(f), 'il titolo intero non si legge al passaggio del mouse');
});

// ── 7. Niente HTML dal contenuto scritto dalle persone ───────────────────────
prova('titoli e note passano dalla ripulitura', () => {
  /* I titoli li scrivono i collaboratori. Senza esc() basta un apice nel
     titolo per rompere la griglia — e un tag per fare di peggio. */
  for (const f of ['function wdsChip(w)', 'function wdsDettaglio(id']) {
    const c = corpoDi(f);
    deve(c, 'manca ' + f);
    deve(!/\$\{w\.(titolo|note|tipo|luogo)\}/.test(c), f + ': un campo esce senza ripulitura');
  }
  const d = corpoDi('function wdsDettaglio(id');
  deve(/escNl\(w\.note\)/.test(d), 'le note non conservano gli a capo (o non sono ripulite)');
});

let ko = 0;
console.log('\nDIARIO — la vista settimana');
for (const [ok, nome, msg] of esiti) {
  console.log(ok ? '  ok  ' + nome + (msg ? ' — ' + msg : '') : '  X   ' + nome + ' — ' + msg);
  if (!ok) ko++;
}
console.log(`\nDIARIO SETTIMANA: ${esiti.length - ko} superate, ${ko} fallite\n`);
process.exit(ko === 0 ? 0 : 1);
