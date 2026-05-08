-- Garpa - Row Level Security
-- Activa RLS en todas las tablas y define políticas mínimas seguras.

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.friendships enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

-- =========================
-- profiles
-- =========================
drop policy if exists "profiles_select_own_or_searchable" on public.profiles;
create policy "profiles_select_own_or_searchable"
  on public.profiles for select
  using (
    auth.uid() = id
    or coalesce(privacy_searchable, true) = true
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================
-- groups
-- =========================
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member"
  on public.groups for select
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "groups_insert_creator" on public.groups;
create policy "groups_insert_creator"
  on public.groups for insert
  with check (auth.uid() = created_by);

drop policy if exists "groups_update_creator" on public.groups;
create policy "groups_update_creator"
  on public.groups for update
  using (auth.uid() = created_by);

drop policy if exists "groups_delete_creator" on public.groups;
create policy "groups_delete_creator"
  on public.groups for delete
  using (auth.uid() = created_by);

-- =========================
-- group_members
-- =========================
drop policy if exists "group_members_select_member" on public.group_members;
create policy "group_members_select_member"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

drop policy if exists "group_members_insert_creator" on public.group_members;
create policy "group_members_insert_creator"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

drop policy if exists "group_members_delete_self_or_creator" on public.group_members;
create policy "group_members_delete_self_or_creator"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- =========================
-- friendships
-- =========================
drop policy if exists "friendships_select_self" on public.friendships;
create policy "friendships_select_self"
  on public.friendships for select
  using (auth.uid() in (user_id_1, user_id_2));

drop policy if exists "friendships_insert_self" on public.friendships;
create policy "friendships_insert_self"
  on public.friendships for insert
  with check (auth.uid() = user_id_1);

drop policy if exists "friendships_update_self" on public.friendships;
create policy "friendships_update_self"
  on public.friendships for update
  using (auth.uid() in (user_id_1, user_id_2));

drop policy if exists "friendships_delete_self" on public.friendships;
create policy "friendships_delete_self"
  on public.friendships for delete
  using (auth.uid() in (user_id_1, user_id_2));

-- =========================
-- expenses
-- =========================
drop policy if exists "expenses_select_participant" on public.expenses;
create policy "expenses_select_participant"
  on public.expenses for select
  using (
    payer_id = auth.uid()
    or exists (
      select 1 from public.expense_splits es
      where es.expense_id = expenses.id and es.user_id = auth.uid()
    )
    or (
      group_id is not null and exists (
        select 1 from public.group_members gm
        where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "expenses_insert_payer" on public.expenses;
create policy "expenses_insert_payer"
  on public.expenses for insert
  with check (auth.uid() = payer_id);

drop policy if exists "expenses_update_payer" on public.expenses;
create policy "expenses_update_payer"
  on public.expenses for update
  using (auth.uid() = payer_id);

drop policy if exists "expenses_delete_payer" on public.expenses;
create policy "expenses_delete_payer"
  on public.expenses for delete
  using (auth.uid() = payer_id);

-- =========================
-- expense_splits
-- =========================
drop policy if exists "expense_splits_select_participant" on public.expense_splits;
create policy "expense_splits_select_participant"
  on public.expense_splits for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and e.payer_id = auth.uid()
    )
  );

drop policy if exists "expense_splits_insert_payer" on public.expense_splits;
create policy "expense_splits_insert_payer"
  on public.expense_splits for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and e.payer_id = auth.uid()
    )
  );

drop policy if exists "expense_splits_delete_payer" on public.expense_splits;
create policy "expense_splits_delete_payer"
  on public.expense_splits for delete
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and e.payer_id = auth.uid()
    )
  );

-- =========================
-- settlements
-- =========================
drop policy if exists "settlements_select_party" on public.settlements;
create policy "settlements_select_party"
  on public.settlements for select
  using (auth.uid() in (payer_id, payee_id));

drop policy if exists "settlements_insert_payer" on public.settlements;
create policy "settlements_insert_payer"
  on public.settlements for insert
  with check (auth.uid() = payer_id);

drop policy if exists "settlements_delete_payer" on public.settlements;
create policy "settlements_delete_payer"
  on public.settlements for delete
  using (auth.uid() = payer_id);
