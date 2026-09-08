import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AnimatedPressable } from '@/components/ui/primitives/AnimatedPressable';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { DottedSpinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { brandGradient, colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

type BaseProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  className?: string;
  fullWidth?: boolean;
};

/** The one primary button: teal→mint gradient fill, white Poppins Medium label. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon: Icon,
  className,
  fullWidth = true,
}: BaseProps) {
  const inactive = disabled || loading;
  const { animatedStyle, pressHandlers } = usePressFeedback();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={animatedStyle}
      {...(inactive ? {} : pressHandlers)}
      className={cn('rounded-full', fullWidth && 'w-full', className)}
    >
      <LinearGradient
        colors={inactive ? [colors.surfaceTertiary, colors.surfaceTertiary] : [...brandGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-full px-5 py-4"
      >
        {loading ? <DottedSpinner size={22} dotCount={8} color="#FFFFFF" duration={900} /> : null}
        {!loading && Icon ? (
          <Icon color={inactive ? colors.muted : '#FFFFFF'} size={19} strokeWidth={1.9} />
        ) : null}
        <Text
          variant="label"
          className={inactive ? 'text-muted text-[16px]' : 'text-[16px] text-white'}
        >
          {label}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

/** The one secondary button: ghost outline, used for every non-primary action. */
export function GhostButton({
  label,
  onPress,
  disabled = false,
  icon: Icon,
  className,
  fullWidth = true,
  tone = 'neutral',
}: BaseProps & { tone?: 'neutral' | 'danger' }) {
  const tint = tone === 'danger' ? colors.riskRed : colors.foreground;
  const { animatedStyle, pressHandlers } = usePressFeedback({ hoverScale: 1.015 });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={animatedStyle}
      {...(disabled ? {} : pressHandlers)}
      className={cn(
        'min-h-[54px] flex-row items-center justify-center gap-2 rounded-full border px-5 py-4',
        tone === 'danger' ? 'border-risk-red/60' : 'border-border',
        disabled && 'opacity-40',
        fullWidth && 'w-full',
        className,
      )}
    >
      {Icon ? <Icon color={tint} size={19} strokeWidth={1.9} /> : null}
      <Text
        variant="label"
        className={cn('text-[16px]', tone === 'danger' ? 'text-risk-red' : 'text-foreground')}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** Compact inline text action — used inside cards where a full button is too heavy. */
export function InlineAction({
  label,
  onPress,
  icon: Icon,
  className,
}: Pick<BaseProps, 'label' | 'onPress' | 'icon' | 'className'>) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn('flex-row items-center gap-1.5 active:opacity-60', className)}
    >
      <Text variant="label" className="text-brand-teal text-[14px]">
        {label}
      </Text>
      {Icon ? <Icon color={colors.brandTeal} size={16} strokeWidth={2} /> : null}
    </Pressable>
  );
}

/** Bottom-anchored action area for input and flow screens (thumb reachable). */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return <View className="gap-3 px-5 pt-3 pb-2">{children}</View>;
}
