/**
 * Saved recipients (backend brief Section 5 / 8).
 *
 * `savedRecipients.list/save/reverify` back the "Saved recipients" screen and
 * feed verification confidence used by `payments.checkBeforeSend`. Every
 * recipient is owned by the authenticated user; a recipient the user has paid
 * several times counts as lower-risk for future checks.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { identifierType } from './schema';

import { requireUser } from './lib/auth';
import { canonicalizeIdentifier } from './reportedEntities';

function summarize(row: Doc<'savedRecipients'>) {
  return {
    _id: row._id,
    label: row.label,
    identifier: row.identifier,
    identifierType: row.identifierType,
    riskLevel: row.riskLevel,
    timesPaid: row.timesPaid,
    lastPaidAt: row.lastPaidAt,
    reverifiedAt: row.reverifiedAt,
  };
}

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const rows = await ctx.db
      .query('savedRecipients')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.map(summarize);
  },
});

export const save = mutation({
  args: {
    sessionToken: v.string(),
    label: v.string(),
    identifier: v.string(),
    identifierType,
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const canonical = canonicalizeIdentifier(args.identifier, args.identifierType);
    if (!canonical) throw new Error('That identifier is not valid for its type.');

    const label = args.label.trim() || canonical;
    const existing = await ctx.db
      .query('savedRecipients')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const match = existing.find((row) => row.identifier === canonical);

    if (match) {
      // Idempotent save: update the label if changed.
      if (match.label !== label) {
        await ctx.db.patch(match._id, { label });
      }
      return summarize({ ...match, label });
    }

    const id = await ctx.db.insert('savedRecipients', {
      userId,
      label,
      identifier: canonical,
      identifierType: args.identifierType,
      timesPaid: 0,
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not save the recipient.');
    return summarize(row);
  },
});

/** Marks a recipient as re-verified (updates reverifiedAt + timestamp). */
export const reverify = mutation({
  args: { sessionToken: v.string(), recipientId: v.id('savedRecipients') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.recipientId);
    if (!row || row.userId !== userId) throw new Error('Recipient not found.');
    await ctx.db.patch(args.recipientId, { reverifiedAt: Date.now() });
    return summarize({ ...row, reverifiedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), recipientId: v.id('savedRecipients') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.recipientId);
    if (!row || row.userId !== userId) throw new Error('Recipient not found.');
    await ctx.db.delete(args.recipientId);
    return { removed: true };
  },
});
