import AnimatedAmount from '@/components/AnimatedAmount';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/hooks/useAuth';
import {
  calcBalance,
  getExpensesWithFriend,
  removeFriendship,
} from '@/services/friends';
import { categoryIcon } from '@/utils/categories';
import { rowsToCsv, shareCsv } from '@/utils/exportCsv';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  date: string | null;
  payer_id: string;
  category: string | null;
  myShare: number;
  friendShare: number;
};

export default function FriendDetailScreen() {
  const { id, name, friendshipId } = useLocalSearchParams<{
    id: string;
    name: string;
    friendshipId: string;
  }>();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const sections = React.useMemo(() => {
    const map: Record<string, { sortKey: number; items: ExpenseItem[] }> = {};
    for (const e of expenses) {
      const d = e.date ? new Date(e.date) : new Date(0);
      const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { sortKey: d.getFullYear() * 12 + d.getMonth(), items: [] };
      map[key].items.push(e);
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b.sortKey - a.sortKey)
      .map(([title, v]) => ({ title, data: v.items }));
  }, [expenses]);

  const load = useCallback(async () => {
    if (!user || !id) return;
    try {
      const [exps, bal] = await Promise.all([
        getExpensesWithFriend(user.id, id),
        calcBalance(user.id, id),
      ]);
      setExpenses(exps as ExpenseItem[]);
      setBalance(bal);
    } catch (err) {
      console.error('Error loading friend detail:', err);
    }
  }, [user, id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const isSettled = balance === 0;
  const oweText =
    balance > 0
      ? `${name} owes you`
      : balance < 0
      ? `You owe ${name}`
      : 'Settled up';

  function renderExpense({ item, index }: { item: ExpenseItem; index: number }) {
    const iPaid = item.payer_id === user?.id;
    const icon = categoryIcon(item.category);
    const dateStr = item.date
      ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    return (
      <Animated.View entering={FadeInDown.duration(260).delay(index * 25)}>
        <AnimatedPressable
          style={styles.expenseRow}
          onPress={() => router.push({ pathname: '/expense/[id]', params: { id: item.id } })}
        >
          <View style={styles.expenseIcon}>
            <MaterialCommunityIcons name={icon as any} size={22} color="#6b7280" />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <Text style={styles.expenseDate}>{dateStr}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseTotal}>${item.amount.toFixed(2)}</Text>
            <Text style={[styles.expenseShare, { color: iPaid ? '#10b981' : '#6b7280' }]}>
              {iPaid ? `you lent $${item.friendShare.toFixed(2)}` : `you borrowed $${item.myShare.toFixed(2)}`}
            </Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: name ?? 'Friend',
          headerBackTitle: 'Friends',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(name ?? 'Friend', 'Options', [
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
                              e.payer_id === user?.id ? 'You' : (name ?? 'Friend'),
                              e.myShare.toFixed(2),
                            ])
                          );
                          await shareCsv(`expenses-${name ?? 'friend'}.csv`, csv);
                        } catch (err: any) {
                          Alert.alert('Export failed', err.message);
                        }
                      },
                    },
                    {
                      text: 'Remove friend',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert(
                          'Remove friend',
                          `Are you sure you want to remove ${name} as a friend?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await removeFriendship(friendshipId!);
                                  router.back();
                                } catch (e: any) {
                                  Alert.alert('Error', e.message);
                                }
                              },
                            },
                          ]
                        ),
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
                style={{ padding: 8 }}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/add-expense',
                    params: { friendId: id, friendName: name },
                  })
                }
                style={{ marginRight: 4 }}
              >
                <Ionicons name="add" size={28} color="#5BC5A7" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Balance Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{oweText}</Text>
          {!isSettled && (
            <AnimatedAmount
              value={Math.abs(balance)}
              style={[styles.balanceAmount, { color: balance > 0 ? '#10b981' : '#ef4444' }]}
            />
          )}
          {!isSettled && (
            <AnimatedPressable
              style={styles.settleButton}
              onPress={() =>
                router.push({
                  pathname: '/settle-up',
                  params: {
                    friendId: id,
                    friendName: name,
                    balance: balance.toString(),
                  },
                })
              }
            >
              <Text style={styles.settleButtonText}>Settle up</Text>
            </AnimatedPressable>
          )}
        </Animated.View>

        {/* Expenses */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5BC5A7" />
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap + to add your first expense with {name}
                </Text>
              </View>
            }
            contentContainerStyle={expenses.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* FAB */}
        <Animated.View
          entering={FadeIn.duration(400).delay(200)}
          style={styles.fabWrapper}
        >
          <AnimatedPressable
            scaleTo={0.88}
            style={styles.fab}
            onPress={() =>
              router.push({
                pathname: '/add-expense',
                params: { friendId: id, friendName: name },
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
  container: { flex: 1, backgroundColor: '#fff' },
  balanceCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  balanceLabel: { fontSize: 16, color: '#6b7280', marginBottom: 6 },
  balanceAmount: { fontSize: 34, fontWeight: '700', marginBottom: 14 },
  settleButton: {
    backgroundColor: '#5BC5A7',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
  },
  settleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 3 },
  expenseDate: { fontSize: 12, color: '#9ca3af' },
  expenseRight: { alignItems: 'flex-end' },
  expenseTotal: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 3 },
  expenseShare: { fontSize: 12 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginLeft: 68 },
  sectionHeader: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
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
