import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  scaleTo?: number;
  children?: React.ReactNode;
};

/**
 * Pressable that scales down on press and springs back on release.
 * Drop-in replacement for TouchableOpacity / Pressable when a tactile feel is wanted.
 */
export default function AnimatedPressable({ scaleTo = 0.96, children, style, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 350 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 250 });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as any]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
