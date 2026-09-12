/**
 * Safety Score (backend brief Section 9 / 2.15).
 *
 * `safetyScoreEvents.record` appends a delta after a simulator round, a
 * verified check or a submitted report; `getUserScore` aggregates those events
 * into a displayed score and a daily-streak metric.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

import { requireUser } from './lib/auth';

const DAY_MS = 24 * 60 * 60 * 1000;

export const record = mutation({
  args: {
    sessionToken: v.string(),
    source: v.union(v.literal('simulatorRound'), v.literal('verifiedCheck'), v.literal('reportSubmitted')),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const id = await ctx.db.insert('safetyScoreEvents', {
      userId,
      source: args.source,
      delta: args.delta,
      createdAt: Date.now(),
    });
    return { _id: id };
  },
});

export const getUserScore = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const now = Date.now();
    const thirtyDays = now - 30 * DAY_MS;

    const events = await ctx.db
      .query('safetyScoreEvents')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const recent = events.filter((e) => e.createdAt >= thirtyDays);
    const score = Math.max(0, Math.round(recent.reduce((sum, e) => sum + e.delta, 0)));

    // Daily streak: number of consecutive days (ending today) with activity.
    const activeDays = new Set(
      events.map((e) => Math.floor(e.createdAt / DAY_MS)),
    );
    let streak = 0;
    for (let d = Math.floor(now / DAY_MS); ; d--) {
      if (activeDays.has(d)) streak++;
      else break;
    }

    return {
      score,
      streak,
      activityCount: events.length,
      lastActivityAt: events.length > 0 ? Math.max(...events.map((e) => e.createdAt)) : undefined,
    };
  },
});
