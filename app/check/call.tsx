import { useState } from 'react';
import { router } from 'expo-router';
import { Info } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

const PROMPTS = [
  'Who did the caller say they were?',
  'What did they ask you to do?',
  'Where did they want the money sent?',
  'Did they push you to hurry or keep it secret?',
];

const STARTERS = [
  'Caller said he is from KCB fraud department. Said my account will be blocked today and I must send KES 20,000 to Paybill 790125 immediately. He told me not to tell anyone.',
  'Caller said my son is at the police station in Ruaraka and I must send KES 15,000 to 0799001122 now, and not call anyone else.',
  'Caller said he is a Safaricom agent and my line will be deactivated unless I read out the code they sent me.',
];

/**
 * Voice Check. Dhibiti never claims it can tell a real voice from a cloned
 * one — it reads the request, the pressure and the destination instead.
 */
export default function CheckCall() {
  const [text, setText] = useState('');

  const submit = () => {
    if (text.trim().length < 8) return;
    router.push({ pathname: '/check/processing', params: { type: 'call', text: text.trim() } });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Describe a call"
        subtitle="Write what the caller said, in your own words"
        backFallback="/(tabs)/shield"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <View className="bg-risk-blue-soft flex-row gap-2.5 rounded-[20px] p-4">
            <Info color={colors.riskBlue} size={18} strokeWidth={1.9} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              Dhibiti cannot tell whether a voice was recorded, cloned or real — no tool can do that
              reliably over a phone line. It checks the request, the pressure and where the money
              would go.
            </Text>
          </View>

          <TextField
            label="What the caller said"
            value={text}
            onChangeText={setText}
            placeholder="He said my account will be blocked unless I send money today…"
            multiline
            minHeight={150}
            helper="Include the claimed name or company, the amount, and the number or Paybill they gave you."
          />

          <View className="gap-2">
            {PROMPTS.map((prompt) => (
              <View key={prompt} className="flex-row gap-2.5">
                <View className="bg-brand-teal mt-2 h-1.5 w-1.5 rounded-full" />
                <Text variant="caption" className="flex-1">
                  {prompt}
                </Text>
              </View>
            ))}
          </View>

          <PrivacyNote>
            Nothing here is recorded or uploaded. Your description stays on this device unless you
            report it.
          </PrivacyNote>

          <SectionLabel label="Common call scripts" className="px-0 pt-2" />
          <View className="gap-2.5">
            {STARTERS.map((starter) => (
              <Pressable
                accessibilityRole="button"
                key={starter}
                onPress={() => setText(starter)}
                className="bg-surface rounded-2xl px-4 py-3.5 active:opacity-80"
              >
                <Text variant="caption" className="text-foreground/85" numberOfLines={2}>
                  {starter}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Check this call"
            onPress={submit}
            disabled={text.trim().length < 8}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
