/**
 * Safe Pay flow + Send-Delay Lock (backend brief Section 8 / 2.14).
 *
 * A high-risk payment (Red/Amber) starts a countdown lock before the user can
 * complete it. `start` computes the lock duration from the risk level;
 * `getStatus` is a live-subscribing query so the frontend countdown and disabled
 * button update without polling; `release` is called either by the
 * `releaseExpiredPaymentLocks` cron once the window elapses, or by a family
 * admin override for a protected member (which is logged — never silent).
 */

import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';

export const RED_LOCK_SECONDS = 15 * 60; // 15 minutes for Red
export const AMBER_LOCK_SECONDS = 5 * 60; // shorter for Amber

function summarize(row: Doc<'paymentLocks'>) {
  const now = Date.now();
  const remaining = row.status === 'locked' ? row.startedAt + row.lockDurationSeconds * 1000 - now : 0;
  return {
    _id: row._id,
    checkId: row.checkId,
    riskLevel: row.riskLevel,
    lockDurationSeconds: row.lockDurationSeconds,
    startedAt: row.startedAt,
    status: row.status,
    releasedAt: row.releasedAt,
    remainingMs: Math.max(0, remaining),
    countsDown: row.status === 'locked',
  };
}

export const start = mutation({
  args: {
    sessionToken: v.string(),
    checkId: v.optional(v.id('checks')),
    riskLevel: v.union(v.literal('red'), v.literal('amber')),
    lockDurationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const now = Date.now();

    // Resolve any active lock for this user up front (idempotent start).
    const active = await ctx.db
      .query('paymentLocks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'locked'))
      .first();
    if (active) return summarize(active);

    const lockDurationSeconds =
      args.lockDurationSeconds ??
      (args.riskLevel === 'red' ? RED_LOCK_SECONDS : AMBER_LOCK_SECONDS);

    const id = await ctx.db.insert('paymentLocks', {
      userId,
      checkId: args.checkId,
      riskLevel: args.riskLevel,
      lockDurationSeconds,
      startedAt: now,
      status: 'locked',
    });

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not start the lock.');
    return summarize(row);
  },
});

export const getStatus = query({
  args: { sessionToken: v.string(), lockId: v.id('paymentLocks') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.lockId);
    if (!row) throw new Error('That lock does not exist.');
    if (row.userId !== userId) throw new Error('You do not have access to this lock.');
    return summarize(row);
  },
});

/** Releases a lock, optionally recording an admin override (Section 8 consent-first rule). */
export const release = mutation({
  args: {
    sessionToken: v.string(),
    lockId: v.id('paymentLocks'),
    override: v.optional(v.boolean()),
    overrideNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.lockId);
    if (!row) throw new Error('That lock does not exist.');

    const isOwner = row.userId === user._id;
    const isFamilyAdmin = user.roles.includes('familyAdmin');
    const isModerator = user.roles.includes('moderator');

    // Owners release their own lock; admins may override a protected member's.
    if (!isOwner && !(args.override && (isFamilyAdmin || isModerator))) {
      throw new Error('You do not have permission to release this lock.');
    }

    const status: Doc<'paymentLocks'>['status'] =
      args.override && !isOwner ? 'overriddenByAdmin' : 'released';

    // A family admin overriding a protected member's lock must be logged.
    const patch: Partial<Doc<'paymentLocks'>> = {
      status,
      releasedAt: Date.now(),
    };
    if (status === 'overriddenByAdmin') {
      patch.overriddenByUserId = user._id;
      patch.overrideNote = args.overrideNote?.trim() || 'Admin override (no note)';
    }

    await ctx.db.patch(args.lockId, patch);
    return summarize({ ...row, ...patch });
  },
});

/**
 * Section 12.2 cron: release every lock whose window has elapsed, every minute.
 * Registered in crons.ts.
 */
export const releaseExpiredPaymentLocks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const locked = await ctx.db
      .query('paymentLocks')
      .filter((q) => q.eq(q.field('status'), 'locked'))
      .collect();

    let released = 0;
    for (const row of locked) {
      if (row.startedAt + row.lockDurationSeconds * 1000 <= now) {
        await ctx.db.patch(row._id, { status: 'released', releasedAt: now });
        released++;
      }
    }
    return { released };
  },
});
