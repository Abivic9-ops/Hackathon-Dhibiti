/**
 * Scheduled jobs (backend brief Section 12: "crons / security jobs").
 *
 * Wires the five batch jobs onto intervals. All are idempotent mutations that
 * snapshot their own window so overruns are safe.
 *
 *   - refreshStaleUrlScans        → every hour   (Section 12.1)
 *   - releaseExpiredPaymentLocks  → every minute (Section 12.2)
 *   - generateScamRadarEvents     → nightly      (Section 12.3)
 *   - sendModerationDigest        → daily        (Section 12.4)
 *   - pruneOldQuarantineEntries   → weekly       (Section 12.5)
 */

import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'refresh-stale-url-scans',
  { hours: 1 },
  internal.urlScans.refreshStaleUrlScans,
  {},
);

crons.interval(
  'release-expired-payment-locks',
  { minutes: 1 },
  internal.paymentLocks.releaseExpiredPaymentLocks,
  {},
);

crons.cron(
  'generate-scam-radar-events',
  '0 1 * * *', // 01:00 daily
  internal.scamRadar.generateScamRadarEvents,
  {},
);

crons.cron(
  'send-moderation-digest',
  '0 6 * * *', // 06:00 daily
  internal.notifications.sendModerationDigest,
  {},
);

crons.interval(
  'prune-old-quarantine-entries',
  { hours: 24 * 7 }, // weekly
  internal.quarantine.pruneOldQuarantineEntries,
  {},
);

export default crons;
