import { router } from 'expo-router';
import { BookOpenCheck, HeartHandshake, KeyRound, PhoneCall } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { NavRow } from '@/components/ui/rows';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

const HOUSE_RULES: { icon: typeof KeyRound; title: string; body: string }[] = [
  {
    icon: PhoneCall,
    title: 'We always call back on a saved number',
    body: 'Nobody in the family acts on a request that arrives from an unknown number, even if the voice or name matches.',
  },
  {
    icon: KeyRound,
    title: 'We agree on a family code word',
    body: 'Used only for real emergencies. A caller who cannot say it does not get money, no matter how urgent they sound.',
  },
  {
    icon: HeartHandshake,
    title: 'Checking first is never a bother',
    body: 'Anyone can pause and ask before sending money. Nobody is made to feel careless for asking.',
  },
];

/**
 * Family safety guide: short, non-judgemental cards for agreeing on money
 * rules before a scam arrives, plus the related literacy lessons.
 */
export default function FamilyGuide() {
  const lessons = useStore((state) => state.lessons);

  const guideLessonCategories = ['family-emergency', 'scam-patterns', 'rights-recourse'] as const;
  const picked = guideLessonCategories
    .flatMap((category) => lessons.filter((lesson) => lesson.category === category))
    .filter((lesson, index, all) => all.findIndex((item) => item.id === lesson.id) === index)
    .slice(0, 3);
  const guideLessons =
    picked.length > 0 ? picked : lessons.filter((lesson, index, all) => all.indexOf(lesson) === index).slice(0, 3);

  return (
    <Screen>
      <ScreenHeader
        title="Family safety guide"
        subtitle="Agree the rules before a scam arrives"
        backFallback="/(tabs)/family"
      />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="gap-3">
            <IconTile icon={HeartHandshake} color={colors.brandMint} size="lg" />
            <Text variant="heading">Start from respect, not blame</Text>
            <Text variant="caption">
              These scams are written to catch anyone, including people who are careful. Families
              that talk about it openly lose far less money than families where it feels shameful to
              ask.
            </Text>
          </Card>
        </View>

        <View>
          <SectionLabel label="Three rules worth agreeing on" />
          <View className="gap-3 px-5">
            {HOUSE_RULES.map((rule) => (
              <Card key={rule.title} className="flex-row items-start gap-3">
                <IconTile icon={rule.icon} color={colors.brandBlue} />
                <View className="flex-1 gap-1">
                  <Text variant="label">{rule.title}</Text>
                  <Text variant="caption">{rule.body}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        <View>
          <SectionLabel label="Short lessons" />
          <View className="gap-3 px-5">
            {guideLessons.map((lesson) => (
              <NavRow
                key={lesson.id}
                icon={BookOpenCheck}
                title={lesson.title}
                description={`${lesson.durationLabel} · ${lesson.intro}`}
                iconColor={colors.brandMint}
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
              />
            ))}
          </View>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
