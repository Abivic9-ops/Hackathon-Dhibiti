/**
 * Android SMS quarantine inbox (backend brief Section 4 / 2.17).
 *
 * `quarantine.list` shows the user's quarantined messages; `restore` returns one
 * to the inbox; `reportFalsePositive` flags the quarantine as a mistake; and
 * `confirmScam` feeds the community `reportedEntities` registry exactly like a
 * manual report (Section 4), so a confirmed quarantine contributes to the shared
 * risk signal.
 *
 * `pruneOldQuarantineEntries` (Section 12.5) auto-restores — never silently
 * deletes — entries older than a window that the user never actioned.
 */

import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';
import { registerReport } from './reportedEntities';
import { canonicalizePhone } from './lib/canonicalize';

const PRUNE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function summarize(row: Doc<'quarantinedMessages'>) {
  return {
    _id: row._id,
    senderId: row.senderId,
    messageSummary: row.messageSummary,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt,
  };
}

function redactSummary(text: string): string {
  return text
    .replace(/\b\d{4,6}\b/g, '[code]')
    .replace(/\b(PIN|OTP|password)\b/gi, '[credential]')
    .slice(0, 160);
}

/** Registers a user's device-quarantined SMS (client-side detection uploads these). */
export const add = mutation({
  args: {
    sessionToken: v.string(),
    senderId: v.string(),
    messageSummary: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const senderId = args.senderId.slice(0, 80);
    const messageSummary = redactSummary(args.messageSummary);
    const reason = args.reason.slice(0, 200);
    if (messageSummary.length === 0) throw new Error('No message content to quarantine.');

    const id = await ctx.db.insert('quarantinedMessages', {
      userId,
      senderId,
      messageSummary,
      reason,
      status: 'quarantined',
      createdAt: Date.now(),
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not quarantine the message.');
    return summarize(row);
  },
});

export const list = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const rows = await ctx.db
      .query('quarantinedMessages')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
    return rows.map(summarize);
  },
});

export const restore = mutation({
  args: { sessionToken: v.string(), messageId: v.id('quarantinedMessages') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.messageId);
    if (!row || row.userId !== userId) throw new Error('Message not found.');
    await ctx.db.patch(row._id, { status: 'restored' });
    return summarize({ ...row, status: 'restored' });
  },
});

export const reportFalsePositive = mutation({
  args: { sessionToken: v.string(), messageId: v.id('quarantinedMessages') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.messageId);
    if (!row || row.userId !== userId) throw new Error('Message not found.');
    await ctx.db.patch(row._id, { status: 'reportedFalsePositive' });
    return summarize({ ...row, status: 'reportedFalsePositive' });
  },
});

/**
 * Confirming a quarantined message as a scam feeds the community registry like
 * a manual report (Section 4). The sender id is treated as a phone identifier
 * when it looks like one.
 */
export const confirmScam = mutation({
  args: { sessionToken: v.string(), messageId: v.id('quarantinedMessages') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.messageId);
    if (!row || row.userId !== userId) throw new Error('Message not found.');
    if (row.status === 'confirmedScam') return summarize(row);

    const sender = row.senderId;
    const looksLikePhone = /^\+?\d{9,14}$/.test(sender.replace(/\s/g, ''));
    if (looksLikePhone) {
      const canonical = canonicalizePhone(sender);
      await registerReport(ctx.db, userId, canonical, 'phone', 'generic_scam');
    }

    await ctx.db.patch(row._id, { status: 'confirmedScam' });
    return summarize({ ...row, status: 'confirmedScam' });
  },
});

/**
 * Section 12.5 cron: auto-restore quarantined entries older than the window
 * that were never actioned. Restores rather than deletes — never silent.
 */
export const pruneOldQuarantineEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const threshold = Date.now() - PRUNE_WINDOW_MS;
    const stale = await ctx.db
      .query('quarantinedMessages')
      .filter((q) => q.lt(q.field('createdAt'), threshold))
      .filter((q) => q.eq(q.field('status'), 'quarantined'))
      .collect();

    let restored = 0;
    for (const row of stale) {
      await ctx.db.patch(row._id, { status: 'restored' });
      restored++;
    }
    return { restored };
  },
});
