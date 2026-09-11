import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { riskLevel } from './schema';

import { requireUser } from './lib/auth';
import { getExplanation } from './lib/explain';
import type { ScamCategory } from './lib/rulesEngine';

export const explainVerdict = mutation({
  args: {
    sessionToken: v.string(),
    body: v.string(),
    verdict: v.object({
      riskLevel,
      scamCategory: v.string(),
      facts: v.array(v.string()),
      technical: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.sessionToken);
    const result = await getExplanation(
      ctx,
      {
        riskLevel: args.verdict.riskLevel,
        scamCategory: args.verdict.scamCategory as ScamCategory,
        facts: args.verdict.facts,
        technical: args.verdict.technical,
      },
      async (hash, aiExplanation) => {
        const existing = await ctx.db.query('aiExplanationCache').withIndex('by_hash', (q) => q.eq('hash', hash)).unique();
        if (!existing) {
          await ctx.db.insert('aiExplanationCache', { hash, aiExplanation, createdAt: Date.now() });
        }
      },
    );
    return { aiExplanation: result.aiExplanation };
  },
});