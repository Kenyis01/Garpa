import { ContactRow } from '@/components/add-friends/ContactRow';
import { ManualContactSheet } from '@/components/add-friends/ManualContactSheet';
import { SelectedRail } from '@/components/add-friends/SelectedRail';
import { styles } from '@/components/add-friends/styles';
import type { Contact } from '@/components/add-friends/types';
import { useDeviceContacts } from '@/components/add-friends/useDeviceContacts';
import ReviewFriendsScreen from '@/components/ReviewFriendsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddFriendsScreen({ visible, onClose }: Props) {
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState<Contact[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const {
    contacts,
    loading: loadingContacts,
    permissionDenied,
    requestAgain,
  } = useDeviceContacts(visible);

  useEffect(() => {
    if (!visible) {
      setSearchText('');
      setSelected([]);
    }
  }, [visible]);

  const filteredContacts = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(searchText) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [contacts, searchText]);

  const selectedIds = useMemo(() => new Set(selected.map((c) => c.id)), [selected]);

  const toggleContact = useCallback((contact: Contact) => {
    setSelected((prev) =>
      prev.some((c) => c.id === contact.id)
        ? prev.filter((c) => c.id !== contact.id)
        : [...prev, contact],
    );
  }, []);

  const removeSelected = useCallback((id: string) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addManual = useCallback((c: Contact) => {
    setSelected((prev) => [...prev, c]);
    setSearchText('');
  }, []);

  const handleNext = useCallback(() => {
    if (selected.length > 0) setShowReview(true);
  }, [selected.length]);

  const handleAddFriends = useCallback(() => {
    setShowReview(false);
    setShowManual(false);
    setSelected([]);
    setSearchText('');
    onClose();
  }, [onClose]);

  const renderContact = useCallback(
    ({ item }: { item: Contact }) => (
      <ContactRow contact={item} selected={selectedIds.has(item.id)} onToggle={toggleContact} />
    ),
    [selectedIds, toggleContact],
  );

  const addButtonText =
    searchText.trim() === '' ? 'Add new contact to Garpa' : `Add ${searchText} to Garpa`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add friends</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            accessibilityLabel="Search contacts"
          />
        </View>

        <SelectedRail contacts={selected} onRemove={removeSelected} />

        <TouchableOpacity
          style={styles.addNewButton}
          onPress={() => setShowManual(true)}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={22} color="#5BC5A7" style={styles.addIcon} />
          <Text style={styles.addNewText}>{addButtonText}</Text>
        </TouchableOpacity>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>From your contacts</Text>
          {loadingContacts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5BC5A7" />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : permissionDenied ? (
            <View style={styles.permissionDeniedContainer}>
              <Ionicons name="lock-closed-outline" size={48} color="#9ca3af" />
              <Text style={styles.permissionDeniedTitle}>Access to contacts required</Text>
              <Text style={styles.permissionDeniedText}>
                To add friends from your contacts, please allow access to your contacts list.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestAgain}
                accessibilityRole="button"
              >
                <Text style={styles.permissionButtonText}>Allow access to contacts</Text>
              </TouchableOpacity>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContactsContainer}>
              <Text style={styles.emptyContactsText}>No contacts found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews
            />
          )}
        </View>

        <View style={styles.nextButtonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, selected.length === 0 && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={selected.length === 0}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.nextButtonText,
                selected.length === 0 && styles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ManualContactSheet
        visible={showManual}
        initialName={searchText.trim()}
        onClose={() => setShowManual(false)}
        onAdd={addManual}
      />

      <ReviewFriendsScreen
        visible={showReview}
        contacts={selected}
        onClose={() => setShowReview(false)}
        onAddFriends={handleAddFriends}
      />
    </Modal>
  );
}
