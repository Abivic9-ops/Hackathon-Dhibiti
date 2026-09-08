import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { ActionBar, InlineAction, PrimaryButton } from '@/components/ui/Button';
import { useCountdown } from '@/components/ui/CountdownTimer';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';

const LENGTH = 6;
const SLOT_KEYS = Array.from({ length: LENGTH }, (_, slot) => `otp-slot-${slot}`);

export default function OtpScreen() {
  const router = useRouter();
  const { to } = useLocalSearchParams<{ to?: string }>();
  const [code, setCode] = useState('');
  const [resendStartedAt, setResendStartedAt] = useState(() => Date.now());
  const inputRef = useRef<TextInput>(null);
  const { remaining } = useCountdown(resendStartedAt, 30);

  const digits = Array.from({ length: LENGTH }, (_, index) => code[index] ?? '');

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
            <Text variant="caption">
              Sent to {to ?? 'your number'}. For this demo any 6 digits will work.
            </Text>
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
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, LENGTH))}
            keyboardType="number-pad"
            maxLength={LENGTH}
            autoFocus
            className="absolute h-px w-px opacity-0"
          />

          <View className="items-center">
            {remaining > 0 ? (
              <Text variant="meta">Resend code in {remaining}s</Text>
            ) : (
              <InlineAction
                label="Resend code"
                onPress={() => {
                  setResendStartedAt(Date.now());
                }}
              />
            )}
          </View>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Verify and continue"
            disabled={code.length < LENGTH}
            onPress={() => router.push('/onboarding/permissions')}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
