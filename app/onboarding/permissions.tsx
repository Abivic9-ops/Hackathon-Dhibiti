import { useRouter } from 'expo-router';
import { BellRing, Camera, Contact, MessageSquareText } from 'lucide-react-native';
import { View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PrivacyNote } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { PermissionKey } from '@/lib/types';

const PERMISSIONS: {
  key: PermissionKey;
  icon: typeof Contact;
  color: string;
  title: string;
  body: string;
}[] = [
  {
    key: 'contacts',
    icon: Contact,
    color: colors.brandBlue,
    title: 'Contacts',
    body: 'So you can save trusted contacts and call the real person instead of the number that called you.',
  },
  {
    key: 'notifications',
    icon: BellRing,
    color: colors.riskAmber,
    title: 'Notifications',
    body: 'So we can warn you about a high-risk number or message, and alert your family circle.',
  },
  {
    key: 'camera',
    icon: Camera,
    color: colors.brandTeal,
    title: 'Camera',
    body: 'So you can scan a QR code before you pay or open a link. Images are checked on your device.',
  },
  {
    key: 'sms',
    icon: MessageSquareText,
    color: colors.brandMint,
    title: 'Messages (Android)',
    body: 'So suspicious SMS can be quarantined for review. Nothing is deleted, and OTP messages are never blocked.',
  },
];

export default function PermissionsPrimer() {
  const router = useRouter();
  const setPermission = useStore((state) => state.setPermission);

  const grantAll = () => {
    for (const item of PERMISSIONS) setPermission(item.key, 'granted');
    router.push('/onboarding/family');
  };

  return (
    <Screen>
      <ScreenHeader title="Why we ask" backFallback="/onboarding/otp" />
      <ScreenScroll contentClassName="px-5 gap-4">
        <View className="gap-2 pb-1">
          <Text variant="title">Permissions, explained first</Text>
          <Text variant="caption">
            We explain every permission before your phone asks. You can allow them later in More →
            Permissions, and Dhibiti still works without them.
          </Text>
        </View>

        {PERMISSIONS.map((item) => (
          <Card key={item.key} className="flex-row gap-3">
            <IconTile icon={item.icon} color={item.color} />
            <View className="flex-1 gap-1">
              <Text variant="label">{item.title}</Text>
              <Text variant="caption">{item.body}</Text>
            </View>
          </Card>
        ))}

        <PrivacyNote>
          Screenshots and pasted messages stay on your device by default. They only leave it if you
          choose to submit a report, and personal details are removed first.
        </PrivacyNote>
      </ScreenScroll>

      <ActionBar>
        <PrimaryButton label="Allow and continue" onPress={grantAll} />
        <GhostButton label="Decide later" onPress={() => router.push('/onboarding/family')} />
      </ActionBar>
    </Screen>
  );
}
