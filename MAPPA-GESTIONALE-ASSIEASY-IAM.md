# Mappa gestionale — cosa prendere da AssiEasy (e da Plurima) per IAM

> Estratto lato **gestionale** della ricognizione su RCPolizza, Plurima by Italnext e AssiEasy.
> La mappa completa delle tre piattaforme, con la parte quotatore, sta in
> `QUOTE/docs/MAPPA-RCPOLIZZA-PLURIMA-ASSIEASY.md`.
> Rilevazione: luglio 2026, da fonti pubbliche (sito AssiEasy + 22 manuali PDF della loro area
> download aperta, sito e portale di registrazione Plurima).

Qui si mappano **funzioni e processi**, non testi né codice: quello che si replica è il modo di
lavorare, non il software altrui.

---

## 1. Perché AssiEasy è il riferimento giusto per IAM

AssiEasy (SAVE Srl, Tortona) è un gestionale web per agenzie mono e plurimandatarie e broker —
nel loro materiale ufficiale 770 intermediari, oggi il sito ne dichiara oltre 1000. Copre
quattro ambiti: **commerciale, organizzativo, amministrativo, documentale**. È esattamente il
perimetro di IAM, ma con vent'anni di sedimentazione sui dettagli operativi.

Corrispondenze con le tab attuali di IAM:

| Tab IAM | Equivalente AssiEasy | Distanza |
|---|---|---|
| `dashboard` | Home + widget azionabili | **grande** — i loro widget sono liste di lavoro, i nostri numeri |
| `agenti`, `team`, `utenti` | Collaboratori → Produttori / Gruppi produttore / Filiali | media — manca il livello *gruppo produttore* |
| `performance` | Analisi → Commerciali (retention, ATR, check-up) | **grande** — mancano retention e check-up portafoglio |
| `pipeline`, `lead` | Analisi → CRM + Richieste preventivi | **grande** — manca il workflow a stati |
| `conto` | Contabilità → quadratura, estratti conto, provvigioni | **grande** — manca il motore provvigionale |
| `sospesi` | Contabilità → Sospesi | piccola — abbiamo già l'alert >60gg |
| `anomalie` | Polizze e assicurati → Controllo Congruità | media |
| `workdiary` | Agenda + Attività + Appunti | media — manca l'agenda *condivisa fra colleghi* |
| `storico`, `azienda`, `carica`, `profilo`, `lab` | Varie → Importazioni / Tabelle nodi / Amministrazione | media |

---

## 2. Le cinque idee da rubare per prime

### 2.1 I widget sono liste di lavoro, non contatori

La loro home espone otto widget, ciascuno **cliccabile per ottenere l'elenco delle posizioni**:

- **Da evadere oggi (n)** — agende dell'utente in scadenza oggi
- **Agende ricevute da colleghi (n)** — con flag «letto» che toglie l'evidenza
- **Agende inviate ai colleghi** — non ancora evase (chi ha delegato vede se il lavoro gira)
- **Attività di oggi / Attività scadute**
- **Preventivi in scadenza** e **Preventivi anni precedenti** — questi ultimi sono preventivi *non
  andati a buon fine* negli anni scorsi che scadono ora: opportunità commerciale pura
- **Polizza concorrenza primo anno** / **anni precedenti** — scadenze delle polizze che i nostri
  clienti hanno *con la concorrenza*
- **(n) scadenze mora** — polizze che escono di mora nei prossimi **3 giorni**

Il nostro `dashboard` mostra stato; il loro mostra **cosa fare oggi, per nome e cognome**.
Il widget "preventivi anni precedenti" in particolare non costa nulla e riapre trattative morte.

### 2.2 Estrazione → CONTATTA

In AssiEasy **ogni griglia** ha sopra quattro bottoni: `CSV`, `WORD/LETTERA`, **`CONTATTA`**, `NUOVO`.
`CONTATTA` apre l'invio di **lettera, mail o SMS al risultato dell'estrazione appena fatta**, con
documenti e diciture personalizzabili per produttore, per tipologia di cliente o per campagna.
Le lettere cartacee partono dalla scrivania via un partner postale (niente stampa/imbusto/spedizione),
gli SMS via gateway, i WhatsApp massivi dalla WebApp.

Conseguenza di design: **qualsiasi ricerca in IAM deve poter diventare una campagna in un click**.
Se lo aggiungiamo alla griglia generica invece che alle singole pagine, lo otteniamo ovunque
in una volta sola.

### 2.3 Il motore provvigionale

Tre modalità di calcolo delle provvigioni passive:

1. **retrocessione** su una quota delle provvigioni di agenzia
2. **percentuale sul premio**
3. **aliquota sull'imponibile di polizza** — e sui rami auto anche **sull'imponibile della singola garanzia**

Ogni regola è applicabile **storicamente** (validità dal/al) e **differenziata per ramo, prodotto e
garanzia**, distinguendo tre eventi: **nuovo contratto (acquisto)**, **altre rate (incasso)**,
**quota diritti**.
L'estratto conto si produce per collaboratore o per **gruppo collaboratore** — che riunisce i
diversi codici assegnati dalle compagnie sotto l'unico produttore reale. Esiste anche una gestione
di **provvigioni di II livello** (il collaboratore che ha sotto altri collaboratori).

Questo è il pezzo che oggi in IAM manca del tutto ed è quello che costa di più farsi a mano
ogni mese.

### 2.4 Il workflow "Richieste preventivi"

Non è una pagina: è una macchina a stati con smistamento.

- **Macro aree** configurabili (default Auto / Rami Elementari / Vita) per indirizzare le pratiche
  a backoffice diversi
- Tabella **Stati** modificabile dall'amministratore: *richiesta di preventivo → richiesta
  quotazione da compagnia → attesa documentazione dal cliente → … → chiusura positiva / negativa*
- Il collaboratore inserisce la richiesta sulla macro area; il backoffice vede nel proprio widget
  le pratiche **non ancora assegnate** (filtrate per le macro aree di sua competenza) e le prende
  in carico
- Lo stato guida il monitoraggio, agganciato ad **agenda** e **documenti**
- Alla chiusura (positiva o negativa) la pratica **esce dai widget**
- Due widget distinti: **«Situazione richieste preventivi»** per il responsabile (visione totale) e
  **«Preventivi assegnati personali»** per il backoffice, entrambi con tasto "aggiungi pratica" e
  totali per stato

È il modello giusto per `pipeline` + `lead` di IAM: oggi abbiamo le liste, non il passaggio di mano.

### 2.5 Caricamento polizze da PDF con IA, a modelli

L'approccio è più solido del "dai il PDF all'IA e spera":

- Si crea **un modello per ogni combinazione compagnia × layout** (es. «Compagnia Blu Rami
  elementari» e «Compagnia Blu Auto» separati)
- Il modello contiene: PDF campione, **quali pagine leggere (max 4)**, **quali campi estrarre**,
  note operative, flag attivo
- **Riconoscimento automatico del mandato**: si indicano fino a 3 stringhe (`Testo1/2/3`) che devono
  comparire nel PDF **in quell'ordine** → il sistema deduce compagnia/collaborazione
- **Riconoscimento automatico di ramo e prodotto** con lo stesso meccanismo a 3 stringhe
- Correzione per singolo campo con istruzioni in linguaggio naturale
  (es. *«leggi il campo premio prima rata, leggi totale lordo rata»*)

Campi estratti: P.IVA, CF, nominativo, cognome, nome, comune, indirizzo, CAP, provincia, numero
polizza, data effetto, scadenza, inizio/scadenza copertura, frazionamento, n. sostituita, targa,
modello auto, immatricolazione, settore, uso, alimentazione, valore, **classe di merito universale
e di compagnia**, più la matrice premi completa — imponibile / netto CVT / netto RCA / diritti /
SSN / accessori / imposte / lordo — su **tre orizzonti: firma, annuo, rata**.

Regole di configurazione che vale la pena copiare pari pari:
- se CVT e RCA sono espliciti nel PDF si leggono quelli e **si toglie l'imponibile**; altrimenti si
  legge l'imponibile e il sistema **calcola** i totali
- si legge **o** l'annuo **o** la rata, mai entrambi: l'altro si deriva dal frazionamento
- i premi **alla firma** vanno sempre letti
- limite dichiarato: sull'auto si ottengono i totali RCA e CVT, **non** l'imponibile della singola garanzia

---

## 3. Il resto della mappa AssiEasy, per area

### 3.1 Menu completo a 3 livelli

**Polizze e Assicurati**
- *Anagrafica*: Anagrafica · Completezza dati anagrafici · Scadenzario Concorrenza/Preventivi · **Scadenzario privacy** · Anagrafiche acquisite e perse nel periodo · Compleanni clienti
- *Polizze*: Inserimento/Emissione polizze · **Inserimento Contratti non assicurativi** · Polizze e relazioni · Polizze annullate · Polizze perse anni precedenti · Scadenzari: Sospensioni, Cessioni, Regolazioni, Fidi cauzioni, Senza tacito rinnovo
- *Titoli*: Verifica abbinamento titoli
- *Quietanzamento*: Giacenze/Scadenze imminenti · Genera quietanze · Carico del periodo · Titoli al contenzioso · **Difesa proattiva portafoglio**
- *Incassi*: Visione foglio cassa · Incassato collaboratori · Incassato per garanzia · Controllo documenti su incasso
- *Sinistri*: ricerca · inserimento manuale · movimentati nel periodo · **comunicazioni sinistri in prescrizione**
- *Controllo congruità*: Polizze da verificare · Polizze vive senza incassi · Pulitura arretrati

**Analisi**
- *Commerciali*: Analisi clientela · Check-up portafoglio · Analisi incassi (+ riepilogo mensile) · Polizze nuove e annullate nel periodo · **Retention** · Portafoglio auto per classi di merito · **Analisi ATR** · Check-up di agenzia
- *CRM*: **Analisi fabbisogni** · Auto senza tutela/infortuni/altro · **Calcolo rating massivo** · Riforme/Azioni marketing · Analisi libere · Ricerca rischi in prodotto · Valutazioni su incassato
- *Organizzazione*: Dati per studio di settore · Portafoglio per localizzazione geografica

**Collaboratori** — Produttori e sub-produttori · profilazione · estratti conto · **gruppi produttore** · collaborazioni · filiali · **riassegnazione portafoglio produttore** · capitolati collaboratori

**Contabilità di agenzia** — Appunti incasso · Quadratura · Sospesi · Prima nota per causali · Anticipazioni · Riconciliazione bancaria · Fatturazione elettronica · Gestione fatture e commissioni · Estratti conto collaborazioni-compagnie · Flusso incassi broker↔agenzia · Export prima nota verso i gestionali del commercialista (Buffetti, Fiscage, GIS, Magix, IPSOA, Osra, Pass Coge, SMC, Sistemi Profis, TeamSystem, Zucchetti)

**Varie** — *Amministrazione*: Utenti · Parametri Email (SMTP + mail di prova) · Parametri SMS · Parametri Home Insurance · Gestione modelli lettere (con duplica template) · Privacy gestione consensi · Gestione richieste di firma · Cartelle flussi. *Importazioni*: Anagrafiche · Polizze/Titoli · Agenda · file ottici. *Esportazioni*: Vendita massiva. *Tabelle nodi*: Agenzie · Compagnie · Rami · Prodotti · Sottotipi carico. *Utility*: Area download · Gestione documenti · Normalizzazione cognomi · **Registro telefonate**

**Sistema** — Accessi/Utenti · Tabelle di sistema · **Nodi Agenzie** · profilature

### 3.2 Convenzioni UI da adottare come specifica di componente

**Griglia dati**: ordinamento per colonna · filtri per contenuto con **intestazione in grassetto
sottolineato quando un filtro è attivo** · scelta colonne visibili · **editing in cella** (icona
matita nell'intestazione) · spostamento colonne in drag · **menu contestuale col tasto destro**
sulle azioni disponibili per quel record · i quattro bottoni `CSV / WORD / CONTATTA / NUOVO`.

**Bottoni di procedura**: Cerca (= tasto Invio) · Salva (**autosalvataggio al cambio di scheda**) ·
Elimina · Modifica · Aggiungi a…

**Campi**: data digitabile senza barre né secolo (se siamo nel mese basta il giorno) · campi
tabellari con **F2** per vedere i valori e, se amministratore, **inserirne di nuovi al volo senza
uscire dalla schermata**.

**Toolbar sempre presente**, anche dentro i programmi: quattro icone di **cruscotto cliente**
(singolo assicurato / famiglia / azienda / gruppo libero) · Appunti personali persistenti ·
Agenda · Esci (= tasto ESC) · Attività · Archiviazione ottica.

**Cartelle di lavoro** (schede) per spezzare le schermate dense in gruppi omogenei.

### 3.3 Processi

**Difesa proattiva del portafoglio.** Sui contratti in scadenza mostra: note registrate sulla
polizza, **aumento o diminuzione del premio rispetto all'incasso precedente**, azioni marketing in
corso, anzianità del contratto, presenza di regolazione premio, e **le divergenze fra le giacenze
arrivate dalle compagnie e quelle a portafoglio**. Per ogni contratto si decreta l'azione da fare.
È l'anti-churn fatto bene: la nostra `performance` guarda indietro, questo guarda avanti di 60 giorni.

**Controllo congruità.** Verifica che polizze, titoli e incassi siano coerenti fra loro e con la
realtà (polizze da verificare, polizze vive senza incassi, pulitura arretrati). È il presupposto di
ogni analisi commerciale — senza, i numeri di `performance` mentono. Da agganciare a `anomalie`.

**Sospesi.** Anticipazioni di denaro al cliente, parametrizzate dal piano dei conti, che generano
uno **scadenzario**; il sospeso recuperato **non viene cancellato fisicamente** e resta ricercabile
a distanza di anni; stampe della situazione per collaboratore, per cliente e globale.
IAM ha già l'alert «sospesi aperti da oltre 60 giorni»: quello che manca è lo scadenzario, la
tracciabilità storica e la vista per collaboratore.

**Quietanzamento.** Giacenze e scadenze imminenti · generazione quietanze per le polizze inserite a
mano · carico del periodo per produttore · titoli al contenzioso · interrogazione **SIC** diretta
per chi ha le credenziali · stampa carico in Excel.

**Contabilità assicurativa.** Appunti incasso registrabili **anche prima che polizza e titolo
esistano** (arriveranno dopo, da flusso o a mano) → quadratura → posizione finanziaria ed economica
+ estratto conto dei conti → individuazione rapida delle squadrature. Prima nota generata
automaticamente dalle operazioni assicurative. Contabilità fiscale esplicitamente fuori perimetro:
si esporta al commercialista.

**Privacy come dato di portafoglio.** Scadenzario consensi, ricerca dei consensi mancanti o
scaduti, flag **«escludi clienti senza privacy»** nelle esportazioni e nelle campagne massive.
Non è un adempimento a parte: è una colonna dell'anagrafica che blocca il marketing.

**Archiviazione ottica.** Documenti abbinati ad anagrafiche, polizze, incassi, sinistri, polizze
concorrenza e documenti contabili. Flag **«documenti condivisi»** per mettere condizioni di polizza,
circolari e documenti interni a disposizione della rete. Verifica di quali polizze **non** hanno il
documento allegato. Scansione che si auto-abbina leggendo numero di polizza o nominativo.
**Il libretto auto inserito una volta si ritrova su tutte le polizze con la stessa targa.**

**Profilazione.** Tre profili base — **Agenzia** (vede tutto, ma limitabile a uno o più codici
agenzia), **Filiale**, **Produttore** (subagente e sub-produttore) — aggregabili per **Gruppo
Produttore**. Accessi illimitati, menu differenziati per ruolo, limitazione della visione dei dati
al singolo utente.
Rispetto ai nostri tre ruoli fissi (`top_master` / `master` / `operativo` in `iam_utenti`) mancano
due cose: il **gruppo produttore** come entità e la **visibilità a perimetro** (per codice agenzia
/ per portafoglio) invece che per livello.

**Integrazioni**: centralino VoIP con riconoscimento del chiamante che apre il cruscotto anagrafico
+ **registro telefonate** con note operative · SMS · posta cartacea inviata dalla scrivania ·
digitalizzazione documenti · scanner con OCR · WhatsApp massivi da WebApp.

---

## 4. Da Plurima, per la parte rete di IAM

- **Onboarding gated dal RUI**: la registrazione chiede CF, **numero di iscrizione RUI e data**
  prima di ogni altra cosa; poi normalizza l'indirizzo con conferma esplicita
  («Attenzione: indirizzo non certificato»); poi i dati utente (nome, cognome, data e luogo di
  nascita, qualifica, sesso, username, password, email, cellulare) e, per le società, ragione
  sociale, sito e descrizione.
- **Accordo di collaborazione firmato in piattaforma come gate all'emissione**: ti registri e vedi
  catalogo e preventivatore; **firmi e puoi emettere**. Non è UX, è come si dimostra la
  collaborazione fra intermediari ex art. 22 DL 179/2012.
- **Sotto-utenze con livello di autonomia** deciso dal profilo padre: agenti e broker creano utenze
  per i propri collaboratori e ne impostano il raggio d'azione. Da mettere accanto ai nostri ruoli.
- **Chiusura estratto conto on demand**: il collaboratore non aspetta fine mese; chiude quando
  vuole e riceve il bonifico delle provvigioni maturate, con storico di quelle già incassate.
  Impatta `conto` e la pagina estratto di QUOTO.
- **IBAN virtuale per intermediario**: incassi tracciati e riconciliati per conto, senza matching a mano.
- **Sinistri**: si caricano i documenti nella sezione dedicata e **il ticket si genera da solo**.

---

## 5. Ordine di lavoro proposto per IAM

| # | Intervento | Tab toccata | Perché prima |
|---|---|---|---|
| 1 | Widget azionabili in home (scadenze mora 3gg, agende ricevute/inviate, preventivi in scadenza, preventivi anni precedenti) | `dashboard`, `workdiary` | costo basso, effetto immediato sul lavoro quotidiano |
| 2 | Workflow richieste preventivi: macro aree + stati + presa in carico + doppio widget | `pipeline`, `lead` | sblocca il passaggio collaboratore↔backoffice |
| 3 | Motore provvigionale a 3 modalità con validità storica per ramo/prodotto/garanzia | `conto`, `agenti` | è il lavoro manuale più costoso che abbiamo |
| 4 | Chiusura estratto conto on demand + storico incassato | `conto` | completa il punto 3 e si vede subito dalla rete |
| 5 | Gruppo produttore + visibilità a perimetro accanto ai ruoli | `team`, `utenti` | prerequisito di 3 e 4 sui plurimandato |
| 6 | Controllo congruità (polizze vive senza incassi, pulitura arretrati) | `anomalie` | senza questo `performance` non è attendibile |
| 7 | Difesa proattiva portafoglio (delta premio, divergenze giacenze, azione da decretare) | `performance` | anti-churn |
| 8 | Griglia standard con CSV/WORD/**CONTATTA**/NUOVO + filtri e F2 | trasversale | una volta sola, vale ovunque |
| 9 | Privacy come dato di portafoglio (scadenzario consensi, esclusione dalle campagne) | `anagrafica`, esportazioni | condizione per usare il punto 8 |
| 10 | Caricamento polizze da PDF con IA a modelli | `carica` | il più grosso; conviene dopo che i punti 1-9 reggono |

Il resto (registro telefonate, riconoscimento chiamante, archiviazione ottica con auto-abbinamento,
libretto auto condiviso per targa, IBAN virtuale) è utile ma non blocca nulla.

---

## 6. Cautele

- **Compliance prima di UX.** Se copiamo il flusso di collaborazione di Plurima ne copiamo anche
  l'obbligo: RUI verificato, accordo firmato e archiviato, RUI pubblicato dove il cliente lo vede,
  reclami e Arbitro assicurativo raggiungibili.
- **Consensi separati.** Tre consensi distinti — gestione del rapporto / marketing proprio /
  marketing di terzi, il terzo esplicitamente facoltativo. Struttura da replicare, testi da
  scrivere nostri.
- **Cosa non si copia.** Testi, grafica, codice, manuali e modulistica delle piattaforme mappate.
  Funzioni e flussi sì; materiale loro no.
- **Numeri datati.** I dati AssiEasy (770 intermediari, elenco delle compagnie con flusso
  automatico) vengono da materiale non recente: da riverificare prima di usarli in un confronto.
