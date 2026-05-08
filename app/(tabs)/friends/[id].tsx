import { useAuth } from '@/hooks/useAuth';
import {
  calcBalance,
  getExpensesWithFriend,
} from '@/services/friends';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

const CATEGORY_ICONS: Record<string, string> = {
  food_drink: 'food-fork-drink',
  entertainment: 'movie-open',
  home: 'home',
  transportation: 'car',
  utilities: 'lightning-bolt',
  life: 'shopping',
  uncategorized: 'receipt',
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

  function renderExpense({ item }: { item: ExpenseItem }) {
    const iPaid = item.payer_id === user?.id;
    const icon = CATEGORY_ICONS[item.category ?? 'uncategorized'] ?? 'receipt';
    const dateStr = item.date
      ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    return (
      <View style={styles.expenseRow}>
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
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: name ?? 'Friend',
          headerBackTitle: 'Friends',
          headerRight: () => (
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
          ),
        }}
      />

      <View style={styles.container}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{oweText}</Text>
          {!isSettled && (
            <Text style={[styles.balanceAmount, { color: balance > 0 ? '#10b981' : '#ef4444' }]}>
              ${Math.abs(balance).toFixed(2)}
            </Text>
          )}
          {!isSettled && (
            <TouchableOpacity
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
            </TouchableOpacity>
          )}
        </View>

        {/* Expenses */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5BC5A7" />
          </View>
        ) : (
          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
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
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            router.push({
              pathname: '/add-expense',
              params: { friendId: id, friendName: name },
            })
          }
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
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
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
