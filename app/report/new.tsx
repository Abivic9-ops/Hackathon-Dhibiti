import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, ImagePlus, ShieldCheck } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import {
  CheckboxRow,
  ChipSelector,
  PrivacyNote,
  TextField,
  type ChipOption,
} from '@/components/ui/Field';
import { CHECK_TYPE_ICON, CHECK_TYPE_LABEL, SCAM_CATEGORY_ICON } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { SCAM_CATEGORY_LABEL } from '@/lib/detection';
import { goBackOrReplace } from '@/lib/navigation';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { CheckType, ScamCategory } from '@/lib/types';

const TYPE_OPTIONS: ChipOption<CheckType>[] = (
  ['sms', 'call', 'qr', 'number', 'link'] as CheckType[]
).map((value) => ({ value, label: CHECK_TYPE_LABEL[value], icon: CHECK_TYPE_ICON[value] }));

const CATEGORY_OPTIONS: ChipOption<ScamCategory>[] = (
  [
    'mpesa-reversal',
    'fake-safaricom-agent',
    'fake-bank-rep',
    'police-impersonation',
    'family-emergency',
    'fake-job-loan',
    'prize-lottery',
    'sim-swap',
    'fake-delivery',
    'qr-merchant-phishing',
    'crypto-investment',
  ] as ScamCategory[]
).map((value) => ({
  value,
  label: SCAM_CATEGORY_LABEL[value],
  icon: SCAM_CATEGORY_ICON[value],
}));

/** Report a scam so the next person is warned before they pay. */
export default function ReportNew() {
  const params = useLocalSearchParams<{
    type?: CheckType;
    identifier?: string;
    content?: string;
    scamCategory?: ScamCategory;
  }>();

  const submitReport = useStore((state) => state.submitReport);
  const simulateOffline = useStore((state) => state.simulateOffline);
  const lessons = useStore((state) => state.lessons);
  const [type, setType] = useState<CheckType>(params.type ?? 'sms');
  const [category, setCategory] = useState<ScamCategory>(
    params.scamCategory && params.scamCategory !== 'none' ? params.scamCategory : 'mpesa-reversal',
  );
  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [content, setContent] = useState(params.content ?? '');
  const [screenshotAttached, setScreenshotAttached] = useState(false);
  const [keepLocal, setKeepLocal] = useState(true);
  const [done, setDone] = useState(false);
  const [queued, setQueued] = useState(false);

  const canSubmit = content.trim().length > 4 || identifier.trim().length > 3;

  const submit = () => {
    if (!canSubmit) return;
    if (simulateOffline) {
      setQueued(true);
      return;
    }
    submitReport({
      type,
      identifier: identifier.trim(),
      content: content.trim(),
      scamCategory: category,
      keepScreenshotLocal: keepLocal,
    });
    setQueued(false);
    setDone(true);
  };

  if (queued) {
    return (
      <Screen>
        <ScreenHeader title="Report a scam" backFallback="/(tabs)/shield" />
        <ErrorState
          title="Saved on your device for now"
          body="You're offline, so this report hasn't reached the community count yet. It's kept on this device and nothing has been shared. Try again once you have a connection."
          onRetry={submit}
          retryLabel="Try sending again"
        />
        <View className="items-center px-8">
          <GhostButton
            label="Back to Shield"
            onPress={() => goBackOrReplace('/(tabs)/shield')}
            fullWidth={false}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Report a scam"
        subtitle="Your report warns the next person"
        backFallback="/(tabs)/shield"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <SectionLabel label="What kind of scam was it" className="px-0" />
          <ChipSelector options={TYPE_OPTIONS} value={type} onChange={setType} />

          <SectionLabel label="Closest pattern" className="px-0 pt-1" />
          <ChipSelector options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />

          <TextField
            label="Number, Paybill, Till or link used"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="e.g. 0712 345 678 or Paybill 790125"
            autoCapitalize="none"
            helper="This is the part that helps other people most."
          />

          <TextField
            label="What was sent or said"
            value={content}
            onChangeText={setContent}
            placeholder="Paste the message or describe the call"
            multiline
            minHeight={120}
          />

          <View className="gap-3">
            <GhostButton
              label={screenshotAttached ? 'Screenshot attached' : 'Attach a screenshot (optional)'}
              icon={screenshotAttached ? CircleCheck : ImagePlus}
              onPress={() => setScreenshotAttached((value) => !value)}
            />
            <CheckboxRow
              label="Keep the screenshot on my device only"
              value={keepLocal}
              onValueChange={setKeepLocal}
            />
          </View>

          <PrivacyNote>
            {keepLocal
              ? 'The screenshot stays on this device. Only the number or link and the scam pattern are shared with the community count.'
              : 'The screenshot will be shared with Dhibiti review after personal details are removed. Never include your PIN, password or full ID number.'}
          </PrivacyNote>

          <View className="bg-surface-secondary/60 flex-row gap-2.5 rounded-[20px] p-4">
            <ShieldCheck color={colors.brandMint} size={18} strokeWidth={1.9} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              Reports are counted per person, so no single reporter can mark a number as a confirmed
              scam on their own.
            </Text>
          </View>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton label="Submit report" onPress={submit} disabled={!canSubmit} />
        </ActionBar>
      </KeyboardAvoidingView>

      <Sheet
        visible={done}
        onClose={() => goBackOrReplace('/(tabs)/shield')}
        icon={CircleCheck}
        iconColor={colors.riskGreen}
        title="Report received"
        body="Thanks for reporting. Reports like yours are what let Dhibiti warn someone else before they pay."
        primaryLabel="See how reports help (1 min)"
        onPrimary={() => {
          setDone(false);
          const lesson =
            lessons.find((item) => item.category === 'rights-recourse') ?? lessons[0];
          if (lesson) {
            router.replace({ pathname: '/lesson/[id]', params: { id: lesson.id } });
          } else {
            router.replace('/more/literacy');
          }
        }}
        secondaryLabel="Done"
        onSecondary={() => goBackOrReplace('/(tabs)/shield')}
      />
    </Screen>
  );
}
