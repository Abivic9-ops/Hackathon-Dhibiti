import { useState } from 'react';
import { useRouter } from 'expo-router';
import { HeartHandshake, ShieldCheck, UserRoundCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { OptionRow, PrivacyNote } from '@/components/ui/Field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';

type Choice = 'admin' | 'protected' | 'none';

export default function FamilyOptIn() {
  const router = useRouter();
  const completeOnboarding = useStore((state) => state.completeOnboarding);
  const [choice, setChoice] = useState<Choice>('admin');

  const finish = (selected: Choice) => {
    completeOnboarding({
      role:
        selected === 'admin'
          ? 'family-admin'
          : selected === 'protected'
            ? 'protected-member'
            : 'standalone',
    });
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <ScreenHeader title="Family Circle" backFallback="/onboarding/permissions" />
      <ScreenScroll contentClassName="px-5 gap-4">
        <View className="gap-2 pb-1">
          <Text variant="title">Would you like to protect someone, or be protected?</Text>
          <Text variant="caption">
            A family circle shares specific high-risk events only — never a feed of everything
            someone does. Both sides choose what is shared, and can change it any time.
          </Text>
        </View>

        <OptionRow
          icon={ShieldCheck}
          title="I want to protect a family member"
          description="You receive alerts when a high-risk call, message, QR or payment reaches them, and you can help verify."
          selected={choice === 'admin'}
          onPress={() => setChoice('admin')}
        />
        <OptionRow
          icon={UserRoundCheck}
          title="I want someone to look out for me"
          description="A person you choose is alerted only when something high-risk happens, and can confirm before you pay."
          selected={choice === 'protected'}
          onPress={() => setChoice('protected')}
        />
        <OptionRow
          icon={HeartHandshake}
          title="Just me for now"
          description="You can set up a family or chama circle later from the Family tab."
          selected={choice === 'none'}
          onPress={() => setChoice('none')}
        />

        <PrivacyNote>
          Nobody is added to a circle without installing Dhibiti and agreeing first. Amounts and
          recipient details are shared only if the protected member turns that on.
        </PrivacyNote>
      </ScreenScroll>

      <ActionBar>
        <PrimaryButton label="Set up now" onPress={() => finish(choice)} />
        <GhostButton label="Skip for now" onPress={() => finish('none')} />
      </ActionBar>
    </Screen>
  );
}
