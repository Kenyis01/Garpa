import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60 },
        headerShown: false, // Ocultamos el header nativo de las tabs
      }}>
      
      {/* 1. Pestaña Amigos (Apunta a friends.tsx) */}
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />

      {/* 2. Pestaña Grupos (Apunta a groups.tsx) */}
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />

      {/* 3. Pestaña Actividad (Apunta a activity.tsx) */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Ionicons name="pulse-outline" size={24} color={color} />,
        }}
      />

      {/* 4. Pestaña Cuenta (Apunta a account.tsx) */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />

      {/* Ocultamos archivos que no son pestañas */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="add-expense-placeholder" options={{ href: null }} />
      <Tabs.Screen name="friends/[id]" options={{ href: null }} />
    </Tabs>
  );
}
