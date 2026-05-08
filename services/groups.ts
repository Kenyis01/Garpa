import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export type GroupWithMeta = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  memberCount: number;
  myBalance: number; // positive = net owed to me, negative = net I owe
};

export type GroupMemberWithProfile = {
  user_id: string;
  profile: Profile;
  balance: number; // balance with current user within this group
};

export type GroupExpense = {
  id: string;
  description: string;
  amount: number;
  date: string | null;
  payer_id: string;
  category: string | null;
  payer_name: string;
  my_share: number;
  i_paid: boolean;
};

/** Get all groups where the user is a member. */
export async function getUserGroups(userId: string): Promise<GroupWithMeta[]> {
  const { data: memberships, error: mErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (mErr) throw mErr;
  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (gErr) throw gErr;
  if (!groups?.length) return [];

  // Get member counts
  const { data: allMembers } = await supabase
    .from('group_members')
    .select('group_id, user_id')
    .in('group_id', groupIds);

  // Get balances per group
  const balances = await Promise.all(groups.map((g) => calcGroupBalance(userId, g.id)));

  return groups.map((g, i) => ({
    ...g,
    memberCount: allMembers?.filter((m) => m.group_id === g.id).length ?? 0,
    myBalance: balances[i],
  }));
}

/** Compute net position per user for a whole group (positive = owed money, negative = owes money). */
export async function getGroupNetPositions(groupId: string): Promise<Record<string, number>> {
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, payer_id, amount')
    .eq('group_id', groupId);

  if (!expenses?.length) return {};

  const expenseIds = expenses.map((e) => e.id);
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('expense_id, user_id, amount')
    .in('expense_id', expenseIds);

  if (!splits?.length) return {};

  const net: Record<string, number> = {};
  for (const e of expenses) {
    net[e.payer_id] = (net[e.payer_id] ?? 0) + e.amount;
  }
  for (const s of splits) {
    net[s.user_id] = (net[s.user_id] ?? 0) - s.amount;
  }
  return net;
}

/** Calculate net balance for a user in a group. */
export async function calcGroupBalance(userId: string, groupId: string): Promise<number> {
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('amount, expense_id')
    .eq('user_id', userId);

  if (!splits?.length) return 0;

  const expenseIds = splits.map((s) => s.expense_id);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, payer_id, amount')
    .eq('group_id', groupId)
    .in('id', expenseIds);

  if (!expenses?.length) return 0;

  let balance = 0;
  for (const expense of expenses) {
    const myShare = splits.find((s) => s.expense_id === expense.id)?.amount ?? 0;
    if (expense.payer_id === userId) {
      // I paid → others owe me (expense.amount - myShare)
      balance += expense.amount - myShare;
    } else {
      // Someone else paid → I owe my share
      balance -= myShare;
    }
  }
  return balance;
}

/** Create a new group and add creator as first member. */
export async function createGroup(params: {
  name: string;
  description?: string;
  createdBy: string;
  memberIds: string[];
}): Promise<string> {
  const { name, description, createdBy, memberIds } = params;

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name, description: description ?? null, created_by: createdBy } as any)
    .select()
    .single();

  if (gErr) throw gErr;

  const allMembers = Array.from(new Set([createdBy, ...memberIds]));
  const { error: mErr } = await supabase.from('group_members').insert(
    allMembers.map((uid) => ({ group_id: group.id, user_id: uid }))
  );

  if (mErr) throw mErr;
  return group.id;
}

/** Get group members with their profiles and balances. */
export async function getGroupMembers(
  groupId: string,
  currentUserId: string
): Promise<GroupMemberWithProfile[]> {
  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (mErr) throw mErr;
  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  // For each member, calculate balance with current user within this group
  const balances = await Promise.all(
    userIds.map((uid) => (uid === currentUserId ? Promise.resolve(0) : calcPairBalanceInGroup(currentUserId, uid, groupId)))
  );

  return members.map((m, i) => ({
    user_id: m.user_id,
    profile: profiles?.find((p) => p.id === m.user_id) as Profile,
    balance: balances[i],
  }));
}

/** Calculate balance between two users within a specific group. */
async function calcPairBalanceInGroup(userId: string, otherId: string, groupId: string): Promise<number> {
  const { data: mySplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', userId);

  if (!mySplits?.length) return 0;

  const myIds = mySplits.map((s) => s.expense_id);

  const { data: otherSplits } = await supabase
    .from('expense_splits')
    .select('expense_id, amount')
    .eq('user_id', otherId)
    .in('expense_id', myIds);

  if (!otherSplits?.length) return 0;

  const sharedIds = otherSplits.map((s) => s.expense_id);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, payer_id')
    .eq('group_id', groupId)
    .in('id', sharedIds);

  if (!expenses?.length) return 0;

  let balance = 0;
  for (const expense of expenses) {
    const myShare = mySplits.find((s) => s.expense_id === expense.id)?.amount ?? 0;
    const otherShare = otherSplits.find((s) => s.expense_id === expense.id)?.amount ?? 0;
    if (expense.payer_id === userId) {
      balance += otherShare;
    } else if (expense.payer_id === otherId) {
      balance -= myShare;
    }
  }
  return balance;
}

/** Get expenses for a group. */
export async function getGroupExpenses(groupId: string, currentUserId: string): Promise<GroupExpense[]> {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) throw error;
  if (!expenses?.length) return [];

  const payerIds = [...new Set(expenses.map((e) => e.payer_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', payerIds);

  return expenses.map((e) => {
    const splits = (e as any).expense_splits ?? [];
    const myShare = splits.find((s: any) => s.user_id === currentUserId)?.amount ?? 0;
    const payerProfile = profiles?.find((p) => p.id === e.payer_id);

    return {
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      payer_id: e.payer_id,
      category: e.category,
      payer_name: payerProfile?.full_name ?? payerProfile?.email ?? 'Someone',
      my_share: myShare,
      i_paid: e.payer_id === currentUserId,
    };
  });
}

/** Add an expense to a group (split equally among all members). */
export async function createGroupExpense(params: {
  groupId: string;
  payerId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}): Promise<void> {
  const { groupId, payerId, amount, description, category, date } = params;

  // Get all members
  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (mErr) throw mErr;
  if (!members?.length) throw new Error('Group has no members');

  const { data: expense, error: eErr } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      payer_id: payerId,
      amount,
      description,
      category,
      date,
      currency_code: 'USD',
    } as any)
    .select()
    .single();

  if (eErr) throw eErr;

  const sharePerMember = amount / members.length;
  const splits = members.map((m) => ({
    expense_id: expense.id,
    user_id: m.user_id,
    amount: sharePerMember,
  }));

  const { error: sErr } = await supabase.from('expense_splits').insert(splits);
  if (sErr) throw sErr;
}

/** Add a member to a group. */
export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
  if (error) throw error;
}

/** Leave / delete group membership. */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}
