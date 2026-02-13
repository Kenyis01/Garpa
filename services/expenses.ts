import { supabaseClient } from '@/lib/supabaseClient'; // <--- CORREGIDO: Importamos el nombre real
import type { Expense } from '@/types';

/** Obtiene todos los gastos de un grupo. */
export async function getGroupExpenses(groupId: string) {
  // Usamos supabaseClient en lugar de supabase
  const { data, error } = await supabaseClient 
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Expense[];
}

// Definimos el input alineado con tu base de datos
type CreateExpenseInput = Pick<Expense, 'group_id' | 'description' | 'amount' | 'currency_code' | 'payer_id' | 'category'>;

/** Crea un nuevo gasto en un grupo. */
export async function createExpense(input: CreateExpenseInput) {
  const { data, error } = await supabaseClient
    .from('expenses')
    .insert({
      group_id: input.group_id,
      description: input.description,
      amount: input.amount,
      currency_code: input.currency_code,
      payer_id: input.payer_id,
      category: input.category,
      date: new Date().toISOString(), // Fecha automática
      
      // --- CAMPOS OBLIGATORIOS POR TYPESCRIPT (aunque sean null en DB) ---
      receipt_url: null, 
      notes: null 
      // -------------------------------------------------------------------
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}