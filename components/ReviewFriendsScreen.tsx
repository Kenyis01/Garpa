import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@/contexts/FriendsContext';
import type { Contact } from '@/components/add-friends/types';

type ReviewFriendsScreenProps = {
  visible: boolean;
  contacts: Contact[];
  onClose: () => void;
  onAddFriends: () => void;
};

export default function ReviewFriendsScreen({
  visible,
  contacts,
  onClose,
  onAddFriends,
}: ReviewFriendsScreenProps) {
  const { addFriends } = useFriends();

  function handleAddFriends() {
    addFriends(contacts);
    onAddFriends();
    onClose();
  }

  function renderContact({ item }: { item: Contact }) {
    const hasEmail = item.email && item.email.length > 0;
    const contactInfo = hasEmail ? item.email : item.phone;
    const iconName = hasEmail ? 'mail-outline' : 'call-outline';

    return (
      <View style={styles.contactRow}>
        <View style={styles.contactLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={20} color="#5BC5A7" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactData}>{contactInfo}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Lista de Contactos */}
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            These people will be notified you've added them as a friend. You can start adding
            expenses right away.
          </Text>
          <TouchableOpacity style={styles.addFriendsButton} onPress={handleAddFriends}>
            <Text style={styles.addFriendsButtonText}>Add friends</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  listContent: {
    paddingVertical: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  contactData: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 16,
    color: '#5BC5A7',
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 68,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  addFriendsButton: {
    backgroundColor: '#5BC5A7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
