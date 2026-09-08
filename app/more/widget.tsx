import { router } from 'expo-router';
import { ClipboardPaste, QrCode, Share2, Smartphone } from 'lucide-react-native';
import { View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { brandGradient, colors } from '@/lib/theme';

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Press and hold your home screen',
    body: 'Then choose Widgets, and scroll to Dhibiti.',
  },
  {
    title: 'Pick the small or medium size',
    body: 'Small gives you Paste & Check. Medium adds Scan QR beside it.',
  },
  {
    title: 'Place it where your thumb lands',
    body: 'Next to your messaging app is the most useful spot — that is where the risky message arrives.',
  },
];

/** Mockup of the Quick-Check widget and share-sheet action. */
export default function WidgetSetup() {
  return (
    <Screen>
      <ScreenHeader title="Quick-Check widget" backFallback="/more" />

      <ScreenScroll contentClassName="px-5 gap-4">
        <View className="gap-2 pb-1">
          <Text variant="title">One tap, from anywhere</Text>
          <Text variant="caption">
            The moment you most need to check something is the moment you least feel like opening an
            app. The widget and the share action both land straight on the paste-and-check screen.
          </Text>
        </View>

        <SectionLabel label="Small widget" className="px-0" />
        <View className="items-center">
          <View className="bg-ink border-border/70 h-[164px] w-[164px] justify-between rounded-[28px] border p-4">
            <View className="flex-row items-center gap-2">
              <IconTile icon={Smartphone} color={colors.brandTeal} size="sm" />
              <Text variant="meta">Dhibiti</Text>
            </View>
            <Text variant="label" className="text-[14px]">
              Check a message before you act
            </Text>
            <LinearGradient
              colors={[...brandGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-row items-center justify-center gap-1.5 rounded-full py-2.5"
            >
              <ClipboardPaste color="#08231D" size={15} strokeWidth={2} />
              <Text variant="label" className="text-ink text-[13px]">
                Paste & Check
              </Text>
            </LinearGradient>
          </View>
        </View>

        <SectionLabel label="Medium widget" className="px-0" />
        <View className="bg-ink border-border/70 gap-3 rounded-[28px] border p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <IconTile icon={Smartphone} color={colors.brandTeal} size="sm" />
              <Text variant="meta">Dhibiti · Verify. Protect. Control.</Text>
            </View>
          </View>
          <Text variant="label">Something feels off? Check it first.</Text>
          <View className="flex-row gap-2.5">
            <LinearGradient
              colors={[...brandGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-3"
            >
              <ClipboardPaste color="#08231D" size={16} strokeWidth={2} />
              <Text variant="label" className="text-ink text-[13px]">
                Paste & Check
              </Text>
            </LinearGradient>
            <View className="border-border flex-1 flex-row items-center justify-center gap-1.5 rounded-full border py-3">
              <QrCode color={colors.foreground} size={16} strokeWidth={1.9} />
              <Text variant="label" className="text-[13px]">
                Scan QR
              </Text>
            </View>
          </View>
        </View>

        <SectionLabel label="How to add it" className="px-0" />
        <View className="gap-3">
          {STEPS.map((step, position) => (
            <Card key={step.title} className="flex-row gap-3">
              <View className="bg-brand-teal-soft h-8 w-8 items-center justify-center rounded-xl">
                <Text variant="label" className="text-brand-mint text-[13px]">
                  {position + 1}
                </Text>
              </View>
              <View className="flex-1 gap-1">
                <Text variant="label">{step.title}</Text>
                <Text variant="caption">{step.body}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <IconTile icon={Share2} color={colors.brandBlue} />
            <View className="flex-1">
              <Text variant="label">Share → Dhibiti: Quick Check</Text>
              <Text variant="meta">Works from WhatsApp, Messages, your browser and email</Text>
            </View>
          </View>
          <Text variant="caption">
            Long-press any message, choose Share, then Dhibiti. We cannot read your WhatsApp
            messages — end-to-end encryption means nothing reaches us until you share it yourself.
            What we can do is warn you before you act on one.
          </Text>
        </Card>

        <PrimaryButton
          label="Open Paste & Check now"
          icon={ClipboardPaste}
          onPress={() => router.push('/check/message')}
        />
        <GhostButton
          label="Scan a QR code instead"
          icon={QrCode}
          onPress={() => router.push('/check/qr')}
        />
      </ScreenScroll>
    </Screen>
  );
}
