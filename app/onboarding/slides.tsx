import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { QrCode, ShieldCheck, Users, Wallet } from 'lucide-react-native';
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { GradientIconTile } from '@/components/ui/IconTile';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    icon: ShieldCheck,
    secondaryIcon: QrCode,
    headline: 'Check before you act',
    body: 'We check messages, calls, and QR codes for scams before you act.',
  },
  {
    icon: Users,
    secondaryIcon: ShieldCheck,
    headline: 'Know who is really calling',
    body: 'We verify who is really contacting you — banks, Safaricom, or family.',
  },
  {
    icon: Wallet,
    secondaryIcon: Users,
    headline: 'Stop money leaving',
    body: 'We warn you before money leaves your account, and can protect your family too.',
  },
];

export default function OnboardingSlides() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const width = Dimensions.get('window').width;
  const last = index === SLIDES.length - 1;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(1, width));
    if (next !== index) setIndex(next);
  };

  const advance = () => {
    if (last) {
      router.push('/onboarding/auth');
      return;
    }
    const next = index + 1;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pt-2">
        <LanguageSwitch />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding/auth')}
          hitSlop={10}
          className="active:opacity-60"
        >
          <Text variant="label" className="text-muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.headline}
            style={{ width }}
            className="items-center justify-center gap-7 px-9"
          >
            <View className="items-center justify-center">
              <View
                className="items-center justify-center rounded-[44px]"
                style={{ width: 168, height: 168, backgroundColor: `${colors.brandBlue}1A` }}
              >
                <GradientIconTile
                  icon={slide.icon}
                  size="lg"
                  className="h-20 w-20 rounded-[28px]"
                />
              </View>
            </View>
            <View className="items-center gap-3">
              <Text variant="display" className="text-center text-[28px] leading-9">
                {slide.headline}
              </Text>
              <Text variant="body" className="text-muted text-center">
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((slide, dotIndex) => (
          <View
            key={slide.headline}
            className={cn(
              'h-1.5 rounded-full',
              dotIndex === index ? 'bg-brand-teal w-6' : 'bg-surface-tertiary w-1.5',
            )}
          />
        ))}
      </View>

      <ActionBar>
        <PrimaryButton label={last ? 'Get started' : 'Next'} onPress={advance} />
      </ActionBar>
    </Screen>
  );
}
