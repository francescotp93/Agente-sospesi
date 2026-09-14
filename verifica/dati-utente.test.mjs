// ═══════════════════════════════════════════════════════════════════════════════
//  I DATI DI UN UTENTE — e l'email, che e' un'altra cosa
//
//  Nome e cognome di un utente non si potevano cambiare da nessuna parte: si
//  sceglievano alla creazione e restavano quelli. Un cognome sbagliato finiva
//  nell'elenco, nelle notifiche, e — da quando esiste il preventivo
//  personalizzato — sul foglio che legge il cliente.
//
//  LA PROVA CHE CONTA E' LA SECONDA. In iam_utenti l'email e' una COPIA:
//  quella con cui si entra sta in auth.users, e la puo' toccare solo una
//  chiave di servizio, che nel browser non c'e' e non ci deve stare.
//  Scrivere la copia e basta sarebbe il peggiore dei mondi — l'elenco
//  mostrerebbe il nuovo indirizzo, la persona continuerebbe a entrare con il
//  vecchio, e il messaggio per rifare la password andrebbe al vecchio.
//  Sembrerebbe fatto e non lo sarebbe. Questa prova impedisce che qualcuno,
//  con le migliori intenzioni, aggiunga `email` a quella update.
// ═══════════════════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { RADICE, esiti, deve } from './banco.mjs';

const idx = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
const e = esiti('DATI UTENTE — si cambia il nome, non l\'accesso');

e.prova('dalla gestione utenti si aprono i dati di una persona', () => {
  deve(/function apriDatiUtente\(/.test(idx), 'manca il modulo dei dati utente');
  deve(/onclick="apriDatiUtente\('\$\{u\.id\}'\)"/.test(idx),
    'il modulo esiste ma nessuna riga dell\'elenco lo apre: per chi lavora non esiste');
  for (const c of ['du-nome', 'du-cognome']) {
    deve(idx.includes('id="' + c + '"'), 'manca il campo ' + c);
  }
  return 'nome e cognome';
});

e.prova('l\'email di accesso si legge e non si tocca', () => {
  const i = idx.indexOf('async function salvaDatiUtente(');
  deve(i > 0, 'non trovo il salvataggio: la prova non starebbe guardando niente');
  const fn = idx.slice(i, idx.indexOf('\n}', i));
  /* Il guasto da impedire e' UNA riga: aggiungere `email` all'update. */
  deve(!/\bemail\b/.test(fn),
    'il salvataggio dei dati utente tocca l\'email: in iam_utenti e\' solo una copia, ' +
    'e cambiarla da sola lascia l\'accesso e il recupero password sull\'indirizzo vecchio');
  deve(/update\(\s*\{\s*nome,\s*cognome\s*\}\s*\)/.test(fn),
    'il salvataggio non scrive piu\' esattamente nome e cognome: ' + fn.slice(0, 200));
  return 'scrive nome e cognome, nient\'altro';
});

e.prova('il campo email nel modulo e\' bloccato, e dice perche\'', () => {
  const i = idx.indexOf('id="du-email"');
  deve(i > 0, 'manca il campo dell\'email');
  const riga = idx.slice(i, i + 220);
  deve(/disabled/.test(riga), 'il campo dell\'email si puo\' scrivere: chi lo compila crede di aver cambiato l\'accesso');
  const spiega = idx.slice(i, i + 1200);
  deve(/password/i.test(spiega) && /accesso/i.test(spiega),
    'il modulo non spiega perche\' l\'email non si cambia da qui');
  return 'bloccato, e spiegato';
});

e.prova('la scheda del proprietario non la modifica un altro', () => {
  const i = idx.indexOf('async function apriDatiUtente(');
  const fn = idx.slice(i, idx.indexOf('\n}', idx.indexOf('ov.innerHTML', i)));
  deve(/SUPER_ADMIN_EMAIL/.test(fn), 'chiunque sia admin puo\' riscrivere i dati del proprietario');
  return 'solo lui sui suoi';
});

e.stampa();
process.exit(e.ko === 0 ? 0 : 1);
