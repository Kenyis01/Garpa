import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export type FriendWithBalance = {
  friendshipId: string;
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  balance: number; // positive = they owe me, negative = I owe them
};

/** Search existing users by email or name (for adding friends). */
export async function searchUsers(query: string, currentUserId: string): Promise<Profile[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(20);

  if (error) throw error;
  return (data as Profile[]) ?? [];
}

/** Get all accepted friends with their current balances. */
export async function getFriendsWithBalances(userId: string): Promise<FriendWithBalance[]> {
  const { data: friendships, error: fErr } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .eq('status', 'accepted');

  if (fErr) throw fErr;
  if (!friendships?.length) return [];

  const friendIds = friendships.map((f) =>
    f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
  );

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);

  if (pErr) throw pErr;

  // Load all direct (non-group) expense splits involving the current user
  const { data: mySplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount');
  // Filter client-side after fetching related expenses
  // Use a simpler per-friendship balance calc
  const balances = await Promise.all(
    friendIds.map((friendId) => calcBalance(userId, friendId))
  );

  return friendships.map((f, i) => {
    const friendId = f.user_id_1 === userId ? f.user_id_2 : f.user_id_1;
    const profile = profiles?.find((p) => p.id === friendId);
    return {
      friendshipId: f.id,
      id: friendId,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
      email: profile?.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      balance: balances[i],
    };
  });
}

/** Calculate balance between two users (positive = friendId owes userId). */
export async function calcBalance(userId: string, friendId: string): Promise<number> {
  // Get all expenses where both users have splits
  const { data: mySplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', userId);

  if (!mySplits?.length) return 0;

  const myExpenseIds = mySplits.map((s) => s.expense_id);

  const { data: friendSplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', friendId)
    .in('expense_id', myExpenseIds);

  if (!friendSplits?.length) return 0;

  const sharedIds = friendSplits.map((s) => s.expense_id);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, payer_id')
    .in('id', sharedIds)
    .is('group_id', null);

  if (!expenses?.length) return 0;

  let balance = 0;
  for (const expense of expenses) {
    const myShare = mySplits.find((s) => s.expense_id === expense.id)?.amount ?? 0;
    const friendShare = friendSplits.find((s) => s.expense_id === expense.id)?.amount ?? 0;

    if (expense.payer_id === userId) {
      // I paid → friend owes me their share
      balance += friendShare;
    } else if (expense.payer_id === friendId) {
      // Friend paid → I owe them my share
      balance -= myShare;
    }
  }

  return balance;
}

/** Create a friendship (accepted immediately, like Splitwise). */
export async function addFriend(userId: string, friendId: string): Promise<void> {
  // Check if friendship already exists in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_id_1.eq.${userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${userId})`
    )
    .single();

  if (existing) return; // already friends

  const { error } = await supabase.from('friendships').insert({
    user_id_1: userId,
    user_id_2: friendId,
    status: 'accepted',
  });

  if (error) throw error;
}

/** Remove a friendship. */
export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

/** Get expenses shared between two users (for the friend detail screen). */
export async function getExpensesWithFriend(userId: string, friendId: string) {
  const { data: mySplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', userId);

  if (!mySplits?.length) return [];

  const myExpenseIds = mySplits.map((s) => s.expense_id);

  const { data: friendSplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', friendId)
    .in('expense_id', myExpenseIds);

  if (!friendSplits?.length) return [];

  const sharedIds = friendSplits.map((s) => s.expense_id);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .in('id', sharedIds)
    .is('group_id', null)
    .order('date', { ascending: false });

  return (expenses ?? []).map((expense) => {
    const myShare = mySplits.find((s) => s.expense_id === expense.id)?.amount ?? 0;
    const friendShare = friendSplits.find((s) => s.expense_id === expense.id)?.amount ?? 0;
    return { ...expense, myShare, friendShare };
  });
}

export type ExpenseDetail = {
  id: string;
  description: string;
  amount: number;
  currency_code: string | null;
  date: string | null;
  category: string | null;
  notes: string | null;
  receipt_url: string | null;
  payer_id: string;
  group_id: string | null;
  is_settlement: boolean;
  splits: { user_id: string; amount: number; name: string; avatar_url: string | null }[];
};

/** Get full expense detail with participant splits and profiles. */
export async function getExpenseDetail(expenseId: string): Promise<ExpenseDetail | null> {
  const { data: expense } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .single();

  if (!expense) return null;

  const { data: splits } = await supabase
    .from('expense_splits')
    .select('user_id, amount')
    .eq('expense_id', expenseId);

  const userIds = (splits ?? []).map((s) => s.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
    : { data: [] };

  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    currency_code: expense.currency_code,
    date: expense.date,
    category: expense.category,
    notes: expense.notes,
    receipt_url: expense.receipt_url,
    payer_id: expense.payer_id,
    group_id: expense.group_id,
    is_settlement: (expense as any).is_settlement ?? false,
    splits: (splits ?? []).map((s) => {
      const p = profiles?.find((pr) => pr.id === s.user_id);
      return {
        user_id: s.user_id,
        amount: s.amount,
        name: p?.full_name ?? p?.email ?? 'Unknown',
        avatar_url: p?.avatar_url ?? null,
      };
    }),
  };
}

/** Delete an expense and its splits. */
export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

/** Record a settlement payment between two users. */
export async function recordSettlement(params: {
  payerId: string;
  receiverId: string;
  amount: number;
  note?: string;
}): Promise<void> {
  const { payerId, receiverId, amount, note } = params;

  // Create an expense with a special settlement category
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      payer_id: payerId,
      amount,
      description: note || 'Settlement payment',
      category: 'uncategorized',
      date: new Date().toISOString().split('T')[0],
      currency_code: 'USD',
      group_id: null,
      is_settlement: true,
    } as any)
    .select()
    .single();

  if (expenseError) throw expenseError;

  // Payer owes 0, receiver gets credited full amount
  const { error: splitsError } = await supabase.from('expense_splits').insert([
    { expense_id: expense.id, user_id: payerId, amount: 0 },
    { expense_id: expense.id, user_id: receiverId, amount },
  ]);

  if (splitsError) throw splitsError;
}
