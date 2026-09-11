/**
 * Notifications module (backend brief Section 10).
 *
 * `pushTokens.register` stores a device token on login; `sendAlert` and
 * `sendRadarDigest` deliver pushes to a user's registered devices. All send
 * paths are fire and forget and degrade gracefully — a failed push never
 * blocks the caller (the push provider is mocked in this build).
 *
 * Scheduled from `alerts.shareCheck` / `groupCircles.broadcastAlert` via
 * `ctx.scheduler.runAfter(0, internal.notifications.sendAlert, ...)`.
 */

import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';
import { sendPush } from './providers/push';

export const register = mutation({
  args: {
    sessionToken: v.string(),
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    if (!args.token || args.token.length === 0) throw new Error('Token is required.');

    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const dup = existing.find((row) => row.token === args.token);
    if (dup) return { _id: dup._id, registered: false };

    const id = await ctx.db.insert('pushTokens', {
      userId,
      token: args.token,
      platform: args.platform,
    });
    return { _id: id, registered: true };
  },
});

export const unregister = mutation({
  args: { sessionToken: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const match = existing.find((row) => row.token === args.token);
    if (match) await ctx.db.delete(match._id);
    return { removed: Boolean(match) };
  },
});

/** Sends user-wide push to every registered device for a user. */
async function notifyUser(
  ctx: { db: MutationCtx['db'] },
  userId: Doc<'users'>['_id'],
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const tokens = await ctx.db
    .query('pushTokens')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const results = [];
  for (const t of tokens) {
    try {
      results.push(await sendPush(t.token, t.platform, { title, body, data }));
    } catch (error) {
      console.error('[notify] push failed, continuing:', error);
    }
  }
  return results;
}

/** Internal mutation triggered when an alert is created/written (Section 10 triggers). */
export const sendAlert = internalMutation({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return { sentTo: 0 };
    const title = alert.circleType === 'family' ? 'Family alert' : 'Group alert';
    const body = `${alert.summary}. ${alert.suggestedAction}`;
    await notifyUser(ctx, args.userId, title, body, { alertId: alert._id });
    return { sentTo: 1 };
  },
});

/** Optional daily/weekly digest of relevant Scam Radar events for a location. */
export const sendRadarDigest = mutation({
  args: {
    userId: v.id('users'),
    roughLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const events = args.roughLocation
      ? await ctx.db
          .query('scamRadarEvents')
          .withIndex('by_location', (q) => q.eq('roughLocation', args.roughLocation!))
          .order('desc')
          .take(5)
      : await ctx.db.query('scamRadarEvents').order('desc').take(5);

    if (events.length === 0) return { sentTo: 0 };
    const top = events[0];
    const body = `${top.sampleAnonymizedSummary} (${top.reportCountLast24h} reports in the last 24h).`;
    await notifyUser(ctx, args.userId, 'Scam Radar update', body);
    return { sentTo: events.length };
  },
});

/**
 * Section 12.4 cron: daily moderator digest. Collects open moderation items
 * from the last 24h and pushes a summary to every moderator user.
 */
export const sendModerationDigest = internalMutation({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, _args) => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const open = await ctx.db
      .query('moderationQueue')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .collect();
    const recent = open.filter((item) => item.createdAt >= since);

    const users = await ctx.db.query('users').collect();
    const moderators = users.filter((u) => u.roles.includes('moderator'));

    const body = `${recent.length} moderation item(s) are waiting (${open.length} open total).`;
    let notified = 0;
    for (const mod of moderators) {
      const results = await notifyUser(ctx, mod._id, 'Daily moderation digest', body);
      notified += results.length;
    }
    return { notified, queued: recent.length };
  },
});
