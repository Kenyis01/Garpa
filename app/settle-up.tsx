import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { recordSettlement } from '@/services/friends';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettleUpScreen() {
  const {
    friendId,
    friendName,
    balance: balanceStr,
  } = useLocalSearchParams<{
    friendId: string;
    friendName: string;
    balance: string;
  }>();
  const { user } = useAuth();
  const { refreshFriends } = useFriends();

  const balance = parseFloat(balanceStr ?? '0');
  // positive = they owe me, negative = I owe them
  const iOwe = balance < 0;
  const suggestedAmount = Math.abs(balance).toFixed(2);

  const [amount, setAmount] = useState(suggestedAmount);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSettle() {
    const numeric = parseFloat(amount);
    if (!numeric || numeric <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!user || !friendId) return;

    setSaving(true);
    try {
      // Payer = whoever owes money
      const payerId = iOwe ? user.id : friendId;
      const receiverId = iOwe ? friendId : user.id;

      await recordSettlement({
        payerId,
        receiverId,
        amount: numeric,
        note: note.trim() || undefined,
      });

      await refreshFriends();
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settle up',
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="close" size={26} color="#111" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(friendName ?? '?').charAt(0).toUpperCase()}</Text>
            </View>
            <Ionicons
              name={iOwe ? 'arrow-forward' : 'arrow-back'}
              size={28}
              color="#5BC5A7"
              style={{ marginHorizontal: 12 }}
            />
            <View style={[styles.avatar, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="person" size={22} color="#10b981" />
            </View>
          </View>

          <Text style={styles.summaryText}>
            {iOwe ? `You owe ${friendName}` : `${friendName} owes you`}
          </Text>
          <Text style={styles.summaryBalance}>${Math.abs(balance).toFixed(2)}</Text>
        </View>

        {/* Amount input */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>
          <TouchableOpacity onPress={() => setAmount(suggestedAmount)} style={styles.fullAmountBtn}>
            <Text style={styles.fullAmountBtnText}>Use full amount (${suggestedAmount})</Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What's this payment for?"
            placeholderTextColor="#aaa"
            value={note}
            onChangeText={setNote}
            maxLength={100}
          />
        </View>

        {/* Record button */}
        <TouchableOpacity
          style={[styles.recordBtn, saving && { opacity: 0.6 }]}
          onPress={handleSettle}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.recordBtnText}>Record payment</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This records the payment in Garpa but doesn't actually send money. Use Venmo, bank
          transfer, or cash to complete the payment.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#4b5563' },
  summaryText: { fontSize: 16, color: '#6b7280', marginBottom: 6 },
  summaryBalance: { fontSize: 32, fontWeight: '800', color: '#111' },
  section: { marginBottom: 24 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#5BC5A7',
    paddingBottom: 6,
  },
  currency: { fontSize: 30, fontWeight: '700', color: '#5BC5A7', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '700', color: '#111' },
  fullAmountBtn: { marginTop: 8 },
  fullAmountBtnText: { fontSize: 13, color: '#5BC5A7', fontWeight: '500' },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111',
  },
  recordBtn: {
    backgroundColor: '#5BC5A7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  recordBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
