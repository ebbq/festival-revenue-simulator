# Data Model — EBBQ Festival Management System

**Versione**: 1.2
**Ultimo aggiornamento**: 2026-04-08
**Stato**: Applicato su Supabase (richiede migration 002)

---

## Diagramma relazioni

```
editions ──< festival_days
editions ──< expenses
editions ──< revenues
editions ──< scenarios
editions ──< fb_operators

expense_categories (albero 3 livelli, self-referencing)
  └── expenses ──< expense_revisions
                ──< expense_payments
                ──< expense_day_assignments

fb_operators ──< fb_actuals

scenarios (snapshot di simulazione)

profiles (estende auth.users con ruolo)
```

---

## Tabelle

### `profiles`
Estende `auth.users` di Supabase. Creato automaticamente via trigger su signup.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | = auth.users.id |
| email | text | |
| full_name | text | |
| role | text | 'admin' / 'editor' / 'viewer' |
| created_at | timestamptz | |

---

### `editions`
Le edizioni del festival (2023, 2024, 2025, 2026...).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| year | int | Unico |
| name | text | Es. "EBBQ 2026" |
| is_current | boolean | Una sola attiva |
| show_edition_comparison | boolean | Default false. Mostra confronto con edizione precedente |
| created_at | timestamptz | |

---

### `festival_days`
I giorni di ogni edizione. Configurabili dall'Admin.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | |
| label | text | Es. "Giorno 1", "Venerdì" |
| date | date | La data effettiva |
| sort_order | int | Per ordinamento |

---

### `expense_categories`
Albero gerarchico a 3 livelli (self-referencing).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | Categorie per edizione |
| parent_id | uuid FK → expense_categories | NULL = livello 1 |
| name | text | |
| level | int | 1, 2, o 3 |
| sort_order | int | |

---

### `expenses`
Singola voce di spesa. L'importo corrente è l'ultima revisione.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | |
| category_id | uuid FK → expense_categories | |
| description | text | Nullable. Vuoto = budget da allocare |
| is_budget | boolean | Default false. True = budget, false = spesa allocata |
| supplier | text | Fornitore (opzionale) |
| supplier_ref | text | Riferimento fornitore (opzionale) |
| vat_applicable | boolean | Default false — true se IVA dovuta |
| vat_rate | numeric(5,2) | Aliquota IVA (es. 22.00 = 22%). NULL se vat_applicable = false |
| is_fully_paid | boolean | Default false |
| paid_at | date | Data pagamento completo |
| notes | text | |
| is_festival_wide | boolean | true = non assegnata a giorni specifici |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### `expense_day_assignments`
Collega una spesa a uno o più giorni (many-to-many).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| expense_id | uuid FK → expenses | |
| festival_day_id | uuid FK → festival_days | |

---

### `expense_revisions`
Storico stanziamenti per ogni spesa. L'ultima revisione = importo corrente.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| expense_id | uuid FK → expenses | |
| amount | numeric(12,2) | Importo stanziato a questa data |
| note | text | Motivo revisione |
| created_at | timestamptz | = data della revisione |

---

### `expense_payments`
Pagamenti (anticipi e saldi) per ogni spesa.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| expense_id | uuid FK → expenses | |
| amount | numeric(12,2) | Importo pagato |
| paid_at | date | Data pagamento |
| is_advance | boolean | true = anticipo, false = saldo |
| note | text | |
| created_at | timestamptz | |

---

### `revenues`
Voci di ricavo (escluso F&B, che ha il suo modulo).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | |
| category | text | 'sponsor' / 'grants' / 'merch' / 'other' |
| description | text | |
| amount | numeric(12,2) | |
| status | text | 'confirmed' / 'potential' |
| expected_date | date | Data incasso prevista |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### `fb_operators`
Operatori F&B per ogni edizione.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | |
| name | text | Nome operatore |
| type | text | 'fixed_fee' / 'percentage' / 'internal' |
| fixed_fee | numeric(12,2) | Solo per type = fixed_fee |
| percentage | numeric(5,2) | Solo per type = percentage (es. 15.00 = 15%) |
| estimated_avg_spend_per_person | numeric(8,2) | €/testa stimato (per simulatore) |
| estimated_conversion_rate | numeric(5,2) | % di persone che compra (es. 30.00 = 30%) |
| notes | text | |
| created_at | timestamptz | |

---

### `fb_actuals`
Consuntivo per operatori F&B (post-evento o in tempo reale).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| fb_operator_id | uuid FK → fb_operators | |
| actual_revenue | numeric(12,2) | Fatturato reale operatore |
| actual_cost | numeric(12,2) | Costo reale (solo per type = internal) |
| actual_fee_paid | numeric(12,2) | Fee/% effettivamente pagata a EBBQ |
| notes | text | |
| created_at | timestamptz | |

---

### `scenarios`
Scenari di simulazione salvati.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | |
| name | text | Es. "Pessimistico — 2000 persone" |
| attendance_per_day | jsonb | Es. {"day_1": 1000, "day_2": 1500, "day_3": 800} |
| total_attendance | int | Calcolato o inserito |
| calculated_total_costs | numeric(12,2) | Snapshot al momento del salvataggio |
| calculated_total_revenues | numeric(12,2) | |
| calculated_margin | numeric(12,2) | |
| notes | text | |
| created_at | timestamptz | |

---

### `edition_history`
KPI aggregati per edizioni storiche (import semplificato).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| edition_id | uuid FK → editions | |
| total_attendance | int | |
| total_costs | numeric(12,2) | |
| total_revenues | numeric(12,2) | |
| margin | numeric(12,2) | |
| costs_by_category | jsonb | Es. {"produzione": 5000, "artisti": 8000} |
| revenues_by_category | jsonb | |
| notes | text | |

---

## Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato. Le policy:

- **Admin**: lettura e scrittura su tutto
- **Editor**: lettura e scrittura su expenses, revenues, fb_operators, fb_actuals, scenarios
- **Viewer**: sola lettura su tutto (esclusi profiles)
- Tutti i dati sono filtrati per `edition_id` dove applicabile
