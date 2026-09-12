import { router } from 'expo-router';
import {
  BookOpen,
  CloudOff,
  Contact,
  Info,
  Landmark,
  Languages,
  LayoutGrid,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { PrimaryButton } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { ToggleRow } from '@/components/ui/Field';
import { OfflineBanner } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { DonutRing } from '@/components/ui/Progress';
import { NavRow, StatTile } from '@/components/ui/rows';
import { PageTitle, Screen, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { User } from '@/lib/types';

const ROLE_LABEL: Record<User['role'], string> = {
  standalone: 'Protecting yourself',
  'family-admin': 'Family admin',
  'protected-member': 'Protected member',
};

function scoreBand(score: number) {
  if (score < 30) return 'Getting started';
  if (score < 60) return 'Building the habit';
  if (score < 90) return 'Checking before you act';
  return 'Hard to catch out';
}

/** More tab: account, permissions, learning and the quick-check shortcuts. */
export default function MoreTab() {
  const user = useStore((state) => state.user);
  const checks = useStore((state) => state.checks);
  const contacts = useStore((state) => state.contacts);
  const institutions = useStore((state) => state.institutions);
  const permissions = useStore((state) => state.permissions);
  const lessons = useStore((state) => state.lessons);
  const readLessonIds = useStore((state) => state.readLessonIds);
  const safetyEvents = useStore((state) => state.safetyEvents);
  const simulateOffline = useStore((state) => state.simulateOffline);
  const setSimulateOffline = useStore((state) => state.setSimulateOffline);

  const score = safetyEvents.reduce((total, event) => total + event.delta, 0);
  const ringValue = Math.min(score, 100);
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const checksThisWeek = checks.filter((check) => check.createdAt >= weekAgo).length;
  const reportsSubmitted = safetyEvents.filter(
    (event) => event.source === 'report-submitted',
  ).length;
  const grantedCount = Object.values(permissions).filter((state) => state === 'granted').length;
  const permissionTotal = Object.keys(permissions).length;

  return (
    <Screen>
      <PageTitle title="More" subtitle="Your account, permissions and learning" />

      <ScreenScroll contentClassName="gap-4">
        {simulateOffline ? <OfflineBanner /> : null}

        <View className="px-5">
          <PressableCard
            className="flex-row items-center gap-3"
            onPress={() => router.push('/more/profile')}
          >
            <IconTile icon={UserRound} color={colors.brandBlue} size="lg" />
            <View className="flex-1 gap-1">
              <Text variant="heading" numberOfLines={1}>
                {user.name || 'My profile'}
              </Text>
              <Text variant="meta">
                {[user.name ? user.phone : null, user.county].filter(Boolean).join('  ·  ') ||
                  'Your details stay on this device'}
              </Text>
              <Text variant="meta" className="text-brand-teal">
                {ROLE_LABEL[user.role]}
              </Text>
            </View>
          </PressableCard>
        </View>

        <View className="px-5">
          <Card className="items-center gap-4">
            <DonutRing
              segments={[
                { value: ringValue, color: colors.brandMint },
                { value: Math.max(100 - ringValue, 0), color: colors.surfaceTertiary },
              ]}
              size={156}
              strokeWidth={16}
            >
              <Text variant="numeral">{score}</Text>
              <Text variant="meta">Safety score</Text>
            </DonutRing>
            <View className="items-center gap-1">
              <Text variant="heading">{scoreBand(score)}</Text>
              <Text variant="caption" className="text-center">
                Your score grows when you check something before acting, report a scam, or practise
                spotting one. It is private to you — there is no leaderboard and no one else sees
                it.
              </Text>
            </View>
            <PrimaryButton
              label="Practice: Spot the Scam"
              icon={Target}
              onPress={() => router.push('/more/simulator')}
            />
          </Card>
        </View>

        <View className="flex-row gap-3 px-5">
          <StatTile icon={ShieldCheck} value={`${checksThisWeek}`} label="Checks this week" />
          <StatTile
            icon={BookOpen}
            value={`${readLessonIds.length}/${lessons.length}`}
            label="Lessons read"
            color={colors.brandBlue}
          />
          <StatTile
            icon={Target}
            value={`${reportsSubmitted}`}
            label="Reports sent"
            color={colors.riskAmber}
          />
        </View>

        <View>
          <SectionLabel label="Language" />
          <View className="px-5">
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <IconTile icon={Languages} color={colors.brandTeal} />
                <View className="flex-1 gap-0.5">
                  <Text variant="heading">App language</Text>
                  <Text variant="caption">
                    Switch between English and Kiswahili at any time. Quoted messages, names and
                    numbers are always shown exactly as they were received.
                  </Text>
                </View>
              </View>
              <LanguageSwitch showIcon={false} className="justify-center self-stretch" />
            </Card>
          </View>
        </View>

        <View>
          <SectionLabel label="Protection" />
          <View className="gap-3 px-5">
            <NavRow
              icon={Contact}
              title="Trusted contacts"
              description={
                contacts.length > 0
                  ? `${contacts.length} saved · call the real person, not the number that called you`
                  : 'Save the people you would call before sending money'
              }
              onPress={() => router.push('/contacts')}
            />
            <NavRow
              icon={Landmark}
              title="Verified institutions"
              description={`${institutions.length} official numbers for banks, Safaricom and government offices`}
              iconColor={colors.brandTeal}
              onPress={() => router.push('/institutions')}
            />
            <NavRow
              icon={SlidersHorizontal}
              title="Permissions"
              description={`${grantedCount} of ${permissionTotal} allowed · change any of them at any time`}
              iconColor={colors.riskAmber}
              onPress={() => router.push('/more/permissions')}
            />
          </View>
        </View>

        <View>
          <SectionLabel label="Learn" />
          <View className="gap-3 px-5">
            <NavRow
              icon={BookOpen}
              title="Literacy library"
              description="Short lessons on scam patterns, mobile money, banks and your rights"
              iconColor={colors.brandMint}
              onPress={() => router.push('/more/literacy')}
            />
            <NavRow
              icon={Target}
              title="Practice: Spot the Scam"
              description="Classify real, redacted messages and see the answer straight away"
              iconColor={colors.brandBlue}
              onPress={() => router.push('/more/simulator')}
            />
          </View>
        </View>

        <View>
          <SectionLabel label="Shortcuts" />
          <View className="gap-3 px-5">
            <NavRow
              icon={LayoutGrid}
              title="Quick-Check widget"
              description="Paste and check a message in one tap, straight from your home screen"
              iconColor={colors.brandTeal}
              onPress={() => router.push('/more/widget')}
            />
          </View>
        </View>

        <View>
          <SectionLabel label="About" />
          <View className="gap-3 px-5">
            <NavRow
              icon={Info}
              title="About Dhibiti"
              description="What we do, what we deliberately do not claim, and how to reach us"
              onPress={() => router.push('/more/about')}
            />
          </View>
        </View>

        <View>
          <SectionLabel label="Review options" />
          <View className="gap-3 px-5">
            <ToggleRow
              icon={CloudOff}
              title="Simulate no connection"
              description="Turn this on to see how every flow behaves offline. Rule checks still run on your device; community report data is paused."
              value={simulateOffline}
              onValueChange={setSimulateOffline}
            />
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
