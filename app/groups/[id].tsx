import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Landmark,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { AlertCard } from '@/components/ui/AlertCard';
import { GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { RiskDot } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Group circle detail: members, the warnings sent to the group, and — for an
 * official — the entry point to broadcast a new verified warning.
 */
export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore((state) => state.user);
  const groups = useStore((state) => state.groups);
  const alerts = useStore((state) => state.alerts);
  const inviteGroupMember = useStore((state) => state.inviteGroupMember);

  const [showInvite, setShowInvite] = useState(false);
  const [invited, setInvited] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const group = groups.find((item) => item.id === id);

  if (!group) {
    return (
      <Screen>
        <ScreenHeader title="Group circle" backFallback="/groups" />
        <EmptyState
          icon={UsersRound}
          title="This group circle no longer exists"
          body="It may have been closed by its official. You can create a new one for your chama or SACCO."
          actionLabel="Create a group circle"
          onAction={() => router.replace('/groups')}
        />
      </Screen>
    );
  }

  const isAdmin = group.adminUserId === user.id;
  const groupAlerts = alerts.filter(
    (alert) => alert.circleKind === 'group' && alert.circleId === group.id,
  );
  const canInvite = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9;

  return (
    <Screen>
      <ScreenHeader
        title={group.name}
        subtitle={group.kind === 'sacco' ? 'SACCO circle' : 'Chama circle'}
        backFallback="/groups"
      />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="gap-3.5">
            <View className="flex-row items-center gap-3">
              <IconTile
                icon={group.kind === 'sacco' ? Landmark : UsersRound}
                color={colors.brandMint}
                size="lg"
              />
              <View className="flex-1 gap-1">
                <Text variant="heading">{group.members.length} members</Text>
                <Text variant="meta">
                  {isAdmin
                    ? 'You are an official — you can send warnings'
                    : 'You receive warnings from the officials'}
                </Text>
              </View>
            </View>
            <Text variant="caption">
              {isAdmin
                ? 'Send a warning when you hear of a scam targeting this group — for example someone using your name to ask for contributions to a new Paybill.'
                : 'If you get a message claiming to be official group business, check it in Shield first. Officials never change the contribution number by SMS or WhatsApp alone.'}
            </Text>
            {isAdmin ? (
              <PrimaryButton
                label="Send a warning to the group"
                icon={Megaphone}
                onPress={() =>
                  router.push({ pathname: '/groups/broadcast', params: { groupId: group.id } })
                }
              />
            ) : (
              <GhostButton
                label="Flag a message claiming to be official"
                icon={ShieldAlert}
                onPress={() => router.push('/check/message')}
              />
            )}
            <GhostButton
              label="Invite a member"
              icon={UserPlus}
              onPress={() => setShowInvite(true)}
            />
          </Card>
        </View>

        <View>
          <SectionLabel label="Members" />
          <View className="gap-3 px-5">
            {group.members.map((member) => (
              <Card key={member.userId} className="flex-row items-center gap-3">
                <IconTile
                  icon={member.role === 'admin' ? ShieldCheck : UserRound}
                  color={member.role === 'admin' ? colors.brandTeal : colors.brandBlue}
                />
                <View className="flex-1 gap-1">
                  <Text variant="label">{member.name}</Text>
                  <View className="flex-row items-center gap-2">
                    <RiskDot level={member.status === 'active' ? 'green' : 'grey'} />
                    <Text variant="meta">
                      {member.status === 'active'
                        ? `${member.role === 'admin' ? 'Official' : 'Member'} · ${member.phone}`
                        : 'Invite pending'}
                    </Text>
                  </View>
                </View>
                {member.userId === user.id ? null : (
                  <GhostButton
                    label="Call"
                    fullWidth={false}
                    onPress={() => void Linking.openURL(`tel:${member.phone}`)}
                  />
                )}
              </Card>
            ))}
            <PrivacyNote>
              Members see group warnings and each other&apos;s names only. Contributions, balances
              and personal checks are never shared with the group.
            </PrivacyNote>
          </View>
        </View>

        <View>
          <SectionLabel label="Warnings sent to this group" />
          {groupAlerts.length > 0 ? (
            <View className="gap-3 px-5">
              {groupAlerts.map((alert) => {
                const relatedCheckId = alert.relatedCheckId;
                return (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
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
              icon={Megaphone}
              title="No warnings yet"
              body={
                isAdmin
                  ? 'When you hear of a scam aimed at this group, send one warning so every member sees the same clear message.'
                  : 'Officials have not needed to warn the group yet. You will get a notification when they do.'
              }
              actionLabel={isAdmin ? 'Send a warning' : undefined}
              onAction={
                isAdmin
                  ? () =>
                      router.push({ pathname: '/groups/broadcast', params: { groupId: group.id } })
                  : undefined
              }
            />
          )}
        </View>
      </ScreenScroll>

      <Sheet
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        icon={UserPlus}
        title="Invite a member"
        body="They get an SMS invite. They show as pending until they install Dhibiti and accept."
        primaryLabel="Send invite"
        onPrimary={
          canInvite
            ? () => {
                inviteGroupMember(group.id, { name: name.trim(), phone: phone.trim() });
                setName('');
                setPhone('');
                setShowInvite(false);
                setInvited(true);
              }
            : undefined
        }
        secondaryLabel="Cancel"
      >
        <View className="gap-3">
          <TextField
            label="Their name"
            value={name}
            onChangeText={setName}
            placeholder="Peter Kamau"
            autoCapitalize="words"
          />
          <TextField
            label="Their phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="712 345 678"
            prefix="+254"
            keyboardType="phone-pad"
          />
        </View>
      </Sheet>

      <Sheet
        visible={invited}
        onClose={() => setInvited(false)}
        icon={UsersRound}
        title="Invite sent"
        body="They will appear as pending in the member list. Nothing is shared with them until they accept."
        primaryLabel="Done"
        onPrimary={() => setInvited(false)}
      />
    </Screen>
  );
}
