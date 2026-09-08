import { type PressableProps, View, type ViewProps } from 'react-native';

import { AnimatedPressable } from '@/components/ui/primitives/AnimatedPressable';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { cn } from '@/lib/utils';

/**
 * The single card surface used for stats, activity rows, saved recipients,
 * literacy cards and radar items. Subtle elevation, no hard borders.
 */
export function Card({ className, ...rest }: ViewProps) {
  return (
    <View
      className={cn('bg-surface border-border/60 rounded-[20px] border p-4', className)}
      {...rest}
    />
  );
}

/** Tappable card: lifts under a pointer, settles in when pressed. */
export function PressableCard({ className, disabled, ...rest }: PressableProps) {
  const { animatedStyle, pressHandlers } = usePressFeedback({
    pressScale: 0.98,
    hoverScale: 1.015,
    pressOpacity: 0.85,
  });

  return (
    <AnimatedPressable
      disabled={disabled}
      style={animatedStyle}
      {...(disabled ? {} : pressHandlers)}
      className={cn('bg-surface border-border/60 rounded-[20px] border p-4', className)}
      {...rest}
    />
  );
}
