import { useEffect } from 'react';
import { CloudOff, type LucideIcon, RotateCcw } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GhostButton, PrimaryButton } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { Floaty, PulseRings, Reveal } from '@/components/ui/Motion';
import { DottedSpinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

/** Friendly empty state with a clear first action. */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center gap-3 px-8 py-10">
      <Floaty>
        <IconTile icon={icon} size="lg" />
      </Floaty>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      <Text variant="caption" className="text-center">
        {body}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} fullWidth={false} className="mt-2" />
      ) : null}
    </View>
  );
}

/** Continuously pulses a shared value between its initial value and 1. */
function usePulsingValue(initial: number, duration: number) {
  const pulse = useSharedValue(initial);
  useEffect(() => {
    // oxlint-disable-next-line react/immutability -- see useSpinningValue above
    pulse.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [duration, pulse]);
  return pulse;
}

/**
 * The "checking" moment. Deliberately takes a beat — the pause is part of
 * how the app earns trust — and names the layers it is running.
 */
export function ProcessingView({
  title = 'Checking this against known scam patterns and community reports…',
  steps,
}: {
  title?: string;
  steps: string[];
}) {
  const pulse = usePulsingValue(0.45, 1100);
  const glowStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View className="flex-1 items-center justify-center gap-6 px-8">
      <View className="h-24 w-24 items-center justify-center">
        <Animated.View
          style={glowStyle}
          className="bg-brand-teal-soft absolute h-24 w-24 rounded-full"
        />
        <PulseRings size={96} count={2} duration={2400} />
        <DottedSpinner size={68} dotCount={10} duration={1400} />
      </View>
      <Text variant="body" className="text-center">
        {title}
      </Text>
      <View className="gap-2">
        {steps.map((step, index) => (
          <Reveal key={step} delay={220 + index * 320} distance={8}>
            <Text variant="caption" className="text-center">
              {step}
            </Text>
          </Reveal>
        ))}
      </View>
    </View>
  );
}

/** Non-technical offline/error state with a retry path. */
export function ErrorState({
  title = "Couldn't reach Dhibiti's servers",
  body = 'Check your connection and try again. Your input stays on this device in the meantime.',
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View className="items-center gap-3 px-8 py-10">
      <IconTile icon={CloudOff} color={colors.riskAmber} size="lg" />
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      <Text variant="caption" className="text-center">
        {body}
      </Text>
      {onRetry ? (
        <GhostButton
          label={retryLabel}
          icon={RotateCcw}
          onPress={onRetry}
          fullWidth={false}
          className="mt-2"
        />
      ) : null}
    </View>
  );
}

/** Persistent inline banner shown while the app has no connection. */
export function OfflineBanner() {
  return (
    <View className="bg-risk-amber-soft mx-5 mb-3 flex-row items-center gap-2.5 rounded-2xl px-4 py-3">
      <CloudOff color={colors.riskAmber} size={17} strokeWidth={1.9} />
      <Text variant="caption" className="text-foreground/85 flex-1">
        You are offline. Community report data may be out of date — rule checks still run on this
        device.
      </Text>
    </View>
  );
}

/** Calm explanation shown when a permission was declined. Never a dead end. */
export function PermissionDeniedState({
  icon,
  title,
  body,
  onEnable,
  enableLabel = 'Open permission settings',
  onSkip,
  skipLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  onEnable: () => void;
  enableLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  return (
    <View className="items-center gap-3 px-8 py-10">
      <IconTile icon={icon} color={colors.brandBlue} size="lg" />
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      <Text variant="caption" className="text-center">
        {body}
      </Text>
      <View className="mt-2 w-full gap-2">
        <PrimaryButton label={enableLabel} onPress={onEnable} />
        {onSkip && skipLabel ? <GhostButton label={skipLabel} onPress={onSkip} /> : null}
      </View>
    </View>
  );
}
