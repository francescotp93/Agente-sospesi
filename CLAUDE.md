# IAM — Note per Claude Code

> **Prima di toccare qualsiasi cosa, leggi `IAM.md`**: dice che cos'è IAM, come
> si chiama e dove finisce. Questo file dice come si lavora su questo
> repository. In caso di contraddizione sul *nome* o sul *perimetro*, vale
> `IAM.md`.
>
> In breve: **IAM (Insurance Agency Management) è il sistema, uno solo.**
> «QUOTO» è il nome del repository `francescotp93/QUOTE`, non di un'applicazione;
> «With Us One» è un nome ritirato. Davanti a un utente si legge solo IAM.

## BLOCCHI — Non modificare senza esplicita richiesta dell'utente

### Transizione IAM → Quoto
**File:** `index.html` — funzione `goTab(t)`, blocco `if (t === 'quoto')`

La **grafica** della splash screen (overlay blu fullscreen con logo bolt e barra di caricamento) è BLOCCATA: non modificarla senza richiesta esplicita dell'utente.

**Il testo, invece, è stato cambiato su richiesta esplicita dell'utente (4 agosto 2026).** La scritta diceva `QUOTO`, ora dice `IAM`: mostrare a tutto schermo il nome di un'altra applicazione era il punto in cui l'utente vedeva, nero su bianco, che i sistemi erano due — mentre IAM è uno solo (`IAM.md` §2). Stessa cosa per il secondo overlay (`quoto-bridge-overlay`), che diceva «Accesso a QUOTO» e ora dice «Accesso all'area PREVENTIVI». **Nessuna regola di stile è stata toccata**: colori, animazioni, dimensioni e disposizione sono identiche a prima.

La **destinazione** del redirect è ora `https://quoto.withusassicurazioni.it/?from=iam` ed è costruita dalla helper `quotoUrl()`, che allega anche la sessione (`#at`/`#rt`) per il login automatico tra i sottodomini. Aggiornata su richiesta esplicita dell'utente (giugno 2026) per il passaggio ai domini personalizzati — vedi `INTERFACCIA-QUOTO-IAM.md` sez. 2-3.

La grafica di questa sezione funziona esattamente come voluto dall'utente. Non toccarla.

---

## Architettura generale

- **Stack:** Vanilla JS + HTML/CSS monolitico (`index.html`), Supabase (PostgreSQL + Auth), GitHub Pages
- **Deploy:** GitHub Pages da branch `main`
- **Supabase:** tabella principale utenti `iam_utenti` con colonne: `ruolo` (top_master/master/operativo), `quoto` (bool), `accesso_quoto` (bool)
- **Quoto:** app separata su `francescotp93/QUOTE`, stessa istanza Supabase, accede a `iam_utenti`

## Ruoli IAM
- `top_master` = admin completo
- `master` = manager
- `operativo` = collaboratore base

## Convenzioni
- Modifiche chirurgiche, mai riscritture complete del file
- Testare sempre che il login non si rompa dopo ogni modifica

---

## Memoria di sessione (Obsidian)

Il vault Obsidian `secondo-cervello` è collegato via MCP (server `mcp-tools-istefox`).

**A inizio sessione:** leggi la nota `withus_memoria_strategica` (cartella `raw/`) e
usala come contesto di partenza, prima di rispondere o toccare codice.

**A fine sessione**, o quando Francesco dice "salva": aggiungi **in fondo** a quella
nota una voce con la data di oggi che riporta:
- cosa è stato fatto
- le decisioni prese e il perché
- i problemi rimasti aperti

Regole:
- Aggiungi in fondo, non riscrivere la nota da capo: lo storico non si cancella.
- Se il server MCP di Obsidian non risponde (Obsidian chiuso, sessione cloud),
  dillo una volta e prosegui lo stesso — non è un motivo per bloccarsi.
