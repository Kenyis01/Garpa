-- Garpa - Esquema inicial
-- Compatible con Supabase (Postgres 15+)

create extension if not exists "pgcrypto";

-- =========================
-- profiles
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  email text,
  phone text,
  currency text default 'USD',
  timezone text,
  language text default 'es',
  privacy_searchable boolean default true,
  updated_at timestamptz default now()
);

-- =========================
-- groups
-- =========================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- =========================
-- friendships
-- =========================
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references public.profiles(id) on delete cascade,
  user_id_2 uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz default now(),
  unique (user_id_1, user_id_2),
  check (user_id_1 <> user_id_2)
);

-- =========================
-- expenses + splits
-- =========================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  description text not null,
  category text default 'uncategorized'
    check (category in ('entertainment','food_drink','home','life','transportation','uncategorized','utilities')),
  currency_code text default 'USD',
  date date,
  receipt_url text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz default now(),
  unique (expense_id, user_id)
);

create index if not exists idx_expense_splits_user on public.expense_splits(user_id);
create index if not exists idx_expense_splits_expense on public.expense_splits(expense_id);
create index if not exists idx_expenses_payer on public.expenses(payer_id);
create index if not exists idx_expenses_group on public.expenses(group_id);

-- =========================
-- settlements (liquidaciones)
-- =========================
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references public.profiles(id) on delete restrict,
  payee_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  currency_code text default 'USD',
  note text,
  created_at timestamptz default now(),
  check (payer_id <> payee_id)
);

create index if not exists idx_settlements_payer on public.settlements(payer_id);
create index if not exists idx_settlements_payee on public.settlements(payee_id);
