import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { ActionBar, InlineAction, PrimaryButton } from '@/components/ui/Button';
import { useCountdown } from '@/components/ui/CountdownTimer';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const LENGTH = 6;
const SLOT_KEYS = Array.from({ length: LENGTH }, (_, slot) => `otp-slot-${slot}`);

export default function OtpScreen() {
  const router = useRouter();
  const requestOtp = useStore((state) => state.requestOtp);
  const verifyOtp = useStore((state) => state.verifyOtp);
  const { to, devCode: initialDevCode } = useLocalSearchParams<{
    to?: string;
    devCode?: string;
  }>();
  const [phone] = useState(() => (to ?? '').replace(/\D/g, ''));
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(initialDevCode);
  const [resendStartedAt, setResendStartedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { remaining } = useCountdown(resendStartedAt, 30);

  const digits = Array.from({ length: LENGTH }, (_, index) => code[index] ?? '');

  const verify = async () => {
    if (code.length < LENGTH || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { isNewUser } = await verifyOtp(phone, code);
      if (isNewUser) {
        router.replace('/onboarding/permissions');
      } else {
        router.replace('/(tabs)');
      }
    } catch (cause) {
      setCode('');
      setError(cause instanceof Error ? cause.message : 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resending) return;
    setResending(true);
    setError(null);
    try {
      const result = await requestOtp(phone);
      if (result.delivery.provider === 'mock') setDevCode(result.delivery.devCode);
      setResendStartedAt(Date.now());
      setCode('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Confirm your code" backFallback="/onboarding/auth" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-8">
          <View className="gap-2 pt-4">
            <Text variant="title">Enter the 6-digit code</Text>
            <Text variant="caption">Sent to {to ?? 'your number'}.</Text>
            {devCode ? (
              <Text variant="meta" className="text-risk-amber">
                Dev build: your code is {devCode}.
              </Text>
            ) : null}
            {error ? (
              <Text variant="meta" className="text-risk-red">
                {error}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enter verification code"
            onPress={() => inputRef.current?.focus()}
            className="flex-row justify-between"
          >
            {digits.map((digit, index) => (
              <View
                key={SLOT_KEYS[index]}
                className={cn(
                  'bg-surface h-16 w-[15%] items-center justify-center rounded-2xl border',
                  index === code.length ? 'border-brand-teal' : 'border-border',
                )}
              >
                <Text variant="numeral">{digit}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, '').slice(0, LENGTH));
              setError(null);
            }}
            keyboardType="number-pad"
            maxLength={LENGTH}
            autoFocus
            className="absolute h-px w-px opacity-0"
          />

          <View className="items-center">
            {remaining > 0 ? (
              <Text variant="meta">Resend code in {remaining}s</Text>
            ) : (
              <InlineAction label={resending ? 'Resending…' : 'Resend code'} onPress={resend} />
            )}
          </View>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label={loading ? 'Verifying…' : 'Verify and continue'}
            disabled={code.length < LENGTH}
            loading={loading}
            onPress={verify}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}