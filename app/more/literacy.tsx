import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { BookOpen, Check, Search, Target } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, PressableCard } from '@/components/ui/Card';
import { ChipSelector, type ChipOption, TextField } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Feedback';
import { GradientIconTile, IconTile } from '@/components/ui/IconTile';
import { CountUp, Floaty, Reveal } from '@/components/ui/Motion';
import { PrimaryButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { LESSON_CATEGORY_ICON, LESSON_CATEGORY_LABEL } from '@/components/ui/icons';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { LessonCategory } from '@/lib/types';

type Filter = 'all' | LessonCategory;

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  {
    value: 'scam-patterns',
    label: LESSON_CATEGORY_LABEL['scam-patterns'],
    icon: LESSON_CATEGORY_ICON['scam-patterns'],
  },
  {
    value: 'mobile-money',
    label: LESSON_CATEGORY_LABEL['mobile-money'],
    icon: LESSON_CATEGORY_ICON['mobile-money'],
  },
  {
    value: 'banks-merchants',
    label: LESSON_CATEGORY_LABEL['banks-merchants'],
    icon: LESSON_CATEGORY_ICON['banks-merchants'],
  },
  {
    value: 'rights-recourse',
    label: LESSON_CATEGORY_LABEL['rights-recourse'],
    icon: LESSON_CATEGORY_ICON['rights-recourse'],
  },
];

/** Literacy library: searchable lessons plus the Scam Simulator entry point. */
export default function LiteracyLibrary() {
  const lessons = useStore((state) => state.lessons);
  const readLessonIds = useStore((state) => state.readLessonIds);
  const safetyEvents = useStore((state) => state.safetyEvents);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const score = safetyEvents.reduce((total, event) => total + event.delta, 0);
  const readCount = lessons.filter((lesson) => readLessonIds.includes(lesson.id)).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesFilter = filter === 'all' || lesson.category === filter;
      if (!matchesFilter) return false;
      if (needle.length === 0) return true;
      return (
        lesson.title.toLowerCase().includes(needle) ||
        lesson.intro.toLowerCase().includes(needle) ||
        lesson.bullets.some((bullet) => bullet.toLowerCase().includes(needle))
      );
    });
  }, [filter, lessons, query]);

  return (
    <Screen>
      <ScreenHeader title="Literacy library" backFallback="/more" />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Reveal>
            <Card className="gap-3">
              <Floaty distance={4} duration={3400}>
                <GradientIconTile icon={Target} size="lg" />
              </Floaty>
              <View className="gap-1">
                <Text variant="heading">Practice: Spot the Scam</Text>
                <Text variant="caption">
                  Five real, redacted messages. Call each one before we show the answer —
                  recognising a pattern is a habit, and habits come from practice.
                </Text>
              </View>
              <View className="bg-ink/40 gap-2 rounded-2xl px-3.5 py-3">
                <View className="flex-row items-center justify-between">
                  <Text variant="section">Your safety score</Text>
                  <CountUp value={score} variant="label" />
                </View>
                <ProgressBar progress={Math.min(score, 100) / 100} />
                <Text variant="meta">
                  Private to you. It rises when you check before acting, report a scam, or finish a
                  practice round.
                </Text>
              </View>
              <PrimaryButton
                label="Start a round"
                icon={Target}
                onPress={() => router.push('/more/simulator')}
              />
            </Card>
          </Reveal>
        </View>

        <View>
          <SectionLabel
            label="Lessons"
            right={
              <Text variant="meta">
                {readCount} of {lessons.length} read
              </Text>
            }
          />
          <View className="gap-3 px-5">
            <TextField
              label="Search lessons"
              value={query}
              onChangeText={setQuery}
              placeholder="Reversal, Paybill, prize, SIM swap…"
              autoCapitalize="none"
            />
            <ChipSelector options={FILTERS} value={filter} onChange={setFilter} />
          </View>
        </View>

        {visible.length > 0 ? (
          <View className="gap-3 px-5">
            {visible.map((lesson) => {
              const read = readLessonIds.includes(lesson.id);
              return (
                <PressableCard
                  key={lesson.id}
                  className="flex-row items-center gap-3"
                  onPress={() =>
                    router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })
                  }
                >
                  <IconTile
                    icon={LESSON_CATEGORY_ICON[lesson.category]}
                    color={read ? colors.brandTeal : colors.brandBlue}
                  />
                  <View className="flex-1 gap-1">
                    <Text variant="label" numberOfLines={2}>
                      {lesson.title}
                    </Text>
                    <Text variant="meta">
                      {LESSON_CATEGORY_LABEL[lesson.category]} · {lesson.durationLabel}
                    </Text>
                  </View>
                  {read ? (
                    <View className="bg-brand-teal-soft h-7 w-7 items-center justify-center rounded-full">
                      <Check color={colors.brandMint} size={15} strokeWidth={2.4} />
                    </View>
                  ) : null}
                </PressableCard>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon={query.trim().length > 0 ? Search : BookOpen}
            title="No lessons match that"
            body="Try a different word, or clear the filters to see everything in the library."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery('');
              setFilter('all');
            }}
          />
        )}

        <View className="px-5">
          <Text variant="meta">
            Longer reads live here on purpose. When something high risk happens, Dhibiti shows you a
            60-second explainer instead — never a ten-minute article in the middle of a decision.
          </Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
