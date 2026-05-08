import { supabase } from '@/lib/supabase';
import type { Recurrence } from '@/types';

export type CreateExpenseBetweenFriendsParams = {
  payerId: string;
  friendId: string;
  amount: number;
  description: string;
  category?: string;
  date?: string;
  notes?: string;
  myShare?: number;
  friendShare?: number;
  recurrence?: Recurrence;
};

export async function createExpenseBetweenFriends(params: CreateExpenseBetweenFriendsParams) {
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
      recurrence,
      is_settlement: false,
      receipt_url: null,
    })
    .select()
    .single();

  if (expenseError) throw expenseError;
  if (!expense) throw new Error('Expense not created');

  const { error: splitsError } = await supabase.from('expense_splits').insert([
    { expense_id: expense.id, user_id: payerId, amount: myShare },
    { expense_id: expense.id, user_id: friendId, amount: friendShare },
  ]);

  if (splitsError) throw splitsError;

  return expense;
}
