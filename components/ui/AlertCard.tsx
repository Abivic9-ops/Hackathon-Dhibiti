import { MessageSquareText, PhoneCall } from 'lucide-react-native';
import { View } from 'react-native';

import { GhostButton, InlineAction } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { SCAM_CATEGORY_ICON } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { RISK } from '@/lib/theme';
import type { Alert } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

/**
 * The one alert card, reused identically for Family Circle and Group Circle
 * alerts: what was detected, why, the suggested action, and a way to reach
 * the person in one tap.
 */
export function AlertCard({
  alert,
  scamIconKey,
  onCall,
  onMessage,
  onOpenDetail,
}: {
  alert: Alert;
  scamIconKey?: keyof typeof SCAM_CATEGORY_ICON;
  onCall?: () => void;
  onMessage?: () => void;
  onOpenDetail?: () => void;
}) {
  const Icon = SCAM_CATEGORY_ICON[scamIconKey ?? 'none'];
  return (
    <Card className="gap-3">
      <View className="flex-row items-start gap-3">
        <IconTile icon={Icon} color={RISK[alert.riskLevel].color} />
        <View className="flex-1 gap-1">
          <Text variant="label">{alert.summary}</Text>
          <View className="flex-row items-center gap-2">
            <RiskPill level={alert.riskLevel} size="sm" />
            <Text variant="meta">
              {alert.memberName} · {timeAgo(alert.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      <Text variant="caption">{alert.detail}</Text>

      <View className="bg-surface-secondary/70 rounded-2xl p-3.5">
        <Text variant="section" className="pb-1">
          Suggested action
        </Text>
        <Text variant="body">{alert.suggestedAction}</Text>
      </View>

      {onCall || onMessage ? (
        <View className="flex-row gap-2.5">
          {onCall ? (
            <GhostButton
              label="Call now"
              icon={PhoneCall}
              onPress={onCall}
              fullWidth={false}
              className="flex-1"
            />
          ) : null}
          {onMessage ? (
            <GhostButton
              label="Message"
              icon={MessageSquareText}
              onPress={onMessage}
              fullWidth={false}
              className="flex-1"
            />
          ) : null}
        </View>
      ) : null}

      {onOpenDetail ? <InlineAction label="See the full check" onPress={onOpenDetail} /> : null}
    </Card>
  );
}
