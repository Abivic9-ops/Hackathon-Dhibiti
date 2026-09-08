import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { brandGradient, colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-xl', icon: 16 },
  md: { box: 'h-11 w-11 rounded-2xl', icon: 20 },
  lg: { box: 'h-14 w-14 rounded-[20px]', icon: 24 },
} as const;

/**
 * Rounded tinted icon container. Dhibiti uses icons — never initials or
 * letter avatars — so this is the single visual "identity" holder for
 * people, institutions, check types, scam categories and menu rows.
 */
export function IconTile({
  icon: Icon,
  color = colors.brandTeal,
  size = 'md',
  className,
}: {
  icon: LucideIcon;
  color?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const dims = SIZES[size];
  return (
    <View
      className={cn('items-center justify-center', dims.box, className)}
      style={{ backgroundColor: `${color}1F` }}
    >
      <Icon color={color} size={dims.icon} strokeWidth={1.9} />
    </View>
  );
}

/** Gradient-filled tile for primary/brand moments (quick actions, verified states). */
export function GradientIconTile({
  icon: Icon,
  size = 'md',
  className,
}: {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const dims = SIZES[size];
  return (
    <LinearGradient
      colors={[...brandGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={cn('items-center justify-center', dims.box, className)}
    >
      <Icon color="#08231D" size={dims.icon} strokeWidth={2} />
    </LinearGradient>
  );
}
