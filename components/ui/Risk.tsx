import { View } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { AttentionGlow, PopIn, Reveal } from '@/components/ui/Motion';
import { Text } from '@/components/ui/Text';
import { RISK } from '@/lib/theme';
import type { RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SCAM_CATEGORY_ICON } from '@/components/ui/icons';
import type { ScamCategory } from '@/lib/types';

/** The one pill/badge component for risk status. */
export function RiskPill({
  level,
  label,
  className,
  size = 'md',
}: {
  level: RiskLevel;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const meta = RISK[level];
  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 self-start rounded-full',
        meta.softBgClass,
        size === 'sm' ? 'px-2 py-[3px]' : 'px-2.5 py-1',
        className,
      )}
    >
      <View className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} />
      <Text
        variant="label"
        className={cn(meta.textClass, size === 'sm' ? 'text-[11px]' : 'text-[12px]')}
      >
        {label ?? meta.label}
      </Text>
    </View>
  );
}

export function RiskDot({ level, className }: { level: RiskLevel; className?: string }) {
  return <View className={cn('h-2 w-2 rounded-full', RISK[level].dotClass, className)} />;
}

/**
 * Zone A of the verdict screen: large colored badge plus the one-line
 * plain-language summary and the canonical action line for that level.
 */
export function VerdictBadge({
  level,
  summary,
  scamCategory,
}: {
  level: RiskLevel;
  summary: string;
  scamCategory?: ScamCategory;
}) {
  const meta = RISK[level];
  const Icon = scamCategory ? SCAM_CATEGORY_ICON[scamCategory] : undefined;
  // Only the two levels that mean "stop" get the breathing outline.
  const urgent = level === 'red' || level === 'amber';
  return (
    <PopIn
      from={0.94}
      className={cn(
        'gap-3 rounded-[24px] border p-5',
        meta.softBgClass,
        meta.borderClass,
        'border',
      )}
    >
      {urgent ? <AttentionGlow color={meta.color} radius={24} /> : null}
      <View className="flex-row items-center gap-3">
        {Icon ? (
          <PopIn delay={140} from={0.6}>
            <IconTile icon={Icon} color={meta.color} />
          </PopIn>
        ) : null}
        <View className="flex-1">
          <Text variant="numeral" className={meta.textClass}>
            {meta.label}
          </Text>
          <Text variant="meta" className={meta.textClass}>
            {meta.meaning}
          </Text>
        </View>
      </View>
      <Reveal delay={180} distance={8}>
        <Text variant="body" className="text-foreground">
          {summary}
        </Text>
      </Reveal>
      <Reveal delay={260} distance={8} className="bg-ink/40 rounded-2xl px-3.5 py-3">
        <Text variant="section" className={cn('pb-1', meta.textClass)}>
          What to do
        </Text>
        <Text variant="body">{meta.action}</Text>
      </Reveal>
    </PopIn>
  );
}

/**
 * The two-panel result: message/content risk beside money-destination risk.
 * Shown whenever a check involves a payment destination.
 */
export function RiskPanelPair({
  contentLabel,
  contentLevel,
  recipientLabel,
  recipientLevel,
  recipientNote,
}: {
  contentLabel: string;
  contentLevel: RiskLevel;
  recipientLabel: string;
  recipientLevel?: RiskLevel;
  recipientNote?: string;
}) {
  return (
    <View className="flex-row gap-3">
      <Reveal
        delay={80}
        className="bg-surface border-border/60 flex-1 gap-2 rounded-[20px] border p-4"
      >
        <Text variant="section">{contentLabel}</Text>
        <RiskPill level={contentLevel} />
      </Reveal>
      <Reveal
        delay={180}
        className="bg-surface border-border/60 flex-1 gap-2 rounded-[20px] border p-4"
      >
        <Text variant="section">{recipientLabel}</Text>
        {recipientLevel ? (
          <RiskPill level={recipientLevel} />
        ) : (
          <Text variant="caption">No payment destination in this check</Text>
        )}
        {recipientNote ? (
          <Text variant="meta" numberOfLines={2}>
            {recipientNote}
          </Text>
        ) : null}
      </Reveal>
    </View>
  );
}
