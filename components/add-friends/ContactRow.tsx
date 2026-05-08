import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';
import type { Contact } from './types';

type Props = {
  contact: Contact;
  selected: boolean;
  onToggle: (contact: Contact) => void;
};

export const ContactRow = memo(function ContactRow({ contact, selected, onToggle }: Props) {
  const initial = contact.name.charAt(0).toUpperCase();
  return (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => onToggle(contact)}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${contact.name}`}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone || contact.email}</Text>
      </View>
      <View style={styles.radioContainer}>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
});
