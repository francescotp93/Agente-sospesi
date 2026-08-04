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
