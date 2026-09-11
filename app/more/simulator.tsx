import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { ArrowRight, RotateCcw, Share2, ShieldCheck, Target } from 'lucide-react-native';
import { Share, View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OptionRow } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { CountUp, PopIn, Stagger, SuccessBurst } from '@/components/ui/Motion';
import { ProgressBar } from '@/components/ui/Progress';
import { RiskPill } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SCAM_CATEGORY_ICON } from '@/components/ui/icons';
import { SCAM_CATEGORY_LABEL } from '@/lib/detection';
import { useStore } from '@/lib/store';
import { RISK, colors } from '@/lib/theme';
import type { RiskLevel, ScamExample } from '@/lib/types';

type Answer = 'scam' | 'verify' | 'not-scam';

const ROUND_SIZE = 5;

const ANSWERS: { value: Answer; title: string; description: string }[] = [
  {
    value: 'scam',
    title: 'This is a scam',
    description: 'Do not answer, reply, click or pay.',
  },
  {
    value: 'verify',
    title: 'Needs verifying first',
    description: 'Could be real, but only after checking on a number you already trust.',
  },
  {
    value: 'not-scam',
    title: 'No known risk',
    description: 'Nothing in it matches a known scam pattern.',
  },
];

function expectedAnswer(level: RiskLevel): Answer {
  if (level === 'red') return 'scam';
  if (level === 'amber' || level === 'grey') return 'verify';
  return 'not-scam';
}

function buildRound(examples: ScamExample[]): ScamExample[] {
  return examples
    .map((example) => ({ example, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, ROUND_SIZE)
    .map((entry) => entry.example);
}

/** Scam Simulator: active practice built from the same corpus the rules engine uses. */
export default function ScamSimulator() {
  const examples = useStore((state) => state.examples);
  const addSafetyEvent = useStore((state) => state.addSafetyEvent);

  const [round, setRound] = useState(() => buildRound(examples));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | undefined>();
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const startRound = useCallback(() => {
    setRound(buildRound(examples));
    setIndex(0);
    setAnswer(undefined);
    setCorrectCount(0);
    setFinished(false);
  }, [examples]);

  if (round.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="Spot the Scam" backFallback="/more/literacy" />
        <EmptyState
          icon={Target}
          title="No practice messages yet"
          body="Practice rounds are built from real, redacted examples. As soon as the library has some, they appear here."
          actionLabel="Back to the library"
          onAction={() => router.replace('/more/literacy')}
        />
      </Screen>
    );
  }

  const current = round[index];
  const expected = expectedAnswer(current.riskLevel);
  const revealed = answer !== undefined;
  const gotItRight = answer === expected;

  const submit = (value: Answer) => {
    if (revealed) return;
    setAnswer(value);
    if (value === expected) setCorrectCount((count) => count + 1);
  };

  const advance = () => {
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setAnswer(undefined);
      return;
    }
    const finalScore = correctCount;
    addSafetyEvent('simulator-round', 2 + finalScore * 2);
    setFinished(true);
  };

  if (finished) {
    const share = () => {
      void Share.share({
        message: `I scored ${correctCount}/${round.length} spotting scams on Dhibiti. It checks numbers, links, and messages before you act.`,
      });
    };

    return (
      <Screen>
        <ScreenHeader title="Round complete" backFallback="/more/literacy" />
        <ScreenScroll contentClassName="px-5 gap-4">
          <Stagger step={90} initialDelay={60}>
            <Card className="items-center gap-4">
              <SuccessBurst icon={ShieldCheck} size={84} />
              <View className="flex-row items-end">
                <CountUp value={correctCount} variant="display" />
                <Text variant="display">/{round.length}</Text>
              </View>
              <ProgressBar progress={correctCount / round.length} className="w-full" />
              <Text variant="body" className="text-center">
                {correctCount === round.length
                  ? 'Every one correct. You already read these patterns quickly — that is exactly the reflex that keeps money safe.'
                  : correctCount >= Math.ceil(round.length / 2)
                    ? 'Solid round. The ones you missed are the patterns worth reading about — nobody spots all of them at first.'
                    : 'These messages are built to fool anyone, and getting them wrong here costs nothing. Now you know the patterns to watch for.'}
              </Text>
              <Text variant="caption" className="text-center">
                Your safety score went up. It stays private to you — no leaderboard, no other names.
              </Text>
            </Card>

            <Card className="gap-3">
              <Text variant="label">Keep going</Text>
              <Text variant="caption">
                Practice is one habit. Checking before you act is the other — and that is the one
                that actually stops a payment.
              </Text>
              <GhostButton
                label="Read a lesson on these patterns"
                onPress={() => router.replace('/more/literacy')}
              />
            </Card>

            <PrimaryButton label="Try another round" icon={RotateCcw} onPress={startRound} />

            <GhostButton label="Share your score" icon={Share2} onPress={share} />
          </Stagger>
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Spot the Scam"
        subtitle={`Message ${index + 1} of ${round.length}`}
        backFallback="/more/literacy"
      />

      <ScreenScroll contentClassName="px-5 gap-4">
        <ProgressBar progress={(index + (revealed ? 1 : 0)) / round.length} />

        <Card className="gap-3">
          <View className="flex-row items-center gap-2.5">
            <IconTile
              icon={SCAM_CATEGORY_ICON[current.scamType]}
              color={colors.brandBlue}
              size="sm"
            />
            <Text variant="section">Message received</Text>
          </View>
          <Text variant="body">{current.text_sw}</Text>
          {current.text_en !== current.text_sw ? (
            <View className="bg-ink/40 rounded-2xl px-3.5 py-3">
              <Text variant="caption">{current.text_en}</Text>
            </View>
          ) : null}
        </Card>

        <View className="gap-2">
          <Text variant="section">What would you do?</Text>
          {ANSWERS.map((option) => (
            <OptionRow
              key={option.value}
              title={option.title}
              description={option.description}
              selected={answer === option.value}
              onPress={() => submit(option.value)}
            />
          ))}
        </View>

        {revealed ? (
          <PopIn key={current.id} from={0.94}>
            <Card className="gap-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text
                  variant="heading"
                  className={gotItRight ? 'text-risk-green' : 'text-risk-amber'}
                >
                  {gotItRight ? 'You called it right' : 'Worth a second look'}
                </Text>
                <RiskPill level={current.riskLevel} />
              </View>
              <Text variant="body">
                {gotItRight
                  ? `Correct — this is ${SCAM_CATEGORY_LABEL[current.scamType].toLowerCase()}.`
                  : `The safer call here is "${ANSWERS.find((option) => option.value === expected)?.title}". This one is ${SCAM_CATEGORY_LABEL[current.scamType].toLowerCase()}.`}
              </Text>
              <Text variant="caption">{current.notes}</Text>
              <View className="bg-ink/40 rounded-2xl px-3.5 py-3">
                <Text variant="section" className="pb-1">
                  What to do with a message like this
                </Text>
                <Text variant="body">{RISK[current.riskLevel].action}</Text>
              </View>
              <PrimaryButton
                label={index + 1 < round.length ? 'Next message' : 'See your round'}
                icon={ArrowRight}
                onPress={advance}
              />
            </Card>
          </PopIn>
        ) : (
          <Text variant="meta">
            Nothing here is sent anywhere. These are real messages with the personal details
            removed.
          </Text>
        )}
      </ScreenScroll>
    </Screen>
  );
}
