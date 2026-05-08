import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { createGroup } from '@/services/groups';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const { friends } = useFriends();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggleFriend(id: string) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please give your group a name.');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const groupId = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        createdBy: user.id,
        memberIds: Array.from(selectedFriendIds),
      });
      router.replace({ pathname: '/group/[id]', params: { id: groupId, name: name.trim() } });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create group.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create group',
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="close" size={26} color="#111" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleCreate}
              disabled={saving || !name.trim()}
              style={{ padding: 8 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#5BC5A7" />
              ) : (
                <Text style={[styles.doneText, !name.trim() && { opacity: 0.4 }]}>Create</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Group name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GROUP NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Weekend Trip, Apartment..."
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={60}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION (optional)</Text>
          <TextInput
            style={styles.descInput}
            placeholder="What's this group for?"
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />
        </View>

        {/* Add members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ADD MEMBERS</Text>
          {friends.length === 0 ? (
            <Text style={styles.noFriendsText}>
              You have no friends yet. Add friends first to include them in a group.
            </Text>
          ) : (
            <FlatList
              data={friends}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const selected = selectedFriendIds.has(item.id);
                return (
                  <TouchableOpacity style={styles.memberRow} onPress={() => toggleFriend(item.id)}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Selected count */}
        {selectedFriendIds.size > 0 && (
          <Text style={styles.selectedCount}>
            {selectedFriendIds.size + 1} members (you + {selectedFriendIds.size} friend
            {selectedFriendIds.size > 1 ? 's' : ''})
          </Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    paddingVertical: 8,
  },
  descInput: {
    fontSize: 15,
    color: '#374151',
    paddingVertical: 8,
    minHeight: 60,
  },
  noFriendsText: { fontSize: 14, color: '#9ca3af', paddingVertical: 12 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberAvatarText: { fontSize: 16, fontWeight: '600', color: '#4b5563' },
  memberName: { flex: 1, fontSize: 16, color: '#111' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#5BC5A7', borderColor: '#5BC5A7' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#f0f0f0', marginLeft: 54 },
  doneText: { color: '#5BC5A7', fontSize: 17, fontWeight: '600' },
  selectedCount: {
    paddingHorizontal: 20,
    paddingTop: 16,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
});
