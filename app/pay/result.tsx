import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, CreditCard, Handshake, ShieldOff, Wallet } from 'lucide-react-native';
import { View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPanelPair, RiskPill } from '@/components/ui/Risk';
import { IDENTIFIER_ICON, IDENTIFIER_LABEL } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import {
  LiteracyPrompt,
  RecommendedActions,
  SocialProofNote,
  WhyFlagged,
} from '@/components/ui/Verdict';
import { useStore } from '@/lib/store';
import { RISK, colors } from '@/lib/theme';
import { useRiskActions } from '@/lib/useRiskActions';
import { formatKes } from '@/lib/utils';

/**
 * Step 2 of Safe Pay Flow: the payment preview and risk overlay.
 * Friction is proportional — a notice for low concern, a confirmation screen
 * with a hold for medium and high concern.
 */
export default function PayResult() {
  const { paymentId } = useLocalSearchParams<{ paymentId?: string }>();
  const payments = useStore((state) => state.payments);
  const lessons = useStore((state) => state.lessons);
  const abandonPayment = useStore((state) => state.abandonPayment);

  const [confirmNote, setConfirmNote] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const payment = payments.find((item) => item.id === paymentId);
  const runAction = useRiskActions({ onDismiss: () => setConfirmNote(true) });

  if (!payment) {
    return (
      <Screen>
        <ScreenHeader title="Payment check" backFallback="/(tabs)/pay" />
        <EmptyState
          icon={Wallet}
          title="This payment check is no longer here"
          body="Payment checks are kept on this device only. Start a new check and we will look up the destination again."
          actionLabel="Check a payment"
          onAction={() => router.replace('/pay/verify')}
        />
      </Screen>
    );
  }

  const meta = RISK[payment.riskLevel];
  const needsFriction = payment.riskLevel === 'red' || payment.riskLevel === 'amber';
  const lesson = lessons.find((item) => item.id === payment.relatedLessonId);
  const summary = `You are about to send ${formatKes(payment.amountKes)} to ${IDENTIFIER_LABEL[
    payment.identifierType
  ].toLowerCase()} ${payment.identifier}${
    payment.recipientLabel ? `, account "${payment.recipientLabel}"` : ''
  }.`;

  return (
    <Screen>
      <ScreenHeader
        title="Payment check"
        subtitle="Nothing has been sent yet"
        backFallback="/(tabs)/pay"
      />

      <ScreenScroll contentClassName="px-5 gap-4">
        <Card className="gap-3.5">
          <View className="flex-row items-center gap-3">
            <IconTile icon={IDENTIFIER_ICON[payment.identifierType]} color={meta.color} />
            <View className="flex-1 gap-1">
              <Text variant="numeral">{formatKes(payment.amountKes)}</Text>
              <Text variant="meta" numberOfLines={1}>
                {IDENTIFIER_LABEL[payment.identifierType]} {payment.identifier}
              </Text>
            </View>
            <RiskPill level={payment.riskLevel} />
          </View>
          <Text variant="body">{summary}</Text>
          <View className="bg-ink/40 rounded-2xl px-3.5 py-3">
            <Text variant="section" className={meta.textClass}>
              Overall payment risk
            </Text>
            <Text variant="body" className="pt-1">
              {meta.action}
            </Text>
          </View>
        </Card>

        <RiskPanelPair
          contentLabel="Message risk"
          contentLevel={payment.messageRiskLevel ?? 'grey'}
          recipientLabel="Recipient risk"
          recipientLevel={payment.recipientRiskLevel}
          recipientNote={
            payment.firstTimeRecipient ? 'First payment to this destination' : 'Paid before'
          }
        />

        {payment.messageRiskLevel ? null : (
          <Text variant="meta">
            You did not paste a message with this payment, so there is nothing to read for scam
            language. Unknown is not the same as safe.
          </Text>
        )}

        <WhyFlagged
          factLines={payment.ruleFactLines}
          aiExplanation={payment.aiExplanation}
          technicalDetails={payment.technicalDetails}
          title="What we found"
        />

        <RecommendedActions
          actions={payment.recommendedActions}
          onAction={runAction}
          title="Before you send"
        />

        <SocialProofNote>
          Many people in Kenya are asked to pay a new number in a hurry. Checking first is normal,
          and it is the step that stops most losses.
        </SocialProofNote>

        {lesson ? (
          <LiteracyPrompt
            title={lesson.title}
            durationLabel={lesson.durationLabel}
            onOpen={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
          />
        ) : null}
      </ScreenScroll>

      <ActionBar>
        {needsFriction ? (
          <>
            <PrimaryButton
              label="Hold this payment and verify"
              icon={Handshake}
              onPress={() =>
                router.push({ pathname: '/pay/confirm', params: { paymentId: payment.id } })
              }
            />
            <GhostButton
              label="Do not send this money"
              icon={ShieldOff}
              tone="danger"
              onPress={() => {
                abandonPayment(payment.id);
                setCancelled(true);
              }}
            />
          </>
        ) : (
          <>
            <PrimaryButton
              label="I have paid — log it"
              icon={CreditCard}
              onPress={() =>
                router.push({ pathname: '/pay/log', params: { paymentId: payment.id } })
              }
            />
            <GhostButton
              label="Cancel this payment"
              onPress={() => {
                abandonPayment(payment.id);
                setCancelled(true);
              }}
            />
          </>
        )}
      </ActionBar>

      <Sheet
        visible={confirmNote}
        onClose={() => setConfirmNote(false)}
        icon={CircleCheck}
        title="Confirm the details with the recipient"
        body="Read the Paybill or number and the amount back to the person or business on a number you already have. No known risk found is not a guarantee."
        primaryLabel="Got it"
        onPrimary={() => setConfirmNote(false)}
      />

      <Sheet
        visible={cancelled}
        onClose={() => setCancelled(false)}
        icon={ShieldOff}
        iconColor={colors.riskGreen}
        title="Payment stopped"
        body="Nothing was sent. You did the right thing by checking — now you know this pattern, and you are harder to scam next time."
        primaryLabel="Back to Pay"
        onPrimary={() => {
          setCancelled(false);
          router.replace('/(tabs)/pay');
        }}
        secondaryLabel="Report this destination"
        onSecondary={() => {
          setCancelled(false);
          router.push({
            pathname: '/report/new',
            params: { type: 'sms', identifier: payment.identifier, content: payment.context ?? '' },
          });
        }}
      />
    </Screen>
  );
}
