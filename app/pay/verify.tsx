import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { ListChecks } from 'lucide-react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, ProcessingView } from '@/components/ui/Feedback';
import { ChipSelector, type ChipOption, PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { IDENTIFIER_ICON, IDENTIFIER_LABEL } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { guessIdentifierType, isIdentifierType, normalisePhone } from '@/lib/detection';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { IdentifierType } from '@/lib/types';
import { formatDate, formatKes } from '@/lib/utils';

const TYPE_OPTIONS: ChipOption<IdentifierType>[] = (
  ['phone', 'paybill', 'till', 'account', 'crypto', 'url'] as IdentifierType[]
).map((value) => ({ value, label: IDENTIFIER_LABEL[value], icon: IDENTIFIER_ICON[value] }));

/** Step 1 of Safe Pay Flow: recipient, amount and any message that came with it. */
export default function PayVerify() {
  const params = useLocalSearchParams<{
    identifier?: string;
    identifierType?: string;
    label?: string;
    checkId?: string;
    context?: string;
  }>();

  const recipients = useStore((state) => state.recipients);
  const createPayment = useStore((state) => state.createPayment);
  const simulateOffline = useStore((state) => state.simulateOffline);

  const initialIdentifier = params.identifier ?? '';
  const [identifierType, setIdentifierType] = useState<IdentifierType>(
    (isIdentifierType(params.identifierType) ? params.identifierType : undefined) ??
      (initialIdentifier ? guessIdentifierType(initialIdentifier) : 'phone'),
  );
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [label, setLabel] = useState(params.label ?? '');
  const [amount, setAmount] = useState('');
  const [context, setContext] = useState(params.context ?? '');
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const cleaned = identifier.trim();
  const amountKes = Number(amount.replace(/[^0-9]/g, ''));
  const ready = cleaned.length >= 4 && amountKes > 0;

  const saved = recipients.find(
    (recipient) => recipient.identifier === cleaned || recipient.label === label.trim(),
  );

  useEffect(() => {
    if (!checking) return undefined;
    const timer = setTimeout(() => {
      const normalised = identifierType === 'phone' ? normalisePhone(cleaned) : cleaned;
      const payment = createPayment({
        recipientLabel:
          label.trim() || saved?.label || `${IDENTIFIER_LABEL[identifierType]} ${normalised}`,
        identifier: normalised,
        identifierType,
        amountKes,
        context: context.trim() || undefined,
        relatedCheckId: params.checkId || undefined,
      });
      router.replace({ pathname: '/pay/result', params: { paymentId: payment.id } });
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    amountKes,
    checking,
    cleaned,
    context,
    createPayment,
    identifierType,
    label,
    params.checkId,
    saved?.label,
  ]);

  if (checking) {
    return (
      <Screen>
        <ScreenHeader title="Checking this payment" showBack={false} />
        <ProcessingView
          title="Checking this destination against community reports and your own history…"
          steps={[
            'Matching the number against reported Paybills, Tills and phone numbers',
            'Checking your payment history with this recipient',
            'Reading any message you pasted for urgency and pressure',
          ]}
        />
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen>
        <ScreenHeader title="Verify a payment" backFallback="/(tabs)/pay" />
        <ErrorState
          onRetry={() => {
            setFailed(false);
            setChecking(true);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Verify a payment"
        subtitle="Before you confirm it in M-Pesa"
        backFallback="/(tabs)/pay"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <View className="gap-2">
            <Text variant="section">Where is the money going?</Text>
            <ChipSelector
              options={TYPE_OPTIONS}
              value={identifierType}
              onChange={setIdentifierType}
            />
          </View>

          <TextField
            label={IDENTIFIER_LABEL[identifierType]}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={
              identifierType === 'phone'
                ? '0722 000 000'
                : identifierType === 'url'
                  ? 'https://'
                  : '123456'
            }
            keyboardType={
              identifierType === 'phone'
                ? 'phone-pad'
                : identifierType === 'url'
                  ? 'url'
                  : identifierType === 'crypto'
                    ? 'default'
                    : 'number-pad'
            }
            autoCapitalize="none"
          />

          <TextField
            label="Account name or reference"
            value={label}
            onChangeText={setLabel}
            placeholder="The name shown on the request"
            helper="Optional. It helps you recognise this payment later."
          />

          <TextField
            label="Amount in KES"
            value={amount}
            onChangeText={setAmount}
            placeholder="20000"
            keyboardType="number-pad"
            prefix="KES"
          />

          <TextField
            label="Message or instruction you were sent"
            value={context}
            onChangeText={setContext}
            placeholder="Paste the SMS or WhatsApp text that asked you to pay, if there was one"
            multiline
            minHeight={110}
            helper="Optional, but it lets us check the language as well as the destination."
          />

          {saved ? (
            <Card className="flex-row items-center gap-3">
              <IconTile icon={IDENTIFIER_ICON[saved.identifierType]} color={colors.riskGreen} />
              <View className="flex-1 gap-0.5">
                <Text variant="label">You have paid this recipient before</Text>
                <Text variant="meta">
                  {saved.timesPaid} payment{saved.timesPaid === 1 ? '' : 's'}
                  {saved.lastPaidAt ? ` · last on ${formatDate(saved.lastPaidAt)}` : ''}
                </Text>
              </View>
            </Card>
          ) : null}

          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <IconTile icon={ListChecks} color={colors.brandBlue} />
              <Text variant="label" className="flex-1">
                What we check next
              </Text>
            </View>
            <View className="gap-2">
              {[
                'Whether other people have reported this destination, and what for',
                'Whether you have ever paid this recipient from this device',
                amountKes >= 15_000
                  ? `Whether ${formatKes(amountKes)} is unusual for this kind of recipient`
                  : 'Whether the amount is unusual for you or for this merchant',
                'Whether the Paybill or Till is newly created or missing from our verified merchant list',
              ].map((line) => (
                <View key={line} className="flex-row gap-2.5">
                  <View className="bg-brand-teal mt-2 h-1.5 w-1.5 rounded-full" />
                  <Text variant="body" className="flex-1">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <PrivacyNote>
            The recipient, amount and any text you paste stay on this device. Nothing is shared
            unless you report it, and we never ask for your PIN or M-Pesa password.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Check this payment"
            disabled={!ready}
            onPress={() => {
              if (simulateOffline) {
                setFailed(true);
                return;
              }
              setChecking(true);
            }}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
