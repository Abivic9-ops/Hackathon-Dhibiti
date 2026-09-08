import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Megaphone, ShieldAlert, UsersRound } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { OptionRow, PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

const TEMPLATES: { id: string; label: string; summary: string; detail: string }[] = [
  {
    id: 'treasurer',
    label: 'Someone is impersonating an official',
    summary: 'Messages claiming to be from the treasurer are asking for a new Paybill',
    detail:
      'Members are getting SMS and WhatsApp messages using the treasurer\u2019s name and asking for contributions to a new Paybill. The group contribution number has not changed. Do not pay a new number, and call the official on the number you already have saved.',
  },
  {
    id: 'meeting-link',
    label: 'A fake group link is going round',
    summary: 'A link claiming to be the group meeting or register is collecting ID and PIN details',
    detail:
      'A link is circulating that looks like a group page and asks for your ID number and M-Pesa PIN. No group official and no bank will ever ask for your PIN. Do not open the link, and check it in Dhibiti if you already did.',
  },
  {
    id: 'contribution-pressure',
    label: 'Members are being rushed to pay today',
    summary: 'Members are being pressured to send contributions immediately',
    detail:
      'Messages are telling members to pay today or lose their place in the group. Real group business is never that urgent. Confirm any deadline with an official on a saved number before sending money.',
  },
];

/**
 * Broadcast composer for a group official. One warning goes to every member,
 * always with a reason and a concrete next step.
 */
export default function GroupBroadcast() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const groups = useStore((state) => state.groups);
  const broadcastGroupAlert = useStore((state) => state.broadcastGroupAlert);

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [detail, setDetail] = useState('');
  const [sent, setSent] = useState(false);

  const group = groups.find((item) => item.id === groupId);

  if (!group) {
    return (
      <Screen>
        <ScreenHeader title="Send a warning" backFallback="/groups" />
        <EmptyState
          icon={UsersRound}
          title="Pick a group first"
          body="Open the group circle you want to warn, then choose Send a warning."
          actionLabel="See your group circles"
          onAction={() => router.replace('/groups')}
        />
      </Screen>
    );
  }

  const canSend = summary.trim().length > 8 && detail.trim().length > 20;

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
    setTemplateId(template.id);
    setSummary(template.summary);
    setDetail(template.detail);
  };

  return (
    <Screen>
      <ScreenHeader title="Send a warning" subtitle={group.name} backFallback="/groups" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <IconTile icon={Megaphone} color={colors.brandMint} />
              <RiskPill level="red" />
            </View>
            <Text variant="label">
              This reaches all {group.members.length} members as a high-risk alert
            </Text>
            <Text variant="caption">
              Members see the warning, the reason, and the same suggested action: do not pay a new
              Paybill or number, and confirm with an official on a saved number.
            </Text>
          </Card>

          <View className="gap-3">
            <Text variant="section">Start from a common pattern</Text>
            {TEMPLATES.map((template) => (
              <OptionRow
                key={template.id}
                icon={ShieldAlert}
                title={template.label}
                description={template.summary}
                selected={templateId === template.id}
                onPress={() => applyTemplate(template)}
              />
            ))}
          </View>

          <TextField
            label="Warning headline"
            value={summary}
            onChangeText={setSummary}
            placeholder="Messages using the treasurer's name are asking for a new Paybill"
            multiline
            minHeight={80}
            maxLength={140}
            helper="One plain sentence describing what is happening."
          />

          <TextField
            label="What members should know and do"
            value={detail}
            onChangeText={setDetail}
            placeholder="Explain what you have seen, confirm what has not changed, and tell members who to call to confirm."
            multiline
            minHeight={140}
            maxLength={600}
          />

          <PrivacyNote>
            Dhibiti sends only the text you write here. Member names, contributions and their own
            checks are never included in a group warning.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label={`Send to ${group.members.length} members`}
            icon={Megaphone}
            disabled={!canSend}
            onPress={() => {
              broadcastGroupAlert(group.id, { summary: summary.trim(), detail: detail.trim() });
              setSent(true);
            }}
          />
          <GhostButton label="Cancel" onPress={() => router.back()} />
        </ActionBar>
      </KeyboardAvoidingView>

      <Sheet
        visible={sent}
        onClose={() => setSent(false)}
        icon={Megaphone}
        title="Warning sent to the group"
        body="Every member now sees the same alert with your reason and the suggested action. You did the right thing by warning them early — members who know the pattern are much harder to trick."
        primaryLabel="Back to the group"
        onPrimary={() => {
          setSent(false);
          router.replace({ pathname: '/groups/[id]', params: { id: group.id } });
        }}
      />
    </Screen>
  );
}
