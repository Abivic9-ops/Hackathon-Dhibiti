import { useEffect, useState } from 'react';
import { CircleCheck, LockKeyhole } from 'lucide-react-native';
import { View } from 'react-native';

import { IconTile } from '@/components/ui/IconTile';
import { PopIn, PulseRings } from '@/components/ui/Motion';
import { ProgressBar } from '@/components/ui/Progress';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { formatDuration } from '@/lib/utils';

export function useCountdown(startedAt: number, durationSeconds: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.min(
    durationSeconds,
    Math.max(0, durationSeconds - Math.floor((now - startedAt) / 1000)),
  );

  return { remaining, elapsed: remaining === 0 };
}

/**
 * Send-Delay Lock timer. Reusable anywhere a timed hold is needed.
 * The copy states plainly that this is a deliberate pause, not a technical limit.
 */
export function CountdownTimer({
  startedAt,
  durationSeconds,
  reason,
  elapsedNote,
  mandatory = false,
}: {
  startedAt: number;
  durationSeconds: number;
  reason: string;
  elapsedNote: string;
  mandatory?: boolean;
}) {
  const { remaining, elapsed } = useCountdown(startedAt, durationSeconds);
  const progress = durationSeconds === 0 ? 1 : (durationSeconds - remaining) / durationSeconds;

  return (
    <View
      className={
        elapsed
          ? 'bg-risk-green-soft/60 gap-3 rounded-[20px] p-4'
          : 'bg-surface border-border/60 gap-3 rounded-[20px] border p-4'
      }
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center">
          {elapsed ? null : (
            <PulseRings size={44} color={colors.riskAmber} count={2} duration={2200} />
          )}
          <PopIn key={elapsed ? 'ready' : 'holding'} from={0.7}>
            <IconTile
              icon={elapsed ? CircleCheck : LockKeyhole}
              color={elapsed ? colors.riskGreen : colors.riskAmber}
            />
          </PopIn>
        </View>
        <View className="flex-1">
          <Text variant="section" className={elapsed ? 'text-risk-green' : 'text-risk-amber'}>
            {elapsed
              ? 'Hold complete'
              : mandatory
                ? 'Hold required by your family admin'
                : 'Hold in progress'}
          </Text>
          <Text variant="numeral" className={elapsed ? 'text-risk-green' : 'text-foreground'}>
            {elapsed ? 'Ready' : formatDuration(remaining)}
          </Text>
        </View>
      </View>
      <ProgressBar progress={progress} color={elapsed ? colors.riskGreen : colors.riskAmber} />
      <Text variant="caption">{elapsed ? elapsedNote : reason}</Text>
    </View>
  );
}
