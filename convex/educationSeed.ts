/**
 * Education content seed (backend brief Section 9 / 2.12).
 *
 * Populates `literacyLessons` and `scamExamples` on first run (idempotent via
 * the `literacyLessons.title` uniqueness). Content mirrors the curated frontend
 * seed (`lib/seed.ts`) kept in the backend so the simulator and literacy
 * screens have data before any user editing. Bootstrap — no auth required.
 */

import { mutation } from './_generated/server';

type ExternalResource = {
  title: string;
  sourceOrg: string;
  url: string;
  resourceType: 'article' | 'video' | 'officialNotice';
};

const LITERACY_LESSONS: {
  title: string;
  category: string;
  bullets: string[];
  relatedScamCategory: string;
  externalResources?: ExternalResource[];
}[] = [
  {
    title: 'How the M-Pesa reversal scam works',
    category: 'scam-patterns',
    relatedScamCategory: 'mpesa-reversal',
    bullets: [
      'You get a message or call saying money was sent to you by mistake.',
      'The "sender" is upset and in a hurry, so you feel pressure to fix it.',
      'You are asked to send it to a different number or Paybill — not the one that supposedly sent it.',
      'Check your real M-Pesa balance and statement before you move anything.',
      'A genuine wrong transfer is reversed by Safaricom, not by you sending money back.',
    ],
  },
  {
    title: 'When someone calls claiming to be your bank',
    category: 'banks-merchants',
    relatedScamCategory: 'fake-bank-rep',
    bullets: [
      'A bank never asks for your PIN, full card number, OTP or password.',
      'A bank never asks you to move money to a "safe" or "holding" account.',
      'Caller ID can be faked, so the number on your screen proves nothing.',
      'Hang up and call the bank on the number saved in Dhibiti or printed on your card.',
      'If a caller resists you hanging up to verify, that is the strongest sign it is a scam.',
    ],
  },
  {
    title: 'Why QR codes need checking before you scan-and-pay',
    category: 'scam-patterns',
    relatedScamCategory: 'qr-merchant-phishing',
    bullets: [
      'A QR code can hold a link, a Paybill, a phone number or a wallet address — you cannot see which by looking.',
      'Fake merchant codes are printed over real ones or sent as "invoices" on WhatsApp.',
      'Look at the domain after scanning, not the logo on the poster.',
      'Never enter your PIN or ID number on a page you reached from a QR code.',
      'If the code was sent to you by someone in a hurry, treat it as unverified.',
    ],
  },
  {
    title: 'The family emergency script',
    category: 'scam-patterns',
    relatedScamCategory: 'family-emergency',
    bullets: [
      'The message claims a relative is arrested, in hospital or stranded.',
      'It asks for secrecy so you cannot confirm with anyone else.',
      'The number is always new or "borrowed from a friend".',
      'Call your relative on the number you already have saved. Always.',
      'Agree a simple family rule: no money moves on a message alone.',
    ],
  },
  {
    title: 'Prize and promotion scams',
    category: 'scam-patterns',
    relatedScamCategory: 'prize-lottery',
    bullets: [
      'You cannot win a promotion you never entered.',
      'A real prize never requires a fee to be released.',
      'Scammers use real brand names and logos freely.',
      "Confirm promotions on the brand's official channels, never through the message link.",
    ],
  },
  {
    title: 'SIM-swap basics',
    category: 'mobile-money',
    relatedScamCategory: 'sim-swap',
    bullets: [
      'Never approve a SIM replacement you did not request.',
      'Never share codes sent to your phone, even with "customer care".',
      'If your line suddenly loses service, check with your provider immediately.',
      'Use a PIN on your SIM as well as on your phone.',
    ],
  },
  {
    title: 'Personal number vs Paybill vs Till',
    category: 'mobile-money',
    relatedScamCategory: 'fake-bank-rep',
    bullets: [
      'A personal number belongs to an individual; a business asking you to pay one is a warning sign.',
      'A Paybill has an account number field — the account tells the business who paid.',
      'A Till is for buy-goods payments at a merchant point.',
      'Registered businesses have a consistent, published Paybill or Till. It does not change weekly.',
      'A brand-new Paybill claiming to be a large institution deserves a phone call first.',
    ],
  },
  {
    title: 'What a real M-Pesa confirmation looks like',
    category: 'mobile-money',
    relatedScamCategory: 'mpesa-reversal',
    bullets: [
      'Real confirmations come from the M-PESA sender ID, in your existing message thread.',
      'They contain a transaction code, the exact amount, the name and your new balance.',
      'A screenshot proves nothing — check your own balance instead.',
      'Reversals are handled by Safaricom, and only within their own rules and window.',
    ],
  },
  {
    title: 'Checking that a business is real',
    category: 'banks-merchants',
    relatedScamCategory: 'fake-delivery',
    bullets: [
      'Look for a physical address, a landline or a long-standing social presence.',
      'A business licence number can be checked with the county.',
      'Pay to a Till or Paybill in the business name, not a personal number.',
      'Be wary of prices far below market, and of pressure to pay a deposit today.',
      'Ask for the official number and call it from your own dialler.',
    ],
  },
  {
    title: 'If you have already sent money',
    category: 'rights-recourse',
    relatedScamCategory: 'none',
    bullets: [
      'Call your provider immediately: Safaricom on 100, or your bank fraud desk.',
      'Report to the DCI and get an OB number from the nearest police station.',
      'Keep screenshots, transaction codes, numbers and times.',
      'Report the number or Paybill in Dhibiti so others are warned.',
      'Be careful of "recovery agents" who ask for a fee — that is a second scam.',
    ],
  },
  {
    title: 'How your report protects other people',
    category: 'rights-recourse',
    relatedScamCategory: 'none',
    bullets: [
      'Reports are aggregated and counted by unique reporter, so no single person can label a number alone.',
      'Identifiers are stored, not your message content, unless you explicitly share it.',
      'When several people report the same Paybill, it moves to confirmed status.',
      'Confirmed identifiers power Scam Radar warnings in your county.',
    ],
  },
  {
    title: "How to talk to parents about scams",
    category: 'rights-recourse',
    relatedScamCategory: 'family-emergency',
    bullets: [
      'Never open with "don\'t be careless" — open with "this one nearly caught me too".',
      'Agree one family rule: we always call each other back on saved numbers.',
      'Set a family code word for real emergencies.',
      'Make it normal to check with you before sending money, with no judgement.',
      'Set up Dhibiti alerts together so consent is clear.',
    ],
  },
];

const SCAM_EXAMPLES: {
  textSw: string;
  textEn: string;
  scamType: string;
  riskLevel: 'red' | 'amber' | 'green';
  patterns: string[];
  notes?: string;
}[] = [
  {
    textSw: 'Nimetuma pesa kwako kimakosa, tafadhali nirudishie kwa namba hii haraka.',
    textEn: 'I sent money to you by mistake, please send it back to this number urgently.',
    scamType: 'mpesa-reversal',
    riskLevel: 'red',
    patterns: ['reversal-claim', 'urgency', 'new-destination'],
    notes: 'Check your own balance. Real reversals are handled by Safaricom.',
  },
  {
    textSw: 'Habari, ni KCB. Akaunti yako imefungwa. Nitumie code uliyopata ili tufungue.',
    textEn: 'Hello, this is KCB. Your account is blocked. Send me the code you received so we can unblock it.',
    scamType: 'fake-bank-rep',
    riskLevel: 'red',
    patterns: ['impersonation', 'authority-threat', 'credential-request'],
    notes: 'No bank ever asks for a code. Call the bank on its official number.',
  },
  {
    textSw: 'Hongera! Umeshinda KES 250,000 kwa promo ya Safaricom. Lipa KES 500 ya usajili.',
    textEn: 'Congratulations! You have won KES 250,000 in the Safaricom promo. Pay KES 500 registration.',
    scamType: 'prize-lottery',
    riskLevel: 'red',
    patterns: ['reward-bait', 'payment-pressure'],
    notes: 'A real prize never needs a fee.',
  },
  {
    textSw: 'Mum niko police station, nisaidie 20,000 haraka. Usimwambie mtu.',
    textEn: 'Mum I am at the police station, help me with 20,000 quickly. Do not tell anyone.',
    scamType: 'family-emergency',
    riskLevel: 'red',
    patterns: ['emotional-pressure', 'urgency', 'secrecy'],
    notes: 'Call the relative on their saved number before anything else.',
  },
  {
    textSw: 'M-PESA: Umepokea KES 1,500 kutoka JOHN MWANGI. Salio jipya ni KES 4,320.',
    textEn: 'M-PESA: You have received KES 1,500 from JOHN MWANGI. New balance is KES 4,320.',
    scamType: 'none',
    riskLevel: 'green',
    patterns: [],
    notes: 'Format and sender ID match a genuine M-Pesa confirmation.',
  },
  {
    textSw: 'Kazi ya haraka Nairobi, mshahara 45,000. Tuma 700 ya usajili kwa 0780 554 433.',
    textEn: 'Quick job in Nairobi, salary 45,000. Send 700 registration fee to 0780 554 433.',
    scamType: 'fake-job-loan',
    riskLevel: 'red',
    patterns: ['reward-bait', 'payment-pressure', 'new-destination'],
    notes: 'Genuine employers do not charge you to be hired.',
  },
  {
    textSw: 'Mzigo wako umefika. Lipa ada ya usafirishaji KES 350 kwa namba hii ili tuachilie.',
    textEn: 'Your parcel has arrived. Pay a delivery fee of KES 350 to this number to release it.',
    scamType: 'fake-delivery',
    riskLevel: 'amber',
    patterns: ['payment-pressure', 'new-destination'],
    notes: 'Confirm with the courier using the number on their official website.',
  },
  {
    textSw: 'Dear customer, your Equity statement is ready. Log in at equity.co.ke to view.',
    textEn: 'Dear customer, your Equity statement is ready. Log in at equity.co.ke to view.',
    scamType: 'none',
    riskLevel: 'green',
    patterns: [],
    notes: 'No pressure, no payment request, official domain.',
  },
  {
    textSw: 'Tumia paybill mpya 790125 kwa malipo ya leo. Ya zamani imefungwa.',
    textEn: "Use new paybill 790125 for today's payments. The old one is closed.",
    scamType: 'fake-bank-rep',
    riskLevel: 'red',
    patterns: ['new-destination', 'urgency'],
    notes: 'A switched payment destination is one of the strongest single warning signs.',
  },
  {
    textSw: 'Invest 5,000 in USDT today and get guaranteed 30,000 in one week. Tuma haraka.',
    textEn: 'Invest 5,000 in USDT today and get a guaranteed 30,000 in one week. Send quickly.',
    scamType: 'crypto-investment',
    riskLevel: 'red',
    patterns: ['crypto-irreversible', 'reward-bait', 'urgency'],
    notes: 'Guaranteed returns do not exist, and crypto payments cannot be reversed.',
  },
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Literacy lessons — idempotent on title.
    let lessons = 0;
    for (const lesson of LITERACY_LESSONS) {
      const existing = await ctx.db
        .query('literacyLessons')
        .filter((q) => q.eq(q.field('title'), lesson.title))
        .first();
      if (!existing) {
        await ctx.db.insert('literacyLessons', {
          title: lesson.title,
          category: lesson.category,
          bullets: lesson.bullets,
          relatedScamCategory: lesson.relatedScamCategory,
          externalResources: lesson.externalResources ?? [],
        });
        lessons++;
      }
    }

    // Scam examples — idempotent on the English text.
    let examples = 0;
    const existingExamples = await ctx.db.query('scamExamples').collect();
    const knownText = new Set(existingExamples.map((e) => e.textEn));
    for (const ex of SCAM_EXAMPLES) {
      if (knownText.has(ex.textEn)) continue;
      await ctx.db.insert('scamExamples', {
        textSw: ex.textSw,
        textEn: ex.textEn,
        scamType: ex.scamType,
        riskLevel: ex.riskLevel,
        patterns: ex.patterns,
        notes: ex.notes,
      });
      examples++;
    }

    return { lessons, examples };
  },
});
