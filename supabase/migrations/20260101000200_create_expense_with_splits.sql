-- Garpa - RPC atómica para crear gasto + splits entre dos amigos.
-- Garantiza atomicidad: o se crean ambos lados del split, o nada.

create or replace function public.create_expense_with_splits(
  p_payer_id uuid,
  p_friend_id uuid,
  p_amount numeric,
  p_description text,
  p_category text,
  p_currency_code text,
  p_date date
)
returns public.expenses
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expense public.expenses;
  v_split numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if auth.uid() <> p_payer_id then
    raise exception 'payer must be the authenticated user' using errcode = '42501';
  end if;
  if p_payer_id = p_friend_id then
    raise exception 'payer and friend must differ' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive' using errcode = '22023';
  end if;

  insert into public.expenses (
    group_id, payer_id, amount, description, category, currency_code, date
  ) values (
    null, p_payer_id, p_amount, p_description, coalesce(p_category, 'uncategorized'),
    coalesce(p_currency_code, 'USD'), coalesce(p_date, current_date)
  )
  returning * into v_expense;

  v_split := round(p_amount / 2.0, 2);

  insert into public.expense_splits (expense_id, user_id, amount)
  values
    (v_expense.id, p_payer_id, v_split),
    (v_expense.id, p_friend_id, p_amount - v_split);

  return v_expense;
end;
$$;

revoke all on function public.create_expense_with_splits(
  uuid, uuid, numeric, text, text, text, date
) from public;

grant execute on function public.create_expense_with_splits(
  uuid, uuid, numeric, text, text, text, date
) to authenticated;
