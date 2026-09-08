import { useState } from 'react';
import { CircleCheck, GraduationCap, Sparkles, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { ACTION_ICON } from '@/components/ui/icons';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import type { RecommendedAction } from '@/lib/types';

/**
 * Zone B. One continuous explanation: rule-based fact lines first, then a
 * single plain-language gloss sentence. The gloss is never boxed off as
 * "AI says" — it closes the same paragraph block.
 */
export function WhyFlagged({
  factLines,
  aiExplanation,
  technicalDetails,
  title = 'Why we flagged this',
}: {
  factLines: string[];
  aiExplanation: string;
  technicalDetails: string[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="gap-3">
      <Text variant="heading">{title}</Text>
      <View className="gap-2.5">
        {factLines.slice(0, 5).map((line) => (
          <View key={line} className="flex-row gap-2.5">
            <View className="bg-brand-teal mt-2 h-1.5 w-1.5 rounded-full" />
            <Text variant="body" className="flex-1">
              {line}
            </Text>
          </View>
        ))}
        <Text variant="body" className="text-muted">
          {aiExplanation}
        </Text>
      </View>
      {technicalDetails.length > 0 ? (
        <Disclosure
          label={open ? 'Hide technical details' : 'Show technical details'}
          open={open}
          onToggle={() => setOpen((value) => !value)}
        >
          {technicalDetails.map((detail) => (
            <Text key={detail} variant="meta">
              {detail}
            </Text>
          ))}
        </Disclosure>
      ) : null}
    </Card>
  );
}

/** Zone C. A verdict is never shown without at least one action. */
export function RecommendedActions({
  actions,
  onAction,
  title = 'What you can do now',
}: {
  actions: RecommendedAction[];
  onAction: (action: RecommendedAction) => void;
  title?: string;
}) {
  return (
    <View className="gap-3">
      <Text variant="heading">{title}</Text>
      {actions.map((action) => (
        <View key={action.id} className="gap-1.5">
          {action.emphasis === 'primary' ? (
            <PrimaryButton
              label={action.label}
              icon={ACTION_ICON[action.kind]}
              onPress={() => onAction(action)}
            />
          ) : (
            <GhostButton
              label={action.label}
              icon={ACTION_ICON[action.kind]}
              onPress={() => onAction(action)}
            />
          )}
          {action.helper ? (
            <Text variant="meta" className="px-4">
              {action.helper}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Literacy always sits below the verdict and actions, and is dismissible.
 * It never interrupts a critical step.
 */
export function LiteracyPrompt({
  title,
  durationLabel,
  onOpen,
  onDismiss,
}: {
  title: string;
  durationLabel: string;
  onOpen: () => void;
  onDismiss?: () => void;
}) {
  if (!onDismiss) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        className="bg-surface-secondary/70 flex-row items-center gap-3 rounded-[20px] p-4 active:opacity-80"
      >
        <IconTile icon={GraduationCap} color={colors.brandBlue} />
        <View className="flex-1">
          <Text variant="label">{title}</Text>
          <Text variant="meta">{durationLabel} · optional</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View className="bg-surface-secondary/70 flex-row items-center gap-3 rounded-[20px] p-4">
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        className="flex-1 flex-row items-center gap-3"
      >
        <IconTile icon={GraduationCap} color={colors.brandBlue} />
        <View className="flex-1">
          <Text variant="label">{title}</Text>
          <Text variant="meta">{durationLabel} · optional</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={10}
        onPress={onDismiss}
      >
        <X color={colors.muted} size={18} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

/** Reinforces learning after a risky moment, never fear or blame. */
export function ReassuranceNote({
  children = 'You did the right thing by checking. Now you know this pattern, and you are harder to scam next time.',
}: {
  children?: string;
}) {
  return (
    <View className="bg-brand-teal-soft/40 flex-row gap-2.5 rounded-[20px] p-4">
      <CircleCheck color={colors.brandMint} size={18} strokeWidth={1.9} />
      <Text variant="caption" className="text-foreground/85 flex-1">
        {children}
      </Text>
    </View>
  );
}

/** Calm social-proof line used under verdicts and lookups. */
export function SocialProofNote({ children }: { children: string }) {
  return (
    <View className="flex-row gap-2.5 px-1">
      <Sparkles color={colors.muted} size={16} strokeWidth={1.9} />
      <Text variant="caption" className="flex-1">
        {children}
      </Text>
    </View>
  );
}
