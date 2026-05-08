import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';
import type { Contact } from './types';

type Props = {
  contacts: Contact[];
  onRemove: (id: string) => void;
};

export function SelectedRail({ contacts, onRemove }: Props) {
  if (contacts.length === 0) return null;
  return (
    <View style={styles.selectedSection}>
      <Text style={styles.selectedSectionTitle}>People to add</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectedScrollContent}
      >
        {contacts.map((c) => (
          <View key={c.id} style={styles.selectedAvatarContainer}>
            <View style={styles.selectedAvatarCircle}>
              <Text style={styles.selectedAvatarText}>{c.name.charAt(0).toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(c.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${c.name}`}
            >
              <Ionicons name="close-circle" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
