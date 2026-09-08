import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Wallet } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { IDENTIFIER_ICON, IDENTIFIER_LABEL } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { formatKes } from '@/lib/utils';

/**
 * Step 4 of Safe Pay Flow: optional, consent-based logging after paying in
 * M-Pesa or a bank app. It makes future checks smarter about this recipient.
 */
export default function PayLog() {
  const { paymentId } = useLocalSearchParams<{ paymentId?: string }>();
  const payments = useStore((state) => state.payments);
  const markPaid = useStore((state) => state.markPaid);
  const abandonPayment = useStore((state) => state.abandonPayment);
  const addSafetyEvent = useStore((state) => state.addSafetyEvent);

  const [note, setNote] = useState('');
  const [logged, setLogged] = useState(false);

  const payment = payments.find((item) => item.id === paymentId);

  if (!payment) {
    return (
      <Screen>
        <ScreenHeader title="Log a payment" backFallback="/(tabs)/pay" />
        <EmptyState
          icon={Wallet}
          title="This payment is no longer here"
          body="Payment checks live on this device only. Start a new check whenever you are about to send money."
          actionLabel="Check a payment"
          onAction={() => router.replace('/pay/verify')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Log this payment"
        subtitle="Optional, and only on this device"
        backFallback="/(tabs)/pay"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <Card className="flex-row items-center gap-3">
            <IconTile icon={IDENTIFIER_ICON[payment.identifierType]} color={colors.brandTeal} />
            <View className="flex-1 gap-1">
              <Text variant="numeral">{formatKes(payment.amountKes)}</Text>
              <Text variant="meta" numberOfLines={1}>
                {IDENTIFIER_LABEL[payment.identifierType]} {payment.identifier}
              </Text>
            </View>
          </Card>

          <Text variant="body">
            Did you send this in M-Pesa or your bank app? Marking it here saves the recipient so a
            future check can tell you how often you have paid them without trouble.
          </Text>

          <TextField
            label="What was this for?"
            value={note}
            onChangeText={setNote}
            placeholder="Rent, stock for the shop, school fees…"
            helper="Optional. You can leave this empty and still log the payment."
          />

          <PrivacyNote>
            This log stays on your device. Amounts and notes are never shared with your family
            circle, and nothing here is sent to Dhibiti&apos;s servers.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Mark as paid"
            icon={CircleCheck}
            onPress={() => {
              markPaid(payment.id, note.trim() || 'Paid after a Dhibiti check');
              addSafetyEvent('verified-check', 3);
              setLogged(true);
            }}
          />
          <GhostButton
            label="I did not send it"
            onPress={() => {
              abandonPayment(payment.id);
              router.replace('/(tabs)/pay');
            }}
          />
        </ActionBar>
      </KeyboardAvoidingView>

      <Sheet
        visible={logged}
        onClose={() => setLogged(false)}
        icon={CircleCheck}
        iconColor={colors.riskGreen}
        title="Payment logged"
        body="Saved on this device. Next time you pay this recipient we will tell you how long you have been paying them without trouble."
        primaryLabel="Back to Pay"
        onPrimary={() => {
          setLogged(false);
          router.replace('/(tabs)/pay');
        }}
        secondaryLabel="See how to verify a merchant"
        onSecondary={() => {
          setLogged(false);
          router.push({ pathname: '/lesson/[id]', params: { id: 'lesson-merchant-checks' } });
        }}
      />
    </Screen>
  );
}
