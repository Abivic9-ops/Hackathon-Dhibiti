import { router } from 'expo-router';
import {
  BellRing,
  BookOpenCheck,
  ChevronRight,
  HeartHandshake,
  Landmark,
  ShieldCheck,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { AlertCard } from '@/components/ui/AlertCard';
import { GhostButton, InlineAction } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { EmptyState, OfflineBanner } from '@/components/ui/Feedback';
import { GradientIconTile, IconTile } from '@/components/ui/IconTile';
import { NavRow } from '@/components/ui/rows';
import { RiskDot } from '@/components/ui/Risk';
import { PageTitle, Screen, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SHARING_LABEL } from '@/lib/family';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Family tab: consent-based protection for the people you look out for, plus
 * the Group Circles section for chamas and SACCOs.
 */
export default function FamilyTab() {
  const user = useStore((state) => state.user);
  const circle = useStore((state) => state.circle);
  const groups = useStore((state) => state.groups);
  const alerts = useStore((state) => state.alerts);
  const checks = useStore((state) => state.checks);
  const simulateOffline = useStore((state) => state.simulateOffline);

  const members = circle.members;
  const others = members.filter((member) => member.userId !== user.id);
  const isAdmin = circle.adminUserId === user.id;
  const protectedCount = members.filter((member) => member.role === 'protected').length;
  const me = members.find((member) => member.userId === user.id);
  const familyAlerts = alerts.filter((alert) => alert.circleKind === 'family');
  const groupAlerts = alerts.filter((alert) => alert.circleKind === 'group');

  return (
    <Screen>
      <PageTitle
        title="Family"
        subtitle="Protection you agree on together"
        right={
          <InlineAction
            label="Invite"
            icon={UserPlus}
            onPress={() => router.push('/family/invite')}
          />
        }
      />

      <ScreenScroll contentClassName="gap-4">
        {simulateOffline ? <OfflineBanner /> : null}

        <View className="px-5">
          <Card className="gap-3.5">
            <GradientIconTile icon={HeartHandshake} />
            <View className="gap-1">
              <Text variant="heading">
                {isAdmin
                  ? `You help protect ${protectedCount} ${protectedCount === 1 ? 'person' : 'people'}`
                  : 'You are protected by your circle'}
              </Text>
              <Text variant="caption">
                {isAdmin
                  ? 'When Dhibiti flags something high risk for a protected member, you get an alert with what was detected and how to help. You never see their normal activity.'
                  : 'Your circle only sees high-risk events you have agreed to share. Nothing else about your messages or payments is visible to them.'}
              </Text>
            </View>
            {me ? (
              <View className="bg-ink/40 rounded-2xl px-3.5 py-3">
                <Text variant="section" className="pb-1">
                  What you share
                </Text>
                <Text variant="body">{SHARING_LABEL[me.sharingLevel]}</Text>
              </View>
            ) : null}
          </Card>
        </View>

        <View>
          <SectionLabel label="Your family circle" />
          {others.length > 0 ? (
            <View className="gap-3 px-5">
              {members.map((member) => (
                <PressableCard
                  key={member.userId}
                  className="flex-row items-center gap-3"
                  onPress={() =>
                    router.push({
                      pathname: '/family/member/[id]',
                      params: { id: member.userId },
                    })
                  }
                >
                  <IconTile
                    icon={member.role === 'admin' ? ShieldCheck : Users}
                    color={member.role === 'admin' ? colors.brandTeal : colors.brandBlue}
                  />
                  <View className="flex-1 gap-1">
                    <Text variant="label" numberOfLines={1}>
                      {member.name}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text variant="meta">
                        {member.role === 'admin' ? 'Family admin' : 'Protected member'}
                      </Text>
                      <RiskDot level={member.status === 'active' ? 'green' : 'grey'} />
                      <Text variant="meta">
                        {member.status === 'active' ? 'Active' : 'Invite pending'}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
                </PressableCard>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={UserPlus}
              title="No one in your circle yet"
              body="Invite a relative to be protected, or ask someone to look out for you. Both sides have to agree before anything is shared."
              actionLabel="Invite someone"
              onAction={() => router.push('/family/invite')}
            />
          )}
        </View>

        <View>
          <SectionLabel
            label="Alerts"
            right={
              familyAlerts.length > 0 ? (
                <Text variant="meta">{familyAlerts.length} shared events</Text>
              ) : null
            }
          />
          {familyAlerts.length > 0 ? (
            <View className="gap-3 px-5">
              {familyAlerts.map((alert) => {
                const relatedCheckId = alert.relatedCheckId;
                return (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    scamIconKey={
                      checks.find((check) => check.id === alert.relatedCheckId)?.scamCategory
                    }
                    onCall={
                      alert.contactPhone
                        ? () => void Linking.openURL(`tel:${alert.contactPhone}`)
                        : undefined
                    }
                    onMessage={
                      alert.contactPhone
                        ? () => void Linking.openURL(`sms:${alert.contactPhone}`)
                        : undefined
                    }
                    onOpenDetail={
                      relatedCheckId
                        ? () =>
                            router.push({
                              pathname: '/check/[id]',
                              params: { id: relatedCheckId },
                            })
                        : undefined
                    }
                  />
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={BellRing}
              title="No alerts shared with you"
              body="Alerts appear here only when Dhibiti flags something high risk for a member of your circle. Quiet is good news."
            />
          )}
        </View>

        <View>
          <SectionLabel
            label="Group circles"
            right={<InlineAction label="See all" onPress={() => router.push('/groups')} />}
          />
          <View className="gap-3 px-5">
            {groups.map((group) => (
              <PressableCard
                key={group.id}
                className="flex-row items-center gap-3"
                onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
              >
                <IconTile
                  icon={group.kind === 'sacco' ? Landmark : UsersRound}
                  color={colors.brandMint}
                />
                <View className="flex-1 gap-1">
                  <Text variant="label" numberOfLines={1}>
                    {group.name}
                  </Text>
                  <Text variant="meta">
                    {group.kind === 'sacco' ? 'SACCO' : 'Chama'} · {group.members.length} members ·{' '}
                    {group.broadcastAlerts.length} broadcast
                    {group.broadcastAlerts.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
              </PressableCard>
            ))}
            {groups.length === 0 ? (
              <Card className="gap-3">
                <IconTile icon={UsersRound} color={colors.brandMint} />
                <Text variant="label">No group circles yet</Text>
                <Text variant="caption">
                  Chamas and SACCOs are common targets for people impersonating a treasurer. A group
                  circle lets an official warn every member at once.
                </Text>
                <GhostButton
                  label="Create a group circle"
                  onPress={() => router.push('/groups/new')}
                />
              </Card>
            ) : null}
            {groupAlerts.length > 0 ? (
              <Text variant="meta">
                {groupAlerts.length} group broadcast{groupAlerts.length === 1 ? '' : 's'} sent so
                far. Open a group to read them.
              </Text>
            ) : null}
          </View>
        </View>

        <View>
          <SectionLabel label="Family safety guide" />
          <View className="gap-3 px-5">
            <NavRow
              icon={BookOpenCheck}
              title="Talking about money safety at home"
              description="Short guides for agreeing on family rules before a scam arrives"
              iconColor={colors.brandMint}
              onPress={() => router.push('/family/guide')}
            />
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
