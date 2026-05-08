import type { Expense, ExpenseCategory, ExpenseSplit } from '@/types/database';
import { logError } from '@/lib/logger';
import { supabase } from './supabase';

export type CreateExpenseBetweenFriendsParams = {
  payerId: string;
  friendId: string;
  amount: number;
  description: string;
  category?: ExpenseCategory;
  date?: string;
  currencyCode?: string;
};

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: Error };

type SplitWithExpense = Pick<ExpenseSplit, 'amount'> & {
  expense: Pick<Expense, 'id' | 'amount' | 'payer_id'> | null;
};

type ExpenseWithSplits = Expense & {
  expense_splits: Pick<ExpenseSplit, 'user_id' | 'amount'>[];
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  return new Error('Unknown error');
}

export async function createExpenseBetweenFriends(
  params: CreateExpenseBetweenFriendsParams,
): Promise<ServiceResult<Expense>> {
  const {
    payerId,
    friendId,
    amount,
    description,
    category = 'uncategorized',
    date,
    currencyCode = 'USD',
  } = params;

  try {
    const { data, error } = await supabase.rpc('create_expense_with_splits', {
      p_payer_id: payerId,
      p_friend_id: friendId,
      p_amount: amount,
      p_description: description,
      p_category: category,
      p_currency_code: currencyCode,
      p_date: date ?? new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    if (!data) throw new Error('Expense not created');

    return { success: true, data: data as Expense };
  } catch (err) {
    const error = toError(err);
    logError('createExpenseBetweenFriends', error, { payerId, friendId, amount });
    return { success: false, error };
  }
}

export async function getUserExpenses(userId: string): Promise<ServiceResult<SplitWithExpense[]>> {
  try {
    const { data, error } = await supabase
      .from('expense_splits')
      .select('amount, expense:expenses(id, amount, payer_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: (data ?? []) as unknown as SplitWithExpense[] };
  } catch (err) {
    const error = toError(err);
    logError('getUserExpenses', error, { userId });
    return { success: false, error };
  }
}

export async function getBalanceWithFriend(
  userId: string,
  friendId: string,
): Promise<ServiceResult<number>> {
  try {
    const [mine, theirs] = await Promise.all([
      supabase
        .from('expense_splits')
        .select('amount, expense:expenses(id, amount, payer_id)')
        .eq('user_id', userId),
      supabase
        .from('expense_splits')
        .select('amount, expense:expenses(id, amount, payer_id)')
        .eq('user_id', friendId),
    ]);

    if (mine.error) throw mine.error;
    if (theirs.error) throw theirs.error;

    const myExpenses = (mine.data ?? []) as unknown as SplitWithExpense[];
    const friendExpenses = (theirs.data ?? []) as unknown as SplitWithExpense[];

    const myExpenseIds = new Set(
      myExpenses.map((e) => e.expense?.id).filter((id): id is string => Boolean(id)),
    );
    const friendExpenseIds = new Set(
      friendExpenses.map((e) => e.expense?.id).filter((id): id is string => Boolean(id)),
    );

    const sharedIds = new Set([...myExpenseIds].filter((id) => friendExpenseIds.has(id)));

    let balance = 0;
    for (const split of myExpenses) {
      const exp = split.expense;
      if (!exp || !sharedIds.has(exp.id)) continue;
      if (exp.payer_id === userId) balance += split.amount;
      else if (exp.payer_id === friendId) balance -= split.amount;
    }

    return { success: true, data: balance };
  } catch (err) {
    const error = toError(err);
    logError('getBalanceWithFriend', error, { userId, friendId });
    return { success: false, error };
  }
}

export async function getExpensesWithFriend(
  userId: string,
  friendId: string,
): Promise<ServiceResult<Expense[]>> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_splits!inner(user_id, amount)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as unknown as ExpenseWithSplits[];
    const shared = rows.filter((expense) => {
      const userIds = expense.expense_splits.map((s) => s.user_id);
      const hasBoth = userIds.includes(userId) && userIds.includes(friendId);
      const isPayer = expense.payer_id === userId || expense.payer_id === friendId;
      return hasBoth && isPayer;
    });

    return { success: true, data: shared };
  } catch (err) {
    const error = toError(err);
    logError('getExpensesWithFriend', error, { userId, friendId });
    return { success: false, error };
  }
}
