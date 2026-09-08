import { router, useLocalSearchParams } from 'expo-router';
import { BookOpenCheck, CircleCheck, Quote } from 'lucide-react-native';
import { View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { LESSON_CATEGORY_ICON, LESSON_CATEGORY_LABEL } from '@/components/ui/icons';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SocialProofNote } from '@/components/ui/Verdict';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { goBackOrReplace } from '@/lib/navigation';

/** A 60-second lesson, opened at the moment it is relevant. */
export default function LessonScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const lessons = useStore((state) => state.lessons);
  const readLessonIds = useStore((state) => state.readLessonIds);
  const markLessonRead = useStore((state) => state.markLessonRead);

  const lesson = lessons.find((item) => item.id === params.id);

  if (!lesson) {
    return (
      <Screen>
        <ScreenHeader title="Lesson" backFallback="/more/literacy" />
        <EmptyState
          icon={BookOpenCheck}
          title="This lesson is no longer available"
          body="Browse the literacy library for the full set of short explainers."
          actionLabel="Open the library"
          onAction={() => router.replace('/more/literacy')}
        />
      </Screen>
    );
  }

  const isRead = readLessonIds.includes(lesson.id);
  const CategoryIcon = LESSON_CATEGORY_ICON[lesson.category];

  return (
    <Screen>
      <ScreenHeader
        title={LESSON_CATEGORY_LABEL[lesson.category]}
        subtitle={`${lesson.durationLabel} read`}
        backFallback="/more/literacy"
      />
      <ScreenScroll contentClassName="px-5 gap-4">
        <View className="flex-row items-center gap-3">
          <IconTile icon={CategoryIcon} color={colors.brandBlue} size="lg" />
          <Text variant="title" className="flex-1">
            {lesson.title}
          </Text>
        </View>

        <Text variant="body">{lesson.intro}</Text>

        <Card className="gap-3">
          <Text variant="heading">What to remember</Text>
          {lesson.bullets.map((bullet) => (
            <View key={bullet} className="flex-row gap-2.5">
              <View className="bg-brand-teal mt-2 h-1.5 w-1.5 rounded-full" />
              <Text variant="body" className="flex-1">
                {bullet}
              </Text>
            </View>
          ))}
        </Card>

        {lesson.example ? (
          <Card className="gap-2.5">
            <View className="flex-row items-center gap-2.5">
              <Quote color={colors.muted} size={16} strokeWidth={1.9} />
              <Text variant="section">{lesson.example.label}</Text>
            </View>
            <Text variant="body" className="text-foreground/85">
              {lesson.example.text}
            </Text>
            <Text variant="meta">Real example, with personal details removed.</Text>
          </Card>
        ) : null}

        <SocialProofNote>
          This scam is designed to trick anyone. Knowing the pattern is what makes you much harder
          to scam next time.
        </SocialProofNote>
      </ScreenScroll>

      <ActionBar>
        {isRead ? (
          <GhostButton
            label="Close"
            icon={CircleCheck}
            onPress={() => goBackOrReplace('/more/literacy')}
          />
        ) : (
          <PrimaryButton
            label="Mark as read"
            onPress={() => {
              markLessonRead(lesson.id);
              goBackOrReplace('/more/literacy');
            }}
          />
        )}
      </ActionBar>
    </Screen>
  );
}
