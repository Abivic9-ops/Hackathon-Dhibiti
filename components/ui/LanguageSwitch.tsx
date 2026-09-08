import { Languages } from 'lucide-react-native';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/primitives/AnimatedPressable';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { LANGUAGES, type Language } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { brandGradient, colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

type SegmentProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function Segment({ label, active, onPress }: SegmentProps) {
  const { animatedStyle, pressHandlers } = usePressFeedback({
    pressScale: 0.95,
    hoverScale: 1.04,
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={animatedStyle}
      {...pressHandlers}
      className="rounded-full"
    >
      {active ? (
        <LinearGradient
          colors={[...brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center justify-center rounded-full px-4 py-2"
        >
          {/* Language names stay in their own language. */}
          <Text verbatim variant="label" className="text-[14px] text-white">
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <View className="items-center justify-center rounded-full px-4 py-2">
          <Text verbatim variant="label" className="text-muted text-[14px]">
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

/**
 * English / Kiswahili segmented switch. Lives on the onboarding slides so the
 * choice is made before anything else, and in More so it can be changed later.
 */
export function LanguageSwitch({
  showIcon = true,
  className,
}: {
  showIcon?: boolean;
  className?: string;
}) {
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);

  const select = (code: Language) => {
    if (code !== language) setLanguage(code);
  };

  return (
    <View
      className={cn(
        'border-border bg-surface-secondary flex-row items-center gap-1 self-start rounded-full border p-1',
        className,
      )}
    >
      {showIcon ? (
        <View className="pl-2">
          <Languages color={colors.brandTeal} size={17} strokeWidth={1.9} />
        </View>
      ) : null}
      {LANGUAGES.map((entry) => (
        <Segment
          key={entry.code}
          label={entry.label}
          active={entry.code === language}
          onPress={() => select(entry.code)}
        />
      ))}
    </View>
  );
}
