import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AtSign, Smartphone } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, InlineAction, PrimaryButton } from '@/components/ui/Button';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('712 345 678');
  const [email, setEmail] = useState('');

  const ready = mode === 'phone' ? phone.replace(/\D/g, '').length >= 9 : /.+@.+\..+/.test(email);

  return (
    <Screen>
      <ScreenHeader title="Sign in" backFallback="/onboarding/slides" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-6">
          <View className="items-center gap-3 pt-4">
            <IconTile
              icon={mode === 'phone' ? Smartphone : AtSign}
              color={colors.brandTeal}
              size="lg"
            />
            <Text variant="title" className="text-center">
              {mode === 'phone' ? 'Your phone number' : 'Your email address'}
            </Text>
            <Text variant="caption" className="text-center">
              We send a one-time code to confirm it is you. No PINs, ever.
            </Text>
          </View>

          {mode === 'phone' ? (
            <TextField
              label="Phone number"
              prefix="+254"
              value={phone}
              onChangeText={setPhone}
              placeholder="712 345 678"
              keyboardType="phone-pad"
              helper="Kenyan numbers only for now."
            />
          ) : (
            <TextField
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          <View className="items-center">
            <InlineAction
              label={mode === 'phone' ? 'Use email instead' : 'Use phone number instead'}
              onPress={() => setMode(mode === 'phone' ? 'email' : 'phone')}
            />
          </View>

          <PrivacyNote>
            Dhibiti will never ask for your M-Pesa PIN, bank password, or full ID number — not here,
            and not anywhere else in the app.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Send code"
            disabled={!ready}
            onPress={() =>
              router.push({
                pathname: '/onboarding/otp',
                params: { to: mode === 'phone' ? `+254 ${phone}` : email },
              })
            }
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
