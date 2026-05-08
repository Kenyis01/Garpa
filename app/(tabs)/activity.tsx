import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { categoryIcon } from '@/utils/categories';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

type ActivityItem = {
  id: string;
  type: 'expense' | 'settlement';
  description: string;
  amount: number;
  date: string;
  payer_id: string;
  payer_name: string;
  group_id: string | null;
  group_name: string | null;
  category: string | null;
  my_share: number;
  i_paid: boolean;
};

function groupByDate(items: ActivityItem[]): { title: string; data: ActivityItem[] }[] {
  const map = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const d = new Date(item.date);
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user) return;
    try {
      // Get all expense splits for the user with joined expenses
      const { data: splits, error } = await supabase
        .from('expense_splits')
        .select('amount, expense_id')
        .eq('user_id', user.id);

      if (error || !splits?.length) {
        setItems([]);
        return;
      }

      const expenseIds = splits.map((s) => s.expense_id);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .in('id', expenseIds)
        .order('date', { ascending: false })
        .limit(100);

      if (!expenses?.length) {
        setItems([]);
        return;
      }

      // Get payer profiles
      const payerIds = [...new Set(expenses.map((e) => e.payer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', payerIds);

      // Get group names
      const groupIds = [...new Set(expenses.map((e) => e.group_id).filter(Boolean))];
      let groupMap: Record<string, string> = {};
      if (groupIds.length) {
        const { data: groups } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);
        groupMap = Object.fromEntries(groups?.map((g) => [g.id, g.name]) ?? []);
      }

      const result: ActivityItem[] = expenses.map((e) => {
        const myShare = splits.find((s) => s.expense_id === e.id)?.amount ?? 0;
        const payer = profiles?.find((p) => p.id === e.payer_id);

        return {
          id: e.id,
          type: (e as any).is_settlement ? 'settlement' : 'expense',
          description: e.description,
          amount: e.amount,
          date: e.date ?? e.created_at,
          payer_id: e.payer_id,
          payer_name: payer?.full_name ?? payer?.email ?? 'Someone',
          group_id: e.group_id,
          group_name: e.group_id ? groupMap[e.group_id] ?? null : null,
          category: e.category,
          my_share: myShare,
          i_paid: e.payer_id === user.id,
        };
      });

      setItems(result);
    } catch (err) {
      console.error('Error loading activity:', err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadActivity().finally(() => setLoading(false));
    }, [loadActivity])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadActivity();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: ActivityItem }) {
    const icon = item.type === 'settlement' ? 'cash' : categoryIcon(item.category);

    const dateStr = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const amountColor = item.i_paid ? '#10b981' : '#ef4444';
    const amountLabel = item.i_paid
      ? `+$${(item.amount - item.my_share).toFixed(2)}`
      : `-$${item.my_share.toFixed(2)}`;

    return (
      <AnimatedPressable
        style={styles.itemRow}
        onPress={() => router.push({ pathname: '/expense/[id]', params: { id: item.id } })}
      >
        <View style={[styles.itemIcon, item.type === 'settlement' && { backgroundColor: '#ecfdf5' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={item.type === 'settlement' ? '#10b981' : '#6b7280'} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.itemMeta}>
            {item.i_paid ? 'You paid' : `${item.payer_name} paid`}
            {item.group_name ? ` · ${item.group_name}` : ''}
            {' · '}{dateStr}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.itemAmount, { color: amountColor }]}>{amountLabel}</Text>
          <Text style={styles.itemTotal}>${item.amount.toFixed(2)} total</Text>
        </View>
      </AnimatedPressable>
    );
  }

  const grouped = groupByDate(items);

  const flatData: ({ type: 'header'; title: string } | { type: 'item'; data: ActivityItem })[] = [];
  for (const section of grouped) {
    flatData.push({ type: 'header', title: section.title });
    for (const item of section.data) {
      flatData.push({ type: 'item', data: item });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5BC5A7" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pulse-outline" size={72} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Add expenses with friends or groups to see your activity here.
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/add-expense')}
          >
            <Text style={styles.addBtnText}>Add expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, i) =>
            item.type === 'header' ? `header-${item.title}` : `item-${item.data.id}`
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => {
            if (item.type === 'header') {
              return (
                <Animated.View entering={FadeInUp.duration(280).delay(index * 15)}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{item.title}</Text>
                  </View>
                </Animated.View>
              );
            }
            return (
              <Animated.View entering={FadeInUp.duration(260).delay(index * 15)}>
                {renderItem({ item: item.data })}
              </Animated.View>
            );
          }}
          ItemSeparatorComponent={({ leadingItem }) =>
            leadingItem?.type === 'item' ? <View style={styles.separator} /> : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1, marginRight: 8 },
  itemDesc: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 3 },
  itemMeta: { fontSize: 12, color: '#9ca3af' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemTotal: { fontSize: 11, color: '#9ca3af' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginLeft: 68 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  addBtn: { backgroundColor: '#5BC5A7', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
