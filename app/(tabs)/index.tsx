import { useState } from 'react';
import {
  Bell,
  MessageSquareText,
  QrCode,
  Radar,
  ScanSearch,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { InlineAction } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, OfflineBanner } from '@/components/ui/Feedback';
import { PulseDot, PulseRings, Stagger } from '@/components/ui/Motion';
import { DonutRing, type RingSegment } from '@/components/ui/Progress';
import { LocationChip, RadarRow } from '@/components/ui/RadarRow';
import { Screen, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ActivityListRow, QuickActionTile, StatTile } from '@/components/ui/rows';
import { LiteracyPrompt } from '@/components/ui/Verdict';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { RiskLevel } from '@/lib/types';

const WEEK = 7 * 24 * 60 * 60 * 1000;

type Protection = {
  status: string;
  caption: string;
  color: string;
  textClass: string;
};

/** Plain-language protection status. Never worded as a safety guarantee. */
function protectionState(total: number, highRisk: number, suspicious: number): Protection {
  if (total === 0) {
    return {
      status: 'Not checked yet',
      caption: 'Run your first check and your protection status appears here.',
      color: colors.riskGrey,
      textClass: 'text-risk-grey',
    };
  }
  if (highRisk > 0) {
    return {
      status: 'Take action',
      caption: `${highRisk} high-risk ${highRisk === 1 ? 'item' : 'items'} flagged in the last 7 days. Do not reply or pay.`,
      color: colors.riskRed,
      textClass: 'text-risk-red',
    };
  }
  if (suspicious > 0) {
    return {
      status: 'Stay alert',
      caption: `${suspicious} suspicious ${suspicious === 1 ? 'item' : 'items'} to verify independently.`,
      color: colors.riskAmber,
      textClass: 'text-risk-amber',
    };
  }
  return {
    status: 'Good',
    caption: 'No high-risk items in the last 7 days. This is not a guarantee — keep checking.',
    color: colors.brandMint,
    textClass: 'text-brand-mint',
  };
}

/** Daily safety snapshot: protection status, every main feature, recent checks. */
export default function HomeTab() {
  const user = useStore((state) => state.user);
  const checks = useStore((state) => state.checks);
  const radar = useStore((state) => state.radar);
  const alerts = useStore((state) => state.alerts);
  const lessons = useStore((state) => state.lessons);
  const safetyEvents = useStore((state) => state.safetyEvents);
  const dismissedPromptIds = useStore((state) => state.dismissedPromptIds);
  const dismissPrompt = useStore((state) => state.dismissPrompt);
  const simulateOffline = useStore((state) => state.simulateOffline);

  const [since] = useState(() => Date.now() - WEEK);
  const week = checks.filter((check) => check.createdAt >= since);
  const countBy = (level: RiskLevel) => week.filter((check) => check.riskLevel === level).length;
  const highRisk = countBy('red');
  const suspicious = countBy('amber');
  const safetyScore = safetyEvents.reduce((total, event) => total + event.delta, 0);
  const protection = protectionState(week.length, highRisk, suspicious);

  const segments: RingSegment[] = [
    { value: countBy('red'), color: colors.riskRed },
    { value: suspicious, color: colors.riskAmber },
    { value: countBy('grey'), color: colors.riskGrey },
    { value: countBy('blue'), color: colors.riskBlue },
    { value: countBy('green'), color: colors.riskGreen },
  ];

  const recent = checks.slice(0, 4);
  const localRadar = [...radar]
    .sort(
      (a, b) => Number(b.roughLocation === user.county) - Number(a.roughLocation === user.county),
    )
    .slice(0, 3);

  const lastHighRisk = week.find(
    (check) => check.riskLevel === 'red' || check.riskLevel === 'amber',
  );
  const promptLesson = lastHighRisk
    ? lessons.find((lesson) => lesson.id === lastHighRisk.relatedLessonId)
    : undefined;
  const promptId = lastHighRisk ? `home-lesson-${lastHighRisk.id}` : '';
  const showPrompt = Boolean(promptLesson) && !dismissedPromptIds.includes(promptId);

  return (
    <Screen>
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4">
        <View className="flex-1">
          <Text variant="title">Hi, {user.name.split(' ')[0]}</Text>
          <Text variant="caption">Stay alert. Stay protected.</Text>
        </View>
        <ThemeToggle />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Family alerts"
          onPress={() => router.push('/(tabs)/family')}
          hitSlop={8}
          className="bg-surface-secondary h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <Bell color={colors.foreground} size={19} strokeWidth={1.9} />
          {alerts.length > 0 ? (
            <View className="absolute top-2.5 right-3">
              <PulseDot />
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          onPress={() => router.push('/more/profile')}
          hitSlop={8}
          className="bg-brand-teal-soft border-brand-teal/40 h-11 w-11 items-center justify-center rounded-full border active:opacity-70"
        >
          <UserRound color={colors.brandMint} size={20} strokeWidth={1.9} />
        </Pressable>
      </View>

      <ScreenScroll contentClassName="gap-4">
        <Stagger step={70} initialDelay={40}>
          {simulateOffline ? <OfflineBanner /> : null}

          <View className="px-5">
            <Card className="flex-row items-center gap-4">
              <View className="flex-1 gap-1">
                <Text variant="section">Overall protection</Text>
                <Text variant="numeral" className={protection.textClass}>
                  {protection.status}
                </Text>
                <Text variant="caption">{protection.caption}</Text>
                <Text variant="meta" className="pt-1">
                  {week.length} {week.length === 1 ? 'check' : 'checks'} in the last 7 days
                </Text>
              </View>
              <View className="items-center justify-center">
                <View className="bg-brand-teal-soft/60 absolute h-20 w-20 rounded-full" />
                <PulseRings size={88} color={protection.color} />
                <DonutRing segments={segments} size={88} strokeWidth={7}>
                  <ShieldCheck color={protection.color} size={30} strokeWidth={1.8} />
                </DonutRing>
              </View>
            </Card>
          </View>

          <View className="px-5">
            <Card className="flex-row items-start gap-2 px-3 py-4">
              <QuickActionTile
                icon={MessageSquareText}
                label="Check message"
                emphasised
                onPress={() => router.push('/check/message')}
              />
              <QuickActionTile
                icon={QrCode}
                label="Scan QR"
                onPress={() => router.push('/check/qr')}
              />
              <QuickActionTile
                icon={Wallet}
                label="Verify recipient"
                onPress={() => router.push('/pay/verify')}
              />
              <QuickActionTile
                icon={ScanSearch}
                label="Check number"
                onPress={() => router.push('/check/lookup')}
              />
            </Card>
          </View>

          <View>
            <SectionLabel
              label="Recent activity"
              right={
                recent.length > 0 ? (
                  <InlineAction label="View all" onPress={() => router.push('/(tabs)/shield')} />
                ) : undefined
              }
            />
            {recent.length > 0 ? (
              <View className="px-5">
                <Card className="gap-0 p-0">
                  {recent.map((check, index) => (
                    <View key={check.id}>
                      {index > 0 ? <View className="bg-surface-tertiary mx-4 h-px" /> : null}
                      <ActivityListRow
                        check={check}
                        onPress={() =>
                          router.push({ pathname: '/check/[id]', params: { id: check.id } })
                        }
                      />
                    </View>
                  ))}
                </Card>
              </View>
            ) : (
              <EmptyState
                icon={MessageSquareText}
                title="No checks yet"
                body="When you check a message, call, QR code or number, it will be listed here so you can look back at it."
                actionLabel="Check a message"
                onAction={() => router.push('/check/message')}
              />
            )}
          </View>

          <View>
            <SectionLabel
              label="Scam radar"
              right={<LocationChip label={`Near ${user.county}`} />}
            />
            <View className="gap-3 px-5">
              {localRadar.map((event) => (
                <RadarRow
                  key={event.id}
                  event={event}
                  onPress={() =>
                    router.push({
                      pathname: '/lesson/[id]',
                      params: { id: event.relatedLessonId },
                    })
                  }
                />
              ))}
              <InlineAction label="See more near you" onPress={() => router.push('/radar')} />
            </View>
          </View>

          <View className="flex-row gap-3 px-5">
            <StatTile
              icon={ShieldCheck}
              value={String(highRisk)}
              label="High-risk items stopped"
              color={colors.riskRed}
            />
            <StatTile
              icon={Radar}
              value={String(safetyScore)}
              label="Your safety score"
              color={colors.brandMint}
            />
          </View>

          {showPrompt && promptLesson && lastHighRisk ? (
            <View className="px-5">
              <LiteracyPrompt
                title={promptLesson.title}
                durationLabel={promptLesson.durationLabel}
                onOpen={() =>
                  router.push({ pathname: '/lesson/[id]', params: { id: promptLesson.id } })
                }
                onDismiss={() => dismissPrompt(promptId)}
              />
            </View>
          ) : null}
        </Stagger>
      </ScreenScroll>
    </Screen>
  );
}
