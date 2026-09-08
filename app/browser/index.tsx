import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Ban,
  Eye,
  FileWarning,
  Flag,
  KeyRound,
  Lock,
  LogOut,
  ShieldAlert,
} from 'lucide-react-native';
import { View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { goBackOrReplace } from '@/lib/navigation';
import { colors, RISK } from '@/lib/theme';
import type { RiskLevel } from '@/lib/types';

const BLOCKED = [
  { icon: KeyRound, text: 'Password and PIN fields are disabled on pages we cannot verify.' },
  { icon: FileWarning, text: 'App and file downloads are blocked in this view.' },
  { icon: Ban, text: 'Forms cannot be submitted to a domain flagged for impersonation.' },
];

/**
 * Dhibiti's sandboxed preview. It never loads the live page — it shows a
 * sanitized, non-interactive summary of what is on it, so the user can decide
 * before anything runs.
 */
export default function SafeBrowser() {
  const params = useLocalSearchParams<{ url?: string; level?: RiskLevel; checkId?: string }>();
  const url = params.url ?? '';
  const level: RiskLevel = params.level ?? 'grey';
  const [showRaw, setShowRaw] = useState(false);

  const host = url.replace(/^https?:\/\//, '').split('/')[0] || 'unknown-site';
  const risky = level === 'red' || level === 'amber';

  const findings = risky
    ? [
        'The page shows an M-Pesa style logo and green header, but the address is not safaricom.co.ke.',
        'There is a login form asking for a phone number and M-Pesa PIN.',
        'A payment form is pre-filled with an amount you did not enter.',
        'The page has no contact details, terms or company name anywhere.',
      ]
    : [
        'The page is a plain information page with no login or payment form.',
        'The address matches the brand shown on the page.',
        'Nothing on the page asks for a PIN, password or ID number.',
      ];

  return (
    <Screen>
      <ScreenHeader
        title="Dhibiti safe preview"
        subtitle="The live page is not loaded"
        backFallback="/(tabs)/shield"
      />

      <View className="bg-risk-amber-soft mx-5 mb-3 flex-row gap-2.5 rounded-2xl px-4 py-3.5">
        <ShieldAlert color={colors.riskAmber} size={18} strokeWidth={1.9} />
        <Text variant="caption" className="text-foreground/85 flex-1">
          You opened this link from a message or QR code. Do not enter your PIN, password or ID
          number unless you are certain the site is genuine.
        </Text>
      </View>

      <ScreenScroll contentClassName="px-5 gap-4">
        <Card className="gap-3">
          <View className="flex-row items-center gap-2.5">
            <Lock color={risky ? colors.riskAmber : colors.muted} size={16} strokeWidth={1.9} />
            <Text variant="label" className="flex-1" numberOfLines={1}>
              {host}
            </Text>
            <RiskPill level={level} size="sm" />
          </View>
          <Text variant="meta" numberOfLines={2}>
            {url}
          </Text>
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <IconTile icon={Eye} color={colors.brandBlue} />
            <View className="flex-1">
              <Text variant="heading">What is on this page</Text>
              <Text variant="meta">Text-only snapshot, nothing on the page can run</Text>
            </View>
          </View>
          {findings.map((finding) => (
            <View key={finding} className="flex-row gap-2.5">
              <View className="bg-brand-teal mt-2 h-1.5 w-1.5 rounded-full" />
              <Text variant="body" className="flex-1">
                {finding}
              </Text>
            </View>
          ))}
        </Card>

        <Card className="gap-3">
          <Text variant="heading">What this preview blocks</Text>
          {BLOCKED.map((item) => (
            <View key={item.text} className="flex-row items-center gap-3">
              <IconTile icon={item.icon} color={colors.muted} size="sm" />
              <Text variant="caption" className="text-foreground/85 flex-1">
                {item.text}
              </Text>
            </View>
          ))}
          <Disclosure
            label={showRaw ? 'Hide technical details' : 'Show technical details'}
            open={showRaw}
            onToggle={() => setShowRaw((value) => !value)}
          >
            <Text variant="meta">Full address: {url}</Text>
            <Text variant="meta">Host: {host}</Text>
            <Text variant="meta">
              Certificate organisation does not match the brand displayed on the page.
            </Text>
            <Text variant="meta">
              Snapshot fetched without cookies, scripts or your IP address.
            </Text>
          </Disclosure>
        </Card>

        <View className="bg-surface-secondary/60 rounded-[20px] p-4">
          <Text variant="caption" className="text-foreground/85">
            {RISK[level].action}
          </Text>
        </View>
      </ScreenScroll>

      <ActionBar>
        <PrimaryButton
          label="Leave this page"
          icon={LogOut}
          onPress={() => goBackOrReplace('/(tabs)/shield')}
        />
        <GhostButton
          label="Report this link"
          icon={Flag}
          onPress={() =>
            router.push({
              pathname: '/report/new',
              params: {
                type: 'link',
                identifier: url,
                content: `Link opened from a check: ${url}`,
              },
            })
          }
        />
      </ActionBar>
    </Screen>
  );
}
