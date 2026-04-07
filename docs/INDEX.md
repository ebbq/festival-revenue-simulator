# Indice del progetto — EBBQ Festival Management System

**Ultimo aggiornamento**: 2026-04-08

---

## Struttura cartelle

```
coding/
├── docs/
│   ├── INDEX.md             # Questo file
│   ├── CHANGELOG.md         # Log modifiche
│   ├── PRD.md               # Product Requirements v1.0
│   └── DATA_MODEL.md        # Schema database v1.1
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_budget_and_comparison.sql  # is_budget + show_edition_comparison
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Layout principale
│   │   ├── page.tsx         # Homepage / Dashboard
│   │   ├── globals.css      # Stili globali
│   │   ├── login/
│   │   │   ├── page.tsx     # Pagina login
│   │   │   └── actions.ts   # Login/logout server actions
│   │   ├── auth/
│   │   │   └── callback/route.ts  # OAuth callback
│   │   ├── settings/
│   │   │   ├── layout.tsx   # Layout settings (admin-only)
│   │   │   ├── page.tsx     # Redirect a /editions
│   │   │   ├── editions/    # Gestione edizioni e giorni
│   │   │   └── categories/  # Albero categorie spesa (3 livelli)
│   │   ├── expenses/
│   │   │   ├── page.tsx     # Lista spese con sommario
│   │   │   ├── actions.ts   # CRUD spese, revisioni, pagamenti
│   │   │   ├── new-expense-form.tsx
│   │   │   ├── expense-list.tsx
│   │   │   └── expense-detail.tsx  # Storico revisioni + pagamenti
│   │   ├── revenues/
│   │   │   ├── page.tsx     # Lista ricavi
│   │   │   ├── actions.ts   # CRUD ricavi
│   │   │   └── revenue-list.tsx
│   │   ├── fb/
│   │   │   ├── page.tsx     # Operatori F&B
│   │   │   ├── actions.ts   # CRUD operatori + consuntivi
│   │   │   └── fb-operator-list.tsx
│   │   └── scenarios/
│   │       ├── page.tsx     # Simulatore scenari
│   │       ├── actions.ts   # Salva/elimina scenari
│   │       └── scenario-simulator.tsx
│   ├── lib/
│   │   ├── auth.ts          # Helper getProfile()
│   │   └── supabase/
│   │       ├── client.ts    # Client browser
│   │       ├── server.ts    # Client server
│   │       └── middleware.ts # Session refresh
│   └── middleware.ts         # Auth middleware (redirect se non loggato)
├── .env.local               # Variabili d'ambiente (NON su git)
├── .claude/launch.json      # Config dev server
└── package.json
```

## Dipendenze principali

| Pacchetto | Scopo |
|-----------|-------|
| next (v16) | Framework React |
| @supabase/supabase-js | Client Supabase |
| @supabase/ssr | Auth SSR per Next.js |
| tailwindcss | CSS |
| typescript | Type safety |

## Stato dei moduli

| Modulo | Stato | Route |
|--------|-------|-------|
| Auth | Fatto | /login |
| Impostazioni (edizioni, giorni, categorie) | Fatto | /settings |
| Spese (budget/allocate, albero collassabile, IVA lordo, confronto edizioni) | Fatto | /expenses |
| Ricavi | Fatto | /revenues |
| Ristorazione (F&B) | Fatto | /fb |
| Simulatore scenari | Fatto | /scenarios |
| Dashboard | Da fare | / |
| Storico edizioni | Da fare | — |
| Report esterno | Futuro | — |
