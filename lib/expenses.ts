import { supabaseClient } from './supabaseClient';

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
    recurrence,
  } = params;

  try {
    const { data: expense, error: expenseError } = await supabaseClient
      .from('expenses')
      .insert({
        payer_id: payerId,
        amount,
        description,
        category: category || 'uncategorized',
        date: date || new Date().toISOString().split('T')[0],
        currency_code: 'USD',
        group_id: null,
        notes: notes || null,
        recurrence: recurrence || 'never',
      })
      .select()
      .single();

    if (expenseError) throw expenseError;
    if (!expense) throw new Error('No se pudo crear el gasto');

    const splits = [
      { expense_id: expense.id, user_id: payerId, amount: myShare },
      { expense_id: expense.id, user_id: friendId, amount: friendShare },
    ];

    const { error: splitsError } = await supabaseClient
      .from('expense_splits')
      .insert(splits);

    if (splitsError) throw splitsError;

    return { success: true, expense };
  } catch (error) {
    console.error('Error creating expense:', error);
    return { success: false, error };
  }
}

export async function getUserExpenses(userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('expense_splits')
      .select('*, expense:expenses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return { success: false, error };
  }
}

export async function getBalanceWithFriend(userId: string, friendId: string) {
  try {
    // CORRECCIÓN 2: Usar alias 'data: myExpenses'
    const { data: myExpenses, error: myError } = await supabaseClient
      .from('expense_splits')
      .select('amount, expense:expenses(id, amount, payer_id)')
      .eq('user_id', userId);

    if (myError) throw myError;

    // CORRECCIÓN 3: Usar alias 'data: friendExpenses'
    const { data: friendExpenses, error: friendError } = await supabaseClient
      .from('expense_splits')
      .select('amount, expense:expenses(id, amount, payer_id)')
      .eq('user_id', friendId);

    if (friendError) throw friendError;

    const myExpenseIds = myExpenses?.map((e: any) => e.expense?.id).filter(Boolean) || [];
    const friendExpenseIds = friendExpenses?.map((e: any) => e.expense?.id).filter(Boolean) || [];
    
    const sharedExpenseIds = new Set(
      myExpenseIds.filter((id: string) => friendExpenseIds.includes(id))
    );

    let balance = 0;

    myExpenses?.forEach((exp: any) => {
      if (exp.expense && sharedExpenseIds.has(exp.expense.id)) {
        if (exp.expense.payer_id === userId) {
          balance += exp.amount;
        } else if (exp.expense.payer_id === friendId) {
          balance -= exp.amount;
        }
      }
    });

    return { success: true, balance };
  } catch (error) {
    console.error('Error calculating balance:', error);
    return { success: false, error, balance: 0 };
  }
}

export async function getExpensesWithFriend(userId: string, friendId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('expenses')
      .select('*, expense_split!inner(user_id, amount)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const sharedExpenses = data?.filter((expense: any) => {
      // Nota: Verifica si Supabase devuelve 'expense_split' (singular) o 'expense_splits' (plural)
      // Depende de cómo esté definida tu foreign key, pero asumo singular por tu query anterior
      const splits = expense.expense_split || []; 
      const userIds = splits.map((split: any) => split.user_id);
      
      const hasBothUsers = userIds.includes(userId) && userIds.includes(friendId);
      const isPayer = expense.payer_id === userId || expense.payer_id === friendId;
      return hasBothUsers && isPayer;
    });

    return { success: true, sharedExpenses };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    // CORRECCIÓN 4: Arreglado el error de sintaxis del array suelto
    return { success: false, error, sharedExpenses: [] };
  }
}