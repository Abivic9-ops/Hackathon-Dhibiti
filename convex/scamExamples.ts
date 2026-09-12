/**
 * Scam Simulator (backend brief Section 9 / 2.12).
 *
 * `scamExamples.getSimulatorRound(count)` returns a randomized, balanced set of
 * scam examples for the simulator — spanning red/amber scam messages, green
 * benign ones, and needs-verification grey cases — so a round is never
 * overwhelmingly one kind.
 */

import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function summarize(row: Doc<'scamExamples'>) {
  return {
    _id: row._id,
    textSw: row.textSw,
    textEn: row.textEn,
    scamType: row.scamType,
    riskLevel: row.riskLevel,
    patterns: row.patterns,
    notes: row.notes,
  };
}

export const getSimulatorRound = query({
  args: { sessionToken: v.string(), count: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const count = Math.min(Math.max(args.count ?? 5, 1), 15);
    const all = await ctx.db.query('scamExamples').collect();

    const scams = all.filter((e) => e.riskLevel === 'red' || e.riskLevel === 'amber');
    const safe = all.filter((e) => e.riskLevel === 'green');

    const round: Doc<'scamExamples'>[] = [];
    const nScam = Math.max(1, Math.round(count * 0.6));

    for (const source of shuffle(scams)) {
      if (round.length >= nScam) break;
      round.push(source);
    }
    for (const source of shuffle(safe)) {
      if (round.length >= count) break;
      round.push(source);
    }

    return { round: shuffle(round).slice(0, count).map(summarize) };
  },
});
