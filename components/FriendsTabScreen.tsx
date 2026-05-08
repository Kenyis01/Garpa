import { useFriends, type Friend } from '@/contexts/FriendsContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddFriendsScreen from './AddFriendsScreen';

type FriendRowProps = {
  friend: Friend;
  onPress: (friend: Friend) => void;
};

const FriendRow = memo(function FriendRow({ friend, onPress }: FriendRowProps) {
  const initial = friend.name.charAt(0).toUpperCase();
  const isSettled = friend.balance === 0;
  const statusText = isSettled ? 'settled up' : 'has expenses';

  return (
    <TouchableOpacity
      style={styles.friendRow}
      onPress={() => onPress(friend)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open ${friend.name}`}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarSquare}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendStatus}>{statusText}</Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>
          {isSettled ? 'settled up' : `$${friend.balance.toFixed(2)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const Separator = memo(() => <View style={styles.separator} />);

export default function FriendsTabScreen() {
  const router = useRouter();
  const { friends } = useFriends();
  const [showAddFriends, setShowAddFriends] = useState(false);

  const handleOpenFriend = useCallback(
    (friend: Friend) => {
      router.push({
        pathname: '/friends/[id]',
        params: { id: friend.id, name: friend.name },
      });
    },
    [router],
  );

  const renderFriend = useCallback(
    ({ item }: { item: Friend }) => <FriendRow friend={item} onPress={handleOpenFriend} />,
    [handleOpenFriend],
  );

  const keyExtractor = useCallback((item: Friend) => item.id, []);

  function renderEmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="people-outline" size={80} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>Welcome to Garpa!</Text>
        <Text style={styles.emptySubtitle}>Add friends to start splitting expenses.</Text>
        <TouchableOpacity
          style={styles.addFriendsButton}
          onPress={() => setShowAddFriends(true)}
          accessibilityRole="button"
        >
          <Text style={styles.addFriendsButtonText}>Add friends</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Friends',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowAddFriends(true)}
              accessibilityRole="button"
              accessibilityLabel="Add friends"
            >
              <Ionicons name="person-add" size={24} color="#5BC5A7" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {friends.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={Separator}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={10}
            removeClippedSubviews
          />
        )}
      </View>

      <AddFriendsScreen visible={showAddFriends} onClose={() => setShowAddFriends(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerButton: { marginRight: 8, padding: 4 },
  listContent: { paddingVertical: 8 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  avatarContainer: { marginRight: 12 },
  avatarSquare: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#6b7280' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  friendStatus: { fontSize: 13, color: '#6b7280' },
  balanceContainer: { alignItems: 'flex-end' },
  balanceText: { fontSize: 14, fontWeight: '500', color: '#9ca3af' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 78,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: { marginBottom: 24 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addFriendsButton: {
    backgroundColor: '#5BC5A7',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  addFriendsButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
