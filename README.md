# EBBQ — Festival Management

Web app per controllo di gestione del festival **Electronic BBQ (EBBQ)**: spese, ricavi, F&B, simulazione scenari, impostazioni (edizioni, giorni, categorie). Stack: **Next.js 16**, Supabase (Auth + Postgres), deploy su Vercel.

## Documentazione progetto

| File | Contenuto |
|------|-------------|
| [docs/INDEX.md](docs/INDEX.md) | Struttura repo, moduli, design system |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Log delle modifiche |
| [docs/PRD.md](docs/PRD.md) | Requisiti di prodotto |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Modello dati |

## Sviluppo

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Variabili ambiente in `.env.local` (vedi Supabase).

## Script

- `npm run dev` — server di sviluppo
- `npm run build` — build di produzione
- `npm run lint` — ESLint
