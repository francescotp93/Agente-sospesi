# IAM — Note per Claude Code

## BLOCCHI — Non modificare senza esplicita richiesta dell'utente

### Transizione IAM → Quoto
**File:** `index.html` — funzione `goTab(t)`, blocco `if (t === 'quoto')`

La **grafica** della splash screen Quoto (overlay blu fullscreen con logo bolt, scritta QUOTO, barra di caricamento) è BLOCCATA: non modificarla senza richiesta esplicita dell'utente.

La **destinazione** del redirect è ora `https://quoto.withusassicurazioni.it/?from=iam` ed è costruita dalla helper `quotoUrl()`, che allega anche la sessione (`#at`/`#rt`) per il login automatico tra i sottodomini. Aggiornata su richiesta esplicita dell'utente (giugno 2026) per il passaggio ai domini personalizzati — vedi `INTERFACCIA-QUOTO-IAM.md` sez. 2-3.

La grafica di questa sezione funziona esattamente come voluto dall'utente. Non toccarla.

---

## Architettura generale

- **Stack:** Vanilla JS + HTML/CSS monolitico (`index.html`), Supabase (PostgreSQL + Auth), GitHub Pages
- **Deploy:** GitHub Pages da branch `main`
- **Supabase:** tabella principale utenti `iam_utenti` con colonne: `ruolo` (top_master/master/operativo), `quoto` (bool), `accesso_quoto` (bool)
- **Quoto:** app separata su `francescotp93/QUOTE`, stessa istanza Supabase, accede a `iam_utenti`

## Visibilità dati tra utenti (REGOLA)
- **La Contabilità è l'UNICO dato condiviso tra tutti gli utenti.** Tabella `sessioni_giornaliere` (cassa, contanti, versamenti, spese, fondo, POS, sospesi/incassi) + estratto conto/note del sotto-tab "Conto": si leggono e scrivono SENZA filtro per utente (chiave per `data_riferimento`). Non aggiungere mai filtri `utente_id`/`creato_da` su queste query.
- **Tutto il resto è per-utente.** Es. Pipeline `iam_trattative`: ogni utente vede solo le proprie trattative + quelle esplicitamente condivise (`utente_id` / `condivisi_con`). Stesso principio per diary, ecc.
- Nota: se in pratica la contabilità NON risultasse condivisa, il problema è la RLS su `sessioni_giornaliere` lato Supabase (deve permettere SELECT/INSERT/UPDATE a tutti gli utenti autenticati), non il codice frontend.

## Ruoli IAM
- `top_master` = admin completo
- `master` = manager
- `operativo` = collaboratore base

## Convenzioni
- Modifiche chirurgiche, mai riscritture complete del file
- Testare sempre che il login non si rompa dopo ogni modifica
