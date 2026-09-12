/**
 * Recipient / number verification (backend brief Section 5 / 3.4).
 *
 * `numbers.resolveLookup` is the reverse-lookup contract: canonicalize an
 * identifier, look it up in the community `reportedEntities` registry and
 * cross-check the `institutionDirectory`. Returns either the reported risk or a
 * verified-institution "blue" match, alongside the recommended action(s).
 */

import { v } from 'convex/values';
import type { DatabaseReader } from './_generated/server';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { identifierType } from './schema';

import { requireUser } from './lib/auth';
import { canonicalizeIdentifier, findEntityByIdentifier } from './reportedEntities';
import type { IdentifierType } from './lib/rulesEngine';

const ACTION_BY_RISK: Record<string, string[]> = {
  red: [
    'Do not send money or share any details.',
    'Report this destination to protect others.',
    'Contact the institution via its official number if a brand is named.',
  ],
  amber: [
    'Verify this destination through an official channel before paying.',
    'Do not rely on the sender mentioning a brand name.',
  ],
  blue: ['This matches an institution in Dhibiti\u2019s verified directory.'],
  green: ['No known reports. Treat as unverified and confirm independently.'],
  grey: ['No known reports. Treat as unverified and confirm independently.'],
};

export type LookupType = Doc<'reportedEntities'>['identifierType'];

/** Reverse-lookup helper reused by `payments.checkBeforeSend`. */
export async function lookupByIdentifier(
  db: DatabaseReader,
  identifier: string,
  type: LookupType,
) {
  const entity = await findEntityByIdentifier(db, identifier, type);

  // Institution directory cross-check: match the canonical identifier against a
  // directory entry's official numbers directly.
  let institution: Doc<'institutionDirectory'> | undefined;
  if (type === 'phone' || type === 'paybill' || type === 'till') {
    const canonical = canonicalizeIdentifier(identifier, type);
    if (canonical) {
      const entries = await db.query('institutionDirectory').collect();
      institution = entries.find((entry) => entry.officialNumbers.includes(canonical));
    }
  }

  return { entity, institution };
}

export const resolveLookup = query({
  args: {
    sessionToken: v.string(),
    identifier: v.string(),
    identifierType,
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const { entity, institution } = await lookupByIdentifier(ctx.db, args.identifier, args.identifierType);

    if (institution) {
      return {
        match: 'institution',
        institution: {
          _id: institution._id,
          officialName: institution.officialName,
          category: institution.category,
          websiteUrl: institution.websiteUrl,
          officialNumbers: institution.officialNumbers,
          verifiedAt: institution.verifiedAt,
        },
        riskLevel: 'blue',
        reasons: [`${institution.officialName} is in Dhibiti\u2019s verified directory.`],
        recommendedActions: ACTION_BY_RISK['blue'],
      };
    }

    if (entity) {
      return {
        match: 'reported',
        entity: {
          _id: entity._id,
          identifier: entity.identifier,
          identifierType: entity.identifierType,
          riskLevel: entity.riskLevel,
          scamCategory: entity.scamCategory,
          reportCount: entity.reportCount,
          uniqueReporters: entity.uniqueReporterIds.length,
          reviewStatus: entity.reviewStatus,
        },
        riskLevel: entity.riskLevel,
        reasons:
          entity.reportCount > 0
            ? [`${entity.reportCount} people have reported this destination.`]
            : ['No positive reports found for this destination.'],
        recommendedActions: ACTION_BY_RISK[entity.riskLevel] ?? ACTION_BY_RISK['grey'],
      };
    }

    return {
      match: 'none',
      riskLevel: 'grey',
      reasons: ['We have no information about this destination yet.'],
      recommendedActions: ACTION_BY_RISK['grey'],
    };
  },
});

export type { IdentifierType };
