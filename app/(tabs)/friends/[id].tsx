import AddExpenseModal from '@/components/AddExpenseModal';
import { useFriends } from '@/contexts/FriendsContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FriendDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const { friends } = useFriends();
  const [showAddExpense, setShowAddExpense] = useState(false);

  const friend = friends.find((f) => f.id === id);

  if (!friend) {
    return (
      <View style={styles.container}>
        <Text>Friend not found</Text>
      </View>
    );
  }

  const balance = friend.balance;
  const isSettled = balance === 0;
  const oweText = balance > 0 
    ? `${name} owes you` 
    : balance < 0 
    ? `You owe ${name}` 
    : 'settled up';

  function renderExpense({ item }: { item: any }) {
    return (
      <View style={styles.expenseRow}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>{item.date}</Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={styles.expensePrice}>${item.amount.toFixed(2)}</Text>
          <Text style={styles.expenseShare}>
            You paid ${(item.amount / 2).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No expenses yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to add your first expense with {name}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: name as string,
          headerBackTitle: 'Friends',
        }}
      />
      <View style={styles.container}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{oweText}</Text>
          {!isSettled && (
            <Text
              style={[
                styles.balanceAmount,
                { color: balance > 0 ? '#10b981' : '#ef4444' },
              ]}
            >
              ${Math.abs(balance).toFixed(2)}
            </Text>
          )}
          {!isSettled && (
            <TouchableOpacity style={styles.settleButton}>
              <Text style={styles.settleButtonText}>Settle up</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expenses List */}
        <FlatList
          data={friend.expenses || []}
          renderItem={renderExpense}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            friend.expenses?.length === 0 ? { flex: 1 } : styles.listContent
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddExpense(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Add Expense Modal */}
        <AddExpenseModal
          visible={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          friendId={id as string}
          friendName={name as string}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  balanceCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  settleButton: {
    backgroundColor: '#5BC5A7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  settleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expensePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expenseShare: {
    fontSize: 13,
    color: '#6b7280',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
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