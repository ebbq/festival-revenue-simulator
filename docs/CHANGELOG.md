# Changelog — EBBQ Festival Management System

Tutte le modifiche significative al progetto.

---

## 2026-04-08

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
