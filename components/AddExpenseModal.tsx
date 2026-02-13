import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/hooks/useAuth';
import { createExpenseBetweenFriends } from '@/lib/expenses';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
}

export default function AddExpenseModal({ 
  visible, 
  onClose, 
  friendId, 
  friendName 
}: AddExpenseModalProps) {
  const { user } = useAuth();
  const { addExpense } = useFriends();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 300);
    } else {
      setDescription('');
      setAmount('');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!description || !amount) {
      Alert.alert('Missing info', 'Please enter a description and amount.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add expenses');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const result = await createExpenseBetweenFriends({
        payerId: user.id,
        friendId: friendId,
        amount: numericAmount,
        description: description,
        category: 'uncategorized',
      });

      if (!result.success) {
        throw new Error('Failed to create expense');
      }

      addExpense(friendId, description, numericAmount);

      Alert.alert('Success', 'Expense added successfully');
      onClose();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.headerButton}
            disabled={loading}
          >
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add an expense</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.headerButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#5bc5a7" />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 200 }}
        >
          
          <View style={styles.withContainer}>
            <Text style={styles.withLabel}>With <Text style={{fontWeight: 'bold'}}>you</Text> and:</Text>
            <View style={styles.chip}>
                <View style={styles.avatarSmall}>
                    <Text style={styles.avatarText}>{friendName.charAt(0)}</Text>
                </View>
                <Text style={styles.chipText}>{friendName}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputRow}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="file-document-outline" size={24} color="#ccc" />
              </View>
              <TextInput
                ref={descriptionInputRef}
                style={styles.descriptionInput}
                placeholder="Enter a description"
                placeholderTextColor="#ccc"
                value={description}
                onChangeText={setDescription}
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputRow, { marginTop: 15 }]}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="currency-usd" size={24} color="#ccc" />
              </View>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#ccc"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.splitSection}>
            <Text style={styles.splitText}>
                Paid by <Text style={styles.boldText}>you</Text> and split <Text style={styles.boldText}>equally</Text>
            </Text>
          </View>
        </ScrollView>

        <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolItem} disabled={loading}>
                <Ionicons name="calendar-outline" size={20} color="#555" />
                <Text style={styles.toolText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolItem} disabled={loading}>
                <Ionicons name="people-outline" size={20} color="#555" />
                <Text style={styles.toolText}>No group</Text>
            </TouchableOpacity>

            <View style={{flex: 1}} /> 

            <TouchableOpacity style={styles.toolItemIconOnly} disabled={loading}>
                <Ionicons name="camera-outline" size={24} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolItemIconOnly} disabled={loading}>
                <Ionicons name="create-outline" size={24} color="#555" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    padding: 5,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5bc5a7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  withContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  withLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  avatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  iconBox: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    height: 40,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    paddingVertical: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    paddingVertical: 10,
  },
  splitSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  splitText: {
    fontSize: 14,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toolText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  toolItemIconOnly: {
    padding: 8,
    marginLeft: 10,
  }
});
