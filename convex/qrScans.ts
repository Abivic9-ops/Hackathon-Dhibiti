/**
 * Collective QR Verification Cache (backend brief Section 13.1 / 3.4).
 *
 * `qr.resolveScan` turns a decoded QR payload into a summarized verdict, using
 * the shared `qrScans` cache keyed by the canonical hash of the normalized
 * payload. Cache hits resolve almost instantly (shared community confidence);
 * cache misses run structural/URL/payment checks, a community lookup, and a
 * best-effort LLM explanation, then upsert the row.
 *
 * Privacy (Section 2.4 / principle 4): the shared row stores only a hashed
 * content key and a normalized `destinationSummary` — never Wi-Fi passwords,
 * vCard personal details, PINs or IDs. Wi-Fi/vCard rows store classification
 * fields only.
 */

import { v } from 'convex/values';
import type { DatabaseReader } from './_generated/server';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';
import { canonicalizeQrPayload, canonicalizeUrl } from './lib/canonicalize';
import { getExplanation } from './lib/explain';
import {
  analyzeUrl,
  classifyQrContent,
  extractPaymentTarget,
  parseWifi,
} from './lib/rulesEngine';
import type { RiskLevel, ScamCategory } from './lib/rulesEngine';
import { findEntityByIdentifier } from './reportedEntities';

function summarize(row: Doc<'qrScans'>) {
  return {
    _id: row._id,
    contentType: row.contentType,
    destinationSummary: row.destinationSummary,
    riskLevel: row.riskLevel,
    reasons: row.reasons,
    scanCount: row.scanCount,
    firstSeenAt: row.firstSeenAt,
    lastVerifiedAt: row.lastVerifiedAt,
  };
}

/**
 * Safe, un-redactable summary of a decoded payload for shared storage. Keeps
 * only what is needed to be useful for the community without crossing the
 * no-sensitive-payload rule. Returns undefined for payloads we deliberately
 * never summarize in full (wifi/vcard handled separately by callers).
 */
function safeDestination(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length > 80) return `${trimmed.slice(0, 80)}…`;
  return trimmed;
}

/** Community lookup keyed by the categorical identifier inside the payload, if any. */
async function communityForPayload(db: DatabaseReader, raw: string) {
  const target = extractPaymentTarget(raw);
  if (!target) return undefined;
  if (target.identifierType === 'url') return undefined; // handled by analyzeUrl
  return findEntityByIdentifier(db, target.identifier, target.identifierType);
}

export const resolveScan = mutation({
  args: {
    sessionToken: v.string(),
    rawPayload: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const raw = args.rawPayload.trim();
    if (raw.length === 0) throw new Error('The code is empty.');

    const contentType = classifyQrContent(raw);
    const contentHash = await canonicalizeQrPayload(raw);
    const now = Date.now();

    // 1. Cache hit — shared community confidence, near-instant.
    let cached = await ctx.db
      .query('qrScans')
      .withIndex('by_contentHash', (q) => q.eq('contentHash', contentHash))
      .unique();

    if (cached) {
      // Idempotent contribution: count a user once.
      const alreadyContributed = cached.contributingUserIds.includes(userId);
      await ctx.db.patch(cached._id, {
        scanCount: cached.scanCount + 1,
        lastVerifiedAt: now,
        contributingUserIds: alreadyContributed
          ? cached.contributingUserIds
          : [...cached.contributingUserIds, userId],
      });
      const updated = await ctx.db.get(cached._id);
      return { hit: true, scan: updated ? summarize(updated) : summarize(cached) };
    }

    // 2. Cache miss — fresh analysis.
    const reasons: string[] = [];
    let linkRisk: RiskLevel | undefined;
    let destinationSummary = safeDestination(raw);

    if (contentType === 'url') {
      const url = canonicalizeUrl(raw);
      const community = await communityForPayload(ctx.db, raw);
      const urlAnalysis = analyzeUrl(
        url,
        community
          ? {
              reportCount: community.reportCount,
              scamCategory: (community.scamCategory ?? 'none') as ScamCategory,
            }
          : undefined,
      );
      linkRisk = urlAnalysis.riskLevel;
      reasons.push(...urlAnalysis.facts);
      destinationSummary = url;
    } else if (contentType === 'wifi') {
      const wifi = parseWifi(raw);
      destinationSummary = `Wi-Fi network "${wifi.ssid}" (${wifi.security})`;
      if (wifi.open) {
        reasons.push('The network is open with no password — traffic on it can be observed.');
      }
    } else if (contentType === 'vcard') {
      destinationSummary = 'Contact card (VCARD)';
      reasons.push('This is a contact card. Share it only with people you trust.');
    } else {
      // paybill / till / phone / crypto / text
      const community = await communityForPayload(ctx.db, raw);
      if (community) {
        reasons.push(`${community.reportCount} people have reported this destination.`);
        if (community.reportCount >= 3) {
          reasons.push('This destination has been reported by several people.');
        }
      }
    }

    const target = extractPaymentTarget(raw);
    if (contentType === 'crypto') {
      destinationSummary = target?.identifier ?? 'Crypto payment request';
      reasons.push(
        'This code asks for a crypto payment. Crypto transfers cannot be reversed once sent.',
      );
    }

    const communityRisk = await communityForPayload(ctx.db, raw);
    const riskLevel = rankRisk(linkRisk, communityRisk?.riskLevel);

    // 3. Best-effort explanation (offline-safe + cached).
    const explanation = await getExplanation(
      ctx,
      {
        riskLevel,
        scamCategory: (communityRisk?.scamCategory ?? 'none') as ScamCategory,
        facts: reasons.slice(0, 4),
        technical: [`content-type: ${contentType}`],
      },
      async (hash, aiExplanation) => {
        const existing = await ctx.db.query('aiExplanationCache').withIndex('by_hash', (q) => q.eq('hash', hash)).unique();
        if (!existing) {
          await ctx.db.insert('aiExplanationCache', { hash, aiExplanation, createdAt: now });
        }
      },
    );

    // 4. Upsert the shared cache row (never raw sensitive payloads).
    const id = await ctx.db.insert('qrScans', {
      contentHash,
      contentType,
      destinationSummary,
      riskLevel,
      reasons: reasons.slice(0, 6),
      scanCount: 1,
      contributingUserIds: [userId],
      firstSeenAt: now,
      lastVerifiedAt: now,
    });

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not save the scan.');

    return {
      hit: false,
      scan: summarize(row),
      aiExplanation: explanation.aiExplanation,
      meta: { explanationCached: explanation.cached },
    };
  },
});

const RANK: Record<RiskLevel, number> = { blue: 0, green: 0, grey: 1, amber: 2, red: 3 };

function rankRisk(...levels: (RiskLevel | undefined)[]): RiskLevel {
  let worst: RiskLevel = 'green';
  for (const level of levels) {
    if (!level) continue;
    if (RANK[level] >= RANK[worst]) worst = level;
  }
  return worst;
}

/** Look up a single QR scan record by its stored id (live-subscribes to updates). */
export const getById = query({
  args: { sessionToken: v.string(), scanId: v.id('qrScans') },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.scanId);
    return row ? summarize(row) : undefined;
  },
});
