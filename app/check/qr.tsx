import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Camera, Images, QrCode, ShieldCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { PermissionDeniedState } from '@/components/ui/Feedback';
import { PrivacyNote } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { Floaty, Stagger } from '@/components/ui/Motion';
import { ScanFrame } from '@/components/ui/ScanFrame';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { qrSamples } from '@/lib/seed';
import { useStore } from '@/lib/store';
import { colors, useTheme, type ThemeMode } from '@/lib/theme';

/** Subtle brand-tinted canvas behind the targeting frame, per theme. */
const SCAN_BACKDROP: Record<ThemeMode, readonly [string, string]> = {
  dark: ['#0D1220', '#0F1A2E'],
  light: ['#E9EDF4', '#DCE9F4'],
};

function scan(raw: string) {
  router.push({ pathname: '/check/processing', params: { type: 'qr', text: raw } });
}

/** Camera capture is simulated in this build; the flow it feeds is real. */
export default function CheckQr() {
  const mode = useTheme();
  const permission = useStore((state) => state.permissions.camera);
  const setPermission = useStore((state) => state.setPermission);
  const [gallery, setGallery] = useState(false);
  const [locked, setLocked] = useState(false);
  const pendingRaw = useRef<string | null>(null);

  function handleSamplePress(raw: string) {
    pendingRaw.current = raw;
    setLocked(true);
  }

  function handleLocked() {
    if (!pendingRaw.current) return;
    const raw = pendingRaw.current;
    pendingRaw.current = null;
    scan(raw);
  }

  if (permission === 'denied') {
    return (
      <Screen>
        <ScreenHeader title="Scan QR code" backFallback="/(tabs)/shield" />
        <PermissionDeniedState
          icon={Camera}
          title="Camera access is off"
          body="Without the camera you cannot scan a code directly, but you can still import a QR screenshot from your gallery, or paste the link it contains."
          onEnable={() => setPermission('camera', 'granted')}
          enableLabel="Turn on camera access"
          onSkip={() => setGallery(true)}
          skipLabel="Import from gallery instead"
        />
        <GallerySheet visible={gallery} onClose={() => setGallery(false)} onPick={scan} />
      </Screen>
    );
  }

  if (permission === 'undetermined') {
    return (
      <Screen>
        <ScreenHeader title="Scan QR code" backFallback="/(tabs)/shield" />
        <ScreenScroll contentClassName="px-5 gap-4">
          <IconTile icon={Camera} color={colors.brandTeal} size="lg" />
          <Text variant="title">Dhibiti needs the camera to read a code</Text>
          <Text variant="caption">
            The camera is used only while this screen is open, to read what a QR code contains. No
            photo is saved and nothing is opened or paid automatically.
          </Text>
          <PrivacyNote>
            We store the domain or Paybill a code points to, never the raw image, and you can delete
            your scan history at any time.
          </PrivacyNote>
        </ScreenScroll>
        <ActionBar>
          <PrimaryButton
            label="Allow camera access"
            onPress={() => setPermission('camera', 'granted')}
          />
          <GhostButton label="Not now" onPress={() => setPermission('camera', 'denied')} />
        </ActionBar>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Scan QR code"
        subtitle="Nothing opens or pays until you decide"
        backFallback="/(tabs)/shield"
      />
      <ScreenScroll contentClassName="px-5 gap-4">
        <Stagger step={80} initialDelay={40}>
          <View className="border-border overflow-hidden rounded-[28px] border">
            <LinearGradient
              colors={SCAN_BACKDROP[mode]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center justify-center px-6 py-8"
            >
              <ScanFrame size={256} locked={locked} onLocked={handleLocked}>
                <Floaty distance={4} duration={3200}>
                  <QrCode color={colors.muted} size={58} strokeWidth={1.4} />
                </Floaty>
              </ScanFrame>
              <Text variant="caption" className="mt-6 px-6 text-center">
                {locked
                  ? 'Found it — checking now…'
                  : 'Hold the code inside the frame. In this preview build, pick a code below to simulate a scan.'}
              </Text>
            </LinearGradient>
          </View>

          <SectionLabel label="Codes you can scan in this build" className="px-0" />

          <View className="gap-2.5">
            {qrSamples.map((sample) => (
              <Pressable
                accessibilityRole="button"
                key={sample.id}
                onPress={() => handleSamplePress(sample.raw)}
                className="bg-surface flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-80"
              >
                <IconTile icon={QrCode} color={colors.brandBlue} size="sm" />
                <View className="flex-1">
                  <Text variant="label">{sample.label}</Text>
                  <Text variant="meta" numberOfLines={1}>
                    {sample.raw}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View className="bg-surface-secondary/60 flex-row gap-2.5 rounded-[20px] p-4">
            <ShieldCheck color={colors.brandMint} size={18} strokeWidth={1.9} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              A code is never opened, dialled, connected to or paid just because you scanned it. You
              see the verdict first.
            </Text>
          </View>
        </Stagger>
      </ScreenScroll>

      <ActionBar>
        <GhostButton
          label="Import a QR screenshot"
          icon={Images}
          onPress={() => setGallery(true)}
        />
      </ActionBar>

      <GallerySheet visible={gallery} onClose={() => setGallery(false)} onPick={scan} />
    </Screen>
  );
}

function GallerySheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (raw: string) => void;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      icon={Images}
      title="Import a saved QR code"
      body="Pick a screenshot to read the code inside it. The image stays on your device."
      secondaryLabel="Cancel"
      onSecondary={onClose}
    >
      <View className="gap-2.5">
        {qrSamples.slice(0, 3).map((sample) => (
          <Pressable
            accessibilityRole="button"
            key={sample.id}
            onPress={() => {
              onClose();
              onPick(sample.raw);
            }}
            className="bg-surface-secondary flex-row items-center gap-3 rounded-2xl px-4 py-3 active:opacity-80"
          >
            <IconTile icon={QrCode} color={colors.muted} size="sm" />
            <Text variant="label" className="flex-1">
              {sample.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
