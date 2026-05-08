import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import type { GroupWithMeta } from '@/services/groups';
import { getUserGroups } from '@/services/groups';
import { Ionicons } from '@expo/vector-icons';
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

export default function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserGroups(user.id);
      setGroups(data);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadGroups().finally(() => setLoading(false));
    }, [loadGroups]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }

  function renderGroup({ item }: { item: GroupWithMeta }) {
    const initial = item.name.charAt(0).toUpperCase();
    const hasBalance = item.myBalance !== 0;

    return (
      <TouchableOpacity
        style={styles.groupRow}
        onPress={() =>
          router.push({ pathname: '/group/[id]', params: { id: item.id, name: item.name } })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.memberCount}>{item.memberCount} members</Text>
        </View>
        <View style={styles.balanceContainer}>
          {hasBalance ? (
            <>
              <Text
                style={[
                  styles.balanceText,
                  { color: item.myBalance > 0 ? Colors.brand.primary : Colors.brand.orange },
                ]}
              >
                {item.myBalance > 0 ? 'you are owed' : 'you owe'}
              </Text>
              <Text
                style={[
                  styles.balanceAmount,
                  { color: item.myBalance > 0 ? Colors.brand.primary : Colors.brand.orange },
                ]}
              >
                ${Math.abs(item.myBalance).toFixed(2)}
              </Text>
            </>
          ) : (
            <Text style={styles.settledText}>settled up</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity onPress={() => router.push('/create-group')}>
          <Text style={styles.createBtn}>Create group</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-circle-outline" size={72} color="#ccc" />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Groups are great for trips, households, or any shared expenses among 3+ people.
          </Text>
          <TouchableOpacity
            style={styles.createBigBtn}
            onPress={() => router.push('/create-group')}
          >
            <Text style={styles.createBigBtnText}>Create a group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          style={{ backgroundColor: '#fff' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  createBtn: { color: Colors.brand.primary, fontSize: 16, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#0284c7' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  memberCount: { fontSize: 12, color: '#9ca3af' },
  balanceContainer: { alignItems: 'flex-end', marginRight: 4 },
  balanceText: { fontSize: 11, fontWeight: '500' },
  balanceAmount: { fontSize: 14, fontWeight: '700' },
  settledText: { fontSize: 12, color: '#9ca3af' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 20, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  createBigBtn: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  createBigBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
