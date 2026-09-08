import { router, useLocalSearchParams } from 'expo-router';
import {
  BellRing,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Timer,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { AlertCard } from '@/components/ui/AlertCard';
import { GhostButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { OptionRow, PrivacyNote } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { RiskDot } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { LOCK_OPTIONS, lockLabel, SHARING_LEVELS } from '@/lib/family';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Member page: who they are, what they share, and the hold applied to their
 * high-risk payments. Sharing is always changeable from here — never buried.
 */
export default function FamilyMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore((state) => state.user);
  const circle = useStore((state) => state.circle);
  const alerts = useStore((state) => state.alerts);
  const checks = useStore((state) => state.checks);
  const setMemberSharing = useStore((state) => state.setMemberSharing);
  const setMemberLock = useStore((state) => state.setMemberLock);

  const member = circle.members.find((item) => item.userId === id);

  if (!member) {
    return (
      <Screen>
        <ScreenHeader title="Member" backFallback="/(tabs)/family" />
        <EmptyState
          icon={UserPlus}
          title="This member is no longer in your circle"
          body="They may have left, or the invite was withdrawn. You can invite them again at any time."
          actionLabel="Invite someone"
          onAction={() => router.replace('/family/invite')}
        />
      </Screen>
    );
  }

  const isMe = member.userId === user.id;
  const isProtected = member.role === 'protected';
  const canEditLock = !isMe && isProtected && circle.adminUserId === user.id;
  const memberAlerts = alerts.filter(
    (alert) => alert.circleKind === 'family' && alert.memberName === member.name,
  );

  return (
    <Screen>
      <ScreenHeader
        title={member.name}
        subtitle={isProtected ? 'Protected member' : 'Family admin'}
        backFallback="/(tabs)/family"
      />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="gap-3.5">
            <View className="flex-row items-center gap-3">
              <IconTile
                icon={isProtected ? Users : ShieldCheck}
                color={isProtected ? colors.brandBlue : colors.brandTeal}
                size="lg"
              />
              <View className="flex-1 gap-1">
                <Text variant="heading">{member.name}</Text>
                <View className="flex-row items-center gap-2">
                  <RiskDot level={member.status === 'active' ? 'green' : 'grey'} />
                  <Text variant="meta">
                    {member.status === 'active'
                      ? `Active · ${member.phone}`
                      : 'Invite pending — nothing is shared yet'}
                  </Text>
                </View>
              </View>
            </View>
            <Text variant="caption">
              {isProtected
                ? 'You get an alert when Dhibiti flags something high risk for them. You never see their normal messages, calls or payments.'
                : 'They get the alerts you choose to share below, and can help you verify a caller or a payment destination.'}
            </Text>
            <View className="flex-row gap-3">
              <GhostButton
                label="Call"
                icon={PhoneCall}
                onPress={() => void Linking.openURL(`tel:${member.phone}`)}
              />
              <GhostButton
                label="Message"
                icon={MessageSquare}
                onPress={() => void Linking.openURL(`sms:${member.phone}`)}
              />
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel label={isMe ? 'What you share' : 'What they share'} />
          <View className="gap-3 px-5">
            {SHARING_LEVELS.map((level) => (
              <OptionRow
                key={level.value}
                title={level.label}
                description={level.description}
                selected={member.sharingLevel === level.value}
                onPress={() => setMemberSharing(member.userId, level.value)}
              />
            ))}
            <PrivacyNote>
              {isMe
                ? 'This is your own setting and you can change it any time. Message text and screenshots stay on this phone unless the level you pick includes them.'
                : 'Only they can loosen this from their own phone. Changing it here is a request they see and agree to before anything new is shared.'}
            </PrivacyNote>
          </View>
        </View>

        {canEditLock ? (
          <View>
            <SectionLabel label="Hold on high-risk payments" />
            <View className="gap-3 px-5">
              <Card className="gap-2">
                <IconTile icon={Timer} color={colors.brandMint} />
                <Text variant="label">Currently: {lockLabel(member.lockSeconds)}</Text>
                <Text variant="caption">
                  When a payment is flagged high risk, the confirm button is held for this long so
                  there is time to verify. It never stops them from calling anyone during the wait.
                </Text>
              </Card>
              {LOCK_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  title={option.label}
                  description={
                    option.value === 0
                      ? 'They can confirm immediately after reading the warning.'
                      : `High-risk payments wait ${option.label.toLowerCase()} before they can be confirmed.`
                  }
                  selected={(member.lockSeconds ?? 0) === option.value}
                  onPress={() => setMemberLock(member.userId, option.value)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View>
          <SectionLabel label="Shared alerts" />
          {memberAlerts.length > 0 ? (
            <View className="gap-3 px-5">
              {memberAlerts.map((alert) => {
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
              title="Nothing has been shared"
              body="Alerts only appear for specific high-risk events. A quiet page means nothing risky has been flagged."
            />
          )}
        </View>
      </ScreenScroll>
    </Screen>
  );
}
