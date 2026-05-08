import AnimatedPressable from '@/components/AnimatedPressable';
import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { createExpenseBetweenFriends } from '@/lib/expenses';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Subcategory = { key: string; label: string };
type CategoryGroup = { key: string; label: string; icon: string; subs: Subcategory[] };

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: 'food_drink',
    label: 'Food & Drink',
    icon: 'food-fork-drink',
    subs: [
      { key: 'restaurants', label: 'Dining out' },
      { key: 'groceries', label: 'Groceries' },
      { key: 'alcohol', label: 'Liquor / Alcohol' },
      { key: 'coffee', label: 'Coffee' },
    ],
  },
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    subs: [
      { key: 'rent', label: 'Rent' },
      { key: 'mortgage', label: 'Mortgage' },
      { key: 'utilities', label: 'Utilities' },
      { key: 'cleaning', label: 'Cleaning' },
      { key: 'furniture', label: 'Furniture' },
      { key: 'maintenance', label: 'Maintenance' },
    ],
  },
  {
    key: 'transportation',
    label: 'Transportation',
    icon: 'car',
    subs: [
      { key: 'gas', label: 'Gas / Fuel' },
      { key: 'parking', label: 'Parking' },
      { key: 'taxi', label: 'Taxi / Rideshare' },
      { key: 'transit', label: 'Bus / Train' },
      { key: 'flights', label: 'Flights' },
      { key: 'tolls', label: 'Tolls' },
    ],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    icon: 'ticket',
    subs: [
      { key: 'movies', label: 'Movies / Theatre' },
      { key: 'music', label: 'Music' },
      { key: 'sports', label: 'Sports / Outdoors' },
      { key: 'games', label: 'Games' },
    ],
  },
  {
    key: 'life',
    label: 'Life',
    icon: 'shopping',
    subs: [
      { key: 'clothing', label: 'Clothing' },
      { key: 'electronics', label: 'Electronics' },
      { key: 'gifts', label: 'Gifts' },
      { key: 'medical', label: 'Medical / Healthcare' },
      { key: 'gym', label: 'Gym / Fitness' },
      { key: 'education', label: 'Education' },
    ],
  },
  {
    key: 'travel',
    label: 'Travel',
    icon: 'airplane',
    subs: [
      { key: 'hotel', label: 'Hotel / Lodging' },
      { key: 'rental_car', label: 'Rental car' },
      { key: 'vacation', label: 'Vacation' },
    ],
  },
  {
    key: 'uncategorized',
    label: 'Uncategorized',
    icon: 'dots-horizontal',
    subs: [{ key: 'general', label: 'General' }],
  },
];

function findCategory(key: string): { group: CategoryGroup; sub?: Subcategory } {
  for (const g of CATEGORY_GROUPS) {
    if (g.key === key) return { group: g };
    const sub = g.subs.find((s) => s.key === key);
    if (sub) return { group: g, sub };
  }
  return { group: CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1] };
}

type SplitType = 'equal' | 'full_payer' | 'full_friend';
type RecurrenceInterval = 'never' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

const RECURRENCE_LABELS: Record<RecurrenceInterval, string> = {
  never: 'Does not repeat',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function AddExpenseScreen() {
  const { friendId, friendName, groupId } = useLocalSearchParams<{
    friendId?: string;
    friendName?: string;
    groupId?: string;
  }>();
  const { user } = useAuth();
  const { refreshFriends } = useFriends();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(new Date());
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceInterval>('never');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<CategoryGroup | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const descInputRef = useRef<TextInput>(null);

  const { group: selectedGroup, sub: selectedSub } = findCategory(category);
  const categoryLabel = selectedSub?.label ?? selectedGroup.label;
  const numericAmount = parseFloat(amount) || 0;

  const splitLabels: Record<SplitType, string> = {
    equal: 'Split equally',
    full_payer: 'You paid in full',
    full_friend: `${friendName ?? 'Friend'} paid in full`,
  };

  async function handleSave() {
    if (!description.trim()) {
      Alert.alert('Missing info', 'Please enter a description.');
      return;
    }
    if (!amount || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!user) return;
    if (!friendId) {
      Alert.alert('No friend selected', 'Please select a friend for this expense.');
      return;
    }

    setSaving(true);
    try {
      let payerId = user.id;
      let myShare = numericAmount / 2;
      let friendShare = numericAmount / 2;

      if (splitType === 'full_payer') {
        payerId = user.id;
        myShare = 0;
        friendShare = numericAmount;
      } else if (splitType === 'full_friend') {
        payerId = friendId;
        myShare = numericAmount;
        friendShare = 0;
      }

      await createExpenseBetweenFriends({
        payerId,
        friendId,
        amount: numericAmount,
        description: description.trim(),
        category,
        date: date.toISOString().split('T')[0],
        notes: notes.trim() || undefined,
        myShare,
        friendShare,
        recurrence: recurrence !== 'never' ? recurrence : undefined,
      });

      await refreshFriends();
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add an expense',
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="close" size={26} color="#111" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving} style={{ padding: 8 }}>
              <Text
                style={{
                  color: '#5BC5A7',
                  fontSize: 17,
                  fontWeight: '600',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* With whom */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>With you and:</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{friendName ?? 'Select friend'}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={24}
            color="#9ca3af"
            style={styles.inputIcon}
          />
          <TextInput
            ref={descInputRef}
            style={styles.textInput}
            placeholder="Enter a description"
            placeholderTextColor="#ccc"
            value={description}
            onChangeText={setDescription}
            returnKeyType="next"
            autoFocus
          />
        </View>

        {/* Amount */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="currency-usd"
            size={28}
            color="#9ca3af"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#ccc"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Options row */}
        <View style={styles.optionsRow}>
          {/* Category */}
          <AnimatedPressable
            scaleTo={0.94}
            style={styles.optionBtn}
            onPress={() => {
              setSelectedParent(null);
              setShowCategoryModal(true);
            }}
          >
            <MaterialCommunityIcons name={selectedGroup.icon as any} size={18} color="#555" />
            <Text style={styles.optionBtnText}>{categoryLabel}</Text>
          </AnimatedPressable>

          {/* Date */}
          <AnimatedPressable
            scaleTo={0.94}
            style={styles.optionBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#555" />
            <Text style={styles.optionBtnText}>
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </AnimatedPressable>

          {/* Recurrence */}
          <AnimatedPressable
            scaleTo={0.94}
            style={styles.optionBtn}
            onPress={() => setShowRecurrenceModal(true)}
          >
            <Ionicons name="repeat" size={18} color={recurrence !== 'never' ? '#5BC5A7' : '#555'} />
            <Text style={[styles.optionBtnText, recurrence !== 'never' && { color: '#5BC5A7' }]}>
              {RECURRENCE_LABELS[recurrence]}
            </Text>
          </AnimatedPressable>
        </View>

        {/* Split options */}
        <View style={styles.splitSection}>
          <Text style={styles.splitTitle}>How to split</Text>
          {(['equal', 'full_payer', 'full_friend'] as SplitType[]).map((type) => (
            <AnimatedPressable
              key={type}
              scaleTo={0.97}
              style={[styles.splitOption, splitType === type && styles.splitOptionSelected]}
              onPress={() => setSplitType(type)}
            >
              <View style={[styles.radio, splitType === type && styles.radioSelected]}>
                {splitType === type && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.splitLabel, splitType === type && styles.splitLabelSelected]}>
                  {splitLabels[type]}
                </Text>
                {type === 'equal' && numericAmount > 0 && (
                  <Text style={styles.splitDetail}>${(numericAmount / 2).toFixed(2)} each</Text>
                )}
                {type === 'full_payer' && numericAmount > 0 && (
                  <Text style={styles.splitDetail}>
                    {friendName ?? 'Friend'} owes you ${numericAmount.toFixed(2)}
                  </Text>
                )}
                {type === 'full_friend' && numericAmount > 0 && (
                  <Text style={styles.splitDetail}>
                    You owe {friendName ?? 'Friend'} ${numericAmount.toFixed(2)}
                  </Text>
                )}
              </View>
            </AnimatedPressable>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={24}
            color="#9ca3af"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Add a note (optional)"
            placeholderTextColor="#ccc"
            value={notes}
            onChangeText={setNotes}
            returnKeyType="done"
            multiline
          />
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalSheet}>
            {selectedParent ? (
              <>
                <TouchableOpacity onPress={() => setSelectedParent(null)} style={styles.backRow}>
                  <Ionicons name="chevron-back" size={20} color="#5BC5A7" />
                  <Text style={styles.backText}>{selectedParent.label}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedParent.label}</Text>
                {selectedParent.subs.map((sub) => (
                  <TouchableOpacity
                    key={sub.key}
                    style={styles.categoryRow}
                    onPress={() => {
                      setCategory(sub.key);
                      setShowCategoryModal(false);
                      setSelectedParent(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === sub.key && { color: '#5BC5A7', fontWeight: '700' },
                      ]}
                    >
                      {sub.label}
                    </Text>
                    {category === sub.key && (
                      <Ionicons name="checkmark" size={18} color="#5BC5A7" />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Category</Text>
                {CATEGORY_GROUPS.map((grp) => (
                  <TouchableOpacity
                    key={grp.key}
                    style={styles.categoryRow}
                    onPress={() => setSelectedParent(grp)}
                  >
                    <MaterialCommunityIcons
                      name={grp.icon as any}
                      size={22}
                      color="#555"
                      style={{ width: 32 }}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        selectedGroup.key === grp.key && { color: '#5BC5A7', fontWeight: '700' },
                      ]}
                    >
                      {grp.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Recurrence Modal */}
      <Modal visible={showRecurrenceModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowRecurrenceModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Repeat</Text>
            {(Object.keys(RECURRENCE_LABELS) as RecurrenceInterval[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={styles.categoryRow}
                onPress={() => {
                  setRecurrence(r);
                  setShowRecurrenceModal(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    recurrence === r && { color: '#5BC5A7', fontWeight: '700' },
                  ]}
                >
                  {RECURRENCE_LABELS[r]}
                </Text>
                {recurrence === r && <Ionicons name="checkmark" size={18} color="#5BC5A7" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionLabel: { fontSize: 16, color: '#333' },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipText: { fontSize: 14, color: '#333', fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputIcon: { marginRight: 12, width: 32, textAlign: 'center' },
  textInput: { flex: 1, fontSize: 18, color: '#111' },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '700', color: '#111' },
  optionsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  optionBtnText: { fontSize: 13, color: '#555', fontWeight: '500' },
  splitSection: { padding: 20 },
  splitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  splitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    gap: 12,
  },
  splitOptionSelected: { borderColor: '#5BC5A7', backgroundColor: '#f0fdf9' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#5BC5A7' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5BC5A7' },
  splitLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  splitLabelSelected: { color: '#5BC5A7' },
  splitDetail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    gap: 4,
  },
  categoryLabel: { flex: 1, fontSize: 16, color: '#374151' },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  backText: { fontSize: 15, color: '#5BC5A7', fontWeight: '600' },
});
