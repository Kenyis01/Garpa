import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/hooks';

export default function LoginScreen() {
  const { loading, signInWithPassword, signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState<'login' | 'signup' | null>(null);

  const isBusy = loading || submitting !== null;

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Por favor completa Email y Password.');
      return;
    }
    setSubmitting('login');
    try {
      await signInWithPassword(email.trim(), password);
      // La navegación se puede manejar escuchando cambios de sesión
    } catch (error: any) {
      Alert.alert('Error al ingresar', error.message ?? 'Intenta nuevamente.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Por favor completa Email y Password.');
      return;
    }
    setSubmitting('signup');
    try {
      await signUpWithPassword(email.trim(), password);
      Alert.alert('Cuenta creada', 'Revisa tu email si se requiere verificación.');
    } catch (error: any) {
      Alert.alert('Error al crear cuenta', error.message ?? 'Intenta nuevamente.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@email.com"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSignUp}
              disabled={isBusy}
            >
              {submitting === 'signup' ? (
                <ActivityIndicator color="#1f2933" />
              ) : (
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleLogin}
              disabled={isBusy}
            >
              {submitting === 'login' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, styles.primaryButtonText]}>Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#020617',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.25)',
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#e5e7eb',
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#0b1120',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
  },
});

