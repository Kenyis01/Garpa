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

/**
 * Get all accepted friends with their current balances.
 * Uses 5 queries total regardless of friend count (no N+1).
 */
export async function getFriendsWithBalances(userId: string): Promise<FriendWithBalance[]> {
  const { data: friendships, error: fErr } = await supabase
    .from('friendships')
    .select('id, user_id_1, user_id_2')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .eq('status', 'accepted');

  if (fErr) throw fErr;
  if (!friendships?.length) return [];

  const friendIds = friendships.map((f) => (f.user_id_1 === userId ? f.user_id_2 : f.user_id_1));

  // Fetch profiles and all relevant splits in parallel
  const [profilesRes, mySplitsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', friendIds),
    supabase.from('expense_splits').select('expense_id, amount').eq('user_id', userId),
  ]);

  if (!mySplitsRes.data?.length) {
    return friendships.map((f) => {
      const friendId = f.user_id_1 === userId ? f.user_id_2 : f.user_id_1;
      const profile = profilesRes.data?.find((p) => p.id === friendId);
      return {
        friendshipId: f.id,
        id: friendId,
        name: profile?.full_name ?? profile?.email ?? 'Unknown',
        email: profile?.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        balance: 0,
      };
    });
  }

  const myExpenseIds = mySplitsRes.data.map((s) => s.expense_id);

  // Get all friend splits for the same expenses (bulk, not per-friend)
  const [friendSplitsRes, expensesRes] = await Promise.all([
    supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount')
      .in('user_id', friendIds)
      .in('expense_id', myExpenseIds),
    supabase
      .from('expenses')
      .select('id, payer_id, group_id')
      .in('id', myExpenseIds)
      .is('group_id', null)
      .eq('is_settlement', false),
  ]);

  const directExpenses = expensesRes.data ?? [];
  const friendSplits = friendSplitsRes.data ?? [];
  const mySplitsMap = new Map(mySplitsRes.data.map((s) => [s.expense_id, s.amount]));

  // Compute per-friend balances in a single pass
  const balanceMap = new Map<string, number>(friendIds.map((id) => [id, 0]));

  for (const expense of directExpenses) {
    const myShare = mySplitsMap.get(expense.id) ?? 0;
    for (const fs of friendSplits) {
      if (fs.expense_id !== expense.id) continue;
      const friendId = fs.user_id;
      if (!balanceMap.has(friendId)) continue;

      if (expense.payer_id === userId) {
        balanceMap.set(friendId, (balanceMap.get(friendId) ?? 0) + fs.amount);
      } else if (expense.payer_id === friendId) {
        balanceMap.set(friendId, (balanceMap.get(friendId) ?? 0) - myShare);
      }
    }
  }

  return friendships.map((f) => {
    const friendId = f.user_id_1 === userId ? f.user_id_2 : f.user_id_1;
    const profile = profilesRes.data?.find((p) => p.id === friendId);
    return {
      friendshipId: f.id,
      id: friendId,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
      email: profile?.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      balance: balanceMap.get(friendId) ?? 0,
    };
  });
}

/** Calculate balance between two users (positive = friendId owes userId). */
export async function calcBalance(userId: string, friendId: string): Promise<number> {
  const { data: mySplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', userId);

  if (!mySplits?.length) return 0;

  const myExpenseIds = mySplits.map((s) => s.expense_id);

  const [friendSplitsRes, expensesRes] = await Promise.all([
    supabase
      .from('expense_splits')
      .select('expense_id, amount')
      .eq('user_id', friendId)
      .in('expense_id', myExpenseIds),
    supabase
      .from('expenses')
      .select('id, payer_id')
      .in('id', myExpenseIds)
      .is('group_id', null)
      .eq('is_settlement', false),
  ]);

  if (!friendSplitsRes.data?.length || !expensesRes.data?.length) return 0;

  const friendSplitsMap = new Map(friendSplitsRes.data.map((s) => [s.expense_id, s.amount]));
  const mySplitsMap = new Map(mySplits.map((s) => [s.expense_id, s.amount]));

  let balance = 0;
  for (const expense of expensesRes.data) {
    const myShare = mySplitsMap.get(expense.id) ?? 0;
    const friendShare = friendSplitsMap.get(expense.id);
    if (friendShare === undefined) continue;

    if (expense.payer_id === userId) {
      balance += friendShare;
    } else if (expense.payer_id === friendId) {
      balance -= myShare;
    }
  }

  return balance;
}

/** Create a friendship (accepted immediately, like Splitwise). */
export async function addFriend(userId: string, friendId: string): Promise<void> {
  if (userId === friendId) throw new Error('You cannot add yourself as a friend.');

  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_id_1.eq.${userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${userId})`,
    )
    .maybeSingle();

  if (existing) return;

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
  const [mySplitsRes, friendSplitsRes] = await Promise.all([
    supabase.from('expense_splits').select('expense_id, amount').eq('user_id', userId),
    supabase.from('expense_splits').select('expense_id, amount').eq('user_id', friendId),
  ]);

  if (!mySplitsRes.data?.length || !friendSplitsRes.data?.length) return [];

  const myIds = new Set(mySplitsRes.data.map((s) => s.expense_id));
  const sharedIds = friendSplitsRes.data
    .filter((s) => myIds.has(s.expense_id))
    .map((s) => s.expense_id);

  if (!sharedIds.length) return [];

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .in('id', sharedIds)
    .is('group_id', null)
    .order('date', { ascending: false });

  if (!expenses?.length) return [];

  const mySplitsMap = new Map(mySplitsRes.data.map((s) => [s.expense_id, s.amount]));
  const friendSplitsMap = new Map(friendSplitsRes.data.map((s) => [s.expense_id, s.amount]));

  return expenses.map((expense) => ({
    ...expense,
    myShare: mySplitsMap.get(expense.id) ?? 0,
    friendShare: friendSplitsMap.get(expense.id) ?? 0,
  }));
}

/** Get full expense detail with participant splits and profiles. */
export async function getExpenseDetail(expenseId: string): Promise<ExpenseDetail | null> {
  const [expenseRes, splitsRes] = await Promise.all([
    supabase.from('expenses').select('*').eq('id', expenseId).single(),
    supabase.from('expense_splits').select('user_id, amount').eq('expense_id', expenseId),
  ]);

  if (!expenseRes.data) return null;
  const expense = expenseRes.data;
  const splits = splitsRes.data ?? [];

  const userIds = splits.map((s) => s.user_id);
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
    is_settlement: expense.is_settlement,
    splits: splits.map((s) => {
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

/** Delete an expense — RLS ensures only the payer can delete. */
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

  // Verify the current session user is involved in this settlement
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.id !== payerId && user.id !== receiverId)) {
    throw new Error('Unauthorized: you are not part of this settlement.');
  }

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
      recurrence: 'never',
    } as any)
    .select()
    .single();

  if (expenseError) throw expenseError;

  const { error: splitsError } = await supabase.from('expense_splits').insert([
    { expense_id: expense.id, user_id: payerId, amount: 0 },
    { expense_id: expense.id, user_id: receiverId, amount },
  ]);

  if (splitsError) throw splitsError;
}
