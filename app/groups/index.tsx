import { router } from 'expo-router';
import { ChevronRight, Landmark, Megaphone, Plus, UsersRound } from 'lucide-react-native';
import { View } from 'react-native';

import { GhostButton } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { timeAgo } from '@/lib/utils';

/**
 * Group circles list: chamas and SACCOs, where an official can warn every
 * member at once about a scam targeting the group.
 */
export default function GroupsList() {
  const user = useStore((state) => state.user);
  const groups = useStore((state) => state.groups);
  const alerts = useStore((state) => state.alerts);

  return (
    <Screen>
      <ScreenHeader
        title="Group circles"
        subtitle="Chamas and SACCOs"
        backFallback="/(tabs)/family"
      />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="gap-3">
            <IconTile icon={Megaphone} color={colors.brandMint} size="lg" />
            <Text variant="heading">One warning reaches everyone</Text>
            <Text variant="caption">
              Scammers copy the name of a treasurer or chairperson and ask members to contribute to
              a new Paybill. A group circle lets an official send one verified warning to every
              member, and lets members flag a message claiming to be official business.
            </Text>
          </Card>
        </View>

        {groups.length > 0 ? (
          <View>
            <SectionLabel label={`Your groups (${groups.length})`} />
            <View className="gap-3 px-5">
              {groups.map((group) => {
                const groupAlerts = alerts.filter(
                  (alert) => alert.circleKind === 'group' && alert.circleId === group.id,
                );
                const latest = groupAlerts[0];
                const isAdmin = group.adminUserId === user.id;

                return (
                  <PressableCard
                    key={group.id}
                    className="flex-row items-center gap-3"
                    onPress={() =>
                      router.push({ pathname: '/groups/[id]', params: { id: group.id } })
                    }
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
                        {group.members.length} members ·{' '}
                        {isAdmin ? 'You are an official' : 'Member'}
                      </Text>
                      <Text variant="meta">
                        {latest
                          ? `Last warning ${timeAgo(latest.createdAt)}`
                          : 'No warnings sent yet'}
                      </Text>
                    </View>
                    <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
                  </PressableCard>
                );
              })}
            </View>
          </View>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No group circles yet"
            body="Create one for your chama or SACCO and invite the members you already collect contributions from."
            actionLabel="Create a group circle"
            onAction={() => router.push('/groups/new')}
          />
        )}

        <View className="px-5">
          <GhostButton
            label="Create a group circle"
            icon={Plus}
            onPress={() => router.push('/groups/new')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}
