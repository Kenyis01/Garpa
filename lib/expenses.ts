import { supabase } from '@/lib/supabase';

export async function createExpenseBetweenFriends(params: {
  payerId: string;
  friendId: string;
  amount: number;
  description: string;
  category?: string;
  date?: string;
  notes?: string;
  myShare?: number;
  friendShare?: number;
  recurrence?: string;
}) {
  const {
    payerId,
    friendId,
    amount,
    description,
    category,
    date,
    notes,
    myShare = amount / 2,
    friendShare = amount / 2,
    recurrence = 'never',
  } = params;

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      payer_id: payerId,
      amount,
      description,
      category: category ?? 'uncategorized',
      date: date ?? new Date().toISOString().split('T')[0],
      currency_code: 'USD',
      group_id: null,
      notes: notes ?? null,
      recurrence: recurrence as any,
      is_settlement: false,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  const { error: splitsError } = await supabase.from('expense_splits').insert([
    { expense_id: expense.id, user_id: payerId, amount: myShare },
    { expense_id: expense.id, user_id: friendId, amount: friendShare },
  ]);

  if (splitsError) throw splitsError;

  return expense;
}
