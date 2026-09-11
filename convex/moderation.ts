/**
 * Moderation surface (backend brief Section 11 / moderation queue).
 *
 * Moderators poll the queue (`listQueue`), claim an item (`assignToSelf`) so
 * two moderators don't work it, and close it (`resolve`) updating the
 * underlying record (reported entity, directory issue, or user report).
 * `overrideEntityRisk` lets a moderator force a risk level on a community
 * entity — a human override that overrules the reporter-driven escalation.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

import { assertModerator, requireUser } from './lib/auth';

export const listQueue = query({
  args: { sessionToken: v.string(), status: v.optional(v.union(v.literal('open'), v.literal('inReview'))) },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertModerator(user);
    const rows = await ctx.db
      .query('moderationQueue')
      .withIndex('by_status', (q) => q.eq('status', args.status ?? 'open'))
      .order('asc')
      .take(200);
    return rows.map((row) => ({
      _id: row._id,
      itemType: row.itemType,
      itemId: row.itemId,
      priority: row.priority,
      status: row.status,
      assignedModeratorId: row.assignedModeratorId,
      createdAt: row.createdAt,
    }));
  },
});

export const assignToSelf = mutation({
  args: { sessionToken: v.string(), queueItemId: v.id('moderationQueue') },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertModerator(user);
    const item = await ctx.db.get(args.queueItemId);
    if (!item) throw new Error('Queue item not found.');
    if (item.status === 'resolved') throw new Error('This item is already resolved.');
    if (item.assignedModeratorId && item.assignedModeratorId !== user._id) {
      throw new Error('Another moderator is already working this item.');
    }
    await ctx.db.patch(item._id, {
      status: 'inReview',
      assignedModeratorId: user._id,
    });
    return { _id: item._id, status: 'inReview' };
  },
});

export const resolve = mutation({
  args: {
    sessionToken: v.string(),
    queueItemId: v.id('moderationQueue'),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertModerator(user);
    const item = await ctx.db.get(args.queueItemId);
    if (!item) throw new Error('Queue item not found.');
    if (item.status === 'resolved') return { _id: item._id, status: 'resolved' };

    // Update the underlying record to reflect moderation closure.
    if (item.itemType === 'reportedEntity') {
      await ctx.db.patch(item.itemId as never, { reviewStatus: 'moderatorConfirmed' }).catch(() => undefined);
    } else if (item.itemType === 'directoryIssue') {
      await ctx.db.patch(item.itemId as never, { status: 'resolved' }).catch(() => undefined);
    } else if (item.itemType === 'userReport') {
      await ctx.db.patch(item.itemId as never, { status: 'resolved' }).catch(() => undefined);
    }

    await ctx.db.patch(item._id, {
      status: 'resolved',
      assignedModeratorId: user._id,
    });
    return { _id: item._id, status: 'resolved' };
  },
});

/** Human override that forces a risk level on a community entity. */
export const overrideEntityRisk = mutation({
  args: {
    sessionToken: v.string(),
    entityId: v.id('reportedEntities'),
    riskLevel: v.union(v.literal('red'), v.literal('amber'), v.literal('green'), v.literal('blue'), v.literal('grey')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertModerator(user);
    const entity = await ctx.db.get(args.entityId);
    if (!entity) throw new Error('Entity not found.');
    await ctx.db.patch(entity._id, { riskLevel: args.riskLevel, reviewStatus: 'moderatorConfirmed' });
    return { _id: entity._id, riskLevel: args.riskLevel };
  },
});
