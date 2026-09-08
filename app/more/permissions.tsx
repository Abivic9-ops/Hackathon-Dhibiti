import { router } from 'expo-router';
import { BellRing, Camera, Contact, MessageSquareText } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrivacyNote, ToggleRow } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { InlineAction } from '@/components/ui/Button';
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
  /** What is lost while this stays off — never a dead end. */
  ifOff: string;
  fallbackLabel: string;
  fallbackRoute: '/check/message' | '/check/lookup' | '/contacts' | '/quarantine';
}[] = [
  {
    key: 'contacts',
    icon: Contact,
    color: colors.brandBlue,
    title: 'Contacts',
    body: 'So you can save trusted contacts and call the real person instead of the number that called you.',
    ifOff: 'You can still add trusted contacts by typing their number in yourself.',
    fallbackLabel: 'Add a contact manually',
    fallbackRoute: '/contacts',
  },
  {
    key: 'notifications',
    icon: BellRing,
    color: colors.riskAmber,
    title: 'Notifications',
    body: 'So we can warn you about a high-risk number or message, and alert your family circle.',
    ifOff:
      'Warnings only appear while the app is open, and family alerts wait until you come back.',
    fallbackLabel: 'Check something now',
    fallbackRoute: '/check/message',
  },
  {
    key: 'camera',
    icon: Camera,
    color: colors.brandTeal,
    title: 'Camera',
    body: 'So you can scan a QR code before you pay or open a link. Images are checked on your device.',
    ifOff: 'You can import a QR screenshot from your gallery, or type the Paybill or link instead.',
    fallbackLabel: 'Look up a number or Paybill',
    fallbackRoute: '/check/lookup',
  },
  {
    key: 'sms',
    icon: MessageSquareText,
    color: colors.brandMint,
    title: 'Messages (Android)',
    body: 'So suspicious SMS can be held in your quarantine inbox for review. Nothing is deleted, and one-time codes are never blocked.',
    ifOff: 'Paste a message or share it to Dhibiti when something looks off.',
    fallbackLabel: 'Open quarantine inbox',
    fallbackRoute: '/quarantine',
  },
];

/** Permission controls, using the same plain-language reasons as onboarding. */
export default function PermissionsSettings() {
  const permissions = useStore((state) => state.permissions);
  const setPermission = useStore((state) => state.setPermission);

  return (
    <Screen>
      <ScreenHeader title="Permissions" backFallback="/more" />

      <ScreenScroll contentClassName="px-5 gap-4">
        <View className="gap-2 pb-1">
          <Text variant="title">You decide what Dhibiti can reach</Text>
          <Text variant="caption">
            Every permission is explained in plain language, and Dhibiti keeps working without any
            of them. Turning one off never leaves you stuck.
          </Text>
        </View>

        {PERMISSIONS.map((item) => {
          const state = permissions[item.key];
          const granted = state === 'granted';
          return (
            <View key={item.key} className="gap-2">
              <ToggleRow
                icon={item.icon}
                title={item.title}
                description={item.body}
                value={granted}
                onValueChange={(value) => setPermission(item.key, value ? 'granted' : 'denied')}
              />
              {!granted ? (
                <Card className="flex-row items-center gap-3">
                  <IconTile icon={item.icon} color={item.color} size="sm" />
                  <View className="flex-1 gap-1.5">
                    <Text variant="caption">
                      {state === 'denied' ? 'Currently off. ' : 'Not set yet. '}
                      {item.ifOff}
                    </Text>
                    <InlineAction
                      label={item.fallbackLabel}
                      onPress={() => router.push(item.fallbackRoute)}
                    />
                  </View>
                </Card>
              ) : null}
            </View>
          );
        })}

        <PrivacyNote>
          Screenshots and pasted messages stay on your device by default. They only leave it if you
          choose to submit a report, and personal details are removed first.
        </PrivacyNote>
      </ScreenScroll>
    </Screen>
  );
}
