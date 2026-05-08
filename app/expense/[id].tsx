import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { deleteExpense, getExpenseDetail, type ExpenseDetail } from '@/services/friends';
import { categoryIcon } from '@/utils/categories';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getExpenseDetail(id)
      .then(setExpense)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    Alert.alert('Delete expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteExpense(id!);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
            setDeleting(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Expense', headerTintColor: Colors.brand.primary }} />
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Expense', headerTintColor: Colors.brand.primary }} />
        <Text style={{ color: '#999' }}>Expense not found</Text>
      </View>
    );
  }

  const payer = expense.splits.find((s) => s.user_id === expense.payer_id);
  const payerName = payer?.name ?? 'Unknown';
  const isMyExpense = expense.payer_id === user?.id || expense.splits.some((s) => s.user_id === user?.id);

  return (
    <>
      <Stack.Screen
        options={{
          title: expense.is_settlement ? 'Settlement' : 'Expense',
          headerTintColor: Colors.brand.primary,
          headerRight: () =>
            isMyExpense ? (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                style={{ padding: 8 }}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Text style={styles.deleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.categoryCircle}>
            <MaterialCommunityIcons
              name={categoryIcon(expense.category) as any}
              size={32}
              color={Colors.brand.primary}
            />
          </View>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.amount}>
            {expense.currency_code ?? 'USD'} {expense.amount.toFixed(2)}
          </Text>
          {expense.date ? (
            <Text style={styles.date}>{formatDate(expense.date)}</Text>
          ) : null}
          {expense.category ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>
                {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Paid by */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAID BY</Text>
          <View style={styles.row}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{payerName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.rowText}>{payerName}</Text>
            <Text style={styles.rowAmount}>${expense.amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Split breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPLIT</Text>
          {expense.splits.map((s) => (
            <View key={s.user_id} style={styles.row}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{s.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.rowText}>{s.name}</Text>
              <Text style={styles.rowAmount}>${s.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {expense.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 12,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  description: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  amount: { fontSize: 32, fontWeight: '800', color: Colors.brand.primary, marginBottom: 4 },
  date: { fontSize: 14, color: '#9ca3af', marginBottom: 8 },
  categoryChip: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  categoryChipText: { fontSize: 12, color: Colors.brand.primary, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarSmallText: { fontSize: 15, fontWeight: '600', color: '#4b5563' },
  rowText: { flex: 1, fontSize: 15, color: '#111' },
  rowAmount: { fontSize: 15, fontWeight: '600', color: '#374151' },
  notesBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  deleteText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});
