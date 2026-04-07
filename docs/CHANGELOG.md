# Changelog — EBBQ Festival Management System

Tutte le modifiche significative al progetto.

---

## 2026-04-08 — Ristrutturazione spese (branch: feature/expense-restructure)

### Budget vs Spese allocate
- Nuovo campo `is_budget` su expenses: voce senza descrizione = budget da allocare
- Badge colorato: "Budget" (blu) vs "Spesa" (grigio), toggle con un click
- Logica gerarchica: budget L1 fa da tetto, sotto-budget e spese si scalano
- Disponibile = Budget - Allocato (rosso se sforato)

### Lista spese collassabile
- Vista ad albero per categoria: L1 → L2 → L3 → singole voci
- Categorie collassabili/espandibili con totali aggregati
- Ogni livello mostra: Budget, Allocato, Disponibile

### IVA come importo lordo
- Importi mostrati sempre lordi (netto + IVA)
- Indicazione "incl. IVA 22%" sotto l'importo
- Summary cards: "Totale lordo" e "di cui IVA"

### Spese a qualsiasi livello
- Rimosso vincolo leaf-only: spese/budget assegnabili a L1, L2 o L3
- Dropdown mostra tutte le categorie con indentazione

### Confronto edizioni
- Toggle nelle impostazioni: "Mostra confronto edizione precedente"
- Nella lista spese L1: importo edizione precedente + variazione %
- Match per nome categoria (case-insensitive)
- Migrazione: `show_edition_comparison` su editions, `is_budget` su expenses

---

## 2026-04-08

### Autenticazione
- Login page con email/password (Supabase Auth)
- Middleware: redirect a /login se non autenticato
- Helper `getProfile()` per ottenere utente e ruolo
- Logout action

### Impostazioni (solo Admin)
- Gestione edizioni: crea, imposta corrente
- Gestione giorni festival: aggiungi/rimuovi per edizione
- Categorie spesa: albero a 3 livelli completamente configurabile (crea, rinomina, elimina)

### Spese
- CRUD completo con assegnazione a categoria (albero gerarchico)
- Storico revisioni importi (timeline stanziamenti)
- Pagamenti: anticipi e saldi, con date e note
- Flag IVA con aliquota configurabile
- Assegnazione a giorni specifici o intero festival
- Riepilogo: budget totale, IVA, pagato, residuo
- Filtro per categoria L1

### Ricavi
- CRUD con categorie (sponsor, contributi, merch, altro)
- Stato confermato/potenziale
- Riepilogo: confermati, potenziali, totale

### Ristorazione (F&B)
- 3 tipi di operatore: fee fissa, percentuale, interno
- Parametri per simulazione: spesa media/persona, tasso conversione
- Consuntivo: fatturato reale, costi, fee pagata
- Stima automatica ricavi per presenze

### Simulatore scenari
- Slider presenze per giorno
- Calcolo automatico: costi fissi, ricavi confermati, ricavi F&B variabili, margine
- Salvataggio scenari nominati
- Lista scenari salvati con confronto

### Database
- Creato schema completo: 13 tabelle, RLS policies, triggers, indici (`supabase/migrations/001_initial_schema.sql`)
- Tabelle: profiles, editions, festival_days, expense_categories, expenses, expense_revisions, expense_payments, expense_day_assignments, revenues, fb_operators, fb_actuals, scenarios, edition_history
- Trigger auto-create profile su signup
- Trigger protezione cambio ruolo (solo admin)
- Trigger auto-update `updated_at` su expenses e revenues
- Row Level Security: admin tutto, editor CRUD su dati, viewer sola lettura
- Schema applicato su Supabase via SQL Editor

### Documentazione
- Creato DATA_MODEL.md v1.1
- Aggiornato INDEX.md con struttura DB e cartella supabase/migrations

---

## 2026-04-07

### Setup iniziale
- Inizializzato progetto Next.js 15 con TypeScript e Tailwind CSS
- Collegato repository GitHub (`ebbq/festival-revenue-simulator`)
- Collegato Vercel per deploy automatico
- Collegato Supabase (database + auth)
- Creata pagina di health check: verifica connessione Supabase e variabili d'ambiente
- Installato `@supabase/supabase-js`

### Documentazione
- Creato PRD v1.0 (`docs/PRD.md`)
- Creato indice progetto (`docs/INDEX.md`)
- Creato questo changelog (`docs/CHANGELOG.md`)
