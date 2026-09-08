import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScanSearch, ShieldCheck } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { PrivacyNote, TextField } from '@/components/ui/Field';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * The flagship input: one screen, one field, one action — so the home-screen
 * widget and share sheet can land straight here.
 */
export default function CheckMessage() {
  const params = useLocalSearchParams<{ text?: string }>();
  const examples = useStore((state) => state.examples);
  const [text, setText] = useState(params.text ?? '');

  const submit = () => {
    if (text.trim().length < 4) return;
    router.push({ pathname: '/check/processing', params: { type: 'sms', text: text.trim() } });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Check a message"
        subtitle="SMS, WhatsApp or any text you were sent"
        backFallback="/(tabs)/shield"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <TextField
            label="Message text"
            value={text}
            onChangeText={setText}
            placeholder="Paste the message here, in English, Kiswahili or Sheng"
            multiline
            minHeight={150}
            helper="Paste it exactly as you received it. Mixed languages are normal, not a problem."
          />

          <PrivacyNote>
            This text stays on your device. It is only sent anywhere if you choose to report it, and
            we never ask for your PIN or password.
          </PrivacyNote>

          <View className="bg-surface-secondary/60 flex-row gap-2.5 rounded-[20px] p-4">
            <ShieldCheck color={colors.brandMint} size={18} strokeWidth={1.9} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              In WhatsApp or Messages, long-press a message, tap Share, then pick Dhibiti Quick
              Check to land on this screen.
            </Text>
          </View>

          <SectionLabel label="Or try a real reported example" className="px-0 pt-2" />
          <View className="gap-2.5">
            {examples.slice(0, 4).map((example) => (
              <Pressable
                accessibilityRole="button"
                key={example.id}
                onPress={() => setText(example.text_sw || example.text_en)}
                className="bg-surface flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-80"
              >
                <ScanSearch color={colors.muted} size={17} strokeWidth={1.9} />
                <Text variant="caption" className="text-foreground/85 flex-1" numberOfLines={2}>
                  {example.text_sw || example.text_en}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Check this message"
            onPress={submit}
            disabled={text.trim().length < 4}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
