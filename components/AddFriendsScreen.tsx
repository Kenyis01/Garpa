import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { searchUsers } from '@/services/friends';
import type { Profile } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AddFriendsScreenProps = {
  onClose: () => void;
};

export default function AddFriendsScreen({ onClose }: AddFriendsScreenProps) {
  const { user } = useAuth();
  const { addFriendById, friends } = useFriends();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existingFriendIds = new Set(friends.map((f) => f.id));

  const doSearch = useCallback(
    async (q: string) => {
      if (!user || q.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await searchUsers(q, user.id);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  async function handleAdd(profile: Profile) {
    setAdding(profile.id);
    try {
      await addFriendById(profile.id);
      setAdded((prev) => new Set(prev).add(profile.id));
    } catch (err: any) {
      console.error('Error adding friend:', err);
    } finally {
      setAdding(null);
    }
  }

  function renderResult({ item }: { item: Profile }) {
    const initial = (item.full_name || item.email || '?').charAt(0).toUpperCase();
    const isAlreadyFriend = existingFriendIds.has(item.id);
    const justAdded = added.has(item.id);
    const isAdding = adding === item.id;

    return (
      <View style={styles.resultRow}>
        <View style={styles.avatar}>
          {item.avatar_url ? (
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            <Text style={styles.avatarText}>{initial}</Text>
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name ?? 'No name'}</Text>
          <Text style={styles.email}>{item.email ?? ''}</Text>
        </View>
        {isAlreadyFriend || justAdded ? (
          <View style={styles.addedBadge}>
            <Ionicons name="checkmark" size={16} color="#5BC5A7" />
            <Text style={styles.addedText}>Added</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAdd(item)}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add friends</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoFocus
        />
        {searching && <ActivityIndicator size="small" color="#9ca3af" />}
      </View>

      {/* Results */}
      {query.trim().length < 2 ? (
        <View style={styles.hint}>
          <Ionicons name="people-outline" size={48} color="#d1d5db" />
          <Text style={styles.hintText}>Type a name or email to find people on Garpa</Text>
        </View>
      ) : results.length === 0 && !searching ? (
        <View style={styles.hint}>
          <Ionicons name="search-outline" size={48} color="#d1d5db" />
          <Text style={styles.hintText}>No users found for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  cancelBtn: { width: 60 },
  cancelText: { fontSize: 16, color: '#5BC5A7', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '600', color: '#111827' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 2 },
  email: { fontSize: 13, color: '#6b7280' },
  addBtn: {
    backgroundColor: '#5BC5A7',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addedText: { fontSize: 14, color: '#5BC5A7', fontWeight: '500' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginLeft: 72 },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  hintText: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
});
