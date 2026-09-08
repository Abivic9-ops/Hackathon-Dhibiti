import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * The app's single loading indicator: a ring of dots that rotates.
 * Used on the splash, in the "checking" moment and inside buttons —
 * Dhibiti never shows a linear progress bar for indeterminate waits.
 */
export function DottedSpinner({
  size = 44,
  dotCount = 8,
  color = colors.brandMint,
  duration = 1200,
  className,
}: {
  size?: number;
  dotCount?: number;
  color?: string;
  duration?: number;
  className?: string;
}) {
  const spin = useSharedValue(0);

  useEffect(() => {
    // Reanimated shared values are mutable by design: writing `.value` from an
    // effect is the documented way to drive an animation.
    // oxlint-disable-next-line react/immutability
    spin.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const dot = Math.max(3, Math.round(size * 0.13));
  const radius = (size - dot) / 2;
  const dots = Array.from({ length: dotCount }, (_, index) => index);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <Animated.View style={[{ width: size, height: size }, spinStyle]}>
        {dots.map((index) => {
          const angle = (index / dotCount) * 2 * Math.PI;
          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                backgroundColor: color,
                // Fade the trailing dots so the rotation reads as motion.
                opacity: 0.18 + (index / (dotCount - 1)) * 0.82,
                left: radius + radius * Math.sin(angle),
                top: radius - radius * Math.cos(angle),
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}
