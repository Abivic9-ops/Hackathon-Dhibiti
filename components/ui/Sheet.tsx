import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { PopIn } from '@/components/ui/Motion';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryTone?: 'brand' | 'danger';
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/**
 * The single bottom-sheet pattern for confirmations, invites, report
 * submissions and destructive actions.
 */
export function Sheet({
  visible,
  onClose,
  icon,
  iconColor = colors.brandTeal,
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  primaryTone = 'brand',
  secondaryLabel,
  onSecondary,
}: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable
          accessibilityRole="none"
          onPress={() => undefined}
          className="bg-surface border-border/60 pb-safe-offset-5 gap-4 rounded-t-[28px] border-t px-5 pt-4"
        >
          <View className="bg-surface-tertiary h-1 w-10 self-center rounded-full" />
          <View className="flex-row items-center gap-3">
            {icon ? (
              <PopIn delay={90} from={0.62}>
                <IconTile icon={icon} color={iconColor} size="lg" />
              </PopIn>
            ) : null}
            <View className="flex-1 gap-1">
              <Text variant="heading">{title}</Text>
              {body ? <Text variant="caption">{body}</Text> : null}
            </View>
          </View>
          {children}
          <View className="gap-2.5">
            {primaryLabel && onPrimary ? (
              primaryTone === 'danger' ? (
                <GhostButton label={primaryLabel} tone="danger" onPress={onPrimary} />
              ) : (
                <PrimaryButton label={primaryLabel} onPress={onPrimary} />
              )
            ) : null}
            {secondaryLabel ? (
              <GhostButton label={secondaryLabel} onPress={onSecondary ?? onClose} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
