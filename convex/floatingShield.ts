/**
 * Floating Shield preferences (backend brief Section 6 / 2.16).
 *
 * The floating shield (overlay w/ quick re-check) is largely a client-side
 * Android overlay; the backend persists its user preferences here and supports
 * pausing the overlay for an interval (e.g. while entering a known-high-value
 * payment), after which it auto-resumes.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

import { requireUser } from './lib/auth';

export const getOrCreate = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    let prefs = await ctx.db
      .query('floatingShieldPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!prefs) return undefined;
    return prefs;
  },
});

/**
 * Create/update the shield prefs. An explicit `pausedUntil` defers the shield's
 * resume; a fresh save with `enabled: true` clears any pause.
 */
export const save = mutation({
  args: {
    sessionToken: v.string(),
    enabled: v.boolean(),
    bubblePosition: v.union(v.literal('left'), v.literal('right')),
    detectionMode: v.union(v.literal('clipboard'), v.literal('accessibility')),
    pausedUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const existing = await ctx.db
      .query('floatingShieldPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    const pausedUntil = args.enabled ? undefined : args.pausedUntil;

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        bubblePosition: args.bubblePosition,
        detectionMode: args.detectionMode,
        pausedUntil,
      });
      const row = await ctx.db.get(existing._id);
      return row!;
    }

    const id = await ctx.db.insert('floatingShieldPreferences', {
      userId,
      enabled: args.enabled,
      bubblePosition: args.bubblePosition,
      detectionMode: args.detectionMode,
      pausedUntil,
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not save shield preferences.');
    return row;
  },
});

/** Pause the shield until `untilMs`. */
export const pause = mutation({
  args: { sessionToken: v.string(), untilMs: v.number() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const existing = await ctx.db
      .query('floatingShieldPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!existing) throw new Error('Shield preferences not found.');
    await ctx.db.patch(existing._id, { enabled: false, pausedUntil: args.untilMs });
    const row = await ctx.db.get(existing._id);
    return row!;
  },
});
