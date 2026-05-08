import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { useFriends } from '@/contexts/FriendsContext';
import type { FriendWithBalance } from '@/services/friends';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FriendsScreen() {
  const { friends, loading } = useFriends();

  const renderFriend = ({ item }: { item: FriendWithBalance }) => (
    <TouchableOpacity
      style={styles.friendRow}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/friends/[id]',
          params: { id: item.id, name: item.name, friendshipId: item.friendshipId },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        {item.balance === 0 ? (
          <Text style={styles.settledText}>settled up</Text>
        ) : (
          <Text style={[styles.balanceText, { color: item.balance > 0 ? Colors.brand.primary : Colors.brand.orange }]}>
            {item.balance > 0
              ? `owes you $${item.balance.toFixed(2)}`
              : `you owe $${Math.abs(item.balance).toFixed(2)}`}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity onPress={() => router.push('/add-friends')}>
          <Text style={styles.addButton}>Add friends</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Add friends to start splitting expenses</Text>
          <TouchableOpacity style={styles.bigButton} onPress={() => router.push('/add-friends')}>
            <Text style={styles.bigButtonText}>Add friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.friendshipId}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </ScreenWrapper>
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
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  addButton: { color: Colors.brand.primary, fontSize: 16, fontWeight: '600' },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#4b5563' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settledText: { fontSize: 12, color: '#999' },
  balanceText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20, marginBottom: 20 },
  bigButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  bigButtonText: { color: Colors.brand.primary, fontWeight: 'bold' },
});
