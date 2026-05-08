import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function NewContactScreen() {
  const { initialName } = useLocalSearchParams();
  const [name, setName] = useState((initialName as string) || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    // Volvemos a 'add.tsx' pero pasando los datos del nuevo contacto
    // para que la pantalla anterior lo agregue a la lista seleccionada
    router.dismiss();
    router.setParams({
      newContactName: name,
      newContactPhone: phone,
      newContactEmail: email,
    });
  };

  return (
    <ScreenWrapper withInput>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Add new contact</Text>
        <TouchableOpacity onPress={handleSave} disabled={!name}>
          <Text style={[styles.saveText, !name && { color: '#ccc' }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoFocus
          placeholder="Enter name"
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+1 555..."
        />

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="example@mail.com"
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: { fontSize: 17, fontWeight: '600' },
  saveText: { fontSize: 16, fontWeight: 'bold', color: Colors.brand.primary },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
});
