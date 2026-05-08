import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { useFriends } from '@/contexts/FriendsContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReviewFriendsScreen() {
  const { contacts } = useLocalSearchParams();
  const { addFriends } = useFriends();

  // Parseamos los contactos que vienen como string desde la pantalla anterior
  const contactsList = contacts ? JSON.parse(contacts as string) : [];

  const handleFinish = () => {
    // 1. Guardamos en el contexto
    addFriends(contactsList);

    // 2. Volvemos al inicio (Friends Tab)
    // dismissAll cierra todos los modales y vuelve a la pantalla base
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(tabs)/friends');
    }
  };

  return (
    <ScreenWrapper>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Review',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleFinish}>
              <Text style={{ color: Colors.brand.primary, fontWeight: 'bold', fontSize: 16 }}>
                Add friends
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        <Text style={styles.label}>Add {contactsList.length} people to Splitwise?</Text>

        <FlatList
          data={contactsList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>{item.email || item.phone}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>These people will be notified you've added them.</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={handleFinish}>
            <Text style={styles.confirmText}>Add friends</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  name: { fontWeight: '600', fontSize: 16 },
  detail: { color: '#666' },
  footer: { marginTop: 'auto', marginBottom: 20 },
  disclaimer: { color: '#888', textAlign: 'center', marginBottom: 15, fontSize: 12 },
  confirmButton: {
    backgroundColor: Colors.brand.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
