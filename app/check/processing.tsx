import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ErrorState, ProcessingView } from '@/components/ui/Feedback';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { useStore } from '@/lib/store';
import type { CheckType, IdentifierType } from '@/lib/types';

const STEPS: Record<CheckType, string[]> = {
  sms: [
    'Reading the wording for urgency, secrecy and payment pressure',
    'Matching English, Kiswahili and Sheng scam patterns',
    'Checking any number or Paybill against community reports',
  ],
  call: [
    'Listing the actions the caller asked you to take',
    'Comparing the claimed identity with your saved and verified numbers',
    'Checking the payment destination against community reports',
  ],
  qr: [
    'Reading the code content and checking its format',
    'Checking the domain age, redirects and brand lookalikes',
    'Checking any Paybill, Till or address against community reports',
  ],
  number: [
    'Looking up community reports for this identifier',
    'Comparing it with verified institutions and merchants',
    'Checking your own payment history with it',
  ],
  link: [
    'Checking the domain, certificate and redirect chain',
    'Comparing it with known Kenyan brand domains',
    'Looking up community reports for this address',
  ],
};

/**
 * The deliberate checking moment — never instant, because this is where the
 * user sees that real work is being done on their behalf.
 */
export default function Processing() {
  const params = useLocalSearchParams<{
    type: CheckType;
    text?: string;
    identifier?: string;
    identifierType?: IdentifierType;
  }>();
  const type: CheckType = params.type ?? 'sms';
  const [attempt, setAttempt] = useState(0);

  return (
    <Screen>
      <ScreenHeader showBack={false} title="Checking" />
      <ProcessingBody
        key={attempt}
        type={type}
        text={params.text}
        identifier={params.identifier}
        identifierType={params.identifierType}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    </Screen>
  );
}

function ProcessingBody({
  type,
  text,
  identifier,
  identifierType,
  onRetry,
}: {
  type: CheckType;
  text?: string;
  identifier?: string;
  identifierType?: IdentifierType;
  onRetry: () => void;
}) {
  const runCheck = useStore((state) => state.runCheck);
  const simulateOffline = useStore((state) => state.simulateOffline);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (simulateOffline) {
        setFailed(true);
        return;
      }
      const check = runCheck({ type, text, identifier, identifierType });
      router.replace({ pathname: '/check/[id]', params: { id: check.id } });
    }, 1700);
    return () => clearTimeout(timer);
  }, [type, text, identifier, identifierType, runCheck, simulateOffline]);

  return (
    <View className="flex-1 justify-center">
      {failed ? <ErrorState onRetry={onRetry} /> : <ProcessingView steps={STEPS[type]} />}
    </View>
  );
}
