import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Options = {
  /** Scale while a finger is down. */
  pressScale?: number;
  /** Scale while a mouse pointer hovers (web / desktop). */
  hoverScale?: number;
  /** Opacity while a finger is down. */
  pressOpacity?: number;
};

/**
 * Shared press + hover feedback for every tappable surface: buttons, cards,
 * quick actions and list rows all lift slightly under a pointer and settle
 * back in when pressed, so the whole app responds the same way.
 */

function to(target: number, value: { value: number }, duration = 140) {
  // oxlint-disable-next-line react/immutability -- shared values are mutable by design
  value.value = withTiming(target, { duration });
}

export function usePressFeedback({
  pressScale = 0.97,
  hoverScale = 1.02,
  pressOpacity = 0.9,
}: Options = {}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const hovered = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  /** 0 → 1 as the pointer enters; drive glows, borders or shadows with it. */
  const hoverStyle = useAnimatedStyle(() => ({ opacity: hovered.value }));

  const pressHandlers = {
    onPressIn: () => {
      to(pressScale, scale, 110);
      to(pressOpacity, opacity, 110);
    },
    onPressOut: () => {
      to(hovered.value > 0 ? hoverScale : 1, scale, 180);
      to(1, opacity, 180);
    },
    onHoverIn: () => {
      to(1, hovered, 180);
      to(hoverScale, scale, 180);
    },
    onHoverOut: () => {
      to(0, hovered, 180);
      to(1, scale, 180);
    },
  };

  return { animatedStyle, hoverStyle, pressHandlers };
}
