import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ReviewFriendsScreen from './ReviewFriendsScreen';

type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

// Mock contacts como fallback
const mockContacts: Contact[] = [];

type AddFriendsScreenProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AddFriendsScreen({ visible, onClose }: AddFriendsScreenProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [showManualSheet, setShowManualSheet] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Cargar contactos del teléfono
  useEffect(() => {
    if (visible) {
      loadContacts();
    } else {
      // Limpiar estados al cerrar
      setSearchText('');
      setSelectedContacts([]);
      setPermissionDenied(false);
    }
  }, [visible]);

  async function loadContacts() {
    setLoadingContacts(true);
    setPermissionDenied(false);
    try {
      // Primero verificamos el estado actual de permisos
      const { status: currentStatus } = await Contacts.getPermissionsAsync();
      
      let finalStatus = currentStatus;
      
      // Si los permisos no están otorgados, intentamos pedirlos
      if (currentStatus !== 'granted') {
        const { status } = await Contacts.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        const formattedContacts: Contact[] = data
          .filter((contact) => contact.name && (contact.phoneNumbers?.length > 0 || contact.emails?.length > 0))
          .map((contact, index) => ({
            id: contact.id || `contact-${index}`,
            name: contact.name || 'Unknown',
            phone: contact.phoneNumbers?.[0]?.number || '',
            email: contact.emails?.[0]?.email,
          }));

        setContacts(formattedContacts);
        setPermissionDenied(false);
      } else {
        // Permisos denegados o no otorgados
        setPermissionDenied(true);
        setContacts(mockContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setPermissionDenied(true);
      setContacts(mockContacts);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function handleRequestPermissionAgain() {
    // Primero intentamos pedir permisos nuevamente
    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status === 'granted') {
      // Si ahora sí otorgó permisos, cargamos los contactos
      await loadContacts();
    } else {
      // Si sigue denegado, abrimos la configuración del teléfono
      try {
        await Linking.openSettings();
      } catch (error) {
        console.error('Error opening settings:', error);
        // Fallback: intentar abrir la URL de settings
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:');
        } else {
          Linking.openURL('package:com.yourapp');
        }
      }
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.phone.includes(searchText) ||
      contact.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  function toggleContactSelection(contact: Contact) {
    const isSelected = selectedContacts.some((c) => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter((c) => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  }

  function removeSelectedContact(contactId: string) {
    setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId));
  }

  function handleAddNewContact() {
    // Prellenar el nombre con el texto del search si existe
    setManualName(searchText.trim());
    setManualContact('');
    setShowManualSheet(true);
  }

  function handleCloseManualSheet() {
    setShowManualSheet(false);
    setManualName('');
    setManualContact('');
  }

  function handleManualDone() {
    const name = manualName.trim();
    const contact = manualContact.trim();

    if (!name) {
      return;
    }

    // Crear un nuevo contacto manual
    const newContact: Contact = {
      id: `manual-${Date.now()}`,
      name: name,
      phone: contact.includes('@') ? '' : contact,
      email: contact.includes('@') ? contact : undefined,
    };

    // Agregar a la lista de seleccionados
    setSelectedContacts([...selectedContacts, newContact]);

    // Limpiar el search bar y cerrar el sheet
    setSearchText('');
    handleCloseManualSheet();
  }

  function handleNext() {
    if (selectedContacts.length > 0) {
      setShowReviewScreen(true);
    }
  }

  function handleCloseReviewScreen() {
    setShowReviewScreen(false);
  }

  function handleAddFriends() {
    // Esta función se llama desde ReviewFriendsScreen
    // que ya guardó los amigos en el contexto
    // Solo cerramos todos los modales
    setShowReviewScreen(false);
    setShowManualSheet(false);
    setSelectedContacts([]);
    setSearchText('');
    onClose();
  }

  function isContactSelected(contactId: string) {
    return selectedContacts.some((c) => c.id === contactId);
  }

  function getAddButtonText() {
    if (searchText.trim() === '') {
      return 'Add new contact to G garpa';
    }
    return `Add ${searchText} to G garpa`;
  }

  function renderContact({ item }: { item: Contact }) {
    const isSelected = isContactSelected(item.id);
    const initial = item.name.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.contactRow}
        onPress={() => toggleContactSelection(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Fijo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add friends</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
        </View>

        {/* People to add section */}
        {selectedContacts.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedSectionTitle}>People to add</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedScrollContent}
            >
              {selectedContacts.map((contact) => {
                const initial = contact.name.charAt(0).toUpperCase();
                return (
                  <View key={contact.id} style={styles.selectedAvatarContainer}>
                    <View style={styles.selectedAvatarCircle}>
                      <Text style={styles.selectedAvatarText}>{initial}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeSelectedContact(contact.id)}
                    >
                      <Ionicons name="close-circle" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Botón Add New Contact */}
        <TouchableOpacity style={styles.addNewButton} onPress={handleAddNewContact}>
          <Ionicons name="add-circle-outline" size={22} color="#5BC5A7" style={styles.addIcon} />
          <Text style={styles.addNewText}>{getAddButtonText()}</Text>
        </TouchableOpacity>

        {/* Lista de Contactos */}
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
                onPress={handleRequestPermissionAgain}
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
            />
          )}
        </View>

        {/* Botón Next */}
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedContacts.length === 0 && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={selectedContacts.length === 0}
          >
            <Text
              style={[
                styles.nextButtonText,
                selectedContacts.length === 0 && styles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Add Sheet */}
      <Modal
        visible={showManualSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseManualSheet}
      >
        <KeyboardAvoidingView
          style={styles.manualSheetContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.manualHeader}>
            <TouchableOpacity onPress={handleCloseManualSheet} style={styles.manualCloseButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.manualHeaderTitle}>Add friend</Text>
            <View style={styles.manualHeaderSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.manualContent} contentContainerStyle={styles.manualContentInner}>
            <View style={styles.manualInputGroup}>
              <Text style={styles.manualLabel}>Name</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Enter name"
                placeholderTextColor="#9ca3af"
                value={manualName}
                onChangeText={setManualName}
                autoFocus
              />
            </View>

            <View style={styles.manualInputGroup}>
              <Text style={styles.manualLabel}>Phone number or email address</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="+1 555 123 4567 or email@example.com"
                placeholderTextColor="#9ca3af"
                value={manualContact}
                onChangeText={setManualContact}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>

          {/* Done Button */}
          <View style={styles.manualButtonContainer}>
            <TouchableOpacity
              style={[
                styles.manualDoneButton,
                !manualName.trim() && styles.manualDoneButtonDisabled,
              ]}
              onPress={handleManualDone}
              disabled={!manualName.trim()}
            >
              <Text
                style={[
                  styles.manualDoneButtonText,
                  !manualName.trim() && styles.manualDoneButtonTextDisabled,
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Review Friends Screen */}
      <ReviewFriendsScreen
        visible={showReviewScreen}
        contacts={selectedContacts}
        onClose={handleCloseReviewScreen}
        onAddFriends={handleAddFriends}
      />
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
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#5BC5A7',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 60,
  },
  searchContainer: {
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  addIcon: {
    marginRight: 10,
  },
  addNewText: {
    fontSize: 16,
    color: '#5BC5A7',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
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
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#5BC5A7',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5BC5A7',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 72,
  },
  selectedSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  selectedSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  selectedScrollContent: {
    paddingRight: 16,
  },
  selectedAvatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  selectedAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5BC5A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    backgroundColor: '#5BC5A7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
  manualSheetContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  manualHeader: {
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
  manualCloseButton: {
    padding: 4,
  },
  manualHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  manualHeaderSpacer: {
    width: 32,
  },
  manualContent: {
    flex: 1,
  },
  manualContentInner: {
    padding: 16,
  },
  manualInputGroup: {
    marginBottom: 24,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  manualButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  manualDoneButton: {
    backgroundColor: '#5BC5A7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualDoneButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  manualDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  manualDoneButtonTextDisabled: {
    color: '#9ca3af',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContactsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContactsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  permissionDeniedContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionDeniedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDeniedText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#5BC5A7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
