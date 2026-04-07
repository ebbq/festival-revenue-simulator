-- EBBQ Festival Management System — Initial Schema
-- Version: 1.0
-- Date: 2026-04-07

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'viewer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. EDITIONS
-- ============================================
create table public.editions (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  name text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.editions enable row level security;

-- ============================================
-- 3. FESTIVAL DAYS
-- ============================================
create table public.festival_days (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  label text not null,
  date date not null,
  sort_order int not null default 0
);

alter table public.festival_days enable row level security;

-- ============================================
-- 4. EXPENSE CATEGORIES (3-level tree)
-- ============================================
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  parent_id uuid references public.expense_categories(id) on delete restrict,
  name text not null,
  level int not null check (level between 1 and 3),
  sort_order int not null default 0
);

alter table public.expense_categories enable row level security;

-- ============================================
-- 5. EXPENSES
-- ============================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  description text not null,
  supplier text,
  supplier_ref text,
  vat_applicable boolean not null default false,
  vat_rate numeric(5,2),
  is_fully_paid boolean not null default false,
  paid_at date,
  is_festival_wide boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

-- ============================================
-- 6. EXPENSE DAY ASSIGNMENTS (many-to-many)
-- ============================================
create table public.expense_day_assignments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  festival_day_id uuid not null references public.festival_days(id) on delete cascade,
  unique (expense_id, festival_day_id)
);

alter table public.expense_day_assignments enable row level security;

-- ============================================
-- 7. EXPENSE REVISIONS (budget history)
-- ============================================
create table public.expense_revisions (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.expense_revisions enable row level security;

-- ============================================
-- 8. EXPENSE PAYMENTS (advances & balances)
-- ============================================
create table public.expense_payments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  amount numeric(12,2) not null,
  paid_at date not null,
  is_advance boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.expense_payments enable row level security;

-- ============================================
-- 9. REVENUES
-- ============================================
create table public.revenues (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  category text not null check (category in ('sponsor', 'grants', 'merch', 'other')),
  description text not null,
  amount numeric(12,2) not null,
  status text not null default 'potential' check (status in ('confirmed', 'potential')),
  expected_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenues enable row level security;

-- ============================================
-- 10. F&B OPERATORS
-- ============================================
create table public.fb_operators (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  name text not null,
  type text not null check (type in ('fixed_fee', 'percentage', 'internal')),
  fixed_fee numeric(12,2),
  percentage numeric(5,2),
  estimated_avg_spend_per_person numeric(8,2),
  estimated_conversion_rate numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.fb_operators enable row level security;

-- ============================================
-- 11. F&B ACTUALS (consuntivo)
-- ============================================
create table public.fb_actuals (
  id uuid primary key default gen_random_uuid(),
  fb_operator_id uuid not null references public.fb_operators(id) on delete cascade,
  actual_revenue numeric(12,2),
  actual_cost numeric(12,2),
  actual_fee_paid numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.fb_actuals enable row level security;

-- ============================================
-- 12. SCENARIOS
-- ============================================
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  name text not null,
  attendance_per_day jsonb,
  total_attendance int not null,
  calculated_total_costs numeric(12,2),
  calculated_total_revenues numeric(12,2),
  calculated_margin numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.scenarios enable row level security;

-- ============================================
-- 13. EDITION HISTORY (historical KPIs)
-- ============================================
create table public.edition_history (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade unique,
  total_attendance int,
  total_costs numeric(12,2),
  total_revenues numeric(12,2),
  margin numeric(12,2),
  costs_by_category jsonb,
  revenues_by_category jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.edition_history enable row level security;

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create trigger revenues_updated_at
  before update on public.revenues
  for each row execute function public.set_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Profiles: users can read all, update own (except role), admin can update anyone
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid() and public.get_user_role() != 'admin');
create policy "profiles_admin_update" on public.profiles for update to authenticated using (public.get_user_role() = 'admin');

-- Prevent non-admin users from changing their own role
create or replace function public.protect_role_change()
returns trigger as $$
begin
  if old.id = auth.uid() and public.get_user_role() != 'admin' and old.role is distinct from new.role then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_update
  before update on public.profiles
  for each row execute function public.protect_role_change();

-- For all data tables: admin & editor can read/write, viewer can read
-- Macro pattern applied to each table:

-- EDITIONS
create policy "editions_select" on public.editions for select to authenticated using (true);
create policy "editions_insert" on public.editions for insert to authenticated with check (public.get_user_role() in ('admin'));
create policy "editions_update" on public.editions for update to authenticated using (public.get_user_role() in ('admin'));
create policy "editions_delete" on public.editions for delete to authenticated using (public.get_user_role() in ('admin'));

-- FESTIVAL DAYS
create policy "festival_days_select" on public.festival_days for select to authenticated using (true);
create policy "festival_days_insert" on public.festival_days for insert to authenticated with check (public.get_user_role() in ('admin'));
create policy "festival_days_update" on public.festival_days for update to authenticated using (public.get_user_role() in ('admin'));
create policy "festival_days_delete" on public.festival_days for delete to authenticated using (public.get_user_role() in ('admin'));

-- EXPENSE CATEGORIES
create policy "expense_categories_select" on public.expense_categories for select to authenticated using (true);
create policy "expense_categories_insert" on public.expense_categories for insert to authenticated with check (public.get_user_role() in ('admin'));
create policy "expense_categories_update" on public.expense_categories for update to authenticated using (public.get_user_role() in ('admin'));
create policy "expense_categories_delete" on public.expense_categories for delete to authenticated using (public.get_user_role() in ('admin'));

-- EXPENSES (admin + editor)
create policy "expenses_select" on public.expenses for select to authenticated using (true);
create policy "expenses_insert" on public.expenses for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "expenses_update" on public.expenses for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "expenses_delete" on public.expenses for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- EXPENSE DAY ASSIGNMENTS
create policy "expense_day_assignments_select" on public.expense_day_assignments for select to authenticated using (true);
create policy "expense_day_assignments_insert" on public.expense_day_assignments for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "expense_day_assignments_update" on public.expense_day_assignments for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "expense_day_assignments_delete" on public.expense_day_assignments for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- EXPENSE REVISIONS
create policy "expense_revisions_select" on public.expense_revisions for select to authenticated using (true);
create policy "expense_revisions_insert" on public.expense_revisions for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "expense_revisions_update" on public.expense_revisions for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "expense_revisions_delete" on public.expense_revisions for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- EXPENSE PAYMENTS
create policy "expense_payments_select" on public.expense_payments for select to authenticated using (true);
create policy "expense_payments_insert" on public.expense_payments for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "expense_payments_update" on public.expense_payments for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "expense_payments_delete" on public.expense_payments for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- REVENUES
create policy "revenues_select" on public.revenues for select to authenticated using (true);
create policy "revenues_insert" on public.revenues for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "revenues_update" on public.revenues for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "revenues_delete" on public.revenues for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- FB OPERATORS
create policy "fb_operators_select" on public.fb_operators for select to authenticated using (true);
create policy "fb_operators_insert" on public.fb_operators for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "fb_operators_update" on public.fb_operators for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "fb_operators_delete" on public.fb_operators for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- FB ACTUALS
create policy "fb_actuals_select" on public.fb_actuals for select to authenticated using (true);
create policy "fb_actuals_insert" on public.fb_actuals for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "fb_actuals_update" on public.fb_actuals for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "fb_actuals_delete" on public.fb_actuals for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- SCENARIOS
create policy "scenarios_select" on public.scenarios for select to authenticated using (true);
create policy "scenarios_insert" on public.scenarios for insert to authenticated with check (public.get_user_role() in ('admin', 'editor'));
create policy "scenarios_update" on public.scenarios for update to authenticated using (public.get_user_role() in ('admin', 'editor'));
create policy "scenarios_delete" on public.scenarios for delete to authenticated using (public.get_user_role() in ('admin', 'editor'));

-- EDITION HISTORY
create policy "edition_history_select" on public.edition_history for select to authenticated using (true);
create policy "edition_history_insert" on public.edition_history for insert to authenticated with check (public.get_user_role() in ('admin'));
create policy "edition_history_update" on public.edition_history for update to authenticated using (public.get_user_role() in ('admin'));
create policy "edition_history_delete" on public.edition_history for delete to authenticated using (public.get_user_role() in ('admin'));

-- ============================================
-- INDEXES
-- ============================================
create index idx_festival_days_edition on public.festival_days(edition_id);
create index idx_expense_categories_edition on public.expense_categories(edition_id);
create index idx_expense_categories_parent on public.expense_categories(parent_id);
create index idx_expenses_edition on public.expenses(edition_id);
create index idx_expenses_category on public.expenses(category_id);
create index idx_expense_revisions_expense on public.expense_revisions(expense_id);
create index idx_expense_payments_expense on public.expense_payments(expense_id);
create index idx_expense_day_assignments_expense on public.expense_day_assignments(expense_id);
create index idx_revenues_edition on public.revenues(edition_id);
create index idx_fb_operators_edition on public.fb_operators(edition_id);
create index idx_fb_actuals_operator on public.fb_actuals(fb_operator_id);
create index idx_scenarios_edition on public.scenarios(edition_id);
