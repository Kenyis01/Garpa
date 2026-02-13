import { supabase } from '@/lib';
import type { Expense } from '@/types';

/** Obtiene todos los gastos de un grupo. */
export async function getGroupExpenses(groupId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Expense[];
}

type CreateExpenseInput = Pick<Expense, 'group_id' | 'description' | 'amount' | 'currency' | 'split_type'> & {
  created_by: string;
};

/** Crea un nuevo gasto en un grupo. */
export async function createExpense(input: CreateExpenseInput) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      group_id: input.group_id,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      split_type: input.split_type,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

