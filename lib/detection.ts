import type {
  DetectedPattern,
  IdentifierType,
  PatternCategory,
  QrContentType,
  ReportedEntity,
  RiskLevel,
  ScamCategory,
  TrustedContact,
  VerifiedInstitution,
} from '@/lib/types';

/**
 * Layer 1 of the detection stack: a deterministic rules engine.
 * It is the sensor. It produces detectedPatterns[], a ruleScore (0-100) and a
 * suggestedRiskLevel. The LLM layer may only explain what this produced.
 */

type Rule = {
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
    id: 'payment-pressure',
    label: 'The message asks you to send money.',
    category: 'payment-pressure',
    weight: 16,
    matchers: [
      /\b(send (the )?money|send kes|send ksh|transfer|deposit|pay now|make payment|clear the balance)\b/i,
      /\b(tuma (pesa|hela|doh)|nitumie (pesa|hela)|lipa|malizia malipo)\b/i,
    ],
  },
  {
    id: 'new-destination',
    label: 'You are told to pay a new or different number, Paybill or Till.',
    category: 'new-destination',
    weight: 20,
    matchers: [
      /\b(new (paybill|till|number|account)|use this (paybill|till|number|account)|changed (our|the) (paybill|number|account))\b/i,
      /\b(namba (hii )?mpya|tuma kwa namba hii|paybill mpya)\b/i,
    ],
  },
  {
    id: 'reversal-claim',
    label: 'Someone claims money was sent to you by mistake.',
    category: 'reversal-claim',
    weight: 30,
    scamHint: 'mpesa-reversal',
    matchers: [
      /\b(sent (you )?money by mistake|wrong number|reverse the (money|transaction)|return the money|refund my money)\b/i,
      /\b(umetuma pesa kwangu kimakosa|nimetuma kimakosa|nirudishie (pesa|hela)|rudisha pesa)\b/i,
    ],
  },
  {
    id: 'credential-request',
    label: 'You are asked for a PIN, password or verification code.',
    category: 'credential-request',
    weight: 34,
    scamHint: 'fake-safaricom-agent',
    matchers: [
      /\b(share your (pin|password|otp|code)|send (me )?the (code|otp|pin)|confirm your pin|enter your pin|id number and pin)\b/i,
      /\b(nitumie code|niambie pin|tuma pin|weka pin yako)\b/i,
    ],
  },
  {
    id: 'authority-threat',
    label: 'The message threatens that your account or line will be blocked.',
    category: 'authority-threat',
    weight: 24,
    scamHint: 'fake-safaricom-agent',
    matchers: [
      /\b(account will be (blocked|suspended|deactivated)|line will be (blocked|deregistered)|sim will be blocked|failure to comply)\b/i,
      /\b(akaunti yako imefungwa|laini yako itafungwa|itafungwa leo)\b/i,
    ],
  },
  {
    id: 'police-threat',
    label: 'The caller claims to be police, court or a government officer.',
    category: 'impersonation',
    weight: 28,
    scamHint: 'police-impersonation',
    matchers: [
      /\b(police|dci|court|warrant|officer|prosecut|arrest)\b/i,
      /\b(niko police station|polisi|mahakama|nimeshikwa)\b/i,
    ],
  },
  {
    id: 'bank-impersonation',
    label: 'The sender claims to be a bank or mobile money provider.',
    category: 'impersonation',
    weight: 22,
    scamHint: 'fake-bank-rep',
    matchers: [
      /\b(kcb|equity|co-?op bank|absa|ncba|stanbic|dtb|family bank|sacco|safaricom|m-?pesa|airtel money)\b/i,
      /\b(customer care|bank agent|fraud department|verification department)\b/i,
    ],
  },
  {
    id: 'family-emergency',
    label: 'The message claims a relative is in trouble and needs money fast.',
    category: 'emotional-pressure',
    weight: 28,
    scamHint: 'family-emergency',
    matchers: [
      /\b(your (child|son|daughter|mother|father) is in (trouble|hospital)|accident|admitted|bail|emergency)\b/i,
      /\b(niko hospitali|mtoto wako|ajali|nisaidie haraka|niko ndani)\b/i,
    ],
  },
  {
    id: 'reward-bait',
    label: 'The message promises a prize, refund or reward.',
    category: 'reward-bait',
    weight: 26,
    scamHint: 'prize-lottery',
    matchers: [
      /\b(you have won|congratulations|you'?ve been selected|claim your (prize|reward|bonus)|lucky winner|promo)\b/i,
      /\b(umeshinda|hongera|umechaguliwa|zawadi yako)\b/i,
    ],
  },
  {
    id: 'job-loan-bait',
    label: 'The message offers a job, loan or investment with an upfront fee.',
    category: 'reward-bait',
    weight: 24,
    scamHint: 'fake-job-loan',
    matchers: [
      /\b(job (offer|opportunity)|instant loan|loan approved|registration fee|processing fee|no cv needed|work from home)\b/i,
      /\b(kazi (ya haraka|mzuri)|mkopo (wa haraka|papo hapo)|ada ya usajili)\b/i,
    ],
  },
  {
    id: 'delivery-bait',
    label: 'The message claims a delivery or order needs a payment to be released.',
    category: 'payment-pressure',
    weight: 20,
    scamHint: 'fake-delivery',
    matchers: [
      /\b(parcel|package|delivery fee|customs fee|courier|your order (is )?(held|pending))\b/i,
      /\b(mzigo wako|ada ya usafirishaji)\b/i,
    ],
  },
  {
    id: 'sim-swap',
    label: 'The message asks you to approve a SIM or line change.',
    category: 'credential-request',
    weight: 30,
    scamHint: 'sim-swap',
    matchers: [
      /\b(sim (swap|replacement)|new sim|line upgrade|4g upgrade|dial \*\d+)\b/i,
      /\b(badilisha (sim|laini)|simu mpya ya laini)\b/i,
    ],
  },
  {
    id: 'crypto-bait',
    label: 'You are asked to pay with crypto, which cannot be reversed.',
    category: 'crypto-irreversible',
    weight: 30,
    scamHint: 'crypto-investment',
    matchers: [
      /\b(usdt|bitcoin|btc|binance|trust wallet|crypto|double your money|guaranteed returns|forex signals)\b/i,
    ],
  },
  {
    id: 'link-bait',
    label: 'The message contains a link you are pushed to open.',
    category: 'link-obfuscation',
    weight: 12,
    matchers: [/\b(click (here|the link)|open this link|register here|verify here|http(s)?:\/\/)/i],
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

export const SCAM_CATEGORY_LABEL: Record<ScamCategory, string> = {
  'mpesa-reversal': 'M-Pesa reversal scam',
  'fake-safaricom-agent': 'Fake Safaricom agent',
  'fake-bank-rep': 'Fake bank representative',
  'police-impersonation': 'Police or court impersonation',
  'family-emergency': 'Family emergency scam',
  'fake-job-loan': 'Fake job or loan offer',
  'prize-lottery': 'Prize or lottery scam',
  'sim-swap': 'SIM-swap attempt',
  'fake-delivery': 'Fake delivery or online-shopping scam',
  'qr-merchant-phishing': 'QR or merchant phishing',
  'crypto-investment': 'Crypto investment scam',
  none: 'No known scam pattern',
};

/**
 * Layer 3 of the stack: the explainer. Calm, plain language, one concrete step,
 * never a certainty claim, never overriding the rule-based level.
 */
const AI_GLOSS: Record<ScamCategory, string> = {
  'mpesa-reversal':
    'This looks like a scam where fraudsters claim you received money by mistake and ask you to send it back to a different number, so your own money leaves your account.',
  'fake-safaricom-agent':
    'Messages like this copy how Safaricom writes, but a real agent will never ask you for your PIN or a verification code.',
  'fake-bank-rep':
    'Fraudsters often call pretending to be from a bank fraud desk, because people move fast when they think their account is at risk.',
  'police-impersonation':
    'Scammers use police or court language to create fear, because frightened people pay before they check.',
  'family-emergency':
    'This pattern uses worry about someone you love to rush you, so the safest step is to call that person on the number you already have.',
  'fake-job-loan':
    'Genuine jobs and licensed lenders do not ask you to pay a fee first, so an upfront payment request here is a strong warning sign.',
  'prize-lottery':
    'You cannot win a promotion you never entered, and a real prize never needs a fee to be released.',
  'sim-swap':
    'This pattern is used to take over your line, which then gives someone else access to your mobile money.',
  'fake-delivery':
    'Fake delivery notices ask for small fees to a personal number, which is different from how real couriers collect payment.',
  'qr-merchant-phishing':
    'QR codes hide where they lead, so a code that opens a login or payment page for a brand you know is worth checking before you enter anything.',
  'crypto-investment':
    'Crypto payments cannot be reversed once sent, and promises of guaranteed returns are one of the most common ways people lose savings.',
  none: 'Nothing in the wording matched a known scam pattern, but a message can still be harmful, so treat anything unexpected with care.',
};

export function aiGloss(category: ScamCategory) {
  return AI_GLOSS[category];
}

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
  if (categories.has('impersonation') && categories.has('payment-pressure')) {
    combinations.push(
      'A claimed identity is combined with a money request, which real institutions do not do.',
    );
    bonus += 18;
  }
  if (categories.has('urgency') && categories.has('payment-pressure')) {
    combinations.push('A payment request is combined with time pressure.');
    bonus += 10;
  }
  if (categories.has('impersonation') && categories.has('credential-request')) {
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

export type ExtractedTarget = {
  identifier: string;
  identifierType: IdentifierType;
  amountKes?: number;
};

const PAYBILL_RE = /\bpay\s?bill[^0-9]{0,12}(\d{5,7})\b/i;
const TILL_RE = /\b(?:till|buy goods)[^0-9]{0,12}(\d{5,7})\b/i;
const PHONE_RE = /(?:\+254|254|0)(?:7|1)\d{8}\b/;
const URL_RE = /https?:\/\/[^\s]+|\b[a-z0-9-]+\.(?:com|net|co\.ke|org|info|xyz|shop|top)\b/i;
const CRYPTO_RE = /\b(?:bc1[a-z0-9]{8,}|0x[a-fA-F0-9]{12,}|T[A-Za-z0-9]{20,})\b/;
const AMOUNT_RE = /\b(?:kes|ksh|kshs)\s?([\d,]{3,12})\b/i;

export function extractAmount(text: string) {
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
  const phone = PHONE_RE.exec(text);
  if (phone) return { identifier: normalisePhone(phone[0]), identifierType: 'phone', amountKes };
  const url = URL_RE.exec(text);
  if (url) return { identifier: url[0], identifierType: 'url', amountKes };
  return undefined;
}

export function normalisePhone(raw: string) {
  const digits = raw.replaceAll(/[^\d]/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  return raw.trim();
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

export type ClaimedIdentity = {
  name: string;
  kind: 'institution' | 'contact';
  officialNumbers: string[];
  contactId?: string;
  relationship?: string;
};

/** Checks a claimed identity against the verified directory and the user's trusted contacts. */
export function detectClaimedIdentity(
  text: string,
  institutions: VerifiedInstitution[],
  contacts: TrustedContact[],
): ClaimedIdentity | undefined {
  const lower = text.toLowerCase();

  for (const institution of institutions) {
    const hit = institution.aliases.some((alias) => lower.includes(alias.toLowerCase()));
    if (hit) {
      return {
        name: institution.name,
        kind: 'institution',
        officialNumbers: institution.officialNumbers,
      };
    }
  }

  for (const contact of contacts) {
    const firstName = contact.name.split(' ')[0].toLowerCase();
    const relationship = contact.relationship.toLowerCase();
    if (lower.includes(firstName) || lower.includes(relationship)) {
      return {
        name: contact.name,
        kind: 'contact',
        officialNumbers: [contact.phone],
        contactId: contact.id,
        relationship: contact.relationship,
      };
    }
  }

  return undefined;
}

export type UrlAnalysis = {
  facts: string[];
  technical: string[];
  riskLevel: RiskLevel;
  impersonatedBrand?: string;
};

/** Structural, reputation and brand-impersonation checks for a URL. */
export function analyzeUrl(rawUrl: string, entity?: ReportedEntity): UrlAnalysis {
  const url = rawUrl.trim();
  const host = url
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .toLowerCase();
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
  if (!/^https:/i.test(url) && /^http:/i.test(url)) {
    facts.push('The link is not encrypted, so anything you type on it can be read in transit.');
    technical.push('Scheme is http, not https.');
    score += 15;
  }

  const lookalike = LOOKALIKE_HINTS.find((hint) => host.includes(hint));
  const brand = KENYAN_BRANDS.find(
    (item) => host.includes(item.replaceAll('-', '')) || host.includes(item),
  );

  if (lookalike) {
    facts.push(
      `The address "${host}" imitates a known Kenyan brand but is not an official domain.`,
    );
    technical.push(`Lookalike pattern matched: ${lookalike}`);
    score += 45;
  } else if (brand && !host.endsWith('.co.ke')) {
    facts.push(`The address mentions ${brand} but does not use that company's official domain.`);
    technical.push(`Brand token "${brand}" on non-official domain.`);
    score += 30;
  }

  if (entity) {
    if (typeof entity.domainAgeDays === 'number') {
      technical.push(`Domain age: ${entity.domainAgeDays} days.`);
      if (entity.domainAgeDays <= 30) {
        facts.push(
          `This domain was created ${entity.domainAgeDays} days ago, which is very new for a brand that claims to be established.`,
        );
        score += 25;
      }
    }
    if (entity.reportCount > 0) {
      facts.push(
        `${entity.reportCount} people have reported this link for ${SCAM_CATEGORY_LABEL[entity.scamCategory].toLowerCase()}.`,
      );
      score += 30;
    }
    for (const note of entity.notes ?? []) technical.push(note);
  } else {
    facts.push(
      'We have no reports about this address yet, which is not the same as it being safe.',
    );
    technical.push('No community reports found for this host.');
  }

  return {
    facts,
    technical,
    riskLevel: score >= 60 ? 'red' : score >= 25 ? 'amber' : facts.length > 0 ? 'grey' : 'green',
    impersonatedBrand: lookalike ? brand : undefined,
  };
}

export const QR_CONTENT_LABEL: Record<QrContentType, string> = {
  url: 'Web link',
  'mobile-money': 'Mobile money instruction',
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
  if (PAYBILL_RE.test(raw) || TILL_RE.test(raw) || /^\*\d+/.test(raw)) return 'mobile-money';
  if (PHONE_RE.test(raw) && raw.trim().length < 20) return 'phone';
  return 'text';
}
