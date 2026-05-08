import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Period = 'this_month' | 'last_month' | 'all_time';

type ExpenseRow = {
  amount: number;
  category: string | null;
  date: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  food_drink: '#f59e0b',
  restaurants: '#f59e0b',
  groceries: '#fbbf24',
  alcohol: '#d97706',
  coffee: '#92400e',
  home: '#3b82f6',
  rent: '#3b82f6',
  utilities: '#60a5fa',
  furniture: '#93c5fd',
  maintenance: '#2563eb',
  transportation: '#8b5cf6',
  gas: '#7c3aed',
  parking: '#a78bfa',
  taxi: '#6d28d9',
  flights: '#c4b5fd',
  entertainment: '#ec4899',
  movies: '#f472b6',
  music: '#be185d',
  sports: '#db2777',
  life: '#10b981',
  clothing: '#34d399',
  electronics: '#059669',
  gifts: '#6ee7b7',
  medical: '#047857',
  travel: '#06b6d4',
  hotel: '#0891b2',
  uncategorized: '#9ca3af',
  general: '#9ca3af',
};

function getCategoryColor(cat: string | null): string {
  if (!cat) return '#9ca3af';
  return CATEGORY_COLORS[cat] ?? '#9ca3af';
}

function getCategoryLabel(cat: string | null): string {
  if (!cat) return 'Other';
  return cat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function filterByPeriod(expenses: ExpenseRow[], period: Period): ExpenseRow[] {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    if (period === 'this_month') return d >= thisMonth;
    if (period === 'last_month') return d >= lastMonth && d <= lastMonthEnd;
    return true;
  });
}

function getMonthlyData(expenses: ExpenseRow[]): { label: string; total: number }[] {
  const map: Record<string, { sortKey: number; total: number }> = {};
  for (const e of expenses) {
    if (!e.date) continue;
    const d = new Date(e.date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!map[key]) {
      map[key] = { sortKey: d.getFullYear() * 12 + d.getMonth(), total: 0 };
    }
    map[key].total += e.amount;
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => a.sortKey - b.sortKey)
    .slice(-6)
    .map(([label, v]) => ({ label, total: v.total }));
}

export default function SpendingScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('this_month');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('expense_splits')
      .select('amount, expense:expenses(category, date, is_settlement)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const rows: ExpenseRow[] = (data ?? [])
          .filter((s: any) => s.expense && !s.expense.is_settlement && s.amount > 0)
          .map((s: any) => ({
            amount: s.amount,
            category: s.expense.category,
            date: s.expense.date,
          }));
        setExpenses(rows);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => filterByPeriod(expenses, period), [expenses, period]);
  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filtered) {
      const k = e.category ?? 'general';
      map[k] = (map[k] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => ({ cat, amount, pct: total > 0 ? (amount / total) * 100 : 0 }));
  }, [filtered, total]);

  const monthly = useMemo(() => getMonthlyData(expenses), [expenses]);
  const maxMonthly = useMemo(() => Math.max(...monthly.map((m) => m.total), 1), [monthly]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Spending', headerTintColor: Colors.brand.primary }} />
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Spending', headerTintColor: Colors.brand.primary }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {([['this_month', 'This Month'], ['last_month', 'Last Month'], ['all_time', 'All Time']] as [Period, string][]).map(([p, label]) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p && styles.periodChipActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total spent</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>

        {/* Monthly bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MONTHLY SPENDING</Text>
          <View style={styles.barChart}>
            {monthly.length === 0 ? (
              <Text style={styles.emptyText}>No data</Text>
            ) : (
              monthly.map(({ label, total: t }) => (
                <View key={label} style={styles.barColumn}>
                  <Text style={styles.barAmount}>${t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(0)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(4, (t / maxMonthly) * 100) },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{label.split(' ')[0]}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Category breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BY CATEGORY</Text>
          {categoryTotals.length === 0 ? (
            <Text style={styles.emptyText}>No expenses in this period</Text>
          ) : (
            <>
              {/* Stacked bar */}
              <View style={styles.stackedBar}>
                {categoryTotals.map(({ cat, pct }) => (
                  <View
                    key={cat}
                    style={[
                      styles.stackedSegment,
                      { width: `${pct}%`, backgroundColor: getCategoryColor(cat) },
                    ]}
                  />
                ))}
              </View>

              {/* Legend */}
              {categoryTotals.map(({ cat, amount, pct }) => (
                <View key={cat} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: getCategoryColor(cat) }]} />
                  <Text style={styles.catName}>{getCategoryLabel(cat)}</Text>
                  <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                  <Text style={styles.catAmount}>${amount.toFixed(2)}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  periodRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  periodChipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  periodChipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  periodChipTextActive: { color: '#fff' },
  totalCard: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  totalAmount: { fontSize: 40, fontWeight: '800', color: '#111' },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: { fontSize: 9, color: '#6b7280', marginBottom: 4 },
  barTrack: {
    width: 28,
    height: 100,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  bar: {
    width: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: 4,
  },
  barLabel: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  stackedBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
  },
  stackedSegment: { height: '100%' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catName: { flex: 1, fontSize: 14, color: '#374151' },
  catPct: { fontSize: 13, color: '#9ca3af', width: 36, textAlign: 'right' },
  catAmount: { fontSize: 14, fontWeight: '600', color: '#111', width: 72, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#9ca3af', paddingVertical: 20 },
});
