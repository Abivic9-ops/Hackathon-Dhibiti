import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { ChipSelector, PrivacyNote, TextField, type ChipOption } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { IDENTIFIER_ICON, IDENTIFIER_LABEL } from '@/components/ui/icons';
import { RiskDot } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { IdentifierType } from '@/lib/types';

const OPTIONS: ChipOption<IdentifierType>[] = (
  ['phone', 'paybill', 'till', 'account', 'crypto'] as IdentifierType[]
).map((value) => ({ value, label: IDENTIFIER_LABEL[value], icon: IDENTIFIER_ICON[value] }));

const PLACEHOLDER: Record<IdentifierType, string> = {
  phone: '07xx xxx xxx or +2547xx xxx xxx',
  paybill: '6-digit Paybill, e.g. 522533',
  till: 'Till or Buy Goods number',
  account: 'Bank account number',
  crypto: 'Wallet address',
  url: 'https://…',
};

function submitLookup(identifier: string, identifierType: IdentifierType) {
  const trimmed = identifier.trim();
  if (trimmed.length < 3) return;
  router.push({
    pathname: '/check/processing',
    params: { type: 'number', identifier: trimmed, identifierType },
  });
}

/** Look up who is really behind a number, Paybill, Till, account or address. */
export default function CheckLookup() {
  const entities = useStore((state) => state.entities);
  const [type, setType] = useState<IdentifierType>('paybill');
  const [value, setValue] = useState('');

  return (
    <Screen>
      <ScreenHeader
        title="Look up a number"
        subtitle="Phone, Paybill, Till, account or wallet"
        backFallback="/(tabs)/shield"
      />
      <ScreenScroll contentClassName="px-5 gap-4">
        <ChipSelector options={OPTIONS} value={type} onChange={setType} />

        <TextField
          label={IDENTIFIER_LABEL[type]}
          value={value}
          onChangeText={setValue}
          placeholder={PLACEHOLDER[type]}
          keyboardType={
            type === 'phone' ? 'phone-pad' : type === 'crypto' ? 'default' : 'number-pad'
          }
          autoCapitalize="none"
          helper="We check community reports, verified institutions and your own payment history."
        />

        <PrivacyNote>
          We store the identifier you check, never your contacts list. Nobody is told that you
          looked someone up.
        </PrivacyNote>

        <SectionLabel label="Recently reported by others" className="px-0 pt-2" />
        <View className="gap-2.5">
          {entities.slice(0, 4).map((entity) => (
            <Pressable
              accessibilityRole="button"
              key={entity.identifier}
              onPress={() => submitLookup(entity.identifier, entity.identifierType)}
              className="bg-surface flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-80"
            >
              <IconTile
                icon={IDENTIFIER_ICON[entity.identifierType]}
                color={colors.muted}
                size="sm"
              />
              <View className="flex-1">
                <Text variant="label" numberOfLines={1}>
                  {entity.displayName ?? entity.identifier}
                </Text>
                <Text variant="meta">
                  {entity.reportCount} reports · {IDENTIFIER_LABEL[entity.identifierType]}
                </Text>
              </View>
              <RiskDot level={entity.riskLevel} />
            </Pressable>
          ))}
        </View>
      </ScreenScroll>

      <ActionBar>
        <PrimaryButton
          label="Check this identifier"
          onPress={() => submitLookup(value, type)}
          disabled={value.trim().length < 3}
        />
      </ActionBar>
    </Screen>
  );
}
