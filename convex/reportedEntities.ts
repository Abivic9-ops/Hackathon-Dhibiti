/**
 * Community data layer (backend brief Section 3.2 + anti-abuse Section 13.2).
 *
 * `reportedEntities` is the community risk registry. Two hard rules are
 * enforced here (not per-feature):
 *  1. One report per user per entity — a duplicate call from the same user is
 *     an idempotent no-op, never an error.
 *  2. Minimum unique-reporter threshold before status can escalate — an entity
 *     cannot move from Amber/Grey to Red purely by report volume until
 *     MIN_REPORTERS_FOR_RED unique people have reported it.
 */

import { v } from 'convex/values';
import type { DatabaseReader, MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { identifierType } from './schema';

import { hasAlreadyContributed, requireUser } from './lib/auth';
import { canonicalizePaybillTill, canonicalizePhone, canonicalizeUrl } from './lib/canonicalize';

export const MIN_REPORTERS_FOR_RED = 3;

type IdentifierTypeLiteral = Doc<'reportedEntities'>['identifierType'];

/** Lookup/report-union view of identifiers. `url` is a first-class target for
 * community checks but is never written to `reportedEntities` (URLs live in
 * `urlScans`), so it only appears in the look-up side of the API. */
export type LookupIdentifierType = IdentifierTypeLiteral | 'url';

/**
 * Shared community-registry write used by `submitReport` and
 * `quarantine.confirmScam` (Section 4). Enforces the anti-abuse rules (13.2):
 * one report per user per entity (idempotent no-op) and the minimum
 * unique-reporter threshold before an entity can escalate to Red.
 */
export async function registerReport(
  db: MutationCtx['db'],
  userId: Doc<'users'>['_id'],
  canonical: string,
  type: IdentifierTypeLiteral,
  scamCategory: string,
): Promise<Doc<'reportedEntities'>> {
  const existing = await findEntityByIdentifier(db, canonical, type);

  if (existing) {
    if (hasAlreadyContributed(existing.uniqueReporterIds, userId)) {
      return existing;
    }
    const uniqueReporterIds = [...existing.uniqueReporterIds, userId];
    const nextRiskLevel =
      uniqueReporterIds.length >= MIN_REPORTERS_FOR_RED &&
      existing.riskLevel !== 'green' &&
      existing.riskLevel !== 'blue'
        ? 'red'
        : existing.riskLevel;
    await db.patch(existing._id, {
      reportCount: existing.reportCount + 1,
      uniqueReporterIds,
      lastReportedAt: Date.now(),
      riskLevel: nextRiskLevel,
      scamCategory: existing.scamCategory ?? scamCategory,
    });
    return { ...existing, uniqueReporterIds, riskLevel: nextRiskLevel };
  }

  const now = Date.now();
  const id = await db.insert('reportedEntities', {
    identifier: canonical,
    identifierType: type,
    riskLevel: 'amber',
    scamCategory,
    reportCount: 1,
    uniqueReporterIds: [userId],
    firstReportedAt: now,
    lastReportedAt: now,
    reviewStatus: 'unreviewed',
  });

  await db.insert('moderationQueue', {
    itemType: 'reportedEntity',
    itemId: id,
    priority: 'medium',
    status: 'open',
    createdAt: now,
  });

  const created = await db.get(id);
  if (!created) throw new Error('Could not write the report.');
  return created;
}

export const submitReport = mutation({
  args: {
    sessionToken: v.string(),
    identifier: v.string(),
    identifierType,
    scamCategory: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const canonical = canonicalizeIdentifier(args.identifier, args.identifierType);
    if (!canonical) {
      throw new Error('That identifier is not valid for its type. Check it and try again.');
    }
    const entity = await registerReport(ctx.db, userId, canonical, args.identifierType, args.scamCategory);
    return summarize(entity);
  },
});

/** Canonicalizes and validates an identifier per its type before any lookup/write. */
export function canonicalizeIdentifier(
  identifier: string,
  type: LookupIdentifierType,
): string | null {
  if (type === 'phone') return canonicalizePhone(identifier);
  if (type === 'paybill' || type === 'till') return canonicalizePaybillTill(identifier);
  if (type === 'url') return canonicalizeUrl(identifier);
  const trimmed = identifier.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Lookup used by every resolver (checks, numbers, payments). Canonicalizes first. */
export async function findEntityByIdentifier(
  db: DatabaseReader,
  identifier: string,
  type: LookupIdentifierType,
): Promise<Doc<'reportedEntities'> | undefined> {
  const canonical = canonicalizeIdentifier(identifier, type);
  if (!canonical) return undefined;
  const found = await db
    .query('reportedEntities')
    .withIndex('by_identifier', (q) =>
      q.eq('identifier', canonical).eq('identifierType', type as IdentifierTypeLiteral),
    )
    .unique();
  return found ?? undefined;
}

export const getByIdentifier = query({
  args: { identifier: v.string(), identifierType },
  handler: async (ctx, args) => {
    const entity = await findEntityByIdentifier(ctx.db, args.identifier, args.identifierType);
    return entity ? summarize(entity) : undefined;
  },
});

function summarize(entity: Doc<'reportedEntities'>) {
  return {
    _id: entity._id,
    identifier: entity.identifier,
    identifierType: entity.identifierType,
    riskLevel: entity.riskLevel,
    scamCategory: entity.scamCategory,
    reportCount: entity.reportCount,
    uniqueReporters: entity.uniqueReporterIds.length,
    firstReportedAt: entity.firstReportedAt,
    lastReportedAt: entity.lastReportedAt,
    reviewStatus: entity.reviewStatus,
  };
}