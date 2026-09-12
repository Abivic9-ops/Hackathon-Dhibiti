/**
 * Deterministic rules engine (backend brief Section 3.1).
 *
 * Pure, offline-computable, no external calls, no Convex imports — so it can
 * be tested in isolation. Inputs are raw text (English/Kiswahili/Sheng) or
 * decoded QR/URL data. Outputs are detectedPatterns[], a ruleScore (0-100), a
 * suggestedRiskLevel, a scamCategory, and combination explanations.
 *
 * The LLM layer is never allowed to set riskLevel — it can only explain what
 * this module produced (see explainVerdict.ts).
 */

import { canonicalizePhone } from './canonicalize';

export type RiskLevel = 'red' | 'amber' | 'green' | 'blue' | 'grey';

/** Section 1 taxonomy, snake_case per the backend spec. */
export type ScamCategory =
  | 'mpesa_reversal_scam'
  | 'fake_agent'
  | 'police_impersonation'
  | 'family_emergency_scam'
  | 'job_loan_scam'
  | 'prize_scam'
  | 'sim_swap_attempt'
  | 'delivery_scam'
  | 'qr_merchant_phishing'
  | 'crypto_investment'
  | 'none';

export const SCAM_CATEGORY_LABEL: Record<ScamCategory, string> = {
  mpesa_reversal_scam: 'M-Pesa reversal scam',
  fake_agent: 'Fake Safaricom agent',
  police_impersonation: 'Police or court impersonation',
  family_emergency_scam: 'Family emergency scam',
  job_loan_scam: 'Fake job or loan offer',
  prize_scam: 'Prize or lottery scam',
  sim_swap_attempt: 'SIM-swap attempt',
  delivery_scam: 'Fake delivery or online-shopping scam',
  qr_merchant_phishing: 'QR or merchant phishing',
  crypto_investment: 'Crypto investment scam',
  none: 'No known scam pattern',
};

export type PatternCategory =
  | 'urgency'
  | 'secrecy'
  | 'payment_pressure'
  | 'impersonation'
  | 'credential_request'
  | 'prize_or_offer'
  | 'reversal_claim'
  | 'authority_threat'
  | 'emotional_pressure'
  | 'new_destination'
  | 'link_obfuscation'
  | 'crypto_irreversible'
  | 'network_config';

export type DetectedPattern = {
  id: string;
  label: string;
  category: PatternCategory;
  /** Verbatim excerpt that triggered the rule (may be Kiswahili or Sheng). */
  evidence?: string;
  weight: number;
};

export type Rule = {
  id: string;
  label: string;
  category: PatternCategory;
  weight: number;
  matchers: RegExp[];
  scamHint?: ScamCategory;
};

const RULES: Rule[] = [
  {
    id: 'urgency',
    label: 'The message pushes you to act immediately.',
    category: 'urgency',
    weight: 18,
    matchers: [
      /\b(now|immediately|urgent(ly)?|right away|within \d+ (min|minutes|hours)|last chance|expires today)\b/i,
      /\b(haraka|haraka sana|saa hii|leo tu|sasa hivi|mara moja)\b/i,
      /\b(fanya haraka|usichelewe)\b/i,
    ],
  },
  {
    id: 'secrecy',
    label: 'You are asked to keep this from other people.',
    category: 'secrecy',
    weight: 20,
    matchers: [
      /\b(do not tell|don'?t tell|keep this between us|no one should know|confidential, do not share)\b/i,
      /\b(usimwambie mtu|usiseme kwa mtu|siri yetu|usiambie mama|usiambie baba)\b/i,
    ],
  },
  {
    id: 'payment_pressure',
    label: 'The message asks you to send money.',
    category: 'payment_pressure',
    weight: 16,
    matchers: [
      /\b(send (the )?money|send kes|send ksh|transfer|deposit|pay now|make payment|clear the balance)\b/i,
      /\b(tuma (pesa|hela|doh)|nitumie (pesa|hela)|lipa|malizia malipo)\b/i,
    ],
  },
  {
    id: 'new_destination',
    label: 'You are told to pay a new or different number, Paybill or Till.',
    category: 'new_destination',
    weight: 20,
    matchers: [
      /\b(new (paybill|till|number|account)|use this (paybill|till|number|account)|changed (our|the) (paybill|number|account))\b/i,
      /\b(namba (hii )?mpya|tuma kwa namba hii|paybill mpya)\b/i,
    ],
  },
  {
    id: 'reversal_claim',
    label: 'Someone claims money was sent to you by mistake.',
    category: 'reversal_claim',
    weight: 30,
    scamHint: 'mpesa_reversal_scam',
    matchers: [
      /\b(sent (you )?money by mistake|wrong number|reverse the (money|transaction)|return the money|refund my money)\b/i,
      /\b(nimetuma (?:pesa|hela)?\s?kwako? kimakosa|umetuma (?:pesa|hela)?\s?kwangu kimakosa|nirudishie|rudisha (?:pesa|hela))\b/i,
    ],
  },
  {
    id: 'credential_request',
    label: 'You are asked for a PIN, password or verification code.',
    category: 'credential_request',
    weight: 34,
    scamHint: 'fake_agent',
    matchers: [
      /\b(share your (pin|password|otp|code)|send (me )?the (code|otp|pin)|confirm your pin|enter your pin|id number and pin)\b/i,
      /\b(nitumie code|niambie pin|tuma pin|weka pin yako)\b/i,
    ],
  },
  {
    id: 'authority_threat',
    label: 'The message threatens that your account or line will be blocked.',
    category: 'authority_threat',
    weight: 24,
    scamHint: 'fake_agent',
    matchers: [
      /\b(account will be (blocked|suspended|deactivated)|line will be (blocked|deregistered)|sim will be blocked|failure to comply)\b/i,
      /\b(akaunti yako imefungwa|laini yako itafungwa|itafungwa leo)\b/i,
    ],
  },
  {
    id: 'police_threat',
    label: 'The caller claims to be police, court or a government officer.',
    category: 'impersonation',
    weight: 28,
    scamHint: 'police_impersonation',
    matchers: [
      /\b(police|dci|court|warrant|officer|prosecut|arrest)\b/i,
      /\b(niko police station|polisi|mahakama|nimeshikwa)\b/i,
    ],
  },
  {
    id: 'bank_impersonation',
    label: 'The sender claims to be a bank or mobile money provider.',
    category: 'impersonation',
    weight: 22,
    scamHint: 'fake_agent',
    matchers: [
      /\b(kcb|equity|co-?op bank|absa|ncba|stanbic|dtb|family bank|sacco|safaricom|m-?pesa|airtel money)\b/i,
      /\b(customer care|bank agent|fraud department|verification department)\b/i,
    ],
  },
  {
    id: 'family_emergency',
    label: 'The message claims a relative is in trouble and needs money fast.',
    category: 'emotional_pressure',
    weight: 28,
    scamHint: 'family_emergency_scam',
    matchers: [
      /\b(your (child|son|daughter|mother|father) is in (trouble|hospital)|accident|admitted|bail|emergency)\b/i,
      /\b(niko hospitali|mtoto wako|ajali|nisaidie haraka|niko ndani)\b/i,
    ],
  },
  {
    id: 'reward_bait',
    label: 'The message promises a prize, refund or reward.',
    category: 'prize_or_offer',
    weight: 26,
    scamHint: 'prize_scam',
    matchers: [
      /\b(you have won|congratulations|you'?ve been selected|claim your (prize|reward|bonus)|lucky winner|promo)\b/i,
      /\b(umeshinda|hongera|umechaguliwa|zawadi yako)\b/i,
    ],
  },
  {
    id: 'job_loan_bait',
    label: 'The message offers a job, loan or investment with an upfront fee.',
    category: 'prize_or_offer',
    weight: 24,
    scamHint: 'job_loan_scam',
    matchers: [
      /\b(job (offer|opportunity)|instant loan|loan approved|registration fee|processing fee|no cv needed|work from home)\b/i,
      /\b(kazi (ya haraka|mzuri)|mkopo (wa haraka|papo hapo)|ada ya usajili)\b/i,
    ],
  },
  {
    id: 'delivery_bait',
    label: 'The message claims a delivery or order needs a payment to be released.',
    category: 'payment_pressure',
    weight: 20,
    scamHint: 'delivery_scam',
    matchers: [
      /\b(parcel|package|delivery fee|customs fee|courier|your order (is )?(held|pending))\b/i,
      /\b(mzigo wako|ada ya usafirishaji)\b/i,
    ],
  },
  {
    id: 'sim_swap',
    label: 'The message asks you to approve a SIM or line change.',
    category: 'credential_request',
    weight: 30,
    scamHint: 'sim_swap_attempt',
    matchers: [
      /\b(sim (swap|replacement)|new sim|line upgrade|4g upgrade|dial \*\d+)\b/i,
      /\b(badilisha (sim|laini)|simu mpya ya laini)\b/i,
    ],
  },
  {
    id: 'crypto_bait',
    label: 'You are asked to pay with crypto, which cannot be reversed.',
    category: 'crypto_irreversible',
    weight: 30,
    scamHint: 'crypto_investment',
    matchers: [
      /\b(usdt|bitcoin|btc|binance|trust wallet|crypto|double your money|guaranteed returns|forex signals)\b/i,
    ],
  },
  {
    id: 'link_bait',
    label: 'The message contains a link you are pushed to open.',
    category: 'link_obfuscation',
    weight: 12,
    matchers: [/\b(click (here|the link)|open this link|register here|verify here|https?:\/\/)/i],
  },
];

const SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  'cutt.ly',
  't.ly',
  'rb.gy',
  'is.gd',
  'shorturl.at',
  'lnk.to',
];

const KENYAN_BRANDS = [
  'safaricom',
  'mpesa',
  'm-pesa',
  'kcb',
  'equity',
  'coop',
  'co-op',
  'absa',
  'ncba',
  'stanbic',
  'nhif',
  'nssf',
  'kra',
];

const LOOKALIKE_HINTS = [
  'mpesa-secure',
  'safaricom-verify',
  'kcb-login',
  'equity-verify',
  'mpesa-portal',
  'mpess',
  'safaricomn',
  'kcbkenya',
  'mpesa-refund',
];

export function riskFromScore(score: number): RiskLevel {
  if (score >= 60) return 'red';
  if (score >= 25) return 'amber';
  return 'green';
}

export type PatternAnalysis = {
  patterns: DetectedPattern[];
  ruleScore: number;
  scamCategory: ScamCategory;
  suggestedRiskLevel: RiskLevel;
  combinations: string[];
};

function firstMatch(text: string, matchers: RegExp[]) {
  for (const matcher of matchers) {
    const found = matcher.exec(text);
    if (found) return found[0];
  }
  return undefined;
}

/** Kenyan-language analysis: matches English, Kiswahili and Sheng, then scores combinations. */
export function analyzePatterns(text: string): PatternAnalysis {
  const patterns: DetectedPattern[] = [];

  for (const rule of RULES) {
    const evidence = firstMatch(text, rule.matchers);
    if (!evidence) continue;
    patterns.push({
      id: rule.id,
      label: rule.label,
      category: rule.category,
      evidence,
      weight: rule.weight,
    });
  }

  const categories = new Set(patterns.map((pattern) => pattern.category));
  const combinations: string[] = [];
  let bonus = 0;

  if (categories.has('urgency') && categories.has('secrecy')) {
    combinations.push('Urgency and secrecy appear together, which is a classic pressure tactic.');
    bonus += 16;
  }
  if (categories.has('impersonation') && categories.has('payment_pressure')) {
    combinations.push(
      'A claimed identity is combined with a money request, which real institutions do not do.',
    );
    bonus += 18;
  }
  if (categories.has('urgency') && categories.has('payment_pressure')) {
    combinations.push('A payment request is combined with time pressure.');
    bonus += 10;
  }
  if (categories.has('impersonation') && categories.has('credential_request')) {
    combinations.push(
      'A claimed institution is asking for a code or PIN, which no bank or telco does.',
    );
    bonus += 22;
  }

  const base = patterns.reduce((sum, pattern) => sum + pattern.weight, 0);
  const ruleScore = Math.min(100, base + bonus);

  const hinted = RULES.filter(
    (rule) => rule.scamHint && patterns.some((pattern) => pattern.id === rule.id),
  ).sort((a, b) => b.weight - a.weight);

  return {
    patterns,
    ruleScore,
    scamCategory: hinted[0]?.scamHint ?? 'none',
    suggestedRiskLevel: riskFromScore(ruleScore),
    combinations,
  };
}

export type IdentifierType = 'phone' | 'paybill' | 'till' | 'account' | 'crypto' | 'url';

export type ExtractedTarget = {
  identifier: string;
  identifierType: IdentifierType;
  amountKes?: number;
};

const PAYBILL_RE = /\bpay\s?bill[^0-9]{0,12}(\d{5,7})\b/i;
const TILL_RE = /\b(?:till|buy goods)[^0-9]{0,12}(\d{5,7})\b/i;
const PHONE_RE = /(?:\+254|254|0)(?:7|1)\d{8}\b/;
const URL_RE =
  /https?:\/\/[^\s]+|\b[a-z0-9-]+\.(?:com|net|co\.ke|org|info|xyz|shop|top|ly|me|io|gg|tv|app|dev|cloud|link|page)\b/i;
const CRYPTO_RE = /\b(?:bc1[a-z0-9]{8,}|0x[a-fA-F0-9]{12,}|T[A-Za-z0-9]{20,})\b/;
const AMOUNT_RE = /\b(?:kes|ksh|kshs)\s?([\d,]{3,12})\b/i;

export function extractAmount(text: string): number | undefined {
  const match = AMOUNT_RE.exec(text);
  if (!match) return undefined;
  const value = Number(match[1].replaceAll(',', ''));
  return Number.isFinite(value) ? value : undefined;
}

/** Pulls the money destination out of a message so a recipient check can run automatically. */
export function extractPaymentTarget(text: string): ExtractedTarget | undefined {
  const amountKes = extractAmount(text);
  const paybill = PAYBILL_RE.exec(text);
  if (paybill) return { identifier: paybill[1], identifierType: 'paybill', amountKes };
  const till = TILL_RE.exec(text);
  if (till) return { identifier: till[1], identifierType: 'till', amountKes };
  const crypto = CRYPTO_RE.exec(text);
  if (crypto) return { identifier: crypto[0], identifierType: 'crypto', amountKes };
  // Kenyans type numbers with spaces/dashes ("0799 987 122"); match on a
  // compacted copy while keeping the surrounding text untouched.
  const phone = PHONE_RE.exec(text.replace(/\s+/g, ''));
  if (phone) return { identifier: canonicalizePhone(phone[0]), identifierType: 'phone', amountKes };
  const url = URL_RE.exec(text);
  if (url) return { identifier: url[0], identifierType: 'url', amountKes };
  return undefined;
}

const IDENTIFIER_TYPES: IdentifierType[] = ['phone', 'paybill', 'till', 'url', 'account', 'crypto'];

export function isIdentifierType(value: string | undefined): value is IdentifierType {
  return value !== undefined && (IDENTIFIER_TYPES as string[]).includes(value);
}

export function guessIdentifierType(raw: string): IdentifierType {
  const value = raw.trim();
  if (CRYPTO_RE.test(value)) return 'crypto';
  if (/^https?:\/\//i.test(value) || /\.[a-z]{2,}/i.test(value)) return 'url';
  if (/^\d{5,7}$/.test(value)) return 'paybill';
  if (/^\d{8,16}$/.test(value)) return 'account';
  return 'phone';
}

export type UrlAnalysis = {
  facts: string[];
  technical: string[];
  riskLevel: RiskLevel;
  impersonatedBrand?: string;
};

/** Structural, reputation and brand-impersonation checks for a URL. */
export function analyzeUrl(
  rawUrl: string,
  community?: { domainAgeDays?: number; reportCount: number; scamCategory: ScamCategory; notes?: string[] },
): UrlAnalysis {
  const url = rawUrl.trim();
  const host = url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  const facts: string[] = [];
  const technical: string[] = [`Resolved host: ${host}`];
  let score = 0;

  if (SHORTENERS.some((shortener) => host.endsWith(shortener))) {
    facts.push('The link uses a shortener, so the real destination is hidden until you open it.');
    technical.push('Link shortener detected in host.');
    score += 25;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    facts.push('The link points to a raw IP address instead of a named website.');
    technical.push('Host is a bare IPv4 address.');
    score += 35;
  }
  if (host.includes('xn--')) {
    facts.push('The web address uses look-alike characters to imitate a familiar name.');
    technical.push('Punycode / homograph host detected.');
    score += 40;
  }
  if (/^http:/i.test(url) && !/^https:/i.test(url)) {
    facts.push('The link is not encrypted, so anything you type on it can be read in transit.');
    technical.push('Scheme is http, not https.');
    score += 15;
  }

  const lookalike = LOOKALIKE_HINTS.find((hint) => host.includes(hint));
  const brand = KENYAN_BRANDS.find(
    (item) => host.includes(item.replaceAll('-', '')) || host.includes(item),
  );

  let positive = false;
  let warningCount = 0;
  if (lookalike) {
    facts.push(`The address "${host}" imitates a known Kenyan brand but is not an official domain.`);
    technical.push(`Lookalike pattern matched: ${lookalike}`);
    score += 45;
    warningCount++;
  } else if (brand && !host.endsWith('.co.ke')) {
    facts.push(`The address mentions ${brand} but does not use that company's official domain.`);
    technical.push(`Brand token "${brand}" on non-official domain.`);
    score += 30;
    warningCount++;
  } else if (brand && host.endsWith('.co.ke')) {
    facts.unshift(`${brand} uses its official ${host} domain, which matches our directory pattern.`);
    technical.push('Official Kenyan corporate domain pattern.');
    positive = true;
  }

  if (community) {
    if (typeof community.domainAgeDays === 'number' && community.domainAgeDays <= 30) {
      facts.push(
        `This domain was created ${community.domainAgeDays} days ago, which is very new for a brand that claims to be established.`,
      );
      technical.push(`Domain age: ${community.domainAgeDays} days.`);
      score += 25;
      warningCount++;
    }
    if (community.reportCount > 0) {
      facts.push(
        `${community.reportCount} people have reported this link for ${SCAM_CATEGORY_LABEL[community.scamCategory].toLowerCase()}.`,
      );
      score += 30;
      warningCount++;
    }
    for (const note of community.notes ?? []) technical.push(note);
  } else {
    if (!positive) {
      facts.push('We have no reports about this address yet, which is not the same as it being safe.');
      technical.push('No community reports found for this host.');
      warningCount++;
    }
  }

  return {
    facts,
    technical,
    riskLevel: score >= 60 ? 'red' : score >= 25 ? 'amber' : warningCount > 0 ? 'grey' : 'green',
    impersonatedBrand: lookalike ? brand : undefined,
  };
}

export type QrContentType =
  | 'url'
  | 'paybill'
  | 'till'
  | 'phone'
  | 'crypto'
  | 'wifi'
  | 'vcard'
  | 'text';

export const QR_CONTENT_LABEL: Record<QrContentType, string> = {
  url: 'Web link',
  paybill: 'M-Pesa Paybill instruction',
  till: 'Till / buy-goods instruction',
  phone: 'Phone number',
  crypto: 'Crypto payment request',
  wifi: 'Wi-Fi network settings',
  vcard: 'Contact card',
  text: 'Plain text instruction',
};

export function classifyQrContent(raw: string): QrContentType {
  if (/^wifi:/i.test(raw)) return 'wifi';
  if (/^begin:vcard/i.test(raw)) return 'vcard';
  if (/^https?:\/\//i.test(raw)) return 'url';
  if (CRYPTO_RE.test(raw)) return 'crypto';
  if (TILL_RE.test(raw)) return 'till';
  if (PAYBILL_RE.test(raw) || /^\*\d+/.test(raw)) return 'paybill';
  if (PHONE_RE.test(raw) && raw.trim().length < 20) return 'phone';
  return 'text';
}

export type WifiDetails = {
  ssid: string;
  security: string;
  open: boolean;
};

export function parseWifi(raw: string): WifiDetails {
  const ssid = /S:([^;]*)/i.exec(raw)?.[1] ?? 'Unknown network';
  const security = /T:([^;]*)/i.exec(raw)?.[1] ?? 'nopass';
  const open = /nopass/i.test(security) || security.trim() === '';
  return { ssid, security: open ? 'Open, no password' : security.toUpperCase(), open };
}

export type CommunityRiskSummary = {
  reportCount: number;
  riskLevel: RiskLevel | undefined;
  scamCategory: ScamCategory;
};

/** Red/amber verdicts must carry a concrete category — 'none' is never enough. */
export function resolveScamCategory(hinted: ScamCategory, fallback: ScamCategory): ScamCategory {
  if (hinted !== 'none') return hinted;
  return fallback;
}