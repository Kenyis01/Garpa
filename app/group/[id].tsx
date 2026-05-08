import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/hooks/useAuth';
import type { GroupExpense, GroupMemberWithProfile } from '@/services/groups';
import {
  getGroupExpenses,
  getGroupMembers,
  getGroupNetPositions,
  leaveGroup,
} from '@/services/groups';
import { categoryIcon } from '@/utils/categories';
import { rowsToCsv, shareCsv } from '@/utils/exportCsv';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

type Tab = 'expenses' | 'balances';
type SimplifiedDebt = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
};

/**
 * Simplify a group's debts using a greedy algorithm on absolute net positions.
 * Net position per user is computed independently from raw expenses (paid - owed).
 * Givers (net > 0) are people owed money; receivers (net < 0) owe money.
 */
function simplifyDebts(
  netPositions: Record<string, number>,
  nameLookup: Record<string, string>,
): SimplifiedDebt[] {
  const givers = Object.entries(netPositions)
    .filter(([, v]) => v > 0.005)
    .map(([id, v]) => ({ id, name: nameLookup[id] ?? 'Unknown', amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const receivers = Object.entries(netPositions)
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => ({ id, name: nameLookup[id] ?? 'Unknown', amount: -v }))
    .sort((a, b) => b.amount - a.amount);

  const result: SimplifiedDebt[] = [];
  let gi = 0;
  let ri = 0;
  while (gi < givers.length && ri < receivers.length) {
    const giver = givers[gi];
    const receiver = receivers[ri];
    const transfer = Math.min(giver.amount, receiver.amount);
    if (transfer > 0.005) {
      result.push({
        from: receiver.id,
        fromName: receiver.name,
        to: giver.id,
        toName: giver.name,
        amount: transfer,
      });
    }
    giver.amount -= transfer;
    receiver.amount -= transfer;
    if (giver.amount < 0.005) gi++;
    if (receiver.amount < 0.005) ri++;
  }
  return result;
}

export default function GroupDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('expenses');
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [netPositions, setNetPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simplify, setSimplify] = useState(false);

  const load = useCallback(async () => {
    if (!user || !id) return;
    try {
      const [exps, mems, net] = await Promise.all([
        getGroupExpenses(id, user.id),
        getGroupMembers(id, user.id),
        getGroupNetPositions(id),
      ]);
      setExpenses(exps);
      setMembers(mems);
      setNetPositions(net);
    } catch (err) {
      console.error('Error loading group:', err);
    }
  }, [user, id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleLeave() {
    Alert.alert('Leave group', `Are you sure you want to leave "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup(id!, user!.id);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  function renderExpense({ item }: { item: GroupExpense }) {
    const icon = categoryIcon(item.category);
    const dateStr = item.date
      ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';

    return (
      <AnimatedPressable
        style={styles.expenseRow}
        onPress={() => router.push({ pathname: '/expense/[id]', params: { id: item.id } })}
      >
        <View style={styles.expenseIcon}>
          <MaterialCommunityIcons name={icon as any} size={20} color="#6b7280" />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseName}>{item.description}</Text>
          <Text style={styles.expenseMeta}>
            {item.i_paid ? 'You paid' : `${item.payer_name} paid`} · {dateStr}
          </Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseTotal}>${item.amount.toFixed(2)}</Text>
          <Text style={[styles.expenseShare, { color: item.i_paid ? '#10b981' : '#6b7280' }]}>
            {item.i_paid
              ? `you lent $${(item.amount - item.my_share).toFixed(2)}`
              : `you owe $${item.my_share.toFixed(2)}`}
          </Text>
        </View>
      </AnimatedPressable>
    );
  }

  function renderMember({ item }: { item: GroupMemberWithProfile }) {
    if (!item.profile) return null;
    const isMe = item.user_id === user?.id;
    const name = item.profile.full_name ?? item.profile.email ?? 'Unknown';
    const initial = name.charAt(0).toUpperCase();

    return (
      <View style={styles.memberRow}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>{initial}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {name}
            {isMe ? ' (you)' : ''}
          </Text>
          {!isMe && item.balance !== 0 && (
            <Text
              style={[styles.memberBalance, { color: item.balance > 0 ? '#10b981' : '#ef4444' }]}
            >
              {item.balance > 0
                ? `owes you $${item.balance.toFixed(2)}`
                : `you owe $${Math.abs(item.balance).toFixed(2)}`}
            </Text>
          )}
          {(isMe || item.balance === 0) && <Text style={styles.settledText}>settled up</Text>}
        </View>
        {!isMe && item.balance !== 0 && (
          <TouchableOpacity
            style={styles.settleBtn}
            onPress={() =>
              router.push({
                pathname: '/settle-up',
                params: {
                  friendId: item.user_id,
                  friendName: name,
                  balance: item.balance.toString(),
                },
              })
            }
          >
            <Text style={styles.settleBtnText}>Settle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: name ?? 'Group',
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(name ?? 'Group', 'Group options', [
                  {
                    text: 'Export as CSV',
                    onPress: async () => {
                      try {
                        const csv = rowsToCsv(
                          ['Date', 'Description', 'Amount', 'Paid by', 'Your share'],
                          expenses.map((e) => [
                            e.date ?? '',
                            e.description,
                            e.amount.toFixed(2),
                            e.i_paid ? 'You' : e.payer_name,
                            e.my_share.toFixed(2),
                          ]),
                        );
                        await shareCsv(`group-${name ?? 'expenses'}.csv`, csv);
                      } catch (err: any) {
                        Alert.alert('Export failed', err.message);
                      }
                    },
                  },
                  {
                    text: 'Leave group',
                    style: 'destructive',
                    onPress: handleLeave,
                  },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
              style={{ padding: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#555" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'expenses' && styles.tabActive]}
            onPress={() => setTab('expenses')}
          >
            <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'balances' && styles.tabActive]}
            onPress={() => setTab('balances')}
          >
            <Text style={[styles.tabText, tab === 'balances' && styles.tabTextActive]}>
              Balances
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5BC5A7" />
          </View>
        ) : tab === 'expenses' ? (
          <FlatList
            data={expenses}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(260).delay(index * 25)}>
                {renderExpense({ item })}
              </Animated.View>
            )}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={expenses.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
            ListEmptyComponent={
              <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Tap + to add the first group expense</Text>
              </Animated.View>
            }
          />
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Simplify toggle */}
            <TouchableOpacity style={styles.simplifyRow} onPress={() => setSimplify((v) => !v)}>
              <View style={[styles.simplifyToggle, simplify && styles.simplifyToggleOn]}>
                <View style={[styles.simplifyThumb, simplify && styles.simplifyThumbOn]} />
              </View>
              <Text style={styles.simplifyLabel}>Simplify debts</Text>
              <Text style={styles.simplifyDesc}>
                {simplify ? 'Showing minimized transactions' : 'Show fewest transactions'}
              </Text>
            </TouchableOpacity>
            <View style={styles.separator} />

            {simplify
              ? (() => {
                  const nameLookup: Record<string, string> = {};
                  for (const m of members) {
                    nameLookup[m.user_id] = m.profile?.full_name ?? m.profile?.email ?? 'Unknown';
                  }
                  const debts = simplifyDebts(netPositions, nameLookup);
                  if (debts.length === 0) {
                    return (
                      <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                        <Text style={styles.emptyTitle}>All settled up!</Text>
                      </View>
                    );
                  }
                  return debts.map((d, i) => (
                    <View key={i}>
                      <View style={styles.debtRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {d.fromName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {d.fromName} → {d.toName}
                          </Text>
                          <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>
                            owes ${d.amount.toFixed(2)}
                          </Text>
                        </View>
                        {(d.from === user?.id || d.to === user?.id) && (
                          <TouchableOpacity
                            style={styles.settleBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/settle-up',
                                params: {
                                  friendId: d.from === user?.id ? d.to : d.from,
                                  friendName: d.from === user?.id ? d.toName : d.fromName,
                                  balance: (d.from === user?.id ? -d.amount : d.amount).toString(),
                                },
                              })
                            }
                          >
                            <Text style={styles.settleBtnText}>Settle</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.separator} />
                    </View>
                  ));
                })()
              : members.map((m) => (
                  <View key={m.user_id}>
                    {renderMember({ item: m })}
                    <View style={styles.separator} />
                  </View>
                ))}
          </ScrollView>
        )}

        {/* FAB */}
        <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.fabWrapper}>
          <AnimatedPressable
            scaleTo={0.88}
            style={styles.fab}
            onPress={() =>
              router.push({
                pathname: '/add-expense',
                params: { groupId: id, groupName: name },
              })
            }
          >
            <Ionicons name="add" size={28} color="#fff" />
          </AnimatedPressable>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#5BC5A7' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#9ca3af' },
  tabTextActive: { color: '#5BC5A7', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  expenseIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 3 },
  expenseMeta: { fontSize: 12, color: '#9ca3af' },
  expenseRight: { alignItems: 'flex-end' },
  expenseTotal: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 3 },
  expenseShare: { fontSize: 12 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberAvatarText: { fontSize: 18, fontWeight: '600', color: '#4b5563' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '500', color: '#111', marginBottom: 2 },
  memberBalance: { fontSize: 13, fontWeight: '600' },
  settledText: { fontSize: 12, color: '#9ca3af' },
  settleBtn: {
    borderWidth: 1,
    borderColor: '#5BC5A7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settleBtnText: { color: '#5BC5A7', fontWeight: '600', fontSize: 13 },
  simplifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  simplifyToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  simplifyToggleOn: { backgroundColor: '#5BC5A7' },
  simplifyThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  simplifyThumbOn: { alignSelf: 'flex-end' },
  simplifyLabel: { fontSize: 15, fontWeight: '600', color: '#111' },
  simplifyDesc: { flex: 1, fontSize: 12, color: '#9ca3af', textAlign: 'right' },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginLeft: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  fabWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5BC5A7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
