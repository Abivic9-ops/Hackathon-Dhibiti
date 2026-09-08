import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldAlert, Trash2, Users } from 'lucide-react-native';

import { GhostButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { CHECK_TYPE_LABEL } from '@/components/ui/icons';
import { Stagger } from '@/components/ui/Motion';
import { RiskPanelPair, VerdictBadge } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import {
  LiteracyPrompt,
  ReassuranceNote,
  RecommendedActions,
  SocialProofNote,
  WhyFlagged,
} from '@/components/ui/Verdict';
import { QR_CONTENT_LABEL, SCAM_CATEGORY_LABEL } from '@/lib/detection';
import { goBackOrReplace } from '@/lib/navigation';
import { useStore } from '@/lib/store';
import { RISK } from '@/lib/theme';
import { useRiskActions } from '@/lib/useRiskActions';
import { timeAgo } from '@/lib/utils';

const SOCIAL_PROOF: Record<string, string> = {
  red: 'Many people in Kenya receive messages like this one. Most of them are scams, and reports from others are what made this one easy to spot.',
  amber:
    'Others have checked identifiers like this one. Unverified does not mean guilty — it means confirm it yourself before money moves.',
};

export default function VerdictScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const check = useStore((state) => state.checks.find((item) => item.id === id));
  const entities = useStore((state) => state.entities);
  const lessons = useStore((state) => state.lessons);
  const readLessonIds = useStore((state) => state.readLessonIds);
  const dismissedPromptIds = useStore((state) => state.dismissedPromptIds);
  const dismissPrompt = useStore((state) => state.dismissPrompt);
  const deleteCheck = useStore((state) => state.deleteCheck);
  const circle = useStore((state) => state.circle);

  const [shared, setShared] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const runAction = useRiskActions({
    check,
    onFamilyShared: () => setShared(true),
    onDismiss: () => goBackOrReplace('/(tabs)/shield'),
  });

  if (!check) {
    return (
      <Screen>
        <ScreenHeader title="Check" backFallback="/(tabs)/shield" />
        <EmptyState
          icon={ShieldAlert}
          title="This check is no longer saved"
          body="It may have been deleted from your history. You can run a new check any time."
          actionLabel="Go to Shield"
          onAction={() => router.replace('/(tabs)/shield')}
        />
      </Screen>
    );
  }

  const entity = check.recipientIdentifier
    ? entities.find((item) => item.identifier === check.recipientIdentifier)
    : undefined;
  const lesson = lessons.find((item) => item.id === check.relatedLessonId);
  const showLesson =
    lesson && !readLessonIds.includes(lesson.id) && !dismissedPromptIds.includes(lesson.id);
  const canShareWithFamily = circle.members.length > 1 && check.riskLevel === 'red';

  const recipientNote = entity
    ? `${entity.reportCount} reports from ${entity.uniqueReporters} people · ${SCAM_CATEGORY_LABEL[entity.scamCategory]}`
    : check.recipientIdentifier
      ? 'No reports yet for this destination. Unknown is not the same as safe.'
      : undefined;

  return (
    <Screen>
      <ScreenHeader
        title={`${CHECK_TYPE_LABEL[check.type]} check`}
        subtitle={timeAgo(check.createdAt)}
        backFallback="/(tabs)/shield"
        rightIcon={Trash2}
        rightLabel="Delete this check"
        onRightPress={() => setConfirmDelete(true)}
      />

      <ScreenScroll contentClassName="px-5 gap-4">
        <Stagger step={80} initialDelay={60}>
          {/* Zone A — verdict */}
          <VerdictBadge
            level={check.riskLevel}
            summary={check.inputSummary}
            scamCategory={check.scamCategory}
          />

          {check.recipientIdentifier ? (
            <RiskPanelPair
              contentLabel={`${CHECK_TYPE_LABEL[check.type]} risk`}
              contentLevel={check.riskLevel}
              recipientLabel="Recipient risk"
              recipientLevel={check.recipientRiskLevel}
              recipientNote={recipientNote}
            />
          ) : null}

          <Card className="gap-2">
            <Text variant="section">What you checked</Text>
            <Text variant="body" className="text-foreground/90">
              {check.inputText ?? check.inputSummary}
            </Text>
            <Text variant="meta">
              {check.qrContentType
                ? `QR content: ${QR_CONTENT_LABEL[check.qrContentType]} · stays on this device`
                : 'This stays on your device unless you choose to report it.'}
            </Text>
          </Card>

          {/* Zone B — why we flagged it */}
          <WhyFlagged
            factLines={check.ruleFactLines}
            aiExplanation={check.aiExplanation}
            technicalDetails={check.technicalDetails}
          />

          {/* Zone C — recommended actions */}
          <RecommendedActions actions={check.recommendedActions} onAction={runAction} />

          <Card className="gap-1.5">
            <Text variant="label" className={RISK[check.riskLevel].textClass}>
              {RISK[check.riskLevel].label}
            </Text>
            <Text variant="caption">{RISK[check.riskLevel].action}</Text>
          </Card>

          {canShareWithFamily ? (
            <GhostButton
              label="Share this alert with your family circle"
              icon={Users}
              onPress={() =>
                runAction({ id: 'share', label: 'share', kind: 'family', emphasis: 'secondary' })
              }
            />
          ) : null}

          {SOCIAL_PROOF[check.riskLevel] ? (
            <SocialProofNote>{SOCIAL_PROOF[check.riskLevel]}</SocialProofNote>
          ) : null}

          {showLesson ? (
            <LiteracyPrompt
              title={`Understand how this works: ${lesson.title}`}
              durationLabel={lesson.durationLabel}
              onOpen={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
              onDismiss={() => dismissPrompt(lesson.id)}
            />
          ) : null}

          <ReassuranceNote />
        </Stagger>
      </ScreenScroll>

      <Sheet
        visible={shared}
        onClose={() => setShared(false)}
        icon={Users}
        title="Alert shared with your circle"
        body="Your circle sees what was detected, why, and what to do — not a feed of everything you do."
        primaryLabel="Done"
        onPrimary={() => setShared(false)}
        secondaryLabel="Open Family"
        onSecondary={() => {
          setShared(false);
          router.push('/(tabs)/family');
        }}
      />

      <Sheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        icon={Trash2}
        title="Delete this check?"
        body="The record leaves your device. Community reports you already submitted stay, without your name."
        primaryLabel="Delete"
        primaryTone="danger"
        onPrimary={() => {
          setConfirmDelete(false);
          deleteCheck(check.id);
          goBackOrReplace('/(tabs)/shield');
        }}
        secondaryLabel="Keep it"
        onSecondary={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}
