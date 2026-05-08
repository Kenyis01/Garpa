import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { logError } from '@/lib/logger';
import { queryKeys } from '@/lib/queryClient';
import { parseAmountInput } from '@/lib/validation';
import { createSettlement } from '@/services/settlements';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
  balance: number;
};

export default function SettleUpModal({ visible, onClose, friendId, friendName, balance }: Props) {
  const { user } = useAuth();
  const { setBalance } = useFriends();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const absBalance = Math.abs(balance);
  const userOwes = balance < 0;

  useEffect(() => {
    if (visible) {
      setAmount(absBalance > 0 ? absBalance.toFixed(2) : '');
      setNote('');
    }
  }, [visible, absBalance]);

  if (!user) return null;

  const headerText = userOwes
    ? t('settle.you_pay', { name: friendName })
    : t('settle.they_pay', { name: friendName });

  async function handleConfirm() {
    if (absBalance === 0) {
      Alert.alert(t('common.error'), t('settle.nothing_to_settle'));
      return;
    }

    let numericAmount: number;
    try {
      numericAmount = parseAmountInput(amount);
    } catch {
      Alert.alert(t('common.error'), t('expenses.invalid_amount'));
      return;
    }

    setLoading(true);
    try {
      const result = await createSettlement({
        payerId: userOwes ? user!.id : friendId,
        payeeId: userOwes ? friendId : user!.id,
        amount: numericAmount,
        currencyCode: 'USD',
        note: note.trim() || undefined,
      });
      if (!result.success) throw result.error;

      const newBalance = userOwes ? balance + numericAmount : balance - numericAmount;
      setBalance(friendId, Number(newBalance.toFixed(2)));

      queryClient.invalidateQueries({
        queryKey: queryKeys.balanceWith(user!.id, friendId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlementsBetween(user!.id, friendId),
      });

      onClose();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed');
      logError('SettleUpModal.handleConfirm', error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settle.title')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>{headerText}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('settle.amount')}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!loading}
              accessibilityLabel="Settlement amount"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('settle.note')}</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Cash, transfer, ..."
              editable={!loading}
              maxLength={160}
              accessibilityLabel="Settlement note"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>{t('settle.confirm')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  body: { padding: 20, gap: 16 },
  subtitle: { fontSize: 16, color: '#374151', marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  amountInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  noteInput: {
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footer: { padding: 16, marginTop: 'auto' },
  confirmButton: {
    backgroundColor: '#5BC5A7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
