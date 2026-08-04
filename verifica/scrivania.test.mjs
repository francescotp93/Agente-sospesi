// ═══════════════════════════════════════
//  SCRIVANIA — il design consegnato il 4/8/2026
//
//  La cosa che queste prove sorvegliano davvero è UNA: che i quattro
//  indicatori in cima dicano il vero.
//
//  Il disegno consegnato li mostrava con numeri d'esempio — € 8.420, 27, 5,
//  14. Copiarli avrebbe dato una scrivania bellissima che mente a chi apre il
//  gestionale la mattina, e non c'è niente di peggio di un cruscotto
//  credibile e sbagliato: uno vuoto lo si ignora, uno falso lo si segue.
//  Gli indicatori si disegnano dalle STESSE voci di «da fare oggi», così non
//  possono nemmeno smentire quello che sta scritto sotto.
// ═══════════════════════════════════════
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

// ── 1. Nessun numero inventato ───────────────────────────────────────────
prova('gli indicatori non contengono i numeri d\'esempio del disegno', () => {
  /* Se qualcuno reincollasse il mockup, questi rientrerebbero. Si guarda
     dove i numeri verrebbero DISEGNATI, non tutto il file: il commento che
     spiega perché non si usano li nomina, ed è giusto che lo faccia. */
  const senzaCommenti = html
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  for (const finto of ['8.420', '+12,4%', 'Premi emessi oggi', 'Preventivi in lavorazione']) {
    deve(!senzaCommenti.includes(finto), 'è tornato un valore d\'esempio del mockup: ' + finto);
  }
});

prova('gli indicatori vengono dai dati veri, non da una lista scritta a mano', () => {
  const f = corpoDi('function oggiIndicatori(voci)');
  deve(f, 'manca oggiIndicatori');
  deve(/voci\.slice\(0,\s*4\)/.test(f), 'gli indicatori non sono presi dalle voci calcolate');
  deve(/v\.n/.test(f) && /v\.l/.test(f), 'gli indicatori non leggono numero ed etichetta dalle voci');
  /* Stessa sorgente del riquadro sotto: due interrogazioni separate possono
     rispondere in momenti diversi e mostrare due verità nella stessa
     schermata. */
  const d = corpoDi('function oggiDisegna(voci)');
  deve(d && /oggiIndicatori\(/.test(d), 'gli indicatori non si aggiornano insieme al «da fare oggi»');
});

prova('senza niente da fare la scrivania lo dice, e non mostra un vuoto', () => {
  const f = corpoDi('function oggiIndicatori(voci)');
  deve(f && /!voci\.length/.test(f), 'con zero voci la fascia degli indicatori resta vuota');
  deve(/Lavoro in pari/.test(f), 'non viene detto che il lavoro è in pari');
});

// ── 2. La struttura del disegno ──────────────────────────────────────────
prova('intestazione, indicatori e griglia a due colonne', () => {
  for (const c of ['page-head', 'kpi-grid', 'dashboard-grid', 'stack', 'card-head', 'card-title', 'pictogram']) {
    deve(html.includes(c), 'manca il blocco del disegno: ' + c);
  }
  deve(/grid-template-columns:minmax\(0,1\.45fr\) minmax\(310px,\.8fr\)/.test(html),
    'la griglia non ha le due colonne del disegno');
});

prova('i token sono quelli ufficiali With Us, non riscritti a mano', () => {
  /* Questo disegno, a differenza del kit dei pittogrammi, è già sul verde di
     marchio. Va tenuto lì: due verdi diversi nello stesso prodotto si notano. */
  deve(/#panel-dashboard\{[\s\S]{0,400}--w1-verde:#02984e/.test(html),
    'la scrivania non usa il verde di marchio #02984e');
  deve(!/#panel-dashboard\{[\s\S]{0,600}#087747/.test(html),
    'la scrivania usa il verde del kit invece di quello di marchio');
});

prova('la tavolozza chiara non esce dalla scrivania', () => {
  /* È una superficie chiara fissa: lasciata libera sfonderebbe il tema scuro
     in tutto il resto del gestionale. */
  const i = html.indexOf('#panel-dashboard{');
  deve(i > 0, 'i token della scrivania non sono confinati in #panel-dashboard');
  const blocco = html.slice(i, html.indexOf('}', i));
  deve(/--w1-/.test(blocco), 'i token non sono dichiarati dentro il confine');
});

// ── 3. Il saluto non deve dire il falso ──────────────────────────────────
prova('il saluto segue l\'ora e non inventa un nome', () => {
  const f = corpoDi('function oggiSaluto()');
  deve(f, 'manca oggiSaluto');
  deve(/getHours\(\)/.test(f), 'il saluto non guarda l\'ora: alle otto di sera direbbe «buongiorno»');
  for (const q of ['Buongiorno', 'Buon pomeriggio', 'Buonasera']) {
    deve(f.includes(q), 'manca il saluto: ' + q);
  }
  /* Nel disegno il nome era scritto dentro. Qui viene dal profilo, e se non
     c'è si saluta senza nome invece di salutare la persona sbagliata. */
  deve(!/Buon pomeriggio, Francesco/.test(html), 'il nome del disegno è rimasto scritto nel codice');
  deve(/PROFILO/.test(f) && /nome \?/.test(f), 'il nome non viene dal profilo di chi è entrato');
});

// ── 4. Niente emoji di sistema ───────────────────────────────────────────
prova('la scrivania non usa emoji di sistema', () => {
  /* La stessa faccina è gialla su un telefono, piatta su Windows e diversa
     su un Mac: in un gestionale non è un simbolo. Ce n'era una nello stato
     «lavoro in pari». */
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  const i = html.indexOf('function oggiDisegna(voci)');
  const zona = html.slice(html.indexOf('function oggiIndicatori'), i + 2500);
  deve(!emoji.test(zona), 'c\'è ancora un\'emoji di sistema nella scrivania');
});

// ── 5. Gli indicatori portano dove serve ─────────────────────────────────
prova('un indicatore si clicca e apre l\'elenco filtrato', () => {
  const f = corpoDi('function oggiIndicatori(voci)');
  deve(f && /__OGGI\[\$\{i\}\]/.test(f), 'gli indicatori non sono cliccabili');
  deve(/\.va\s*&&/.test(f), 'un indicatore senza destinazione proverebbe ad aprire il nulla');
  deve(/<button/.test(f), 'gli indicatori non sono pulsanti: da tastiera non si raggiungono');
});

let ko = 0;
console.log('\nSCRIVANIA — il design consegnato');
for (const [ok, nome, msg] of esiti) {
  console.log(ok ? '  ok  ' + nome + (msg ? ' — ' + msg : '') : '  X   ' + nome + ' — ' + msg);
  if (!ok) ko++;
}
console.log(`\nSCRIVANIA: ${esiti.length - ko} superate, ${ko} fallite\n`);
process.exit(ko === 0 ? 0 : 1);
