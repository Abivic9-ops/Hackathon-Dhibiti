import { useMemo, useState } from 'react';
import { Landmark, PhoneCall, Search, Smartphone } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { GhostButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipSelector, type ChipOption, TextField } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { VerifiedInstitution } from '@/lib/types';

type Filter = 'all' | VerifiedInstitution['category'];

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'bank', label: 'Banks' },
  { value: 'telco', label: 'Telcos' },
  { value: 'government', label: 'Government' },
  { value: 'merchant', label: 'Merchants' },
];

const CATEGORY_LABEL: Record<VerifiedInstitution['category'], string> = {
  bank: 'Bank',
  telco: 'Mobile network',
  government: 'Government',
  merchant: 'Merchant',
};

const dial = (phone: string) => void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);

/** Verified institution directory — the number you call, never the one that called you. */
export default function InstitutionsScreen() {
  const institutions = useStore((state) => state.institutions);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return institutions.filter((institution) => {
      if (filter !== 'all' && institution.category !== filter) return false;
      if (needle.length === 0) return true;
      return (
        institution.name.toLowerCase().includes(needle) ||
        institution.aliases.some((alias) => alias.toLowerCase().includes(needle))
      );
    });
  }, [filter, institutions, query]);

  return (
    <Screen>
      <ScreenHeader title="Verified institutions" backFallback="/more" />

      <ScreenScroll contentClassName="px-5 gap-4">
        <Card className="gap-2">
          <IconTile icon={Landmark} color={colors.brandTeal} />
          <Text variant="label">Call these numbers yourself</Text>
          <Text variant="caption">
            If someone calls claiming to be your bank, Safaricom or a government office, hang up and
            call the official number here. A caller ID or sender name can be faked; this directory
            cannot be edited by whoever contacted you.
          </Text>
        </Card>

        <TextField
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="KCB, Equity, Safaricom, DCI…"
          autoCapitalize="none"
        />
        <ChipSelector options={FILTERS} value={filter} onChange={setFilter} />

        {visible.length > 0 ? (
          <View className="gap-3">
            {visible.map((institution) => (
              <Card key={institution.id} className="gap-3">
                <View className="flex-row items-center gap-3">
                  <IconTile
                    icon={institution.category === 'telco' ? Smartphone : Landmark}
                    color={colors.brandBlue}
                  />
                  <View className="flex-1 gap-1">
                    <Text variant="label" numberOfLines={1}>
                      {institution.name}
                    </Text>
                    <Text variant="meta">{CATEGORY_LABEL[institution.category]}</Text>
                  </View>
                  <RiskPill level="blue" label="Verified" size="sm" />
                </View>
                {institution.note ? <Text variant="caption">{institution.note}</Text> : null}
                <View className="gap-2">
                  {institution.officialNumbers.map((number) => (
                    <GhostButton
                      key={number}
                      label={`Call ${number}`}
                      icon={PhoneCall}
                      onPress={() => dial(number)}
                    />
                  ))}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches that name"
            body="We only list institutions whose official numbers we have confirmed. If yours is missing, find the number on a statement, a card or the official website — never from the message that contacted you."
            actionLabel="Clear search"
            onAction={() => {
              setQuery('');
              setFilter('all');
            }}
          />
        )}
      </ScreenScroll>
    </Screen>
  );
}
