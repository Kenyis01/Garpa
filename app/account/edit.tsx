import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/hooks';
import { supabase } from '@/lib';
import type { Profile } from '@/types';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('English');
  const [privacy, setPrivacy] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    if (session?.user) fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!session?.user) return;

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profile = data as Profile;

        setFullName(profile.full_name ?? '');
        setPhone(profile.phone ?? '');
        setCurrency(profile.currency ?? 'USD');
        setTimezone(profile.timezone ?? '');
        setLanguage(profile.language ?? 'English');
        setPrivacy(profile.privacy_searchable ?? true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!session?.user) return;

      const updates: Partial<Profile> = {
        full_name: fullName || null,
        phone: phone || null,
        currency: currency || null,
        timezone: timezone || null,
        language: language || null,
        privacy_searchable: privacy,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully!');
      router.back(); // Volver a la pantalla anterior
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Configuración del Header para que tenga el botón Save */}
      <Stack.Screen 
        options={{
          title: 'Edit account',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#5BC5A7" /> : <Text style={styles.saveButton}>Save</Text>}
            </TouchableOpacity>
          ),
          headerTintColor: '#5BC5A7', // Color verde G garpa
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your name" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={session?.user?.email} 
            editable={false} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1 555 123 456" keyboardType="phone-pad" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Default currency</Text>
          <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="USD" autoCapitalize="characters" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time zone</Text>
          <TextInput style={styles.input} value={timezone} onChangeText={setTimezone} placeholder="(GMT-03:00) Buenos Aires" />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Language</Text>
          <TextInput style={styles.input} value={language} onChangeText={setLanguage} placeholder="English" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Privacy</Text>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Allow others to find me by email or phone</Text>
          <Switch 
            value={privacy} 
            onValueChange={setPrivacy}
            trackColor={{ false: "#767577", true: "#5BC5A7" }}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  saveButton: { fontSize: 18, color: '#5BC5A7', fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#888', marginBottom: 8, fontWeight: '600' },
  input: { 
    fontSize: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd', 
    paddingVertical: 8,
    color: '#333'
  },
  disabledInput: { color: '#ccc' },
  sectionHeader: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  switchLabel: { flex: 1, fontSize: 16, color: '#333', paddingRight: 10 },
});