import { AuthProvider } from '@/contexts/AuthContext';
import { FriendsProvider } from '@/contexts/FriendsContext';
import '@/lib/i18n';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FriendsProvider>
          <StatusBar style="dark" />
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
              name="new-contact"
              options={{ presentation: 'card', headerShown: false }}
            />
            <Stack.Screen
              name="review-friends"
              options={{ presentation: 'card', headerShown: false }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </FriendsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
