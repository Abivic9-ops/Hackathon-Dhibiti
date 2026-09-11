/**
 * Recipient & payment verification (backend brief Section 5 / 8).
 *
 * `payments.checkBeforeSend` composes the two-panel result the Verdict screen's
 * "message risk + recipient risk" pairing is built on: resolve the recipient
 * through `reportedEntities` + `institutionDirectory`, and (when context text
 * is supplied) run the message through the rules engine.
 *
 * `paymentHistory.markPaid` logs a completed payment and bumps the matching
 * `savedRecipients.timesPaid` used for future verification confidence.
 */

import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { identifierType } from './schema';

import { requireUser } from './lib/auth';
import { analyzePatterns } from './lib/rulesEngine';
import type { RiskLevel } from './lib/rulesEngine';
import { lookupByIdentifier } from './numbers';
import { canonicalizeIdentifier } from './reportedEntities';

const RANK: Record<RiskLevel, number> = { blue: 0, green: 0, grey: 1, amber: 2, red: 3 };

function worstRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RANK[a] >= RANK[b] ? a : b;
}

export const checkBeforeSend = mutation({
  args: {
    sessionToken: v.string(),
    recipientDetails: v.string(),
    identifierType,
    amountKes: v.optional(v.number()),
    contextText: v.optional(v.string()),
    savedRecipientId: v.optional(v.id('savedRecipients')),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);

    // --- Recipient panel ---------------------------------------------------
    const canonical = canonicalizeIdentifier(args.recipientDetails, args.identifierType);
    const { entity, institution } = canonical
      ? await lookupByIdentifier(ctx.db, args.recipientDetails, args.identifierType)
      : { entity: undefined, institution: undefined };

    const recipientRisk: RiskLevel = institution
      ? 'blue'
      : entity
        ? entity.riskLevel
        : 'grey';

    const recipientReasons: string[] = [];
    const recommendedActions: string[] = [];

    if (institution) {
      recipientReasons.push(`${institution.officialName} is in Dhibiti\u2019s verified directory.`);
    } else if (entity && entity.reportCount > 0) {
      recipientReasons.push(`${entity.reportCount} people have reported this destination.`);
      recommendedActions.push('Do not send money to this destination.');
      recommendedActions.push('Report it to protect others.');
    } else {
      recipientReasons.push('We have no history for this destination, so treat it as unverified.');
      recommendedActions.push('Confirm the recipient through an official channel first.');
    }

    // First-time or low-conviction recipient bonus when an amount is large.
    if (args.amountKes && args.amountKes >= 15000 && recipientRisk === 'grey') {
      recommendedActions.unshift(
        `KES ${args.amountKes.toLocaleString('en-KE')} is a large amount for an unverified recipient.`,
      );
    }

    // --- Message panel -----------------------------------------------------
    let messageRisk: RiskLevel = 'green';
    let messageReasons: string[] = [];
    const context = args.contextText?.trim();
    if (context && context.length > 0) {
      const analysis = analyzePatterns(context);
      messageRisk = analysis.suggestedRiskLevel;
      messageReasons = analysis.patterns.slice(0, 3).map((p) => p.label);
    }

    const overallRisk = worstRisk(recipientRisk, messageRisk);
    if (overallRisk === 'red' || overallRisk === 'amber') {
      recommendedActions.unshift(
        'Do not send money, share any PIN, or enter any code until you confirm this independently.',
      );
    }

    const recipient = {
      identifier: canonical ?? args.recipientDetails,
      identifierType: args.identifierType,
      riskLevel: recipientRisk,
      institution: institution
        ? {
            _id: institution._id,
            officialName: institution.officialName,
            websiteUrl: institution.websiteUrl,
          }
        : undefined,
      reportCount: entity?.reportCount ?? 0,
      reasons: recipientReasons,
    };

    const message = {
      textRedacted: context ? redact(context) : undefined,
      riskLevel: messageRisk,
      reasons: messageReasons,
    };

    return {
      messageRisk,
      recipientRisk,
      overallRisk,
      recipient,
      message,
      recommendedActions,
      savedRecipientId: args.savedRecipientId,
    };
  },
});

/** Minimal redaction for context text stored on a Check — strips PIN/OTP-ish codes. */
function redact(text: string): string {
  return text.replace(/\b\d{4,6}\b/g, '[code]').slice(0, 200);
}

export const markPaid = mutation({
  args: {
    sessionToken: v.string(),
    recipientId: v.optional(v.id('savedRecipients')),
    identifier: v.string(),
    identifierType,
    amountKes: v.optional(v.number()),
    note: v.optional(v.string()),
    checkId: v.optional(v.id('checks')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const canonical = canonicalizeIdentifier(args.identifier, args.identifierType) ?? args.identifier;
    const now = Date.now();

    // Bump the saved recipient's timesPaid when it's one of ours.
    if (args.recipientId) {
      const saved = await ctx.db.get(args.recipientId);
      if (saved && saved.userId === userId) {
        await ctx.db.patch(args.recipientId, {
          timesPaid: saved.timesPaid + 1,
          lastPaidAt: now,
        });
      }
    }

    const id = await ctx.db.insert('paymentHistory', {
      userId,
      recipientId: args.recipientId,
      identifier: canonical,
      identifierType: args.identifierType,
      amountKes: args.amountKes,
      note: args.note?.trim() || undefined,
      checkId: args.checkId,
      createdAt: now,
    });

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not log the payment.');
    return { _id: row._id, createdAt: row.createdAt, identifier: row.identifier };
  },
});
