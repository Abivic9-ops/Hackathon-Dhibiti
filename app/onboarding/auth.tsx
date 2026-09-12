import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Smartphone } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function AuthScreen() {
  const router = useRouter();
  const requestOtp = useStore((state) => state.requestOtp);
  const [phone, setPhone] = useState('712 345 678');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = phone.replace(/\D/g, '').length >= 9;

  const send = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestOtp(phone);
      const digits = phone.replace(/\D/g, '');
      const grouped = digits.replace(/(\d{3})(?=\d)/g, '$1 ');
      router.push({
        pathname: '/onboarding/otp',
        params: {
          to: `+254 ${grouped}`,
          // Development convenience: the mock SMS provider prints the code to
          // the console and returns it here. Never shown once a real gateway
          // is wired up (delivery.provider is then not 'mock').
          devCode: result.delivery.provider === 'mock' ? result.delivery.devCode : undefined,
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Sign in" backFallback="/onboarding/slides" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-6">
          <View className="items-center gap-3 pt-4">
            <IconTile icon={Smartphone} color={colors.brandTeal} size="lg" />
            <Text variant="title" className="text-center">
              Your phone number
            </Text>
            <Text variant="caption" className="text-center">
              We send a one-time code to confirm it is you. No PINs, ever.
            </Text>
          </View>

          <TextField
            label="Phone number"
            prefix="+254"
            value={phone}
            onChangeText={setPhone}
            placeholder="712 345 678"
            keyboardType="phone-pad"
            helper="Kenyan numbers only for now."
          />

          {error ? (
            <Text variant="meta" style={{ color: colors.riskRed }} className="text-center">
              {error}
            </Text>
          ) : null}

          <PrivacyNote>
            Dhibiti will never ask for your M-Pesa PIN, bank password, or full ID number — not here,
            and not anywhere else in the app.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton label={loading ? 'Sending…' : 'Send code'} disabled={!ready} loading={loading} onPress={send} />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}