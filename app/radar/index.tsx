import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { GraduationCap, PhoneCall, Radar } from 'lucide-react-native';

import { GhostButton, InlineAction } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { ChipSelector, type ChipOption } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { LocationChip } from '@/components/ui/RadarRow';
import { SCAM_CATEGORY_ICON } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SocialProofNote } from '@/components/ui/Verdict';
import { SCAM_CATEGORY_LABEL } from '@/lib/detection';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Scam Radar: anonymised, aggregated community reports near the user, so the
 * same report data warns people before anything happens to them.
 */
export default function RadarScreen() {
  const radar = useStore((state) => state.radar);
  const institutions = useStore((state) => state.institutions);
  const user = useStore((state) => state.user);

  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');

  const categoryOptions: ChipOption<string>[] = [
    { value: 'all', label: 'All patterns', icon: Radar },
    ...[...new Set(radar.map((event) => event.scamCategory))].map((value) => ({
      value,
      label: SCAM_CATEGORY_LABEL[value],
      icon: SCAM_CATEGORY_ICON[value],
    })),
  ];

  const locationOptions: ChipOption<string>[] = [
    { value: 'all', label: 'Everywhere' },
    ...[...new Set(radar.map((event) => event.roughLocation))].map((value) => ({
      value,
      label: value,
    })),
  ];

  const visible = radar
    .filter((event) => category === 'all' || event.scamCategory === category)
    .filter((event) => location === 'all' || event.roughLocation === location)
    .sort((a, b) => b.reportCountLast24h - a.reportCountLast24h);

  return (
    <Screen>
      <ScreenHeader
        title="Scam radar"
        subtitle={
          user.county
            ? `What people near ${user.county} are reporting`
            : 'What people across Kenya are reporting'
        }
        backFallback="/(tabs)"
      />

      <ScreenScroll contentClassName="px-5 gap-4">
        <Text variant="caption">
          These are patterns reported by other people in the last 24 hours. No names, numbers or
          amounts are shared — only the pattern and the rough area.
        </Text>

        <ChipSelector options={categoryOptions} value={category} onChange={setCategory} />
        <ChipSelector options={locationOptions} value={location} onChange={setLocation} />

        {visible.length === 0 ? (
          <EmptyState
            icon={Radar}
            title="Nothing reported for this filter"
            body="No reports match this pattern or area in the last 24 hours. That is not a guarantee — treat anything unexpected as unverified."
            actionLabel="Show everything"
            onAction={() => {
              setCategory('all');
              setLocation('all');
            }}
          />
        ) : (
          visible.map((event) => {
            const Icon = SCAM_CATEGORY_ICON[event.scamCategory];
            const institution = institutions.find((item) => item.id === event.relatedInstitutionId);
            const officialNumber = institution?.officialNumbers[0];

            return (
              <Card key={event.id} className="gap-3">
                <View className="flex-row items-start gap-3">
                  <IconTile icon={Icon} color={colors.riskAmber} />
                  <View className="flex-1 gap-1.5">
                    <Text variant="label">{SCAM_CATEGORY_LABEL[event.scamCategory]}</Text>
                    <View className="flex-row items-center gap-2">
                      <LocationChip label={event.roughLocation} />
                      <Text variant="meta">{event.reportCountLast24h} reports in 24h</Text>
                    </View>
                  </View>
                </View>

                <Text variant="body">{event.sampleAnonymizedSummary}</Text>

                {officialNumber && institution ? (
                  <GhostButton
                    label={`Call the real ${institution.name} number`}
                    icon={PhoneCall}
                    onPress={() => void Linking.openURL(`tel:${officialNumber}`)}
                  />
                ) : null}

                <InlineAction
                  label="Read the 1-minute lesson"
                  icon={GraduationCap}
                  onPress={() =>
                    router.push({ pathname: '/lesson/[id]', params: { id: event.relatedLessonId } })
                  }
                />
              </Card>
            );
          })
        )}

        <SocialProofNote>
          Many people in Kenya receive messages like these. Most are scams, and every report makes
          the next person harder to trick.
        </SocialProofNote>
      </ScreenScroll>
    </Screen>
  );
}
