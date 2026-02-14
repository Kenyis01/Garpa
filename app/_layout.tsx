import { AuthProvider } from '@/contexts/AuthContext';
import { FriendsProvider } from '@/contexts/FriendsContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
    <FriendsProvider>
      <StatusBar style="dark" />
      <Stack>
        {/* Las Pestañas (Tabs) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Login */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* --- MODALES (Entran desde abajo) --- */}
        <Stack.Screen 
          name="add-friends" 
          options={{ 
            presentation: 'modal', // Esto asegura la animación desde abajo
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="add-expense" 
          options={{ 
            presentation: 'modal', 
            headerShown: false 
          }} 
        />

        {/* --- PANTALLAS LATERALES (Entran de costado) --- */}
        <Stack.Screen 
          name="new-contact" 
          options={{ 
            presentation: 'card', 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="review-friends" 
          options={{ 
            presentation: 'card', 
            headerShown: false 
          }} 
        />
        
        <Stack.Screen name="+not-found" />
      </Stack>
    </FriendsProvider>
    </AuthProvider>
  );
}
