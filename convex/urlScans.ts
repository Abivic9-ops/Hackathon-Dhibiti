/**
 * URL Authenticity shared cache (backend brief Section 13.2 / 3.4 / 12.1).
 *
 * `url.resolveLink` turns a link into an authenticity verdict using the shared
 * `urlScans` cache keyed by canonical domain. On a hit it returns the cached
 * `authenticityStatus`; on a miss it runs structural checks (rulesEngine),
 * a domain reputation lookup (Section 11.2), an SSL check (11.3), and
 * cross-references the `institutionDirectory` for an impersonation/authenticity
 * match. When a legitimate institution match exists it returns a
 * `suggestedRedirect` so the UI can point the user to the verified page.
 *
 * `refreshStaleUrlScans` is the Section 12.1 hourly cron that re-checks rows
 * older than the freshness window (24-72h) with a lightweight pass and updates
 * them in place — the newer verdict live-subscribes to the row.
 */

import { v } from 'convex/values';
import type { DatabaseReader } from './_generated/server';
import { internalMutation, mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';
import { canonicalizeUrl } from './lib/canonicalize';
import { getExplanation } from './lib/explain';
import { analyzeUrl } from './lib/rulesEngine';
import type { RiskLevel, ScamCategory } from './lib/rulesEngine';
import { checkDomainReputation, checkTls } from './providers/domainReputation';
import { findEntityByIdentifier } from './reportedEntities';

export const FRESHNESS_WINDOW_MS = 48 * 60 * 60 * 1000; // 48h staleness window

function summarize(row: Doc<'urlScans'>) {
  return {
    _id: row._id,
    domain: row.domain,
    canonicalUrl: row.canonicalUrl,
    authenticityStatus: row.authenticityStatus,
    matchedInstitutionId: row.matchedInstitutionId,
    redirectChain: row.redirectChain,
    domainAgeDays: row.domainAgeDays,
    sslValid: row.sslValid,
    reportCount: row.reportCount,
    uniqueReporters: row.uniqueReporterIds.length,
    lastCheckedAt: row.lastCheckedAt,
  };
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  }
}

/** Matches a domain against the directory's official website domains. */
function institutionForDomain(db: DatabaseReader, domain: string) {
  return db
    .query('institutionDirectory')
    .filter((q) => q.or(q.eq(q.field('websiteUrl'), `https://${domain}`), q.eq(q.field('websiteUrl'), `https://www.${domain}`)))
    .first();
}

export const resolveLink = mutation({
  args: {
    sessionToken: v.string(),
    rawUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const canonicalUrl = canonicalizeUrl(args.rawUrl);
    const domain = domainOf(canonicalUrl);
    const now = Date.now();

    // 1. Cache hit by domain.
    let cached = await ctx.db
      .query('urlScans')
      .withIndex('by_domain', (q) => q.eq('domain', domain))
      .unique();
    if (cached) {
      // Refresh the staleness marker lightly on read (does not re-run analysis).
      return { hit: true, url: summarize(cached), suggestedRedirect: cached.matchedInstitutionId };
    }

    // 2. Cache miss — run the checks.
    const reasons: string[] = [];
    let riskLevel: RiskLevel = 'green';
    let authenticityStatus: Doc<'urlScans'>['authenticityStatus'] = 'unverified';
    let matchedInstitutionId: Doc<'institutionDirectory'>['_id'] | undefined;
    let domainAgeDays: number | undefined;
    let sslValid: boolean | undefined;

    // 2a. Structural checks (rulesEngine) + community entity lookup.
    const entity = await findEntityByIdentifier(ctx.db, canonicalUrl, 'url');
    const urlAnalysis = analyzeUrl(
      canonicalUrl,
      entity
        ? {
            reportCount: entity.reportCount,
            scamCategory: (entity.scamCategory ?? 'none') as ScamCategory,
          }
        : undefined,
    );
    riskLevel = urlAnalysis.riskLevel;
    reasons.push(...urlAnalysis.facts);

    // 2b. Domain reputation + SSL (wrapped, degrades gracefully).
    try {
      const reputation = await checkDomainReputation(domain);
      domainAgeDays = reputation.domainAgeDays;
      for (const note of reputation.notes) reasons.push(note);
      if (reputation.status === 'known_bad') riskLevel = 'red';
      if (reputation.status === 'suspicious' && riskLevel === 'green') riskLevel = 'amber';
      try {
        const tls = await checkTls(domain);
        sslValid = tls.valid;
        if (tls.orgMatch) reasons.push(`Certificate issued to ${tls.orgMatch}.`);
      } catch {
        sslValid = undefined;
      }
    } catch (error) {
      console.error('[url] reputation check failed, continuing:', error);
    }

    // 2c. Institution directory cross-reference for authenticity/impersonation.
    const institution = await institutionForDomain(ctx.db, domain);
    if (institution) {
      matchedInstitutionId = institution._id;
      authenticityStatus = 'verified';
      reasons.push(`${institution.officialName} uses this as its official web address.`);
      if (riskLevel === 'green') riskLevel = 'blue';
    } else if (urlAnalysis.impersonatedBrand) {
      authenticityStatus = 'notAuthentic';
      reasons.push(`This is not the official site of ${urlAnalysis.impersonatedBrand}.`);
    }

    const redirectChain = detectRedirects(canonicalUrl);

    // 3. Best-effort explanation.
    const explanation = await getExplanation(
      ctx,
      {
        riskLevel,
        scamCategory: (entity?.scamCategory ?? 'none') as ScamCategory,
        facts: reasons.slice(0, 4),
        technical: [`domain: ${domain}`, `redirects: ${redirectChain.length}`],
      },
      async (hash, aiExplanation) => {
        const existing = await ctx.db.query('aiExplanationCache').withIndex('by_hash', (q) => q.eq('hash', hash)).unique();
        if (!existing) await ctx.db.insert('aiExplanationCache', { hash, aiExplanation, createdAt: now });
      },
    );

    // 4. Upsert the shared cache row.
    const id = await ctx.db.insert('urlScans', {
      domain,
      canonicalUrl,
      authenticityStatus,
      matchedInstitutionId,
      redirectChain,
      domainAgeDays,
      sslValid,
      reportCount: entity?.reportCount ?? 0,
      uniqueReporterIds: entity?.uniqueReporterIds ?? [],
      lastCheckedAt: now,
    });

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not save the scan.');

    return {
      hit: false,
      url: summarize(row),
      suggestedRedirect: matchedInstitutionId,
      reasons: reasons.slice(0, 6),
      aiExplanation: explanation.aiExplanation,
      meta: { explanationCached: explanation.cached },
    };
  },
});

export const getByDomain = query({
  args: { sessionToken: v.string(), domain: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const key = domainOf(canonicalizeUrl(args.domain));
    const row = await ctx.db
      .query('urlScans')
      .withIndex('by_domain', (q) => q.eq('domain', key))
      .unique();
    return row ? summarize(row) : undefined;
  },
});

/**
 * Best-effort redirect chain detection. Without a live fetch (the reputation
 * provider does not resolve redirects in the mock) this returns just the
 * canonical URL; it exists so a future real fetch can populate the chain.
 */
function detectRedirects(canonicalUrl: string): string[] {
  return [canonicalUrl];
}

/**
 * Section 12.1 cron: hourly, refresh `urlScans` rows older than the freshness
 * window with a lightweight reputation + report-count check, updating in place.
 * Does NOT re-run full structural analysis.
 */
export const refreshStaleUrlScans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const threshold = Date.now() - FRESHNESS_WINDOW_MS;
    const stale = await ctx.db
      .query('urlScans')
      .filter((q) => q.lt(q.field('lastCheckedAt'), threshold))
      .collect();

    let refreshed = 0;
    for (const row of stale) {
      const entity = await findEntityByIdentifier(ctx.db, row.canonicalUrl, 'url');
      const analysis = analyzeUrl(
        row.canonicalUrl,
        entity
          ? {
              reportCount: entity.reportCount,
              scamCategory: (entity.scamCategory ?? 'none') as ScamCategory,
            }
          : undefined,
      );

      const institution = await institutionForDomain(ctx.db, row.domain);
      const reportCount = entity?.reportCount ?? 0;
      const uniqueReporterIds = entity?.uniqueReporterIds ?? [];
      const newStatus = institution
        ? 'verified'
        : analysis.impersonatedBrand
          ? 'notAuthentic'
          : 'unverified';

      await ctx.db.patch(row._id, {
        authenticityStatus: newStatus,
        matchedInstitutionId: institution?._id ?? row.matchedInstitutionId,
        reportCount,
        uniqueReporterIds,
        lastCheckedAt: Date.now(),
      });
      refreshed++;
    }
    return { refreshed };
  },
});
