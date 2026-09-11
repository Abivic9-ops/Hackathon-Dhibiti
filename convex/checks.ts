/**
 * Core resolution flow (backend brief Section 1 / 3): a single action turns a
 * raw SMS/USSD/QR payload into a structured `checks` row for the user's wall.
 *
 * Pipeline: authenticate → deterministic rules engine → extract payment target
 * → community lookup on the target → URL structural analysis → deterministic
 * composition of final risk/category/reasons/actions → best-effort LLM
 * explanation (never a blocker) → persist `checks` row.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { checkType } from './schema';
import type { Doc } from './_generated/dataModel';

import { requireUser } from './lib/auth';
import { assertOwns } from './lib/auth';
import { getExplanation } from './lib/explain';
import {
  analyzePatterns,
  analyzeUrl,
  classifyQrContent,
  extractPaymentTarget,
} from './lib/rulesEngine';
import type {
  CommunityRiskSummary,
  ExtractedTarget,
  PatternAnalysis,
  RiskLevel,
  ScamCategory,
  UrlAnalysis,
} from './lib/rulesEngine';
import { findEntityByIdentifier } from './reportedEntities';

const RANK: Record<RiskLevel, number> = { blue: 0, green: 0, grey: 1, amber: 2, red: 3 };

function worstRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RANK[a] >= RANK[b] ? a : b;
}

/**
 * Falls back to a concrete category when the tolerated risk has no hint.
 * `mpesa_reversal_scam` is the last resort for red/amber because the UI and the
 * community surfaces should never show an uncategorized scam verdict — the
 * reason strings always carry the actual observed evidence.
 */
function inferCategory(analysis: PatternAnalysis, urlInfo: UrlAnalysis | undefined, community: CommunityRiskSummary | undefined): ScamCategory {
  const hinted = analysis.scamCategory;
  if (hinted !== 'none') return hinted;
  if (community && community.riskLevel !== 'green' && community.scamCategory !== 'none') {
    return community.scamCategory;
  }
  if (analysis.suggestedRiskLevel === 'red' || analysis.suggestedRiskLevel === 'amber') {
    const byCategory: Partial<Record<string, ScamCategory>> = {
      impersonation: 'fake_agent',
      authority_threat: 'police_impersonation',
      emotional_pressure: 'family_emergency_scam',
      prize_or_offer: 'prize_scam',
      reversal_claim: 'mpesa_reversal_scam',
      credential_request: 'sim_swap_attempt',
      crypto_irreversible: 'crypto_investment',
    };
    for (const key of Object.keys(byCategory)) {
      if (analysis.patterns.some((pattern) => pattern.category === key)) {
        return byCategory[key]!;
      }
    }
    if (urlInfo?.impersonatedBrand) return 'qr_merchant_phishing';
    return 'mpesa_reversal_scam'; // most common Kenyan mobile-money scam
  }
  return 'none';
}

function buildRecommendedActions(args: {
  riskLevel: RiskLevel;
  category: ScamCategory;
  target: ExtractedTarget | undefined;
  urlInfo: UrlAnalysis | undefined;
}): string[] {
  const { riskLevel, category, target, urlInfo } = args;
  const actions: string[] = [];

  if (riskLevel === 'red' || riskLevel === 'amber') {
    actions.push('Do not send money, share any PIN, or enter any code until you confirm this independently.');
    if (target?.identifierType === 'paybill' || target?.identifierType === 'till') {
      actions.push(`Do not pay ${target.identifierType} ${target.identifier} without confirming it via an official channel.`);
    } else if (target?.identifierType === 'phone') {
      actions.push(`Do not send money to ${target.identifier} without confirming it via an official channel.`);
    } else if (target?.identifierType === 'crypto') {
      actions.push('Crypto payments cannot be reversed, so do not send anything to this address.');
    }
    if (urlInfo?.riskLevel !== 'green') {
      actions.push('Do not open the link, and do not type your number or PIN on that page.');
    }
  }

  if (category === 'fake_agent' || category === 'police_impersonation' || category === 'sim_swap_attempt') {
    actions.push('Hang up or block your end, then contact the institution through its official number printed on your statement.');
  }
  if (category === 'family_emergency_scam' || category === 'prize_scam') {
    actions.push('Verify the story with the person directly on a call you dial yourself — not the number in the message.');
  }
  if (category === 'mpesa_reversal_scam') {
    actions.push('M-Pesa never asks you to send money to reverse an error. Block the sender immediately.');
  }

  if (riskLevel === 'red') {
    actions.push('If you already sent money, contact your bank or Safaricom right away and report the incident to the police.');
  }

  actions.push('Block the sender and delete the message.');
  return actions;
}

function summarizeForUser(row: Doc<'checks'>) {
  return {
    _id: row._id,
    type: row.type,
    inputSummary: row.inputSummary,
    riskLevel: row.riskLevel,
    scamCategory: row.scamCategory,
    reasons: row.detectedPatterns,
    recommendedActions: row.recommendedActions,
    aiExplanation: row.aiExplanation,
    createdAt: row.createdAt,
  };
}

export const resolveMessageOrCall = mutation({
  args: {
    sessionToken: v.string(),
    type: checkType,
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const body = args.body.trim();
    if (body.length === 0) throw new Error('Nothing to check.');

    // 1. Deterministic rules engine — never allowed to be overridden by the LLM.
    const analysis = analyzePatterns(body);
    const target = extractPaymentTarget(body);

    // 2. Community + URL analysis on the extracted destination.
    let community: CommunityRiskSummary | undefined;
    let urlInfo: UrlAnalysis | undefined;
    let linkedEntityId: Doc<'reportedEntities'>['_id'] | undefined;

    if (target) {
      const entity = await findEntityByIdentifier(ctx.db, target.identifier, target.identifierType);
      if (entity) {
        linkedEntityId = entity._id;
        community = {
          reportCount: entity.reportCount,
          riskLevel: entity.riskLevel,
          scamCategory: (entity.scamCategory ?? 'none') as ScamCategory,
        };
      }
      if (target.identifierType === 'url') {
        urlInfo = analyzeUrl(target.identifier, community);
      }
    }

    // 3. Compose the risk: worst of rules, URL structure and community.
    const riskLevel = [analysis.suggestedRiskLevel, urlInfo?.riskLevel, community?.riskLevel]
      .filter((level): level is RiskLevel => level !== undefined)
      .reduce((worst, level) => worstRisk(worst, level), 'green' as RiskLevel);

    const scamCategory = inferCategory(analysis, urlInfo, community);

    // 4. Human-readable reasons from every contributor (also the UI's copy).
    const reasons: string[] = [];
    for (const pattern of analysis.patterns.slice(0, 3)) reasons.push(`"${pattern.label}" was detected.`);
    for (const combination of analysis.combinations.slice(0, 2)) reasons.push(combination);
    for (const fact of urlInfo?.facts ?? []) reasons.push(fact);
    if (community && community.reportCount > 0) {
      reasons.push(`${community.reportCount} people have reported this destination.`);
    }
    if (args.type === 'qr' && analysis.suggestedRiskLevel === 'green' && urlInfo?.riskLevel === 'green') {
      reasons.unshift(`The code contains ${classifyQrContent(body) === 'wifi' ? 'Wi-Fi settings only' : 'no obvious payment demand'}.`);
    }

    const recommendedActions = buildRecommendedActions({ riskLevel, category: scamCategory, target, urlInfo });

    // 5. Best-effort LLM explanation (offline-safe, cached).
    const explanation = await getExplanation(
      ctx,
      {
        riskLevel,
        scamCategory,
        facts: reasons.slice(0, 4),
        technical: [target ? `${target.identifierType}: ${target.identifier}` : 'no money destination extracted'],
      },
      async (hash, aiExplanation) => {
        const existing = await ctx.db.query('aiExplanationCache').withIndex('by_hash', (q) => q.eq('hash', hash)).unique();
        if (!existing) {
          await ctx.db.insert('aiExplanationCache', { hash, aiExplanation, createdAt: Date.now() });
        }
      },
    );

    // 6. Persist the user's check (raw payload stays out of shared tables).
    const createdAt = Date.now();
    const keywords = (args.type === 'qr' ? `${classifyQrContent(body)} · ${body}` : body).slice(0, 80);
    const checkId = await ctx.db.insert('checks', {
      userId,
      type: args.type,
      inputSummary: keywords + (body.length > 80 ? '…' : ''),
      detectedPatterns: reasons,
      ruleScore: analysis.ruleScore,
      riskLevel,
      scamCategory,
      aiExplanation: explanation.aiExplanation,
      recommendedActions,
      linkedEntityId,
      createdAt,
    });

    const row = await ctx.db.get(checkId);
    if (!row) throw new Error('Could not save the check.');
    return {
      check: summarizeForUser(row),
      meta: {
        explanationCached: explanation.cached,
        explanationProvider: explanation.provider,
      },
    };
  },
});

/** The user's past checks, newest first, own-scope only. */
export const listHistory = query({
  args: { sessionToken: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    const rows = await ctx.db
      .query('checks')
      .withIndex('by_user_createdAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit);
    return rows.map(summarizeForUser);
  },
});

export const getById = query({
  args: { sessionToken: v.string(), checkId: v.id('checks') },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const row = await ctx.db.get(args.checkId);
    if (!row) throw new Error('That check does not exist.');
    assertOwns(userId, row.userId);
    return summarizeForUser(row);
  },
});