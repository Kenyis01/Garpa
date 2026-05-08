import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ARS', 'BRL', 'MXN', 'CLP', 'COP'];
const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'French'];

export default function PreferencesScreen() {
  const { session } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('English');
  const [privacySearchable, setPrivacySearchable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('currency, language, privacy_searchable')
          .eq('id', session.user.id)
          .single();
        if (cancelled || !data) return;
        setCurrency(data.currency ?? 'USD');
        setLanguage(data.language ?? 'English');
        setPrivacySearchable(data.privacy_searchable ?? true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleSave() {
    if (!session?.user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency, language, privacy_searchable: privacySearchable } as any)
        .eq('id', session.user.id);
      if (error) throw error;
      Alert.alert('Saved', 'Preferences updated.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5BC5A7" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Preferences',
          headerTintColor: '#5BC5A7',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving} style={{ padding: 8 }}>
              {saving ? (
                <ActivityIndicator size="small" color="#5BC5A7" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Currency */}
        <Text style={styles.sectionLabel}>DEFAULT CURRENCY</Text>
        <View style={styles.optionsGroup}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity key={c} style={styles.optionRow} onPress={() => setCurrency(c)}>
              <Text style={styles.optionText}>{c}</Text>
              {currency === c && <Ionicons name="checkmark" size={20} color="#5BC5A7" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>LANGUAGE</Text>
        <View style={styles.optionsGroup}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity key={l} style={styles.optionRow} onPress={() => setLanguage(l)}>
              <Text style={styles.optionText}>{l}</Text>
              {language === l && <Ionicons name="checkmark" size={20} color="#5BC5A7" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <View style={styles.optionsGroup}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.switchLabel}>Allow others to find me</Text>
              <Text style={styles.switchDesc}>
                People can search for you by email or phone number to add you as a friend.
              </Text>
            </View>
            <Switch
              value={privacySearchable}
              onValueChange={setPrivacySearchable}
              trackColor={{ false: '#d1d5db', true: '#5BC5A7' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#5BC5A7', fontSize: 16, fontWeight: '700' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  optionsGroup: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  optionText: { flex: 1, fontSize: 16, color: '#111' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  switchLabel: { fontSize: 16, color: '#111', fontWeight: '500', marginBottom: 4 },
  switchDesc: { fontSize: 13, color: '#9ca3af', lineHeight: 18 },
});
