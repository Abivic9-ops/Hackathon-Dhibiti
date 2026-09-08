import { useState } from 'react';
import { router } from 'expo-router';
import {
  Flag,
  Inbox,
  Link2,
  MessageSquareText,
  PhoneCall,
  QrCode,
  ScanSearch,
  Trash2,
  Trophy,
} from 'lucide-react-native';
import { View } from 'react-native';

import { InlineAction } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, OfflineBanner } from '@/components/ui/Feedback';
import { PageTitle, Screen, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { ActivityRow, NavRow, QuickActionCard } from '@/components/ui/rows';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/** The detection hub: check anything, review what you checked, review what was held back. */
export default function ShieldTab() {
  const checks = useStore((state) => state.checks);
  const quarantine = useStore((state) => state.quarantine);
  const clearHistory = useStore((state) => state.clearHistory);
  const simulateOffline = useStore((state) => state.simulateOffline);
  const [confirmClear, setConfirmClear] = useState(false);

  const held = quarantine.filter((message) => message.status === 'quarantined');

  return (
    <Screen>
      <PageTitle title="Shield" subtitle="Check anything before you act on it" />

      <ScreenScroll contentClassName="gap-4">
        {simulateOffline ? <OfflineBanner /> : null}

        <View>
          <SectionLabel label="Check something now" />
          <View className="gap-3 px-5">
            <View className="flex-row gap-3">
              <QuickActionCard
                icon={MessageSquareText}
                title="Paste a message"
                caption="SMS or WhatsApp text, in any language"
                emphasised
                onPress={() => router.push('/check/message')}
              />
              <QuickActionCard
                icon={PhoneCall}
                title="Describe a call"
                caption="What the caller said and what they asked for"
                onPress={() => router.push('/check/call')}
              />
            </View>
            <View className="flex-row gap-3">
              <QuickActionCard
                icon={QrCode}
                title="Scan QR code"
                caption="Camera or an image from your gallery"
                onPress={() => router.push('/check/qr')}
              />
              <QuickActionCard
                icon={ScanSearch}
                title="Look up a number"
                caption="Phone, Paybill, Till, account or wallet"
                onPress={() => router.push('/check/lookup')}
              />
            </View>
            <NavRow
              icon={Link2}
              title="Check a link before you open it"
              description="Paste any web address, wherever it came from"
              onPress={() => router.push('/check/link')}
            />
          </View>
        </View>

        <View>
          <SectionLabel label="Quarantine inbox" />
          <View className="px-5">
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <Inbox color={colors.riskAmber} size={20} strokeWidth={1.9} />
                <Text variant="label" className="flex-1">
                  {held.length > 0
                    ? `${held.length} message${held.length === 1 ? '' : 's'} were quarantined. Review them.`
                    : 'No messages are being held right now.'}
                </Text>
              </View>
              <Text variant="caption">
                Nothing is deleted. Every held message shows why it was flagged, and you can restore
                it in one tap. One-time codes from your bank or Safaricom are never held.
              </Text>
              <InlineAction
                label="Open quarantine inbox"
                onPress={() => router.push('/quarantine')}
              />
            </Card>
          </View>
        </View>

        <View>
          <SectionLabel
            label="Your risk history"
            right={
              checks.length > 0 ? (
                <InlineAction label="Clear" onPress={() => setConfirmClear(true)} />
              ) : undefined
            }
          />
          {checks.length > 0 ? (
            <View className="gap-3 px-5">
              {checks.map((check) => (
                <ActivityRow
                  key={check.id}
                  check={check}
                  onPress={() => router.push({ pathname: '/check/[id]', params: { id: check.id } })}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={ScanSearch}
              title="Your history is empty"
              body="Checks you run are saved here with their verdict, so you can look back at what happened."
              actionLabel="Run your first check"
              onAction={() => router.push('/check/message')}
            />
          )}
        </View>

        <View>
          <SectionLabel label="Help others, and practise" />
          <View className="gap-3 px-5">
            <NavRow
              icon={Flag}
              title="Report a scam"
              description="Your report warns the next person who checks"
              iconColor={colors.riskRed}
              onPress={() => router.push('/report/new')}
            />
            <NavRow
              icon={Trophy}
              title="Practice: Spot the Scam"
              description="Five real examples. Can you call them correctly?"
              iconColor={colors.brandMint}
              onPress={() => router.push('/more/simulator')}
            />
          </View>
        </View>
      </ScreenScroll>

      <Sheet
        visible={confirmClear}
        onClose={() => setConfirmClear(false)}
        icon={Trash2}
        iconColor={colors.riskRed}
        title="Clear your check history?"
        body="The verdicts you have already seen will be removed from this device. Community reports you submitted are not affected."
        primaryLabel="Clear history"
        onPrimary={() => {
          clearHistory();
          setConfirmClear(false);
        }}
        secondaryLabel="Keep my history"
        onSecondary={() => setConfirmClear(false)}
      />
    </Screen>
  );
}
