import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './styles';
import type { Contact } from './types';

type Props = {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onAdd: (contact: Contact) => void;
};

export function ManualContactSheet({ visible, initialName, onClose, onAdd }: Props) {
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setContact('');
    }
  }, [visible, initialName]);

  const trimmedName = name.trim();
  const disabled = trimmedName.length === 0;

  function handleDone() {
    if (disabled) return;
    const value = contact.trim();
    onAdd({
      id: `manual-${randomUUID()}`,
      name: trimmedName,
      phone: value.includes('@') ? '' : value,
      email: value.includes('@') ? value : undefined,
    });
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.manualSheetContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.manualHeader}>
          <TouchableOpacity onPress={onClose} style={styles.manualCloseButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.manualHeaderTitle}>Add friend</Text>
          <View style={styles.manualHeaderSpacer} />
        </View>

        <ScrollView style={styles.manualContent} contentContainerStyle={styles.manualContentInner}>
          <View style={styles.manualInputGroup}>
            <Text style={styles.manualLabel}>Name</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoFocus
              accessibilityLabel="Friend name"
            />
          </View>

          <View style={styles.manualInputGroup}>
            <Text style={styles.manualLabel}>Phone number or email address</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="+1 555 123 4567 or email@example.com"
              placeholderTextColor="#9ca3af"
              value={contact}
              onChangeText={setContact}
              autoCapitalize="none"
              accessibilityLabel="Friend contact"
            />
          </View>
        </ScrollView>

        <View style={styles.manualButtonContainer}>
          <TouchableOpacity
            style={[styles.manualDoneButton, disabled && styles.manualDoneButtonDisabled]}
            onPress={handleDone}
            disabled={disabled}
            accessibilityRole="button"
          >
            <Text
              style={[styles.manualDoneButtonText, disabled && styles.manualDoneButtonTextDisabled]}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
