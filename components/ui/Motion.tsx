import { Children, isValidElement, useEffect, useState } from 'react';
import { CircleCheck, type LucideIcon } from 'lucide-react-native';
import { View, type ViewProps } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Text, type TextVariant } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

/**
 * The app's motion vocabulary. Every flourish here is decorative only —
 * nothing gates a tap, blocks a verdict or delays a warning, and everything
 * stops flat when the device asks for reduced motion.
 */

/** Shared values are mutable by design; writing `.value` drives the animation. */
function set(target: { value: number }, next: number) {
  // oxlint-disable-next-line react/immutability
  target.value = next;
}

/** False when the OS asks for less motion — loops and flourishes stay off. */
export function useMotionOk(): boolean {
  return !useReducedMotion();
}

type RevealProps = ViewProps & {
  /** Milliseconds before this element starts moving in. */
  delay?: number;
  /** Distance in px the element rises from. */
  distance?: number;
};

/** Fade-and-rise entrance for a section of a screen. */
export function Reveal({ delay = 0, distance = 14, style, children, ...rest }: RevealProps) {
  const motionOk = useMotionOk();
  const progress = useSharedValue(motionOk ? 0 : 1);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(
      progress,
      withDelay(delay, withTiming(1, { duration: 340, easing: Easing.out(Easing.quad) })),
    );
    return () => cancelAnimation(progress);
  }, [delay, motionOk, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return (
    <AnimatedView style={[animatedStyle, style]} {...rest}>
      {children}
    </AnimatedView>
  );
}

/** Wraps a list of children so each one reveals a beat after the previous. */
export function Stagger({
  children,
  step = 70,
  initialDelay = 0,
  distance = 14,
}: {
  children: React.ReactNode;
  step?: number;
  initialDelay?: number;
  distance?: number;
}) {
  const { result } = Children.toArray(children).reduce<{
    position: number;
    result: React.ReactNode[];
  }>(
    (acc, child) => {
      if (!isValidElement(child)) {
        return { position: acc.position, result: [...acc.result, child] };
      }
      const delay = initialDelay + acc.position * step;
      const node = (
        <Reveal key={child.key ?? acc.result.length} delay={delay} distance={distance}>
          {child}
        </Reveal>
      );
      return { position: acc.position + 1, result: [...acc.result, node] };
    },
    { position: 0, result: [] },
  );
  return <>{result}</>;
}

type PopInProps = ViewProps & {
  delay?: number;
  /** Scale the element springs up from. */
  from?: number;
};

/** Spring pop for badges, verdict icons and confirmation marks. */
export function PopIn({ delay = 0, from = 0.84, style, children, ...rest }: PopInProps) {
  const motionOk = useMotionOk();
  const scale = useSharedValue(motionOk ? from : 1);
  const opacity = useSharedValue(motionOk ? 0 : 1);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(scale, withDelay(delay, withSpring(1, { damping: 13, stiffness: 170 })));
    set(opacity, withDelay(delay, withTiming(1, { duration: 220 })));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [delay, motionOk, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView style={[animatedStyle, style]} {...rest}>
      {children}
    </AnimatedView>
  );
}

/** Counts a stat up from zero on mount, so numbers land instead of appearing. */
export function CountUp({
  value,
  duration = 850,
  variant = 'numeral',
  className,
  suffix = '',
}: {
  value: number;
  duration?: number;
  variant?: TextVariant;
  className?: string;
  suffix?: string;
}) {
  const motionOk = useMotionOk();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!motionOk) return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - (1 - elapsed) ** 3;
      setDisplay(Math.round(value * eased));
      if (elapsed >= 1) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [duration, motionOk, value]);

  const shown = motionOk ? display : value;

  return (
    <Text variant={variant} className={className}>
      {`${shown}${suffix}`}
    </Text>
  );
}

/** Slow radar-style rings, sized to sit behind a ring or icon. */
export function PulseRings({
  size,
  color = colors.brandMint,
  count = 2,
  duration = 2800,
}: {
  size: number;
  color?: string;
  count?: number;
  duration?: number;
}) {
  const motionOk = useMotionOk();
  if (!motionOk) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute items-center justify-center"
      style={{ width: size, height: size }}
    >
      {Array.from({ length: count }, (_, index) => (
        <PulseRing
          key={`pulse-ring-${index * duration}`}
          size={size}
          color={color}
          delay={(duration / count) * index}
          duration={duration}
        />
      ))}
    </View>
  );
}

function PulseRing({
  size,
  color,
  delay,
  duration,
}: {
  size: number;
  color: string;
  delay: number;
  duration: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    set(
      progress,
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.ease) }), -1, false),
      ),
    );
    return () => cancelAnimation(progress);
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - progress.value),
    transform: [{ scale: 0.7 + progress.value * 0.52 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/** Small notification dot with a breathing halo. */
export function PulseDot({ color = colors.riskRed, size = 10 }: { color?: string; size?: number }) {
  const motionOk = useMotionOk();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(
      pulse,
      withRepeat(withTiming(1, { duration: 1900, easing: Easing.out(Easing.ease) }), -1, false),
    );
    return () => cancelAnimation(pulse);
  }, [motionOk, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.7 }],
  }));

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          haloStyle,
        ]}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: colors.ink,
        }}
      />
    </View>
  );
}

/** Very slow vertical drift — used on empty-state and celebration icons. */
export function Floaty({
  distance = 5,
  duration = 2800,
  style,
  children,
  ...rest
}: ViewProps & { distance?: number; duration?: number }) {
  const motionOk = useMotionOk();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(
      drift,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    return () => cancelAnimation(drift);
  }, [drift, duration, motionOk]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -drift.value * distance }],
  }));

  return (
    <AnimatedView style={[animatedStyle, style]} {...rest}>
      {children}
    </AnimatedView>
  );
}

/**
 * Breathing outline that draws the eye to a high-risk surface without
 * flashing or shouting. Absolutely positioned inside its parent.
 */
export function AttentionGlow({
  color,
  radius = 24,
  duration = 1900,
}: {
  color: string;
  radius?: number;
  duration?: number;
}) {
  const motionOk = useMotionOk();
  const pulse = useSharedValue(0.12);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(
      pulse,
      withRepeat(withTiming(0.55, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    return () => cancelAnimation(pulse);
  }, [duration, motionOk, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: radius,
          borderWidth: 1.5,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/** One-shot celebration: an expanding ring and a few dots leaving an icon. */
export function SuccessBurst({
  icon: Icon = CircleCheck,
  color = colors.brandMint,
  size = 76,
  dotCount = 8,
}: {
  icon?: LucideIcon;
  color?: string;
  size?: number;
  dotCount?: number;
}) {
  const motionOk = useMotionOk();
  const ring = useSharedValue(0);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(ring, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(ring);
  }, [motionOk, ring]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.5,
    transform: [{ scale: 0.68 + ring.value * 1.1 }],
  }));

  const angles = Array.from({ length: dotCount }, (_, index) => (index / dotCount) * 2 * Math.PI);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: color,
          },
          ringStyle,
        ]}
      />
      {motionOk
        ? angles.map((angle) => (
            <BurstDot key={`burst-${angle}`} angle={angle} color={color} radius={size * 0.6} />
          ))
        : null}
      <PopIn from={0.5} className="items-center justify-center">
        <LinearGradient
          colors={[colors.brandTeal, colors.brandMint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center justify-center rounded-full"
          style={{ width: size * 0.62, height: size * 0.62 }}
        >
          <Icon color="#08231D" size={size * 0.32} strokeWidth={2} />
        </LinearGradient>
      </PopIn>
    </View>
  );
}

function BurstDot({ angle, color, radius }: { angle: number; color: string; radius: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    set(
      progress,
      withDelay(120, withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) })),
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.sin(angle) * radius * progress.value },
      { translateY: -Math.cos(angle) * radius * progress.value },
      { scale: 1 - progress.value * 0.45 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

/** Sweeping line inside the QR framing guide — reads as "looking", not "loading". */
export function ScanBeam({
  size,
  color = colors.brandMint,
  duration = 2400,
}: {
  size: number;
  color?: string;
  duration?: number;
}) {
  const motionOk = useMotionOk();
  const travel = useSharedValue(0);

  useEffect(() => {
    if (!motionOk) return undefined;
    set(
      travel,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    return () => cancelAnimation(travel);
  }, [duration, motionOk, travel]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + (1 - Math.abs(travel.value - 0.5) * 2) * 0.6,
    transform: [{ translateY: travel.value * (size - 3) }],
  }));

  if (!motionOk) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, width: size, height: 3 }, animatedStyle]}
    >
      <LinearGradient
        colors={[`${color}00`, color, `${color}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, borderRadius: 2 }}
      />
    </Animated.View>
  );
}
