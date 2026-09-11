/**
 * Scam reporting (backend brief Section 4).
 *
 * `reports.submitScamReport(type, content, screenshotLocalOnly)` is a
 * mutation-safe entry point that:
 *   1. stores a redacted textual evidence summary and a boolean flag (a
 *      screenshot itself never leaves the device — `screenshotLocalOnly`);
 *   2. resolves the scam category from the content;
 *   3. when a phone number is present, feeds the community `reportedEntities`
 *      registry via `registerReport` so the report also strengthens the shared
 *      risk signal.
 */

import { v } from 'convex/values';
import { mutation } from './_generated/server';

import { requireUser } from './lib/auth';
import { analyzePatterns, extractPaymentTarget } from './lib/rulesEngine';
import { canonicalizePaybillTill, canonicalizePhone } from './lib/canonicalize';
import { registerReport } from './reportedEntities';

function redactEvidence(text: string): string {
  return text
    .slice(0, 400)
    .replace(/\b\d{4,6}\b/g, '[code]')
    .replace(/\b(PIN|OTP|password)\b/gi, '[credential]');
}

export const submitScamReport = mutation({
  args: {
    sessionToken: v.string(),
    type: v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('instagram'), v.literal('phoneCall')),
    content: v.string(),
    screenshotLocalOnly: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const content = args.content.trim();
    if (content.length === 0 && !args.screenshotLocalOnly) {
      throw new Error('Please add some text or keep the screenshot to report.');
    }
    const evidenceText = redactEvidence(content);

    const analysis = analyzePatterns(content);
    const scamCategory = analysis.scamCategory;

    // Feed the community registry when the report names a phone/paybill/till.
    if (content) {
      const target = extractPaymentTarget(content);
      if (target && (target.identifierType === 'phone' || target.identifierType === 'paybill' || target.identifierType === 'till')) {
        try {
          const canonical =
            target.identifierType === 'phone'
              ? canonicalizePhone(target.identifier)
              : canonicalizePaybillTill(target.identifier);
          if (canonical) {
            await registerReport(ctx.db, userId, canonical, target.identifierType, scamCategory).catch(() => undefined);
          }
        } catch {
          // Community feed is best-effort; a malformed target must not block the report.
        }
      }
    }

    const id = await ctx.db.insert('reports', {
      userId,
      scamCategory,
      type: args.type,
      evidenceText,
      screenshotLocalOnly: args.screenshotLocalOnly,
      status: 'open',
      createdAt: Date.now(),
    });
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not save the report.');
    return {
      _id: row._id,
      scamCategory: row.scamCategory,
      status: row.status,
      screenshotLocalOnly: row.screenshotLocalOnly,
      createdAt: row.createdAt,
    };
  },
});
