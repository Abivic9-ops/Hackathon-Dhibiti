import type { SharingLevel } from '@/lib/types';

/**
 * Family and Group Circle sharing levels, least intrusive first.
 * Copy is consent-first: a circle is about specific high-risk events, never a
 * general activity feed.
 */
export const SHARING_LEVELS: {
  value: SharingLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'alertsOnly',
    label: 'High-risk alerts only',
    description: 'Your admin sees that something high risk was flagged, and nothing else.',
  },
  {
    value: 'withRecipient',
    label: 'Alerts with the destination',
    description: 'Adds the number, Paybill or link involved so they can help you verify it.',
  },
  {
    value: 'withAmount',
    label: 'Alerts with destination and amount',
    description: 'Adds how much was being requested. Useful for large or unusual requests.',
  },
  {
    value: 'full',
    label: 'Alerts with the full check',
    description: 'Shares the message text too. Only choose this if you are comfortable with it.',
  },
];

export const SHARING_LABEL: Record<SharingLevel, string> = {
  alertsOnly: 'High-risk alerts only',
  withRecipient: 'Alerts with the destination',
  withAmount: 'Alerts with destination and amount',
  full: 'Alerts with the full check',
};

export const LOCK_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'No hold' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 3600, label: '1 hour' },
];

export function lockLabel(seconds?: number) {
  if (!seconds) return 'No hold';
  return (
    LOCK_OPTIONS.find((option) => option.value === seconds)?.label ?? `${seconds / 60} minutes`
  );
}
