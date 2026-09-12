import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { PrimaryButton } from '@/components/ui/Button';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <ScreenHeader title="Page not found" backFallback="/(tabs)" />
      <ScreenScroll contentClassName="gap-4 px-5">
        <Text variant="heading">This screen does not exist.</Text>
        <Text variant="body">
          The link may be stale, or the address may have been typed incorrectly. Nothing was sent
          and nothing is at risk.
        </Text>
        <View className="pt-2">
          <PrimaryButton label="Go home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScreenScroll>
    </Screen>
  );
}