import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Image, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { BrandMark } from '@/components/ui/BrandMark';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { DottedSpinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { useStore } from '@/lib/store';

const SPLASH_BG = require('../assets/splash-bg.png');

/**
 * The first thing you see when Dhibiti opens: brand mark, name, promise and a
 * dotted spinner while local state loads. Routes on to onboarding or the tabs.
 */
export default function SplashGate() {
  const router = useRouter();
  const hydrated = useStore((state) => state.hydrated);
  const onboarded = useStore((state) => state.onboarded);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!hydrated) return undefined;
    const timer = setTimeout(() => {
      router.replace(onboarded ? '/(tabs)' : '/onboarding/slides');
    }, 1900);
    return () => clearTimeout(timer);
  }, [hydrated, onboarded, router]);

  return (
    <View className="bg-ink flex-1">
      <Image
        source={SPLASH_BG}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />
      <LinearGradient
        colors={['rgba(11,15,26,0.72)', 'rgba(11,15,26,0.28)', 'rgba(11,15,26,0.92)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />

      <View className="flex-1 items-center justify-center px-9">
        <Animated.View entering={FadeIn.duration(500)} className="items-center">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 168, height: 168, backgroundColor: `${colors.brandTeal}1F` }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 124, height: 124, backgroundColor: `${colors.brandTeal}26` }}
            >
              <BrandMark size={82} />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(600)} className="items-center pt-7">
          <Text variant="display" className="text-[42px] leading-[50px]">
            Dhibiti
          </Text>
          <View className="flex-row gap-1.5 pt-1.5">
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
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeIn.delay(500).duration(600)}
        className="items-center gap-5 pb-14"
      >
        <View className="items-center">
          <Text variant="caption" className="text-foreground/70 text-center">
            Your security.
          </Text>
          <Text variant="caption" className="text-foreground/70 text-center">
            Our priority.
          </Text>
        </View>
        <DottedSpinner size={34} />
      </Animated.View>
    </View>
  );
}
