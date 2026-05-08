import React, { useEffect } from 'react';
import { type TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(
  require('react-native').TextInput
);

type Props = {
  value: number;
  prefix?: string;
  decimals?: number;
  style?: TextStyle | TextStyle[];
  duration?: number;
};

/**
 * Renders a number that animates from its previous value to the new one.
 * Uses an Animated TextInput (read-only) so the text re-renders without causing JS-side updates.
 */
export default function AnimatedAmount({ value, prefix = '$', decimals = 2, style, duration = 600 }: Props) {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${prefix}${progress.value.toFixed(decimals)}`,
      defaultValue: `${prefix}${progress.value.toFixed(decimals)}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      style={[{ padding: 0, margin: 0 }, style as any]}
      animatedProps={animatedProps}
    />
  );
}
