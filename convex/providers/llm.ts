/**
 * LLM verdict explainer provider (backend brief Section 11.2).
 *
 * The rules engine computes risk; the LLM only ever writes the human-friendly
 * `aiExplanation` string. This provider is swapped when a real model is wired
 * (OpenRouter, Azure OpenAI, vertex, etc.), keeping the call contract stable.
 */

import { SCAM_CATEGORY_LABEL } from '../lib/rulesEngine';
import type { RiskLevel, ScamCategory } from '../lib/rulesEngine';

export type ExplainInput = {
  riskLevel: RiskLevel;
  scamCategory: ScamCategory;
  facts: string[];
  technical: string[];
};

export type ExplainResult = { aiExplanation: string; provider: string };

/**
 * Mock explainer — deterministic, offline, no external call. It composes the
 * evidence the rules engine already collected into a readable paragraph so the
 * whole flow is exercisable today. Swap with the real gateway later; it must
 * never throw (see getExplanation in ../lib/explain.ts).
 */
export async function explain(input: ExplainInput): Promise<ExplainResult> {
  const { riskLevel, scamCategory, facts, technical } = input;

  const summary =
    ruleSummary(riskLevel) +
    ` ${categoryLine(scamCategory)}` +
    renderBullets(facts, 3) +
    renderBullets(technical, 2, 'Technical signals');

  // Simulated latency so the loading UI is visible in dev builds.
  await new Promise((resolve) => setTimeout(resolve, 650));
  console.log('[mock-llm] explained verdict:', { riskLevel, scamCategory });
  return { aiExplanation: summary, provider: 'mock' };
}

function ruleSummary(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'red':
      return 'This message shows strong, credible signs of a scam.';
    case 'amber':
      return 'This message shows several warning signs, so it should not be trusted without extra checks.';
    case 'green':
      return 'This message does not show the warning signs we look for, though common scams can still target you.';
    default:
      return 'We do not have enough evidence to reach a firm conclusion about this message.';
  }
}

function categoryLine(scamCategory: ScamCategory): string {
  const label = SCAM_CATEGORY_LABEL[scamCategory];
  if (scamCategory === 'none') return 'No specific scam ladder matched yet.';
  return `It looks most like a ${label.toLowerCase()} attempt.`;
}

function renderBullets(lines: string[], max: number, header?: string): string {
  const picked = lines.slice(0, max);
  if (picked.length === 0) return '';
  const heading = header ? ` ${header}:` : '';
  return (
    heading + ' ' + picked.map((line) => `- ${line}`).join(' ')
  );
}