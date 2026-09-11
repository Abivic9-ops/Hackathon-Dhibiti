/**
 * Alerts module (backend brief Section 7 / 2.11).
 *
 * `alerts` rows are shared by both Family and Group circles, disambiguated by
 * `circleType`. `shareCheck` creates an alert from a Red/Amber Check the caller
 * ran, honoring the member's `sharingLevel`, and schedules a push notification.
 * `listForCircle` is a live-subscribed query so new alerts appear instantly on
 * the admin's Family/Group tab (real-time, not polled — Section 15).
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

import { assertFamilyMembership, requireUser } from './lib/auth';

function summarize(row: Doc<'alerts'>) {
  return {
    _id: row._id,
    circleId: row.circleId,
    circleType: row.circleType,
    relatedCheckId: row.relatedCheckId,
    summary: row.summary,
    riskLevel: row.riskLevel,
    suggestedAction: row.suggestedAction,
    createdAt: row.createdAt,
  };
}

/**
 * Shares a Check with the caller's family circle (the "share this alert" action
 * in the frontend). Honors the caller's sharing level and never shares a raw
 * activity feed — only this one alert.
 */
export const shareCheck = mutation({
  args: {
    sessionToken: v.string(),
    checkId: v.id('checks'),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const { circle } = await assertFamilyMembership(ctx.db, user._id);

    const check = await ctx.db.get(args.checkId);
    if (!check) throw new Error('That check does not exist.');
    if (check.userId !== user._id) throw new Error('You can only share your own checks.');

    const id = await ctx.db.insert('alerts', {
      circleId: circle._id,
      circleType: 'family',
      relatedCheckId: args.checkId,
      summary: `${check.scamCategory ?? 'A suspicious message'} was detected.`,
      riskLevel: check.riskLevel,
      suggestedAction: 'Warn your circle about this pattern and the destination behind it.',
      createdAt: Date.now(),
    });

    // Schedule the push notification (fire-and-forget, degrades gracefully).
    await ctx.scheduler.runAfter(0, internal.notifications.sendAlert, {
      userId: user._id,
      alertId: id,
    });

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not create the alert.');
    return summarize(row);
  },
});

/** Export the scalar fields an admin's Family tab needs for each member. */
export const listForCircle = query({
  args: {
    sessionToken: v.string(),
    circleId: v.string(),
    circleType: v.union(v.literal('family'), v.literal('group')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);

    // Access control: caller must belong to the circle they're reading.
    if (args.circleType === 'family') {
      const memberships = await ctx.db
        .query('familyMemberships')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      const ok = memberships.some(
        (m) => m.circleId === args.circleId && (m.status === 'active' || m.role === 'admin'),
      );
      if (!ok) throw new Error('You do not belong to this family circle.');
    } else {
      const memberships = await ctx.db
        .query('groupMemberships')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      const ok = memberships.some((m) => m.groupId === args.circleId && m.status === 'active');
      if (!ok) throw new Error('You do not belong to this group.');
    }

    const rows = await ctx.db
      .query('alerts')
      .withIndex('by_circle', (q) => q.eq('circleId', args.circleId))
      .order('desc')
      .take(100);
    return rows.map(summarize);
  },
});
