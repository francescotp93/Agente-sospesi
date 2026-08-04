// ═══════════════════════════════════════
//  FONTI COMPAGNIE — la schermata più delicata del sistema
//
//  Le credenziali con cui l'agenzia entra nei portali delle compagnie. Il kit
//  consegnato elenca quattro regole non negoziabili, e queste prove le
//  sorvegliano una per una — perché sono esattamente le regole che si
//  perdono per prime quando qualcuno «sistema al volo» una schermata:
//
//   1. Solo Super Admin, e il cancello sta NEL CODICE, non solo nel menu:
//      una voce nascosta si raggiunge lo stesso scrivendo l'indirizzo.
//   2. Le password non tornano mai al browser, quindi i campi non si
//      precompilano e un campo vuoto vuol dire «non la cambio».
//   3. Il freno non si scavalca: dopo tre accessi falliti lo scraper smette
//      di bussare, e forzarlo da qui farebbe bloccare l'utenza dalla
//      compagnia.
//   4. «Riuscito» lo dice il backend, mai il browser perché la richiesta è
//      partita.
// ═══════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ritaglia } from './banco.mjs';

const radice = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(radice, 'index.html'), 'utf8');
const scocca = fs.readFileSync(path.join(radice, 'withus-one.js'), 'utf8');

const esiti = [];
const prova = (nome, fn) => {
  try { const m = fn(); esiti.push([true, nome, m || '']); }
  catch (e) { esiti.push([false, nome, e.message]); }
};
const deve = (c, msg) => { if (!c) throw new Error(msg); };

// ── 1. La schermata vive in IAM, non nel preventivatore ──────────────────
prova('le fonti sono una schermata di IAM, non un riquadro del preventivatore', () => {
  deve(/id="panel-fonti"/.test(html), 'manca il pannello delle fonti in IAM');
  /* Sono credenziali dei portali: amministrazione. Il preventivatore resta
     dedicato a preventivare (IAM.md §4). */
  deve(!/go:\s*Q\('fonti'\)/.test(scocca), 'il menu apre ancora le fonti dentro il preventivatore');
  deve(/vai\('fonti'\)/.test(scocca), 'il menu non porta alla schermata di IAM');
});

// ── 2. Solo Super Admin ──────────────────────────────────────────────────
prova('il cancello sta nel codice, non solo nel menu', () => {
  const g = ritaglia(html, 'fontiPuoEntrare');
  deve(g, 'manca fontiPuoEntrare');
  /* Il controllo riusa isSuperAdmin(), che è l'helper del resto del
     gestionale. Una copia della regola qui dentro vorrebbe dire che il
     giorno in cui cambia, questa schermata resta indietro in silenzio. */
  deve(/isSuperAdmin\(\)/.test(g), 'il controllo non riusa isSuperAdmin()');
  deve(/function isSuperAdmin\(\)/.test(html), 'manca l\'helper isSuperAdmin');
  /* Una voce di menu nascosta si raggiunge scrivendo l'indirizzo: il
     controllo deve stare dove i dati vengono chiesti. */
  const c = ritaglia(html, 'fontiCarica');
  deve(c && /fontiPuoEntrare\(\)/.test(c), 'si possono caricare le fonti senza essere Super Admin');
  for (const f of ['fontiSalva', 'fontiVerifica']) {
    const b = ritaglia(html, f);
    deve(b && /fontiPuoEntrare\(\)/.test(b), f + ' non controlla chi sta scrivendo');
  }
});

// ── 3. Le password non tornano al browser ────────────────────────────────
prova('nessun campo password viene precompilato', () => {
  const s = ritaglia(html, 'fontiScheda');
  deve(s, 'manca fontiScheda');
  /* Il backend manda «salvata», non il valore. Se un giorno mandasse anche
     il valore, questo campo lo stamperebbe: qui si sorveglia che non lo
     faccia mai. */
  deve(!/f\.password/.test(s), 'la scheda legge una password dalla risposta del server');
  deve(!/f\.totp/.test(s), 'la scheda legge un segreto TOTP dalla risposta del server');
  deve(/type="password"[^>]*placeholder/.test(s.replace(/\n/g, ' ')) || /Lascia vuoto/.test(s),
    'il campo password non spiega che vuoto vuol dire «non la cambio»');
});

prova('un campo vuoto non cancella quello che c\'è', () => {
  const s = ritaglia(html, 'fontiSalva');
  deve(s, 'manca fontiSalva');
  /* Mandare una stringa vuota sovrascriverebbe la credenziale buona con
     niente, e l'agenzia resterebbe fuori dal portale. */
  for (const campo of ['url', 'user', 'pw']) {
    deve(new RegExp('if \\(' + campo + '\\)').test(s), 'il campo ' + campo + ' viene mandato anche se vuoto');
  }
  deve(/Niente da salvare/.test(s), 'con tutti i campi vuoti parte comunque una scrittura');
  /* Dopo il salvataggio il campo si svuota: lasciarlo pieno fa credere che
     il valore mostrato sia quello salvato. */
  deve(/pwEl.*value = ''|value = ''/.test(s), 'il campo password resta pieno dopo il salvataggio');
});

// ── 4. Il freno si mostra, non si scavalca ───────────────────────────────
prova('lo stato «bloccata» si vede e si spiega', () => {
  const s = ritaglia(html, 'fontiScheda');
  deve(s && /bloccata/.test(s), 'lo stato bloccata non viene distinto');
  deve(/freno/i.test(s), 'non viene spiegato che cos\'è il blocco');
  /* «Bloccata» non è «non attiva e basta»: è l'unico stato che chiede un
     gesto preciso, e confonderli fa perdere tempo a chi guarda. */
  const info = ritaglia(html, 'fontiInfo');
  deve(html.includes('FONTI_STATO'), 'manca la mappa degli stati');
  deve(info, 'manca fontiInfo');
  /* Si guardano le AZIONI, non le parole: il testo che spiega il freno dice
     «non forzando da qui», ed è giusto che lo dica. Quello che non deve
     esistere è un pulsante che lo toglie. */
  const azioni = (s.match(/onclick="[^"]+"/g) || []).join(' ');
  deve(!/sblocc|forza|bypass|reset/i.test(azioni), 'c\'è un\'azione che scavalca il freno');
});

// ── 5. «Riuscito» lo dice il backend ─────────────────────────────────────
prova('l\'accesso non si dà per riuscito prima della conferma', () => {
  const v = ritaglia(html, 'fontiVerifica');
  deve(v, 'manca fontiVerifica');
  deve(/Verifica in corso/.test(v), 'non viene detto che la verifica è in corso');
  /* L'esito si legge dalla risposta, non si presume perché la richiesta è
     partita: dirlo prima è il modo più rapido di far fidare qualcuno di un
     collegamento che non funziona. */
  deve(/r\.ok === true|r\.stato === 'attiva'/.test(v), 'l\'esito non viene letto dalla risposta del motore');
  deve(/non ha confermato/.test(v), 'una risposta negativa non viene distinta da una riuscita');
});

// ── 6. Gli endpoint non sono stati rinominati ────────────────────────────
prova('gli endpoint restano quelli che c\'erano', () => {
  for (const e of ["'/fonti'", "/credenziali", "/verifica"]) {
    deve(html.includes(e), 'endpoint cambiato o mancante: ' + e);
  }
  /* Passano dal fetch autenticato di IAM: senza token il backend risponde
     403, e la schermata sembrerebbe rotta invece che chiusa. */
  const c = ritaglia(html, 'fontiCarica');
  deve(c && /mailFetch\(/.test(c), 'le fonti non passano dal fetch autenticato');
});

// ── 7. Lo stato non deve invecchiare in silenzio ─────────────────────────
prova('aprendo la schermata lo stato si rilegge', () => {
  /* Uno stato di collegamento vecchio di dieci minuti è peggio di nessuno
     stato: si crede a un «attiva» che non c'è più. */
  deve(/t === 'fonti'\s*\)\s*\{\s*fontiCarica\(true\)/.test(html.replace(/\s+/g, ' ')),
    'aprendo le fonti non si rilegge lo stato');
});

// ── 8. Niente di quello che c'era deve essere andato perso ──────────────
prova('il pannello nuovo fa tutto quello che faceva il vecchio', () => {
  /* La schermata nuova sostituisce quella del preventivatore: se ne perde
     un pezzo, quel pezzo si puo' fare solo mettendo le mani sul server.
     Questo elenco viene dalle rotte del backend, non da un desiderio. */
  const attese = {
    'elenco':            "'/fonti'",
    'salva credenziali': '/credenziali',
    'controlla stato':   '/verifica',
    'accedi al portale': '/accedi',
    'stato del login':   '/loginstate',
    'conferma codice':   '/conferma-codice',
    'altro codice':      '/altro-codice',
    'prova preventivo':  '/auto?targa=',
    'cattura API':       "'/sniff'",
    'esplora portale':   "'/explore'",
  };
  for (const [cosa, pezzo] of Object.entries(attese)) {
    deve(html.includes(pezzo), 'funzione persa rispetto al vecchio pannello: ' + cosa);
  }
  for (const fn of ['fontiCrea', 'fontiElimina']) {
    deve(ritaglia(html, fn), 'manca ' + fn + ': una compagnia nuova si collegherebbe solo dal server');
  }
});

prova('il codice del portale ha dove essere scritto', () => {
  /* Il portale manda un codice via email e senza quello il collegamento non
     riparte. Lasciare l'operatore davanti al messaggio senza un campo dove
     scriverlo e' il punto esatto in cui si rinuncia e si telefona. */
  const s = ritaglia(html, 'fontiScheda');
  deve(s && /f-cod-/.test(s), 'non c\'è nessun campo per il codice ricevuto');
  deve(s && /fontiCodice\(/.test(s), 'il codice non si può confermare');
  deve(s && /fontiAltroCodice\(/.test(s), 'non si può chiedere un codice nuovo');
});

prova('dopo l\'accesso si aspetta il portale, non si dice «fatto»', () => {
  const a = ritaglia(html, 'fontiAspetta');
  deve(a, 'manca l\'attesa: si direbbe «fatto» appena partita la richiesta');
  deve(/loginstate/.test(a), 'lo stato del login non viene richiesto al portale');
  /* Un ciclo senza fine lascerebbe la schermata a girare per sempre su un
     portale che non risponde piu'. */
  deve(/i < \d+/.test(a), 'l\'attesa non ha una fine');
  deve(/non ha ancora risposto/.test(a), 'scaduta l\'attesa non viene detto niente');
});

prova('eliminare una fonte chiede conferma e dice cosa sparisce', () => {
  const e = ritaglia(html, 'fontiElimina');
  deve(e, 'manca fontiElimina');
  deve(/confirm\(/.test(e), 'una fonte si elimina senza chiedere niente');
  deve(/credenziali/.test(e), 'non viene detto che spariscono anche le credenziali');
});

let ko = 0;
console.log('\nFONTI COMPAGNIE');
for (const [ok, nome, msg] of esiti) {
  console.log(ok ? '  ok  ' + nome + (msg ? ' — ' + msg : '') : '  X   ' + nome + ' — ' + msg);
  if (!ko && !ok) ko++;
  else if (!ok) ko++;
}
console.log(`\nFONTI: ${esiti.length - ko} superate, ${ko} fallite\n`);
process.exit(ko === 0 ? 0 : 1);
