import { useAuth } from '@/hooks';
import { supabase } from '@/lib';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
  }, [session]);

  async function handleSave() {
    if (!session?.user) return;
    const name = fullName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', session.user.id);

      if (error) throw error;
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit account',
          headerTintColor: '#5BC5A7',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ padding: 8 }}>
              {loading ? (
                <ActivityIndicator size="small" color="#5BC5A7" />
              ) : (
                <Text style={styles.saveBtn}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your name"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          autoFocus
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabled]}
          value={session?.user?.email ?? ''}
          editable={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  saveBtn: { fontSize: 17, color: '#5BC5A7', fontWeight: '600' },
  label: { fontSize: 13, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8, marginTop: 20 },
  input: { fontSize: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 10, color: '#111' },
  disabled: { color: '#9ca3af' },
});
