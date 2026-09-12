/**
 * Scam Radar (backend brief Section 13 / 2.13).
 *
 * `generateScamRadarEvents` is a nightly cron mutation (Section 12.3) that
 * aggregates reports from the last 24h into a single anonymized `scamRadarEvents`
 * row per scam category — no precise coordinates, only a rough locator (here a
 * generic "nationwide" since reports carry no precise placement). `listEvents`
 * powers the Scam Radar feed, pinned by county/town.
 */

import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';

const DAY_MS = 24 * 60 * 60 * 1000;

function summarize(row: Doc<'scamRadarEvents'>) {
  return {
    _id: row._id,
    scamCategory: row.scamCategory,
    roughLocation: row.roughLocation,
    reportCountLast24h: row.reportCountLast24h,
    sampleAnonymizedSummary: row.sampleAnonymizedSummary,
    generatedAt: row.generatedAt,
  };
}

export const listEvents = query({
  args: { sessionToken: v.string(), roughLocation: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    if (args.roughLocation) {
      const rows = await ctx.db
        .query('scamRadarEvents')
        .withIndex('by_location', (q) => q.eq('roughLocation', args.roughLocation!))
        .order('desc')
        .take(50);
      return rows.map(summarize);
    }
    const rows = await ctx.db.query('scamRadarEvents').order('desc').take(100);
    return rows.map(summarize);
  },
});

/**
 * Section 12.3 cron: aggregate the 24h report window into anonymized radar
 * events. Runs nightly and is idempotent per category by pruning the previous
 * day's event for that category first (avoid duplicate rows on re-runs).
 */
export const generateScamRadarEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const since = now - DAY_MS;

    const allReports = await ctx.db.query('reports').collect();
    const recent = allReports.filter((r) => r.createdAt >= since && r.status !== 'cancelled');

    const byCategory = new Map<string, Doc<'reports'>[]>();
    for (const r of recent) {
      const arr = byCategory.get(r.scamCategory) ?? [];
      arr.push(r);
      byCategory.set(r.scamCategory, arr);
    }

    const events: Array<Doc<'scamRadarEvents'>> = [];
    for (const [category, rows] of byCategory) {
      const prev = await ctx.db
        .query('scamRadarEvents')
        .filter((q) => q.and(q.eq(q.field('scamCategory'), category), q.eq(q.field('roughLocation'), 'nationwide')))
        .collect();
      for (const old of prev) await ctx.db.delete(old._id);

      const sample = rows
        .find((r) => r.evidenceText.length > 0)
        ?.evidenceText.replace(/\s+/g, ' ')
        .slice(0, 160);
      const id = await ctx.db.insert('scamRadarEvents', {
        scamCategory: category,
        roughLocation: 'nationwide',
        reportCountLast24h: rows.length,
        sampleAnonymizedSummary: sample ?? `New ${category} reports in the last 24h.`,
        generatedAt: now,
      });
      const created = await ctx.db.get(id);
      if (created) events.push(created);
    }

    return { generated: events.length };
  },
});
