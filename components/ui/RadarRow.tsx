import { MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableCard } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { SCAM_CATEGORY_ICON } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { SCAM_CATEGORY_LABEL } from '@/lib/detection';
import { colors } from '@/lib/theme';
import type { ScamRadarEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Small location pill used on Scam Radar items and the radar feed. */
export function LocationChip({ label, className }: { label: string; className?: string }) {
  return (
    <View
      className={cn(
        'bg-surface-tertiary flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1',
        className,
      )}
    >
      <MapPin color={colors.muted} size={12} strokeWidth={2} />
      <Text variant="meta">{label}</Text>
    </View>
  );
}

/**
 * One anonymised trend from the community report data. Tapping it opens the
 * matching 1-minute lesson, so a trend always leads to something useful.
 */
export function RadarRow({ event, onPress }: { event: ScamRadarEvent; onPress: () => void }) {
  const Icon = SCAM_CATEGORY_ICON[event.scamCategory];
  return (
    <PressableCard
      onPress={onPress}
      className="bg-surface-secondary/70 flex-row items-center gap-3"
    >
      <IconTile icon={Icon} color={colors.riskAmber} />
      <View className="flex-1 gap-1">
        <Text variant="label" numberOfLines={1}>
          {SCAM_CATEGORY_LABEL[event.scamCategory]}
        </Text>
        <Text variant="meta" numberOfLines={2}>
          {event.sampleAnonymizedSummary}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="label">{event.reportCountLast24h}</Text>
        <Text variant="meta">in 24h</Text>
      </View>
    </PressableCard>
  );
}
