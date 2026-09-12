/**
 * Shared AI-explanation helper (backend brief Section 11.2).
 *
 * Cached to make the explainer effectively free, and degrade-only: the verdict
 * flow never fails because the LLM is down — the cache row falls back to a
 * deterministic fallback explanation stored with a failure counter.
 */

import type { MutationCtx } from '../_generated/server';
import { hashToken } from './canonicalize';
import { explain } from '../providers/llm';
import type { ExplainInput } from '../providers/llm';

export type ExplanationResult = {
  aiExplanation: string;
  cached: boolean;
  provider: string;
};

/**
 * Returns a cached explanation when the same verdict evidence exists, otherwise
 * asks the LLM provider once and caches it. In Convex, caching writes must go
 * through a mutation, so callers pass a small `put` delegate.
 */
export async function getExplanation(
  ctx: { db: MutationCtx['db'] },
  input: ExplainInput,
  put: (hash: string, aiExplanation: string) => Promise<unknown>,
): Promise<ExplanationResult> {
  const hash = await hashToken(JSON.stringify(input));

  const cached = await ctx.db.query('aiExplanationCache').withIndex('by_hash', (q) => q.eq('hash', hash)).unique();
  if (cached) {
    return { aiExplanation: cached.aiExplanation, cached: true, provider: 'fallback' };
  }

  try {
    const result = await explain(input);
    await put(hash, result.aiExplanation);
    return { aiExplanation: result.aiExplanation, cached: false, provider: result.provider };
  } catch (error) {
    console.error('[explain] LLM provider failed, using fallback:', error);
    const fallback =
      ruleFallback(input.riskLevel) + ' ' + input.facts.slice(0, 2).map((f) => `- ${f}`).join(' ');
    await put(hash, fallback);
    return { aiExplanation: fallback, cached: false, provider: 'fallback' };
  }
}

function ruleFallback(riskLevel: ExplainInput['riskLevel']): string {
  switch (riskLevel) {
    case 'red':
      return 'This looks like a scam based on the warning signs in the message.';
    case 'amber':
      return 'Be cautious — this message shows several warning signs.';
    case 'green':
      return 'No clear warning signs found.';
    default:
      return 'Not enough evidence to decide.';
  }
}