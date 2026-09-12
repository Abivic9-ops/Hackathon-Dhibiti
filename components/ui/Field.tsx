import { Check, ChevronDown, Info, type LucideIcon } from 'lucide-react-native';
import { Pressable, Switch, TextInput, View } from 'react-native';

import { Text, useTranslate } from '@/components/ui/Text';
import { colors, onGradient } from '@/lib/theme';
import { cn } from '@/lib/utils';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helper?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  prefix?: string;
  minHeight?: number;
  maxLength?: number;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  prefix,
  minHeight,
  maxLength,
}: FieldProps) {
  const tr = useTranslate();

  return (
    <View className="gap-2">
      <Text variant="section">{label}</Text>
      <View
        className={cn(
          'bg-surface border-border/70 flex-row gap-2 rounded-[18px] border px-4',
          multiline ? 'py-3' : 'items-center py-1',
        )}
      >
        {prefix ? (
          <Text variant="label" className="text-muted py-3">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ? tr(placeholder) : undefined}
          placeholderTextColor={colors.muted}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
          className="font-poppins text-foreground flex-1 text-[15px] leading-[22px]"
          style={{ minHeight: minHeight ?? (multiline ? 132 : 48) }}
        />
      </View>
      {helper ? <Text variant="meta">{helper}</Text> : null}
    </View>
  );
}

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

/** Horizontal selector used for filters and type pickers. */
export function ChipSelector<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-70',
              active ? 'bg-brand-teal border-brand-teal' : 'bg-surface border-border/70',
            )}
          >
            {Icon ? (
              <Icon color={active ? onGradient : colors.muted} size={15} strokeWidth={2} />
            ) : null}
            <Text variant="label" className={cn('text-[13px]', active ? 'text-ink' : 'text-muted')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Single-select list rows — used where options need a description each. */
export function OptionRow({
  icon: Icon,
  title,
  description,
  selected,
  onPress,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 rounded-[18px] border p-4 active:opacity-80',
        selected ? 'border-brand-teal bg-brand-teal-soft/40' : 'border-border/60 bg-surface',
      )}
    >
      {Icon ? (
        <Icon color={selected ? colors.brandMint : colors.muted} size={20} strokeWidth={1.9} />
      ) : null}
      <View className="flex-1">
        <Text variant="label">{title}</Text>
        {description ? <Text variant="caption">{description}</Text> : null}
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border',
          selected ? 'border-brand-teal bg-brand-teal' : 'border-border',
        )}
      >
        {selected ? <Check color={onGradient} size={14} strokeWidth={2.5} /> : null}
      </View>
    </Pressable>
  );
}

export function ToggleRow({
  icon: Icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="bg-surface border-border/60 flex-row items-center gap-3 rounded-[18px] border p-4">
      {Icon ? <Icon color={colors.brandBlue} size={20} strokeWidth={1.9} /> : null}
      <View className="flex-1">
        <Text variant="label">{title}</Text>
        {description ? <Text variant="caption">{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceTertiary, true: colors.brandTeal }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.surfaceTertiary}
      />
    </View>
  );
}

export function CheckboxRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      className="flex-row items-center gap-3 active:opacity-70"
    >
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-lg border',
          value ? 'border-brand-teal bg-brand-teal' : 'border-border bg-surface',
        )}
      >
        {value ? <Check color={onGradient} size={15} strokeWidth={2.5} /> : null}
      </View>
      <Text variant="body" className="flex-1">
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Explicit storage note. Used anywhere text, a screenshot or a photo is
 * captured — the brief requires this to be stated, never implied.
 */
export function PrivacyNote({ children }: { children: string }) {
  return (
    <View className="bg-brand-blue-soft/40 flex-row gap-2.5 rounded-[18px] p-3.5">
      <Info color={colors.brandBlue} size={17} strokeWidth={1.9} />
      <Text variant="caption" className="text-foreground/80 flex-1">
        {children}
      </Text>
    </View>
  );
}

/** Collapsed technical disclosure used by verdicts and lookups. */
export function Disclosure({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-surface-secondary/60 rounded-[18px]">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        className="flex-row items-center justify-between p-4 active:opacity-70"
      >
        <Text variant="label" className="text-muted">
          {label}
        </Text>
        <ChevronDown
          color={colors.muted}
          size={18}
          strokeWidth={2}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? <View className="gap-2 px-4 pb-4">{children}</View> : null}
    </View>
  );
}
