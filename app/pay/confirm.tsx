import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Landmark, PhoneCall, ShieldOff, Users, Wallet } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { ActionBar, GhostButton, InlineAction, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CountdownTimer, useCountdown } from '@/components/ui/CountdownTimer';
import { EmptyState } from '@/components/ui/Feedback';
import { CheckboxRow, OptionRow } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { IDENTIFIER_LABEL } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { RISK, colors } from '@/lib/theme';
import { formatKes } from '@/lib/utils';

const DEFAULT_LOCK_SECONDS = 900;

/**
 * Step 3 of Safe Pay Flow: the high-risk confirmation with the Send-Delay Lock.
 * The hold blocks confirming early — never calling out for help.
 */
export default function PayConfirm() {
  const { paymentId } = useLocalSearchParams<{ paymentId?: string }>();

  const payments = useStore((state) => state.payments);
  const locks = useStore((state) => state.locks);
  const contacts = useStore((state) => state.contacts);
  const institutions = useStore((state) => state.institutions);
  const circle = useStore((state) => state.circle);
  const user = useStore((state) => state.user);
  const startLock = useStore((state) => state.startLock);
  const releaseLock = useStore((state) => state.releaseLock);
  const abandonPayment = useStore((state) => state.abandonPayment);
  const shareCheckWithFamily = useStore((state) => state.shareCheckWithFamily);

  const payment = payments.find((item) => item.id === paymentId);
  const lock = locks.find((item) => item.paymentId === paymentId);

  const [acknowledged, setAcknowledged] = useState(false);
  const [spoken, setSpoken] = useState<'unanswered' | 'yes' | 'no'>('unanswered');
  const [contactSheet, setContactSheet] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [fastForwarded, setFastForwarded] = useState(false);
  const [fallbackStartedAt] = useState(() => Date.now());

  useEffect(() => {
    if (payment && !lock) startLock(payment.id);
  }, [lock, payment, startLock]);

  const duration = lock?.lockDurationSeconds ?? DEFAULT_LOCK_SECONDS;
  const startedAt = lock
    ? fastForwarded
      ? lock.startedAt - duration * 1000
      : lock.startedAt
    : fallbackStartedAt;
  const { elapsed } = useCountdown(startedAt, duration);

  const protectedMembership = circle.members.find(
    (member) => member.userId === user.id && member.role === 'protected',
  );
  const admin = circle.members.find((member) => member.role === 'admin');
  const verifiedContacts = contacts.filter((contact) => contact.verified);
  const bank = institutions.find((institution) => institution.category === 'bank');

  if (!payment) {
    return (
      <Screen>
        <ScreenHeader title="High-risk payment" backFallback="/(tabs)/pay" />
        <EmptyState
          icon={Wallet}
          title="This payment check is no longer here"
          body="Payment checks live on this device only. Start a new check and we will look up the destination again."
          actionLabel="Check a payment"
          onAction={() => router.replace('/pay/verify')}
        />
      </Screen>
    );
  }

  const meta = RISK[payment.riskLevel];
  const canConfirm = elapsed && acknowledged && spoken === 'yes';

  return (
    <Screen>
      <ScreenHeader
        title="Before this money leaves"
        subtitle={`${formatKes(payment.amountKes)} to ${payment.recipientLabel}`}
        backFallback="/(tabs)/pay"
      />

      <ScreenScroll contentClassName="px-5 gap-4">
        <Card className={`gap-3 ${meta.softBgClass}`}>
          <View className="flex-row items-center gap-3">
            <IconTile icon={ShieldOff} color={meta.color} />
            <View className="flex-1 gap-1">
              <Text variant="heading" className={meta.textClass}>
                {meta.label}
              </Text>
              <Text variant="meta" numberOfLines={1}>
                {IDENTIFIER_LABEL[payment.identifierType]} {payment.identifier}
              </Text>
            </View>
            <RiskPill level={payment.riskLevel} size="sm" />
          </View>
          <Text variant="body">{payment.ruleFactLines[0]}</Text>
          <Text variant="caption">{payment.aiExplanation}</Text>
        </Card>

        <CountdownTimer
          startedAt={startedAt}
          durationSeconds={duration}
          mandatory={lock?.mandatory}
          reason={
            lock?.mandatory
              ? `High-risk payments on your account are held for ${Math.round(duration / 60)} minutes because ${admin?.name ?? 'your family admin'} set this hold. This is not a technical limit — it gives you time to verify.`
              : `We are holding the confirm button for ${Math.round(duration / 60)} minutes so you have time to verify. This isn't a technical limit — it's protecting you from pressure to act fast.`
          }
          elapsedNote="The hold is over. Only continue if you have verified the recipient on a number you already had."
        />

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <IconTile icon={PhoneCall} color={colors.brandMint} />
            <Text variant="label" className="flex-1">
              Use the wait to verify
            </Text>
          </View>
          <Text variant="caption">
            Calling out is never blocked. Speak to someone you trust, or to the institution on the
            number saved in Dhibiti — never the number that contacted you.
          </Text>
          <GhostButton
            label="Call a trusted contact while you wait"
            icon={Users}
            onPress={() => setContactSheet(true)}
          />
          {bank ? (
            <GhostButton
              label={`Call ${bank.name} on its verified number`}
              icon={Landmark}
              onPress={() => void Linking.openURL(`tel:${bank.officialNumbers[0]}`)}
            />
          ) : null}
        </Card>

        <View className="gap-3">
          <Text variant="section">One question before you continue</Text>
          <OptionRow
            icon={CircleCheck}
            title="Yes, I have spoken to them directly"
            description="On a number I already had, not the one that contacted me"
            selected={spoken === 'yes'}
            onPress={() => setSpoken('yes')}
          />
          <OptionRow
            icon={PhoneCall}
            title="No, not yet"
            description="I have only had messages or calls from the number that asked for money"
            selected={spoken === 'no'}
            onPress={() => setSpoken('no')}
          />
          {spoken === 'no' ? (
            <Text variant="caption" className="text-risk-amber">
              Speak to them on a number you already had first. That single step stops most
              impersonation scams.
            </Text>
          ) : null}
        </View>

        <Card className="gap-3">
          <CheckboxRow
            label="I understand this is high risk and I may not get this money back."
            value={acknowledged}
            onValueChange={setAcknowledged}
          />
          {protectedMembership && admin ? (
            <Text variant="caption">
              You are a protected member of {admin.name}&apos;s family circle. If you continue, they
              will see that a high-risk payment was flagged — the amount is only shared if your
              sharing level allows it. You can change this in Family.
            </Text>
          ) : null}
        </Card>

        <View className="gap-1 pt-1">
          <InlineAction
            label={
              fastForwarded ? 'Hold fast-forwarded for this demo' : 'Demo: fast-forward the hold'
            }
            onPress={() => setFastForwarded(true)}
          />
          <Text variant="meta">
            Included so you can review the lock-elapsed state. In the real app the timer always runs
            its full length.
          </Text>
        </View>
      </ScreenScroll>

      <ActionBar>
        <PrimaryButton
          label={elapsed ? "I'm ready to pay" : 'Confirm is held until the timer ends'}
          disabled={!canConfirm}
          onPress={() => {
            if (lock) releaseLock(lock.id);
            if (protectedMembership && payment.relatedCheckId) {
              shareCheckWithFamily(payment.relatedCheckId);
            }
            router.replace({ pathname: '/pay/log', params: { paymentId: payment.id } });
          }}
        />
        {!canConfirm ? (
          <Text variant="meta" className="px-4 text-center">
            {elapsed
              ? 'Answer the question above and tick the box to continue.'
              : 'You can still call anyone you need to while the hold runs.'}
          </Text>
        ) : null}
        <GhostButton
          label="Do not send this money"
          icon={ShieldOff}
          tone="danger"
          onPress={() => {
            abandonPayment(payment.id);
            if (lock) releaseLock(lock.id);
            setCancelled(true);
          }}
        />
      </ActionBar>

      <Sheet
        visible={contactSheet}
        onClose={() => setContactSheet(false)}
        icon={Users}
        title="Call someone you trust"
        body="These are the numbers you saved yourself. Caller ID can be faked — a number you saved cannot."
        secondaryLabel="Close"
      >
        <View className="gap-2.5">
          {verifiedContacts.map((contact) => (
            <Pressable
              accessibilityRole="button"
              key={contact.id}
              onPress={() => void Linking.openURL(`tel:${contact.phone}`)}
              className="bg-surface-secondary flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-80"
            >
              <IconTile icon={PhoneCall} color={colors.brandMint} size="sm" />
              <View className="flex-1">
                <Text variant="label">{contact.name}</Text>
                <Text variant="meta">
                  {contact.relationship} · {contact.phone}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={cancelled}
        onClose={() => setCancelled(false)}
        icon={ShieldOff}
        iconColor={colors.riskGreen}
        title="Payment stopped"
        body="Nothing was sent. Pressure to pay fast is the clearest sign of a scam, and you did not give in to it."
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
