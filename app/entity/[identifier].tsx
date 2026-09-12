import { useLocalSearchParams } from 'expo-router';
import { CalendarClock, Flag, ScanSearch, ShieldQuestion, Users } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { IDENTIFIER_LABEL } from '@/components/ui/icons';
import { VerdictBadge } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { RecommendedActions, SocialProofNote } from '@/components/ui/Verdict';
import { SCAM_CATEGORY_LABEL } from '@/lib/detection';
import { useStore } from '@/lib/store';
import { colors, RISK } from '@/lib/theme';
import type { RecommendedAction } from '@/lib/types';
import { useRiskActions } from '@/lib/useRiskActions';
import { formatDate } from '@/lib/utils';

/** Reverse lookup result for a number, Paybill, Till, account or wallet. */
export default function EntityResult() {
  const params = useLocalSearchParams<{ identifier?: string }>();
  const identifier = params.identifier ?? '';

  const entities = useStore((state) => state.entities);
  const institutions = useStore((state) => state.institutions);
  const recipients = useStore((state) => state.recipients);
  const lessons = useStore((state) => state.lessons);

  const needle = identifier.replace(/\s+/g, '').toLowerCase();
  const entity = entities.find((item) => {
    const value = item.identifier.replace(/\s+/g, '').toLowerCase();
    return value === needle || value.endsWith(needle.slice(-9)) || needle.includes(value);
  });

  const institution = institutions.find((item) => item.officialNumbers.includes(identifier));
  const paidBefore = recipients.find((item) => item.identifier === identifier);
  const level = institution ? 'blue' : (entity?.riskLevel ?? 'grey');
  const lesson =
    lessons.find((item) => item.relatedScamCategory === entity?.scamCategory) ??
    lessons.find((item) => item.category === 'mobile-money') ??
    lessons[0];

  const summary = institution
    ? `This is a published official number for ${institution.name}.`
    : entity
      ? `${entity.displayName ?? identifier} has ${entity.reportCount} reports from ${entity.uniqueReporters} different people, most often for ${SCAM_CATEGORY_LABEL[entity.scamCategory].toLowerCase()}.`
      : `Nobody has reported ${identifier} to Dhibiti yet. That is not the same as it being safe — an unreported number can still be a scammer.`;

  const actions: RecommendedAction[] = [];
  if (institution) {
    actions.push({
      id: 'a-call',
      label: `Call ${institution.name} on this number`,
      kind: 'call-verified',
      emphasis: 'primary',
      payload: institution.id,
      helper: 'Dial it yourself rather than calling back a number that contacted you.',
    });
  } else if (level === 'red' || level === 'amber') {
    actions.push({
      id: 'a-pay',
      label: 'Check a payment to this recipient',
      kind: 'safe-pay',
      emphasis: 'primary',
      payload: identifier,
      helper: 'Enter the amount and we will show you the risk before any money moves.',
    });
    actions.push({
      id: 'a-contact',
      label: 'Call someone you trust first',
      kind: 'call-contact',
      emphasis: 'secondary',
      payload: '',
      helper: 'A second opinion costs nothing and takes a minute.',
    });
  } else {
    actions.push({
      id: 'a-pay',
      label: 'Verify a payment before sending',
      kind: 'safe-pay',
      emphasis: 'primary',
      payload: identifier,
      helper: 'No reports found, so confirm the amount and account name still match.',
    });
  }
  actions.push({
    id: 'a-report',
    label: 'Report this to protect others',
    kind: 'report',
    emphasis: 'secondary',
    payload: identifier,
  });
  if (lesson) {
    actions.push({
      id: 'a-lesson',
      label: lesson.title,
      kind: 'lesson',
      emphasis: 'secondary',
      payload: lesson.id,
    });
  }

  const onAction = useRiskActions({});

  return (
    <Screen>
      <ScreenHeader
        title={identifier}
        subtitle={entity ? IDENTIFIER_LABEL[entity.identifierType] : 'Lookup result'}
        backFallback="/(tabs)/shield"
      />
      <ScreenScroll contentClassName="px-5 gap-4">
        <VerdictBadge
          level={level}
          summary={summary}
          scamCategory={entity?.scamCategory === 'none' ? undefined : entity?.scamCategory}
        />

        {institution ? (
          <Card className="flex-row items-center gap-3">
            <IconTile icon={ShieldQuestion} color={colors.brandBlue} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              A verified sender still does not mean the message you received is genuine. Confirm
              that what you were asked to do is something {institution.name} would actually ask.
            </Text>
          </Card>
        ) : null}

        <Card className="gap-3">
          <Text variant="heading">What the community data shows</Text>
          <FactRow
            label="Independent reports"
            value={
              entity
                ? `${entity.reportCount} reports · ${entity.uniqueReporters} reporters`
                : 'None yet'
            }
          />
          <FactRow
            label="Most common category"
            value={entity ? SCAM_CATEGORY_LABEL[entity.scamCategory] : 'Not enough information'}
          />
          <FactRow
            label="First reported"
            value={entity ? formatDate(entity.firstReportedAt) : '—'}
          />
          <FactRow
            label="Most recent report"
            value={entity ? formatDate(entity.lastReportedAt) : '—'}
          />
          <FactRow
            label="Review status"
            value={
              entity
                ? entity.reviewStatus === 'confirmed'
                  ? 'Confirmed by Dhibiti review'
                  : entity.reviewStatus === 'under-review'
                    ? 'Under review'
                    : 'Reported, not yet reviewed'
                : 'No record'
            }
          />
          <FactRow
            label="Merchant verification"
            value={
              institution
                ? `Verified ${institution.category}`
                : entity?.merchantVerified
                  ? 'Matches a known merchant'
                  : 'Not in our verified merchant list'
            }
          />
          {entity?.domainAgeDays !== undefined ? (
            <FactRow label="Domain age" value={`${entity.domainAgeDays} days old`} />
          ) : null}
        </Card>

        <Card className="gap-3">
          <Text variant="heading">Your own history</Text>
          <View className="flex-row items-center gap-3">
            <IconTile
              icon={paidBefore ? CalendarClock : ScanSearch}
              color={paidBefore ? colors.brandMint : colors.muted}
            />
            <Text variant="body" className="flex-1">
              {paidBefore
                ? `You have paid this recipient ${paidBefore.timesPaid} time${paidBefore.timesPaid === 1 ? '' : 's'}${
                    paidBefore.lastPaidAt
                      ? `, most recently on ${formatDate(paidBefore.lastPaidAt)}`
                      : ''
                  }.`
                : 'You have never paid this recipient from Dhibiti. First-time payments deserve one extra check.'}
            </Text>
          </View>
        </Card>

        {entity?.notes?.length ? (
          <Card className="gap-2.5">
            <Text variant="heading">Other things we noticed</Text>
            {entity.notes.map((note) => (
              <View key={note} className="flex-row gap-2.5">
                <View className="bg-brand-teal mt-2 h-1.5 w-1.5 rounded-full" />
                <Text variant="body" className="flex-1">
                  {note}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <RecommendedActions actions={actions} onAction={onAction} />

        <SocialProofNote>
          {entity
            ? 'Others have reported this identifier more than once. Reports from different people count separately, so one person cannot mark a number as a scam alone.'
            : 'Many people in Kenya are asked to pay numbers they have never used before. Most legitimate businesses are happy to be verified first.'}
        </SocialProofNote>

        <View className="bg-surface-secondary/60 flex-row items-center gap-3 rounded-[20px] p-4">
          <IconTile icon={Users} color={colors.muted} size="sm" />
          <Text variant="caption" className="flex-1">
            Nobody is told that you looked this up.
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5 px-1 pb-2">
          <Flag color={RISK[level].color} size={16} strokeWidth={1.9} />
          <Text variant="meta" className="flex-1">
            {RISK[level].action}
          </Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text variant="caption" className="flex-1">
        {label}
      </Text>
      <Text variant="label" className="max-w-[58%] text-right">
        {value}
      </Text>
    </View>
  );
}
