import { AuthProvider, FriendsProvider } from '@/contexts';
import { useAuth } from '@/hooks';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/friends');
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-friends"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="add-expense"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="settle-up"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="create-group"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="group/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="preferences" options={{ headerShown: true }} />
      <Stack.Screen name="account/edit" options={{ headerShown: true }} />
      <Stack.Screen
        name="new-contact"
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="review-friends"
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FriendsProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </FriendsProvider>
    </AuthProvider>
  );
}
