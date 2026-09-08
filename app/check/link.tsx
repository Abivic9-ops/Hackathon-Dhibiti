import { useState } from 'react';
import { router } from 'expo-router';
import { Link2, ShieldAlert } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

const SAMPLES = [
  'https://mpesa-secure-refund.com/verify?ref=88213',
  'https://bit.ly/kcb-loan-offer',
  'https://safaricom.co.ke/bonga',
];

function submitLink(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 5) return;
  router.push({
    pathname: '/check/processing',
    params: { type: 'link', text: trimmed, identifier: trimmed, identifierType: 'url' },
  });
}

/** A link can be checked on its own, wherever it came from. */
export default function CheckLink() {
  const [url, setUrl] = useState('');

  return (
    <Screen>
      <ScreenHeader
        title="Check a link"
        subtitle="Before you open it, not after"
        backFallback="/(tabs)/shield"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <TextField
            label="Web address"
            value={url}
            onChangeText={setUrl}
            placeholder="Paste the link here"
            keyboardType="url"
            autoCapitalize="none"
            helper="We check the domain age, certificate, redirects and brand lookalikes."
          />

          <View className="bg-risk-amber-soft flex-row gap-2.5 rounded-[20px] p-4">
            <ShieldAlert color={colors.riskAmber} size={18} strokeWidth={1.9} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              Do not enter your PIN, password or ID number on a page you reached from a message,
              even if the page looks familiar.
            </Text>
          </View>

          <PrivacyNote>
            We keep the domain, not the full link with your personal details in it.
          </PrivacyNote>

          <SectionLabel label="Examples to try" className="px-0 pt-2" />
          <View className="gap-2.5">
            {SAMPLES.map((sample) => (
              <Pressable
                accessibilityRole="button"
                key={sample}
                onPress={() => setUrl(sample)}
                className="bg-surface flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-80"
              >
                <IconTile icon={Link2} color={colors.muted} size="sm" />
                <Text variant="caption" className="text-foreground/85 flex-1" numberOfLines={1}>
                  {sample}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Check this link"
            onPress={() => submitLink(url)}
            disabled={url.trim().length < 5}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
