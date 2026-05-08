import Colors from '@/constants/Colors';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button = ({ title, variant = 'primary', isLoading, style, ...props }: ButtonProps) => {
  const getBackgroundColor = () => {
    if (props.disabled) return '#ccc';
    switch (variant) {
      case 'primary':
        return Colors.brand.primary;
      case 'danger':
        return Colors.brand.orange; // O el rojo de danger
      case 'outline':
        return 'transparent';
      default:
        return Colors.brand.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return Colors.brand.primary;
    return '#fff';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: Colors.brand.primary,
        },
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
