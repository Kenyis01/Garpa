import { supabase } from '@/lib';
import type { Expense } from '@/types';

/** Obtiene todos los gastos de un grupo. */
export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type CreateExpenseInput = Pick<
  Expense,
  'group_id' | 'description' | 'amount' | 'currency_code' | 'payer_id' | 'category'
>;

/** Crea un nuevo gasto en un grupo. */
export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      group_id: input.group_id,
      description: input.description,
      amount: input.amount,
      currency_code: input.currency_code,
      payer_id: input.payer_id,
      category: input.category,
      date: new Date().toISOString().split('T')[0],
      receipt_url: null,
      notes: null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Expense not created');
  return data;
}
