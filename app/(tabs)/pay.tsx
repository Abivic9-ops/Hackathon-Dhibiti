import { router } from 'expo-router';
import { BadgeCheck, ClipboardList, CreditCard, ShieldCheck, Wallet } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { InlineAction, PrimaryButton } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { EmptyState, OfflineBanner } from '@/components/ui/Feedback';
import { GradientIconTile, IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { IDENTIFIER_ICON, IDENTIFIER_LABEL } from '@/components/ui/icons';
import { PageTitle, Screen, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { formatDate, formatKes, timeAgo } from '@/lib/utils';

/**
 * Pay tab: the checkpoint between "I am about to send money" and confirming it
 * in M-Pesa or a bank app. Dhibiti never moves money itself.
 */
export default function PayTab() {
  const recipients = useStore((state) => state.recipients);
  const payments = useStore((state) => state.payments);
  const tips = useStore((state) => state.tips);
  const lessons = useStore((state) => state.lessons);
  const simulateOffline = useStore((state) => state.simulateOffline);

  const pending = payments.filter((payment) => payment.status === 'pending');
  const paid = payments.filter((payment) => payment.status === 'paid');

  function openTipLesson(tip: (typeof tips)[number]) {
    const lesson = lessons.find((item) => item.category === tip.lessonCategory) ?? lessons[0];
    if (lesson) {
      router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } });
    } else {
      router.push('/more/literacy');
    }
  }

  return (
    <Screen>
      <PageTitle title="Pay" subtitle="Check the destination before the money leaves" />

      <ScreenScroll contentClassName="gap-4">
        {simulateOffline ? <OfflineBanner /> : null}

        <View className="px-5">
          <Card className="gap-3.5">
            <GradientIconTile icon={ShieldCheck} />
            <View className="gap-1">
              <Text variant="heading">Verify before you send</Text>
              <Text variant="caption">
                Enter the recipient and the amount. We check the destination against community
                reports, your own payment history and any message you were sent.
              </Text>
            </View>
            <PrimaryButton
              label="Check a payment"
              icon={CreditCard}
              onPress={() => router.push('/pay/verify')}
            />
            <Text variant="meta">
              You still confirm the payment in M-Pesa or your bank app. Dhibiti only adds the check.
            </Text>
          </Card>
        </View>

        {pending.length > 0 ? (
          <View>
            <SectionLabel label="Waiting on your decision" />
            <View className="gap-3 px-5">
              {pending.map((payment) => (
                <PressableCard
                  key={payment.id}
                  className="flex-row items-center gap-3"
                  onPress={() =>
                    router.push({ pathname: '/pay/result', params: { paymentId: payment.id } })
                  }
                >
                  <IconTile
                    icon={IDENTIFIER_ICON[payment.identifierType]}
                    color={colors.riskAmber}
                  />
                  <View className="flex-1 gap-1">
                    <Text variant="label" numberOfLines={1}>
                      {formatKes(payment.amountKes)} to {payment.recipientLabel}
                    </Text>
                    <Text variant="meta">Checked {timeAgo(payment.createdAt)} · not yet sent</Text>
                  </View>
                  <RiskPill level={payment.riskLevel} size="sm" />
                </PressableCard>
              ))}
            </View>
          </View>
        ) : null}

        <View>
          <SectionLabel label="Saved recipients" />
          {recipients.length > 0 ? (
            <View className="gap-3 px-5">
              {recipients.map((recipient) => (
                <Card key={recipient.id} className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <IconTile
                      icon={IDENTIFIER_ICON[recipient.identifierType]}
                      color={colors.brandBlue}
                    />
                    <View className="flex-1 gap-1">
                      <Text variant="label" numberOfLines={1}>
                        {recipient.label}
                      </Text>
                      <Text variant="meta">
                        {IDENTIFIER_LABEL[recipient.identifierType]} {recipient.identifier}
                      </Text>
                    </View>
                    <RiskPill level={recipient.riskLevel} size="sm" />
                  </View>
                  <Text variant="caption">
                    Paid {recipient.timesPaid} time{recipient.timesPaid === 1 ? '' : 's'}
                    {recipient.lastPaidAt ? ` · last on ${formatDate(recipient.lastPaidAt)}` : ''}
                  </Text>
                  <InlineAction
                    label="Verify again"
                    icon={BadgeCheck}
                    onPress={() =>
                      router.push({
                        pathname: '/pay/verify',
                        params: {
                          identifier: recipient.identifier,
                          identifierType: recipient.identifierType,
                          label: recipient.label,
                        },
                      })
                    }
                  />
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No saved recipients yet"
              body="Once you log a payment, the recipient is saved here so future checks can tell you whether you have paid them before."
              actionLabel="Check a payment"
              onAction={() => router.push('/pay/verify')}
            />
          )}
        </View>

        {paid.length > 0 ? (
          <View>
            <SectionLabel label="Your payment log" />
            <View className="gap-3 px-5">
              {paid.map((payment) => (
                <Card key={payment.id} className="flex-row items-center gap-3">
                  <IconTile icon={ClipboardList} color={colors.brandTeal} />
                  <View className="flex-1 gap-1">
                    <Text variant="label" numberOfLines={1}>
                      {formatKes(payment.amountKes)} to {payment.recipientLabel}
                    </Text>
                    <Text variant="meta" numberOfLines={2}>
                      {payment.paidNote
                        ? `${payment.paidNote} · ${timeAgo(payment.createdAt)}`
                        : `Marked as paid ${timeAgo(payment.createdAt)}`}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
            <Text variant="meta" className="px-5 pt-3">
              This log stays on your device. You choose what to add, and you can leave it empty.
            </Text>
          </View>
        ) : null}

        <View>
          <SectionLabel label="Payment safety tips" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5"
          >
            {tips.map((tip) => (
              <PressableCard
                key={tip.id}
                className="w-64 gap-2"
                onPress={() => openTipLesson(tip)}
              >
                <IconTile icon={ShieldCheck} color={colors.brandMint} size="sm" />
                <Text variant="label">{tip.title}</Text>
                <Text variant="caption">{tip.body}</Text>
                <InlineAction label="Read the lesson" onPress={() => openTipLesson(tip)} />
              </PressableCard>
            ))}
          </ScrollView>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
