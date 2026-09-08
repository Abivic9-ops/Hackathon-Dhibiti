import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableCard } from '@/components/ui/Card';
import { GradientIconTile, IconTile } from '@/components/ui/IconTile';
import { CountUp } from '@/components/ui/Motion';
import { RiskPill } from '@/components/ui/Risk';
import { CHECK_TYPE_ICON, CHECK_TYPE_LABEL } from '@/components/ui/icons';
import { AnimatedPressable } from '@/components/ui/primitives/AnimatedPressable';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { colors } from '@/lib/theme';
import type { Check } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';

/**
 * Compact quick action used in the four-across row on Home, so every main
 * feature is one tap away the moment the app opens.
 */
export function QuickActionTile({
  icon,
  label,
  onPress,
  emphasised = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  emphasised?: boolean;
}) {
  const { animatedStyle, pressHandlers } = usePressFeedback({
    pressScale: 0.94,
    hoverScale: 1.05,
    pressOpacity: 0.85,
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={animatedStyle}
      {...pressHandlers}
      className="flex-1 items-center gap-2"
    >
      {emphasised ? (
        <GradientIconTile icon={icon} size="lg" />
      ) : (
        <IconTile icon={icon} size="lg" color={colors.brandBlue} />
      )}
      <Text variant="meta" className="text-foreground text-center" numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** Activity row for grouped lists, where the card surface is the list itself. */
export function ActivityListRow({ check, onPress }: { check: Check; onPress: () => void }) {
  const { animatedStyle, pressHandlers } = usePressFeedback({
    pressScale: 0.99,
    hoverScale: 1.005,
    pressOpacity: 0.85,
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      style={animatedStyle}
      {...pressHandlers}
      className="flex-row items-center gap-3 px-4 py-3"
    >
      <IconTile icon={CHECK_TYPE_ICON[check.type]} color={colors.brandBlue} />
      <View className="flex-1 gap-1">
        <Text variant="label" numberOfLines={1}>
          {check.inputSummary}
        </Text>
        <Text variant="meta">
          {CHECK_TYPE_LABEL[check.type]} · {timeAgo(check.createdAt)}
        </Text>
      </View>
      <RiskPill level={check.riskLevel} size="sm" />
    </AnimatedPressable>
  );
}

/** 2×2 grid entry point on Home and Shield. */
export function QuickActionCard({
  icon,
  title,
  caption,
  onPress,
  emphasised = false,
}: {
  icon: LucideIcon;
  title: string;
  caption: string;
  onPress: () => void;
  emphasised?: boolean;
}) {
  return (
    <PressableCard
      onPress={onPress}
      className={cn('min-h-[132px] flex-1 justify-between', emphasised && 'border-brand-teal/50')}
    >
      {emphasised ? <GradientIconTile icon={icon} /> : <IconTile icon={icon} />}
      <View className="gap-0.5 pt-3">
        <Text variant="label">{title}</Text>
        <Text variant="meta" numberOfLines={2}>
          {caption}
        </Text>
      </View>
    </PressableCard>
  );
}

/** Recent activity / risk history row. */
export function ActivityRow({ check, onPress }: { check: Check; onPress: () => void }) {
  return (
    <PressableCard onPress={onPress} className="flex-row items-center gap-3">
      <IconTile icon={CHECK_TYPE_ICON[check.type]} color={colors.brandBlue} />
      <View className="flex-1 gap-1">
        <Text variant="label" numberOfLines={1}>
          {check.inputSummary}
        </Text>
        <Text variant="meta">
          {CHECK_TYPE_LABEL[check.type]} · {timeAgo(check.createdAt)}
        </Text>
      </View>
      <RiskPill level={check.riskLevel} size="sm" />
    </PressableCard>
  );
}

/** Settings / navigation row with an icon, never an initial or letter avatar. */
export function NavRow({
  icon,
  title,
  description,
  onPress,
  right,
  iconColor = colors.brandBlue,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <PressableCard onPress={onPress} className="flex-row items-center gap-3">
      <IconTile icon={icon} color={iconColor} />
      <View className="flex-1 gap-0.5">
        <Text variant="label">{title}</Text>
        {description ? <Text variant="meta">{description}</Text> : null}
      </View>
      {right ?? <ChevronRight color={colors.muted} size={18} strokeWidth={2} />}
    </PressableCard>
  );
}

/**
 * Compact stat tile used on Home and the safety score summary. A plain
 * number counts up on mount so the figure lands rather than just appearing.
 */
export function StatTile({
  icon,
  value,
  label,
  color = colors.brandTeal,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  color?: string;
}) {
  const trimmed = value.trim();
  const numeric = /^-?\d+$/.test(trimmed) ? Number(trimmed) : undefined;

  return (
    <View className="bg-surface border-border/60 flex-1 gap-2 rounded-[20px] border p-4">
      <IconTile icon={icon} color={color} size="sm" />
      {numeric === undefined ? <Text variant="numeral">{value}</Text> : <CountUp value={numeric} />}
      <Text variant="meta">{label}</Text>
    </View>
  );
}
