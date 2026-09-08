import { router } from 'expo-router';
import {
  CircleCheck,
  Inbox,
  MessageSquareOff,
  RotateCcw,
  ShieldQuestion,
} from 'lucide-react-native';
import { View } from 'react-native';

import { GhostButton, InlineAction } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PermissionDeniedState } from '@/components/ui/Feedback';
import { RiskPill } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { goBackOrReplace } from '@/lib/navigation';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { timeAgo } from '@/lib/utils';

/**
 * Transparent quarantine: messages are held, never deleted, and every one
 * explains itself and can be restored in a single tap.
 */
export default function QuarantineInbox() {
  const quarantine = useStore((state) => state.quarantine);
  const permissions = useStore((state) => state.permissions);
  const restoreQuarantined = useStore((state) => state.restoreQuarantined);
  const reportFalsePositive = useStore((state) => state.reportFalsePositive);

  const held = quarantine.filter((message) => message.status === 'quarantined');

  if (permissions.sms === 'denied') {
    return (
      <Screen>
        <ScreenHeader title="Quarantine inbox" backFallback="/(tabs)/shield" />
        <PermissionDeniedState
          icon={MessageSquareOff}
          title="Message access is off"
          body="Without message access on Android, Dhibiti cannot hold suspicious SMS for review. You can still paste or share any message into Shield to check it, and you can turn this on later."
          onEnable={() => router.push('/more/permissions')}
          enableLabel="Turn on message access"
          onSkip={() => router.push('/check/message')}
          skipLabel="Paste a message instead"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Quarantine inbox"
        subtitle={
          held.length > 0
            ? `${held.length} message${held.length === 1 ? '' : 's'} held for review`
            : 'Nothing held right now'
        }
        backFallback="/(tabs)/shield"
      />

      {quarantine.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing has been quarantined"
          body="Suspicious messages will appear here with the reason they were flagged. Nothing is ever deleted, and one-time codes are never held."
          actionLabel="Back to Shield"
          onAction={() => goBackOrReplace('/(tabs)/shield')}
        />
      ) : (
        <ScreenScroll contentClassName="px-5 gap-3">
          <View className="bg-surface-secondary/60 flex-row gap-2.5 rounded-[20px] p-4">
            <ShieldQuestion color={colors.brandBlue} size={18} strokeWidth={1.9} />
            <Text variant="caption" className="text-foreground/85 flex-1">
              These messages are still on your phone. Restoring one puts it back in your Messages
              app. If we got it wrong, tell us — it helps the rules improve.
            </Text>
          </View>

          {quarantine.map((message) => (
            <Card key={message.id} className="gap-3">
              <View className="flex-row items-center gap-2">
                <Text variant="label" className="flex-1" numberOfLines={1}>
                  {message.sender}
                </Text>
                <RiskPill level={message.riskLevel} size="sm" />
              </View>

              <View className="bg-surface-secondary/70 rounded-2xl p-3.5">
                <Text variant="body" className="text-foreground/90">
                  {message.body}
                </Text>
              </View>

              <View className="gap-1">
                <Text variant="section">Why it was held</Text>
                <Text variant="caption">{message.reason}</Text>
              </View>

              <Text variant="meta">Received {timeAgo(message.receivedAt)}</Text>

              {message.status === 'quarantined' ? (
                <View className="gap-2.5">
                  <View className="flex-row gap-2.5">
                    <GhostButton
                      label="Restore"
                      icon={RotateCcw}
                      onPress={() => restoreQuarantined(message.id)}
                      fullWidth={false}
                      className="flex-1"
                    />
                    <GhostButton
                      label="Not a scam"
                      icon={CircleCheck}
                      onPress={() => reportFalsePositive(message.id)}
                      fullWidth={false}
                      className="flex-1"
                    />
                  </View>
                  <InlineAction
                    label="Check this message in full"
                    onPress={() =>
                      router.push({ pathname: '/check/message', params: { text: message.body } })
                    }
                  />
                </View>
              ) : (
                <View className="bg-brand-teal-soft/40 flex-row gap-2.5 rounded-2xl p-3.5">
                  <CircleCheck color={colors.brandMint} size={17} strokeWidth={1.9} />
                  <Text variant="caption" className="text-foreground/85 flex-1">
                    {message.status === 'restored'
                      ? 'Restored to your Messages app. It stays visible here so you can check it again later.'
                      : 'Thanks — we are reviewing this one and it has been restored to your Messages app.'}
                  </Text>
                </View>
              )}
            </Card>
          ))}
        </ScreenScroll>
      )}
    </Screen>
  );
}
