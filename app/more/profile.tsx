import { useState } from 'react';
import { router } from 'expo-router';
import {
  Contact,
  Fingerprint,
  Landmark,
  Mail,
  Smartphone,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react-native';
import { View } from 'react-native';

import { GhostButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PrivacyNote } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { NavRow } from '@/components/ui/rows';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { SHARING_LABEL } from '@/lib/family';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { User } from '@/lib/types';

const ROLE_LABEL: Record<User['role'], string> = {
  standalone: 'Protecting yourself',
  'family-admin': 'Family admin',
  'protected-member': 'Protected member',
};

const STORAGE_ITEMS: { label: string; body: string; tone: 'local' | 'shared' | 'never' }[] = [
  {
    label: 'Stays on this device',
    body: 'Messages and call descriptions you paste, screenshots you attach, your check history and your scan history. Rule checks run here, on your phone.',
    tone: 'local',
  },
  {
    label: 'Shared with your family or group circle',
    body: 'Only the high-risk events at the sharing level you chose. Your circle never sees your normal messages, contacts or day-to-day payments.',
    tone: 'shared',
  },
  {
    label: 'Never leaves this device',
    body: 'PINs, passwords and full ID numbers. Dhibiti never asks for them, and no screen in this app will accept them.',
    tone: 'never',
  },
  {
    label: 'Shared only when you report',
    body: 'If you submit a report, we send the identifier (number, Paybill or domain) and the scam pattern. Names, phone contacts and photos are removed first.',
    tone: 'shared',
  },
];

const TONE_COLOR: Record<'local' | 'shared' | 'never', string> = {
  local: colors.brandTeal,
  shared: colors.brandBlue,
  never: colors.riskGreen,
};

/** Profile, auth methods and the itemised privacy statement. */
export default function ProfileScreen() {
  const user = useStore((state) => state.user);
  const authUser = useStore((state) => state.authUser);
  const sessionToken = useStore((state) => state.sessionToken);
  const logout = useStore((state) => state.logout);
  const circle = useStore((state) => state.circle);
  const checks = useStore((state) => state.checks);
  const clearHistory = useStore((state) => state.clearHistory);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const me = circle.members.find((member) => member.userId === user.id);

  const displayName = authUser?.name || user.name;
  const displayPhone = authUser?.phone || user.phone;
  const displayEmail = authUser?.email ?? user.email;

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    router.replace('/onboarding/slides');
  };

  return (
    <Screen>
      <ScreenHeader title="Profile & security" backFallback="/more" />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="items-center gap-3">
            <IconTile icon={UserRound} color={colors.brandBlue} size="lg" />
            <View className="items-center gap-1">
              <Text variant="heading">{displayName}</Text>
              <Text variant="caption">{ROLE_LABEL[user.role]}</Text>
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel label="Account" />
          <View className="gap-3 px-5">
            <Card className="flex-row items-center gap-3">
              <IconTile icon={Smartphone} color={colors.brandTeal} />
              <View className="flex-1 gap-0.5">
                <Text variant="label">{displayPhone}</Text>
                <Text variant="meta">Phone number · verified by one-time code</Text>
              </View>
            </Card>
            <Card className="flex-row items-center gap-3">
              <IconTile icon={Mail} color={colors.brandBlue} />
              <View className="flex-1 gap-0.5">
                <Text variant="label">{displayEmail ?? 'No email added'}</Text>
                <Text variant="meta">
                  {displayEmail
                    ? 'Backup sign-in method'
                    : 'Optional backup if you change your phone number'}
                </Text>
              </View>
            </Card>
            <Card className="flex-row items-center gap-3">
              <IconTile icon={Landmark} color={colors.brandMint} />
              <View className="flex-1 gap-0.5">
                <Text variant="label">
                  {user.county ? `${user.county} County` : 'County not set'}
                </Text>
                <Text variant="meta">
                  Used only to show scam trends near you. We store the county, never your exact
                  location.
                </Text>
              </View>
            </Card>
          </View>
        </View>

        {me ? (
          <View>
            <SectionLabel label="What your circle can see" />
            <View className="px-5">
              <Card className="gap-2">
                <View className="flex-row items-center gap-3">
                  <IconTile icon={Users} color={colors.brandBlue} />
                  <View className="flex-1">
                    <Text variant="label">Your sharing level</Text>
                    <Text variant="meta">{SHARING_LABEL[me.sharingLevel]}</Text>
                  </View>
                </View>
                <Text variant="caption">
                  You chose this, and you can change it whenever you like. Nothing is shared
                  retroactively.
                </Text>
                <GhostButton
                  label="Change sharing level"
                  onPress={() =>
                    router.push({
                      pathname: '/family/member/[id]',
                      params: { id: me.userId },
                    })
                  }
                />
              </Card>
            </View>
          </View>
        ) : null}

        <View>
          <SectionLabel label="Session" />
          <View className="gap-3 px-5">
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <IconTile icon={Smartphone} color={colors.brandTeal} />
                <View className="flex-1 gap-0.5">
                  <Text variant="label">
                    {sessionToken ? 'Signed in with Dhibiti Cloud' : 'Signed in on this device only'}
                  </Text>
                  <Text variant="meta">
                    {sessionToken
                      ? 'Your checks, reports and circle alerts sync once you are online.'
                      : 'Sign in with your phone number to report scams and sync your circle.'}
                  </Text>
                </View>
              </View>
              {sessionToken ? (
                <GhostButton
                  label={signingOut ? 'Signing out…' : 'Sign out'}
                  disabled={signingOut}
                  onPress={signOut}
                />
              ) : (
                <GhostButton label="Sign in" onPress={() => router.push('/onboarding/auth')} />
              )}
            </Card>
          </View>
        </View>

        <View>
          <SectionLabel label="Where your information lives" />
          <View className="gap-3 px-5">
            {STORAGE_ITEMS.map((item) => (
              <Card key={item.label} className="flex-row gap-3">
                <IconTile icon={Fingerprint} color={TONE_COLOR[item.tone]} />
                <View className="flex-1 gap-1">
                  <Text variant="label">{item.label}</Text>
                  <Text variant="caption">{item.body}</Text>
                </View>
              </Card>
            ))}
            <PrivacyNote>
              No screen in Dhibiti will ever ask for your M-Pesa PIN, a bank password or a
              verification code. If anything claiming to be Dhibiti asks, it is not us.
            </PrivacyNote>
          </View>
        </View>

        <View>
          <SectionLabel label="Your data" />
          <View className="gap-3 px-5">
            <NavRow
              icon={Contact}
              title="Trusted contacts"
              description="The people Dhibiti suggests you call before money moves"
              onPress={() => router.push('/contacts')}
            />
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <IconTile icon={Trash2} color={colors.riskRed} />
                <View className="flex-1">
                  <Text variant="label">Delete check and scan history</Text>
                  <Text variant="meta">
                    {cleared
                      ? 'History deleted from this device.'
                      : `${checks.length} checks stored on this device`}
                  </Text>
                </View>
              </View>
              <Text variant="caption">
                Deleting your history removes it from this device. Reports you already submitted
                stay in the community data, without your name attached.
              </Text>
              <GhostButton
                label="Delete history"
                tone="danger"
                disabled={checks.length === 0}
                onPress={() => setConfirmClear(true)}
              />
            </Card>
          </View>
        </View>
      </ScreenScroll>

      <Sheet
        visible={confirmClear}
        onClose={() => setConfirmClear(false)}
        icon={Trash2}
        iconColor={colors.riskRed}
        title="Delete your history?"
        body="Your checks and scans are removed from this device. This cannot be undone."
        primaryLabel="Delete history"
        primaryTone="danger"
        onPrimary={() => {
          clearHistory();
          setCleared(true);
          setConfirmClear(false);
        }}
        secondaryLabel="Keep it"
      />
    </Screen>
  );
}
