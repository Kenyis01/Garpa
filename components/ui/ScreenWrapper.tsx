import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  StyleSheet,
  View
} from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: any;
  withInput?: boolean; // Ponlo en true si la pantalla tiene formularios
}

export const ScreenWrapper = ({ children, style, withInput = false }: ScreenWrapperProps) => {
  // Ajuste para Android que a veces ignora el SafeArea
  const paddingTop = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

  const Content = (
    <SafeAreaView style={[styles.container, { paddingTop }, style]}>
      {/* Esto controla la barrita de hora/batería del celular */}
      <StatusBar style="dark" backgroundColor="white" />
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );

  if (withInput) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Ajuste fino
      >
        {Content}
      </KeyboardAvoidingView>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});