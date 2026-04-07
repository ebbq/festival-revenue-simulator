# PRD — EBBQ Festival Management System

**Versione**: 1.1
**Ultimo aggiornamento**: 2026-04-08
**Stato**: In definizione

---

## Obiettivo

Sistema web per il controllo di gestione del festival EBBQ (festival musicale a ingresso gratuito, IV edizione). Permette di inserire e tracciare spese, monitorare pagamenti, simulare scenari basati sul pubblico atteso, e confrontare con edizioni storiche. Accesso protetto con ruoli differenziati.

---

## Contesto festival

- Ingresso gratuito
- Edizione 2026: **3 giorni** (le precedenti erano 2 giorni)
- IV edizione: storico disponibile per le prime 3

---

## Utenti e ruoli

| Ruolo | Permessi |
|-------|----------|
| **Admin** | Tutto: spese, ricavi, simulazioni, storico, configurazione categorie, gestione utenti |
| **Editor** | Inserimento e modifica spese/ricavi, simulazioni |
| **Viewer** | Solo lettura: dashboard e report (versione futura) |

Max 5 utenti. Auth via email + password (Supabase Auth).

---

## Moduli

### 1. Piano di spesa

#### Struttura categorie (albero configurabile)
Le categorie di spesa sono organizzate su **3 livelli gerarchici**, completamente configurabili dall'Admin. Nessuna categoria è predefinita nel sistema — l'Admin costruisce l'albero liberamente.

```
Livello 1 (es. "Produzione")
  └── Livello 2 (es. "Palco")
        └── Livello 3 (es. "Noleggio palco principale")
```

Le voci di spesa si agganciano sempre al **livello più basso** disponibile. La dashboard aggrega automaticamente verso l'alto.

#### Attribuzione temporale
Ogni spesa può essere attribuita a:
- **Un giorno specifico** del festival (i giorni sono configurati dall'Admin nelle impostazioni, mai hardcoded)
- **Più giorni selezionati**
- **All'intero festival** (spesa non giornalizzata)

#### Evoluzione nel tempo (storico stanziamenti)
Ogni voce di spesa tiene traccia di tutte le sue revisioni:

| Data | Tipo | Importo | Note |
|------|------|---------|------|
| 01/03 | Stanziamento iniziale | 100 € | |
| 15/03 | Revisione | +60 € → 160 € | Richiesta fornitore |
| 02/04 | Revisione | −120 € → 40 € | Rinegoziato |

- L'importo corrente è sempre l'ultima revisione
- La sequenza storica è sempre consultabile
- Ogni revisione ha data, importo e nota opzionale

#### Monitoraggio pagamenti
Per ogni voce di spesa:
- **Importo impegnato** (stanziamento corrente)
- **Anticipo versato** (importo + data)
- **Saldo residuo** (calcolato: impegnato − anticipo)
- **Pagato completamente** (flag + data)
- **Fornitore** (nome + riferimento facoltativo)
- **Note**

---

### 2. Ristorazione (modulo separato)

La ristorazione è separata perché ha una logica propria: mix di soggetti con modelli economici diversi, tutti legati alle presenze.

#### Tre tipi di operatore F&B

| Tipo | Descrizione | Come si calcola |
|------|-------------|-----------------|
| **Vendor a fee fissa** | Paga un importo fisso per partecipare | Ricavo = fee; Costo = 0 (o costo dello spazio) |
| **Vendor a percentuale** | Paga una % sul venduto | Due campi: **% stimata** (budget, usata nel simulatore) e **% reale + fatturato reale** (consuntivo) |
| **Interno** | EBBQ gestisce direttamente | Budget: ricavi e costi stimati. Consuntivo: ricavi e costi reali inseriti dall'Admin. Margine netto calcolato su entrambi. |

#### Variabile driver
Il **numero di presenze** è il driver principale. Per ogni operatore F&B si definisce:
- Spesa media stimata per persona (€/testa)
- % di conversione (quante persone del pubblico si fermano a mangiare/bere)

Questo permette al simulatore di calcolare automaticamente i ricavi F&B al variare delle presenze.

---

### 3. Ricavi

Categorie principali:
- Sponsor (confermato / in trattativa)
- Contributi pubblici / bandi
- F&B (calcolato dal modulo ristorazione)
- Merch
- Altro

Per ogni ricavo: importo, stato (confermato / potenziale), data incasso prevista.

---

### 4. Simulatore scenari

- Input principale: **presenze attese** (per giorno e/o totale)
- Calcolo automatico di tutti i costi variabili F&B
- Output: totale costi, totale ricavi, margine, break-even
- Salvataggio scenari nominati (es. "Base 2026 — 3.000 presenze/giorno")
- Confronto scenari affiancati

---

### 5. Dashboard

- Budget totale vs impegnato vs pagato
- Saldo cassa: anticipi versati vs incassi ricevuti
- Ricavi: confermati vs potenziali
- Margine per scenario attivo
- Vista per giorno / per categoria
- Confronto con edizioni precedenti (YoY)

---

### 6. Storico edizioni

Dati delle prime 3 edizioni (I, II, III) importati per confronto storico.

#### Strategia di import

Dato che i dati storici sono su Google Sheets con strutture non uniformi tra edizioni, si adotta un approccio **a due livelli**:

**Livello A — Aggregati (subito)**
Import manuale dei KPI chiave per edizione:
- Presenze totali
- Totale costi per categoria di primo livello
- Totale ricavi per categoria
- Margine finale

Questo permette confronti YoY immediati senza normalizzare tutto.

**Livello B — Dettaglio (futuro, opzionale)**
Se si vuole drill-down sullo storico: costruiamo un template CSV con le colonne del nuovo sistema. L'Admin esporta da Sheets, adatta le colonne, e importa. Il sistema valida e segnala le righe problematiche.

---

### 7. Report / Vista esterna *(versione futura)*

Vista sintetica per stakeholder esterni (sponsor, Comune). Non inclusa nel primo rilascio.

---

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 16 + React + Tailwind CSS v4 |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Deploy | Vercel |

---

## UI e brand

- **Palette**: colori da visual identity EBBQ (coral, olive, periwinkle, giallo tramonto), esposti come CSS variables e utility Tailwind in `src/app/globals.css`
- **Leggibilità**: UI chiara; CTA principali in giallo con testo scuro; bottoni “salva” / traccia spese su toni olive; traccia informativa secondaria (anticipi, ricavi) su periwinkle
- **Logo**: primario Electronic BBQ in header (dashboard, login, moduli operativi)
- **Numeri in interfaccia**: formattazione italiana tramite helper condivisi (`format-it.ts`) per evitare differenze tra rendering server e browser

---

## Decisioni prese

- Le date del festival sono configurate dall'Admin nell'app (mai hardcoded — repo pubblica)
- F&B a %: doppio campo budget/consuntivo per permettere stima e controllo a posteriori
- Dati F&B interno: inseriti solo dall'Admin (una persona)
- Sponsor: tutti a importo fisso (nessun sponsor legato alle presenze)
- Numeri mostrati all’utente: formattazione IT centralizzata e deterministica (vedi `docs/INDEX.md` — `format-it.ts`)
