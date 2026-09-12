/**
 * Institution Directory (backend brief Section 6 / 2.6 / 2.7).
 *
 * The curated, founder-maintained registry of verified Kenyan institutions.
 * Powers the Directory search screen, the "Call the verified number" button
 * inside a Scam Shield verdict (`getVerifiedCallback`), and the URL
 * authenticity + suggested-redirect feature in `url.resolveLink`.
 *
 * Data-integrity corrections go to `directoryIssueReports` — a SEPARATE table
 * from `reportedEntities` so a directory correction can never accidentally
 * increment a public scam-report counter against the institution (Section 8.2).
 *
 * Any function that maintains the directory requires the `moderator` role.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { INSTITUTION_SEED } from './lib/seedInstitutions';

import { assertRole, requireUser } from './lib/auth';

function summarize(entry: Doc<'institutionDirectory'>) {
  return {
    _id: entry._id,
    officialName: entry.officialName,
    category: entry.category,
    subcategory: entry.subcategory,
    officialNumbers: entry.officialNumbers,
    websiteUrl: entry.websiteUrl,
    poBox: entry.poBox,
    physicalAddress: entry.physicalAddress,
    town: entry.town,
    mapId: entry.mapId,
    verifiedAt: entry.verifiedAt,
    sourceUrl: entry.sourceUrl,
  };
}

/**
 * Seeds the curated directory. Idempotent by officialName so it can be run
 * repeatedly without creating duplicates. This is a bootstrap/ops function (a
 * moderator may not exist on a fresh DB yet), so it deliberately does not
 * require authentication — it only ever adds founder-curated data.
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const inserted: Doc<'institutionDirectory'>['_id'][] = [];
    const existing = await ctx.db.query('institutionDirectory').collect();
    const have = new Set(existing.map((e) => e.officialName.toLowerCase()));

    for (const seed of INSTITUTION_SEED) {
      if (have.has(seed.officialName.toLowerCase())) continue;
      const { aliases: _aliases, ...rest } = seed;
      const id = await ctx.db.insert('institutionDirectory', rest);
      inserted.push(id);
    }
    return { inserted: inserted.length, total: existing.length + inserted.length };
  },
});

/** Backs the Directory search screen (uses the search_name searchIndex). */
export const search = query({
  args: {
    query: v.string(),
    category: v.optional(
      v.union(v.literal('bank'), v.literal('telco'), v.literal('hospital'), v.literal('government')),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const term = args.query.trim();
    const usedLimit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    if (!term) return [];

    const found = await ctx.db
      .query('institutionDirectory')
      .withSearchIndex('search_name', (q) => q.search('officialName', term))
      .take(usedLimit);

    const filtered = args.category
      ? found.filter((entry) => entry.category === args.category)
      : found;
    return filtered.slice(0, usedLimit).map(summarize);
  },
});

export const list = query({
  args: {
    category: v.optional(
      v.union(v.literal('bank'), v.literal('telco'), v.literal('hospital'), v.literal('government')),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const usedLimit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const entries = args.category
      ? await ctx.db
          .query('institutionDirectory')
          .withIndex('by_category', (q) => q.eq('category', args.category!))
          .take(usedLimit)
      : await ctx.db.query('institutionDirectory').take(usedLimit);
    return entries.map(summarize);
  },
});

export const getById = query({
  args: { id: v.id('institutionDirectory') },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    return entry ? summarize(entry) : undefined;
  },
});

const NORMALIZE = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Fuzzy-matches a claimed identity (e.g. a brand name extracted from a Check's
 * text) against the directory. Returns the verified number/website when a
 * confident match exists — this is what powers the "Call the verified number"
 * button (Section 6).
 */
export const getVerifiedCallback = query({
  args: { claimedInstitutionName: v.string() },
  handler: async (ctx, args) => {
    const claimed = NORMALIZE(args.claimedInstitutionName);
    if (!claimed) return undefined;

    const entries = await ctx.db.query('institutionDirectory').collect();
    let best: Doc<'institutionDirectory'> | undefined;
    let bestScore = 0;

    for (const entry of entries) {
      const name = NORMALIZE(entry.officialName);
      if (name === claimed) return summarize(entry);
      // Substring or word-overlap match on the official name.
      const words = claimed.split(' ').filter((w) => w.length > 2);
      const overlap = words.filter((w) => name.includes(w)).length;
      const score = words.length > 0 ? overlap / words.length : 0;
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    // Require a reasonably confident match (>= half the claimed words overlap).
    const confidenceOk = bestScore >= 0.5 && bestScore > 0;
    return confidenceOk && best ? summarize(best) : undefined;
  },
});

// ---------------------------------------------------------------------------
// directoryIssueReports (Section 2.7 / 6) — data-integrity corrections.
// ---------------------------------------------------------------------------

export const submitIssueReport = mutation({
  args: {
    sessionToken: v.string(),
    institutionEntryId: v.id('institutionDirectory'),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const description = args.description.trim();
    if (description.length === 0) throw new Error('Please describe the issue.');

    const entry = await ctx.db.get(args.institutionEntryId);
    if (!entry) throw new Error('That institution is not in the directory.');

    // One open issue per user per entry — duplicate submissions are idempotent.
    const existing = await ctx.db
      .query('directoryIssueReports')
      .withIndex('by_entry', (q) => q.eq('institutionEntryId', args.institutionEntryId))
      .collect();
    const dup = existing.find(
      (row) => row.reporterUserId === userId && row.status === 'open',
    );
    if (dup) return summarizeIssue(dup);

    const id = await ctx.db.insert('directoryIssueReports', {
      institutionEntryId: args.institutionEntryId,
      reporterUserId: userId,
      description,
      status: 'open',
      createdAt: Date.now(),
    });

    // Backlog for the moderator digest.
    await ctx.db.insert('moderationQueue', {
      itemType: 'directoryIssue',
      itemId: id,
      priority: 'low',
      status: 'open',
      createdAt: Date.now(),
    });

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not save the issue.');
    return summarizeIssue(row);
  },
});

export const listIssueReports = query({
  args: { sessionToken: v.string(), status: v.optional(v.union(v.literal('open'), v.literal('reviewed'), v.literal('resolved'))) },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertRole(user, 'moderator');
    const rows = args.status
      ? await ctx.db
          .query('directoryIssueReports')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .collect()
      : await ctx.db.query('directoryIssueReports').collect();
    return rows.map(summarizeIssue);
  },
});

export const resolveIssueReport = mutation({
  args: {
    sessionToken: v.string(),
    issueId: v.id('directoryIssueReports'),
    status: v.union(v.literal('reviewed'), v.literal('resolved')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertRole(user, 'moderator');
    const row = await ctx.db.get(args.issueId);
    if (!row) throw new Error('That issue report does not exist.');
    await ctx.db.patch(args.issueId, { status: args.status });
    return { _id: args.issueId, status: args.status };
  },
});

function summarizeIssue(row: Doc<'directoryIssueReports'>) {
  return {
    _id: row._id,
    institutionEntryId: row.institutionEntryId,
    reporterUserId: row.reporterUserId,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Curated directory maintenance — moderator only (Section 14).
// ---------------------------------------------------------------------------

export const upsertEntry = mutation({
  args: {
    sessionToken: v.string(),
    entry: v.object({
      officialName: v.string(),
      category: v.union(v.literal('bank'), v.literal('telco'), v.literal('hospital'), v.literal('government')),
      subcategory: v.optional(v.string()),
      officialNumbers: v.array(v.string()),
      websiteUrl: v.string(),
      poBox: v.optional(v.string()),
      physicalAddress: v.optional(v.string()),
      mapId: v.optional(v.string()),
      town: v.optional(v.string()),
      verifiedAt: v.number(),
      sourceUrl: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    assertRole(user, 'moderator');

    const officialName = args.entry.officialName.trim();
    if (officialName.length === 0) throw new Error('Institution name is required.');
    if (args.entry.officialNumbers.length === 0) throw new Error('At least one official number is required.');

    const existing = await ctx.db
      .query('institutionDirectory')
      .withIndex('by_category', (q) => q.eq('category', args.entry.category))
      .collect();
    const match = existing.find((e) => e.officialName.toLowerCase() === officialName.toLowerCase());

    if (match) {
      await ctx.db.patch(match._id, args.entry);
      return { _id: match._id, created: false };
    }
    const id = await ctx.db.insert('institutionDirectory', args.entry);
    return { _id: id, created: true };
  },
});
