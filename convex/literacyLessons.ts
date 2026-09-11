/**
 * Literacy module (backend brief Section 9).
 *
 * `literacyLessons.list/getById` back the literacy screens; `getTriggeredFor`
 * powers the five trigger points in the frontend §9, called right after a Check
 * resolves Red/Amber to surface a context-relevant lesson.
 */

import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';

function summarize(row: Doc<'literacyLessons'>) {
  return {
    _id: row._id,
    title: row.title,
    category: row.category,
    bullets: row.bullets,
    relatedScamCategory: row.relatedScamCategory,
    externalResources: row.externalResources,
  };
}

export const list = query({
  args: { sessionToken: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const rows = await ctx.db.query('literacyLessons').collect();
    const filtered = args.category ? rows.filter((r) => r.category === args.category) : rows;
    return filtered.map(summarize);
  },
});

export const getById = query({
  args: { sessionToken: v.string(), id: v.id('literacyLessons') },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.id);
    return row ? summarize(row) : undefined;
  },
});

/**
 * Returns the lesson most relevant to a scam category, falling back to a
 * general lesson when there's no exact match. Called after a Red/Amber verdict.
 */
export const getTriggeredFor = query({
  args: { sessionToken: v.string(), scamCategory: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const rows = await ctx.db.query('literacyLessons').collect();
    const direct = rows.find((r) => r.relatedScamCategory === args.scamCategory);
    if (direct) return summarize(direct);
    const general = rows.find((r) => r.category === 'general');
    if (general) return summarize(general);
    return rows.length > 0 ? summarize(rows[0]) : undefined;
  },
});
