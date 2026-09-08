import { useEffect } from 'react';
import { View } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PopIn, useMotionOk } from '@/components/ui/Motion';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Circle, Svg } from '@/components/ui/primitives/Svg';
import { colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Slim progress bar used for locks, lesson progress and score streaks. */
export function ProgressBar({
  progress,
  color = colors.brandMint,
  className,
}: {
  /** 0–1 */
  progress: number;
  color?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const motionOk = useMotionOk();
  const fill = useSharedValue(motionOk ? 0 : clamped);

  useEffect(() => {
    if (!motionOk) {
      // oxlint-disable-next-line react/immutability -- shared values are mutable by design
      fill.value = clamped;
      return;
    }
    // oxlint-disable-next-line react/immutability -- shared values are mutable by design
    fill.value = withTiming(clamped, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [clamped, fill, motionOk]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View className={cn('bg-surface-tertiary h-2 w-full overflow-hidden rounded-full', className)}>
      <AnimatedView className="h-2 rounded-full" style={[{ backgroundColor: color }, fillStyle]} />
    </View>
  );
}

export type RingSegment = { value: number; color: string };

/**
 * Multi-segment donut used for the 7-day safety snapshot and the personal
 * safety score. Segment colors are always the functional risk colors.
 */
export function DonutRing({
  segments,
  size = 176,
  strokeWidth = 18,
  children,
}: {
  segments: RingSegment[];
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const gap = segments.length > 1 ? 0.018 : 0;

  const arcs = segments
    .filter((segment) => segment.value > 0)
    .reduce<{
      items: { key: string; color: string; length: number; offset: number }[];
      cumulative: number;
    }>(
      (acc, segment, index) => {
        const fraction = total > 0 ? segment.value / total : 0;
        const visible = Math.max(fraction - gap, 0.004);
        const arc = {
          key: `${segment.color}-${index}`,
          color: segment.color,
          length: circumference * visible,
          offset: circumference * acc.cumulative,
        };
        return { items: [...acc.items, arc], cumulative: acc.cumulative + fraction };
      },
      { items: [], cumulative: 0 },
    ).items;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <PopIn from={0.86} className="absolute" style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceTertiary}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        </Svg>
      </PopIn>
      <View className="items-center">{children}</View>
    </View>
  );
}
