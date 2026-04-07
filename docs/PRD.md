# PRD — EBBQ Festival Management System

**Versione**: 0.2
**Ultimo aggiornamento**: 2026-04-07
**Stato**: In definizione

---

## Obiettivo

Sistema web per il controllo di gestione del festival EBBQ (festival musicale a ingresso gratuito, IV edizione). Permette di inserire e tracciare spese, monitorare pagamenti, simulare scenari basati sul pubblico atteso, e confrontare con edizioni storiche. Accesso protetto con ruoli differenziati.

---

## Utenti e ruoli

| Ruolo | Permessi |
|-------|----------|
| **Admin** | Tutto: spese, ricavi, simulazioni, storico, gestione utenti |
| **Editor** | Inserimento e modifica spese/ricavi, simulazioni |
| **Viewer** | Solo lettura: dashboard e report |

Max 5 utenti. Auth via email + password (Supabase Auth).

---

## Moduli

### 1. Piano di spesa

#### Struttura categorie (3 livelli)
Le spese sono organizzate su 3 livelli gerarchici con precisione crescente. Esempio:

```
Livello 1: Produzione
  Livello 2: Palco
    Livello 3: Noleggio palco principale
  Livello 2: Audio/Video
    Livello 3: Mixer, monitor, regia

Livello 1: Artisti
  Livello 2: Headliner
    Livello 3: Cachet artista X
  Livello 2: Opening
    Livello 3: Cachet artista Y

Livello 1: Logistica
  Livello 2: Trasporti
    ...
```
> Le categorie sono configurabili dall'Admin.

#### Attribuzione temporale
Ogni spesa può essere attribuita a:
- **Un giorno specifico** del festival
- **Più giorni selezionati**
- **All'intero festival** (non legata a un giorno)

#### Evoluzione nel tempo (storico stanziamenti)
Ogni voce di spesa tiene traccia delle sue revisioni nel tempo:

| Data | Tipo | Importo | Note |
|------|------|---------|------|
| 01/03 | Stanziamento iniziale | 100 € | Prima stima |
| 15/03 | Revisione | 160 € | Richiesta fornitore |
| 02/04 | Revisione | 40 € | Rinegoziato |

Importo corrente = ultima revisione. La sequenza è sempre visibile.

#### Monitoraggio pagamenti
Per ogni spesa:
- **Importo impegnato** (stanziamento corrente)
- **Anticipo versato** (data + importo)
- **Saldo residuo** (calcolato automaticamente)
- **Pagato completamente** (flag)
- **Fornitore** (nome, riferimento)
- **Note**

---

### 2. Ristorazione (modulo separato)

La ristorazione è trattata separatamente perché i suoi costi e ricavi sono fortemente variabili in base al pubblico.

> **Da definire**: il modello F&B di EBBQ — venditori esterni che pagano una fee? gestione diretta? entrambi?

Struttura prevista:
- Costi variabili legati a una **variabile driver** (es. presenze attese)
- Ricavi F&B (fee vendor, % sul venduto, gestione diretta)
- Simulazione automatica al variare delle presenze

---

### 3. Ricavi

Categorie principali:
- Sponsor (confermato / in trattativa)
- Contributi pubblici / bandi
- F&B (vedi modulo separato)
- Merch
- Altro

Per ogni ricavo: importo, stato (confermato/potenziale), data incasso prevista.

---

### 4. Simulatore scenari

- Input: **presenze attese** (slider o campo numerico)
- Calcolo automatico di tutti i costi variabili (principalmente F&B)
- Output: totale costi, totale ricavi, margine, eventuale break-even
- Salvataggio scenari nominati (es. "Base 2026 — 3.000 persone")
- Confronto scenari affiancati

---

### 5. Dashboard

- Riepilogo: impegnato vs pagato vs budget totale
- Saldo cassa: anticipo versati vs incassi ricevuti
- Ricavi confermati vs potenziali
- Margine per scenario attivo
- Confronto con edizioni precedenti (YoY)
- Grafici per categoria di spesa

---

### 6. Storico edizioni

- Dati delle edizioni precedenti (I, II, III)
- Import manuale da Google Sheets
- Confronto year-over-year su KPI chiave

---

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 15 + Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Deploy | Vercel |

---

## Domande aperte

- [ ] Quanti giorni dura il festival?
- [ ] Definire i 3 livelli di categorie spesa (l'Admin li configura o sono predefiniti?)
- [ ] Modello F&B: vendor esterni, gestione diretta, o misto?
- [ ] Quali altre variabili driver oltre alle presenze (es. ore di apertura, numero di palchi)?
- [ ] Il Viewer esterno (sponsor, Comune) vede la dashboard completa o una versione ridotta?
- [ ] Import storico: manuale (CSV) o guidato voce per voce?
