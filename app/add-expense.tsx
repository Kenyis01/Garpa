import { ScreenWrapper } from '@/components/ui/ScreenWrapper'; // <--- Importamos desde UI
import Colors from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddExpenseScreen() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Referencia para controlar el foco del input
  const descriptionInputRef = useRef<TextInput>(null);

  // Efecto para abrir el teclado automáticamente al entrar
  useEffect(() => {
    const timer = setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 600); // Pequeño delay para esperar la animación del modal
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    // Aquí iría la lógica de guardar
    router.back();
  };

  return (
    <ScreenWrapper withInput>
      {/* Configuración del Header Nativo para quitar lo negro */}
      <Stack.Screen
        options={{
          headerShown: true, // Queremos header, pero el nuestro personalizado
          title: 'Add an expense',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
            color: 'black',
          },
          headerShadowVisible: false, // Quita la sombra fea
          headerStyle: { backgroundColor: 'white' }, // Fondo blanco, no negro
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: -10, padding: 10 }}
            >
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={{ padding: 10 }}>
              <Text style={{ color: Colors.brand.primary, fontSize: 17, fontWeight: '600' }}>
                Save
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        {/* Sección "With you and..." */}
        <View style={styles.row}>
          <Text style={styles.label}>
            With <Text style={{ fontWeight: 'bold' }}>you</Text> and:{' '}
          </Text>
          <View style={styles.chip}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>F</Text>
            </View>
            <Text style={styles.chipText}>Friend</Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Descripción */}
          <View style={styles.inputRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#ccc" />
            </View>
            <TextInput
              ref={descriptionInputRef} // <--- AutoFocus aplicado aquí
              style={styles.textInput}
              placeholder="Enter a description"
              placeholderTextColor="#ccc"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Monto */}
          <View style={[styles.inputRow, { marginTop: 24 }]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="currency-usd" size={28} color="#ccc" />
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#ccc"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric" // Teclado numérico
            />
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.splitInfo}>
          <Text style={styles.splitText}>
            Paid by <Text style={{ fontWeight: 'bold' }}>you</Text> and split{' '}
            <Text style={{ fontWeight: 'bold' }}>equally</Text>
          </Text>
        </View>
      </View>

      {/* Toolbar inferior (simulada) */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn}>
          <Text style={styles.toolText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn}>
          <Text style={styles.toolText}>No group</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 16, color: '#333' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: { fontSize: 10, color: 'white', fontWeight: 'bold' },
  chipText: { fontSize: 14, color: '#333' },

  form: { marginTop: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    height: 40,
  },

  textInput: { flex: 1, fontSize: 18, color: 'black' },
  amountInput: { flex: 1, fontSize: 36, fontWeight: 'bold', color: 'black' },

  splitInfo: { alignItems: 'center', marginTop: 30 },
  splitText: { fontSize: 14, color: '#333' },

  toolbar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#f0f0f0' },
  toolBtn: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  toolText: { fontSize: 12, color: '#555' },
});
