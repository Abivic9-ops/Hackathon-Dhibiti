import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ScanBeam, useMotionOk } from '@/components/ui/Motion';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { colors, useTheme } from '@/lib/theme';

/** Shared values are mutable by design; writing `.value` drives the animation. */
function set(target: { value: number }, next: number) {
  // oxlint-disable-next-line react/immutability
  target.value = next;
}

const CORNER_THICKNESS = 4;
const CORNER_LENGTH = 40;
/** Fraction of each corner arm that wears the brand colour (vertex side). */
const CORNER_SPLIT = 0.5;
/** How far the whole targeting square springs inward when a code is "found". */
const LOCK_SCALE = 0.56;

type Segment = {
  key: string;
  horizontal: boolean;
  brand: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Two-tone corner brackets: the stretch nearest each vertex is the brand
 * gradient while the tips are neutral (white in light, ink in dark) — so the
 * frame pairs "white and the other colour" the same way in both themes.
 */
function cornerSegments(size: number): Segment[] {
  const t = CORNER_THICKNESS;
  const len = CORNER_LENGTH;
  const v = Math.round(len * CORNER_SPLIT);
  const s = size;
  const parts: Segment[] = [];
  const add = (
    key: string,
    horizontal: boolean,
    brand: boolean,
    left: number,
    top: number,
    width: number,
    height: number,
  ) => {
    parts.push({
      key: `corner-${key}`,
      horizontal,
      brand,
      left,
      top,
      width,
      height,
    });
  };

  // top-left (vertex 0,0): arms extend right and down.
  add('tl-hv', true, true, 0, 0, v, t);
  add('tl-ho', true, false, v, 0, len - v, t);
  add('tl-vv', false, true, 0, 0, t, v);
  add('tl-vo', false, false, 0, v, t, len - v);

  // top-right (vertex s,0): horizontal extends left, vertical extends down.
  add('tr-hv', true, true, s - v, 0, v, t);
  add('tr-ho', true, false, s - len, 0, len - v, t);
  add('tr-vv', false, true, s - t, 0, t, v);
  add('tr-vo', false, false, s - t, v, t, len - v);

  // bottom-left (vertex 0,s): horizontal extends right, vertical extends up.
  add('bl-hv', true, true, 0, s - t, v, t);
  add('bl-ho', true, false, v, s - t, len - v, t);
  add('bl-vv', false, true, 0, s - v, t, v);
  add('bl-vo', false, false, 0, s - len, t, len - v);

  // bottom-right (vertex s,s): arms extend left and up.
  add('br-hv', true, true, s - v, s - t, v, t);
  add('br-ho', true, false, s - len, s - t, len - v, t);
  add('br-vv', false, true, s - t, s - v, t, v);
  add('br-vo', false, false, s - t, s - len, t, len - v);

  return parts;
}

/**
 * The QR targeting frame. Large two-tone gradient corners sit wide while the
 * scanner "searches"; when `locked` flips, the whole rounded square springs
 * inward to hug the code and a confirmation ring pulses. Colours adapt to
 * light and dark: brand + white, or brand + ink.
 */
export function ScanFrame({
  size = 256,
  locked = false,
  beam = true,
  onLocked,
  children,
}: {
  size?: number;
  locked?: boolean;
  /** Render the sweeping scan beam while searching. */
  beam?: boolean;
  /** Fires after the lock-on animation lands. */
  onLocked?: () => void;
  children?: React.ReactNode;
}) {
  const mode = useTheme();
  const motionOk = useMotionOk();
  const breathe = useSharedValue(0);
  const lock = useSharedValue(0);
  const ring = useSharedValue(0);
  const hasLocked = useRef(false);
  const onLockedRef = useRef(onLocked);

  useEffect(() => {
    onLockedRef.current = onLocked;
  });

  useEffect(() => {
    if (!motionOk) return undefined;
    set(
      breathe,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(breathe);
  }, [breathe, motionOk]);

  useEffect(() => {
    if (!locked || hasLocked.current) return undefined;
    hasLocked.current = true;
    if (!motionOk) {
      onLockedRef.current?.();
      return undefined;
    }
    set(lock, withSpring(1, { damping: 16, stiffness: 165 }));
    set(
      ring,
      withDelay(150, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })),
    );
    const timer = setTimeout(() => {
      onLockedRef.current?.();
    }, 620);
    return () => {
      clearTimeout(timer);
    };
  }, [lock, locked, motionOk, ring]);

  const codeSize = Math.round(size * LOCK_SCALE);
  const ringInset = Math.round((size - codeSize) / 2);
  const neutral = mode === 'dark' ? colors.ink : '#FFFFFF';

  const trackStyle = useAnimatedStyle(() => {
    const scale = 1 + (LOCK_SCALE - 1) * lock.value;
    return { transform: [{ scale }] };
  });

  const contentFade = useAnimatedStyle(() => ({ opacity: 1 - lock.value }));

  const barsPulse = useAnimatedStyle(() => ({
    opacity: 0.82 + breathe.value * 0.18,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.55,
    transform: [{ scale: 1 + ring.value * 0.3 }],
  }));

  const segments = cornerSegments(size);

  return (
    <View style={{ width: size, height: size }}>
      <View
        pointerEvents="none"
        className="absolute rounded-[26px] border"
        style={{ top: 1, left: 1, right: 1, bottom: 1, borderColor: `${colors.border}66` }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-[22px]"
        style={{
          top: 8,
          left: 8,
          right: 8,
          bottom: 8,
          backgroundColor: `${colors.brandTeal}0D`,
          borderWidth: 1,
          borderColor: `${colors.brandTeal}30`,
        }}
      />

      <AnimatedView pointerEvents="none" style={[trackStyle, { width: size, height: size }]}>
        <View className="absolute inset-0">
          <AnimatedView pointerEvents="none" className="absolute inset-0" style={barsPulse}>
            {segments.map((segment) => (
              <LinearGradient
                key={segment.key}
                colors={
                  segment.brand
                    ? segment.horizontal
                      ? [colors.brandTeal, colors.brandMint]
                      : [colors.brandMint, colors.brandTeal]
                    : [neutral, neutral]
                }
                start={{ x: 0, y: 0 }}
                end={segment.horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 }}
                style={{
                  position: 'absolute',
                  left: segment.left,
                  top: segment.top,
                  width: segment.width,
                  height: segment.height,
                  borderRadius: CORNER_THICKNESS / 2,
                }}
              />
            ))}
          </AnimatedView>
          <View
            className="absolute rounded-[18px] border"
            style={{
              top: 10,
              left: 10,
              right: 10,
              bottom: 10,
              borderColor: `${colors.brandMint}2E`,
            }}
          />
          <AnimatedView
            className="absolute inset-0 items-center justify-center"
            style={contentFade}
          >
            {beam && motionOk ? <ScanBeam size={size} /> : null}
            {children}
          </AnimatedView>
        </View>
      </AnimatedView>

      {motionOk ? (
        <Animated.View
          pointerEvents="none"
          style={[
            ringStyle,
            {
              position: 'absolute',
              left: ringInset,
              top: ringInset,
              width: codeSize,
              height: codeSize,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: colors.brandMint,
            },
          ]}
        />
      ) : null}
    </View>
  );
}