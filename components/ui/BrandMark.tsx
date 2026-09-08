import { Check, Fingerprint, House } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * The Dhibiti mark, built from the same icon language as the rest of the app:
 * a blue house (your safe space), a teal fingerprint shield (the financial
 * action being assessed) and a green check (verified, safe to proceed).
 */
export function BrandMark({ size = 96, className }: { size?: number; className?: string }) {
  const badge = Math.round(size * 0.34);
  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <House color={colors.brandBlue} size={size} strokeWidth={1.5} />
      <View
        className="absolute items-center justify-center rounded-2xl"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          top: size * 0.36,
          backgroundColor: `${colors.brandTeal}2E`,
        }}
      >
        <Fingerprint color={colors.brandMint} size={size * 0.28} strokeWidth={1.8} />
      </View>
      <View
        className="bg-risk-green absolute items-center justify-center rounded-full"
        style={{ width: badge, height: badge, right: -size * 0.04, bottom: size * 0.02 }}
      >
        <Check color={colors.ink} size={badge * 0.62} strokeWidth={2.6} />
      </View>
    </View>
  );
}

/** Wordmark + tagline lockup used on the splash and About screens. */
export function BrandLockup({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <View className="items-center gap-2">
      <Text variant="display" className="text-[40px] leading-[48px]">
        Dhibiti
      </Text>
      {showTagline ? (
        <View className="flex-row gap-1.5">
          <Text variant="label" className="text-brand-mint">
            Verify.
          </Text>
          <Text variant="label" className="text-brand-blue">
            Protect.
          </Text>
          <Text variant="label" className="text-foreground">
            Control.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
