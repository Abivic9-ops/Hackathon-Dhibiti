import { ChevronLeft, Ellipsis, type LucideIcon } from 'lucide-react-native';
import type { Href } from 'expo-router';
import { Pressable, ScrollView, View, type ViewProps } from 'react-native';

import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Text } from '@/components/ui/Text';
import { goBackOrReplace } from '@/lib/navigation';
import { colors, useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Full-screen canvas. Every screen starts here, so a `useTheme()` subscription here keeps every screen's `colors.*` renders in sync with the active theme. */
export function Screen({ className, children, ...rest }: ViewProps) {
  useTheme();
  return (
    <SafeAreaView className={cn('bg-ink flex-1', className)} edges={['top']} {...rest}>
      {children}
    </SafeAreaView>
  );
}

type HeaderProps = {
  title?: string;
  subtitle?: string;
  /** Where to land if this route was opened directly and has no history. */
  backFallback?: Href;
  onBack?: () => void;
  showBack?: boolean;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
  rightLabel?: string;
};

/** Circular icon control used for back / overflow actions in headers. */
function HeaderButton({
  icon: Icon,
  onPress,
  label,
}: {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      className="bg-surface-secondary h-10 w-10 items-center justify-center rounded-full active:opacity-70"
    >
      <Icon color={colors.foreground} size={19} strokeWidth={2} />
    </Pressable>
  );
}

/** Centered title with optional back and overflow controls. */
export function ScreenHeader({
  title,
  subtitle,
  backFallback = '/(tabs)',
  onBack,
  showBack = true,
  rightIcon,
  onRightPress,
  rightLabel = 'More options',
}: HeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-5 pt-2 pb-3">
      <View className="w-10">
        {showBack ? (
          <HeaderButton
            icon={ChevronLeft}
            label="Go back"
            onPress={onBack ?? (() => goBackOrReplace(backFallback))}
          />
        ) : null}
      </View>
      <View className="flex-1 items-center">
        {title ? (
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="meta" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="w-10 items-end">
        {rightIcon && onRightPress ? (
          <HeaderButton icon={rightIcon} label={rightLabel} onPress={onRightPress} />
        ) : null}
      </View>
    </View>
  );
}

export { Ellipsis as HeaderOverflowIcon };

/** Left-aligned page title used on tab roots, with optional trailing slot. */
export function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-end justify-between gap-3 px-5 pt-2 pb-4">
      <View className="flex-1">
        <Text variant="title">{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Uppercase section label with an optional trailing action. */
export function SectionLabel({
  label,
  right,
  className,
}: {
  label: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-center justify-between px-5 pb-3', className)}>
      <Text variant="section">{label}</Text>
      {right}
    </View>
  );
}

/** Scrollable body with the app's standard padding and bottom breathing room. */
export function ScreenScroll({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <ScrollView
      className={cn('flex-1', className)}
      contentContainerClassName={cn('pb-12', contentClassName)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
