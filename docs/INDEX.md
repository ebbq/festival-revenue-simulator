# Indice del progetto — EBBQ Festival Management System

**Ultimo aggiornamento**: 2026-04-08

---

## Struttura cartelle

```
coding/
├── docs/                    # Documentazione di progetto
│   ├── INDEX.md             # Questo file — mappa del progetto
│   ├── CHANGELOG.md         # Log di tutte le modifiche
│   ├── PRD.md               # Product Requirements Document v1.0
│   └── DATA_MODEL.md        # Schema database (v1.1, applicato)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Schema iniziale DB (13 tabelle + RLS + triggers)
├── src/
│   └── app/
│       ├── layout.tsx       # Layout principale Next.js
│       ├── page.tsx         # Homepage (attualmente: health check)
│       ├── globals.css      # Stili globali Tailwind
│       └── favicon.ico
├── public/                  # File statici
├── .env.local               # Variabili d'ambiente (NON su git)
├── package.json             # Dipendenze npm
├── next.config.ts           # Configurazione Next.js
├── tsconfig.json            # Configurazione TypeScript
└── postcss.config.mjs       # Configurazione PostCSS
```

## Dipendenze principali

| Pacchetto | Scopo |
|-----------|-------|
| next | Framework React (v15) |
| react / react-dom | UI library |
| @supabase/supabase-js | Client Supabase per DB e Auth |
| tailwindcss | Utility-first CSS |
| typescript | Type safety |

## Infrastruttura

| Servizio | Scopo | URL |
|----------|-------|-----|
| GitHub | Repository codice | github.com/ebbq/festival-revenue-simulator |
| Vercel | Hosting e deploy automatico | (collegato alla repo) |
| Supabase | Database PostgreSQL + Auth | (progetto configurato, schema applicato) |

## Database

13 tabelle su Supabase — dettagli in `DATA_MODEL.md`:
- `profiles` — utenti e ruoli (admin/editor/viewer)
- `editions`, `festival_days` — edizioni e giorni configurabili
- `expense_categories` — albero 3 livelli (self-referencing)
- `expenses`, `expense_revisions`, `expense_payments`, `expense_day_assignments` — spese con storico e pagamenti
- `revenues` — ricavi (sponsor, contributi, merch)
- `fb_operators`, `fb_actuals` — modulo ristorazione
- `scenarios` — simulazioni salvate
- `edition_history` — KPI storici

## Stato dei moduli (da PRD)

| Modulo | Stato |
|--------|-------|
| Database schema | Applicato |
| Auth (login/ruoli) | Da fare |
| Piano di spesa | Da fare |
| Ristorazione (F&B) | Da fare |
| Ricavi | Da fare |
| Simulatore scenari | Da fare |
| Dashboard | Da fare |
| Storico edizioni | Da fare |
| Report esterno | Futuro |
