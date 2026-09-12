import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Dhibiti backend schema — Convex.
 *
 * Mirrors the backend brief "Section 2: FULL SCHEMA" exactly for the public
 * tables (naming, validators and indexes come from the spec). Three operational
 * tables are added beyond the spec and are called out below:
 *
 *  - `sessions`          — the spec allows "Convex Auth OR an equivalent
 *                          session pattern". Auth is phone+OTP with a mock SMS
 *                          provider in the foundation pass, so sessions are
 *                          opaque server-side tokens (hash stored, 30-day
 *                          inactivity expiry). Revocable and simple.
 *  - `otpRequests`       — persistence for the OTP rate limit (max 3 per phone
 *                          per 10 minutes, Section 1 / 13.2).
 *  - `aiExplanationCache` — Section 3.3 explicitly endorses this to control
 *                          LLM cost: keyed by the rule combination hash, one
 *                          generated explanation reused for identical
 *                          pattern+risk+category combos.
 *
 * Every enum field uses `v.union(v.literal(...))` so invalid values are
 * rejected at the schema boundary, never just in application code.
 */

export const RISK_LEVELS = ['red', 'amber', 'green', 'blue', 'grey'] as const;
export const IDENTIFIER_TYPES = ['phone', 'paybill', 'till', 'account', 'crypto'] as const;
export const CHECK_TYPES = ['sms', 'call', 'qr', 'number', 'link'] as const;

export const riskLevel = v.union(
  v.literal('red'),
  v.literal('amber'),
  v.literal('green'),
  v.literal('blue'),
  v.literal('grey'),
);

export const identifierType = v.union(
  v.literal('phone'),
  v.literal('paybill'),
  v.literal('till'),
  v.literal('account'),
  v.literal('crypto'),
);

export const checkType = v.union(
  v.literal('sms'),
  v.literal('call'),
  v.literal('qr'),
  v.literal('number'),
  v.literal('link'),
);

export const qrContentType = v.union(
  v.literal('url'),
  v.literal('paybill'),
  v.literal('till'),
  v.literal('phone'),
  v.literal('crypto'),
  v.literal('wifi'),
  v.literal('vcard'),
  v.literal('text'),
);

// ---------------------------------------------------------------------------
// 2.1 users
// ---------------------------------------------------------------------------
const users = defineTable({
  phone: v.string(), // canonical +254XXXXXXXXX
  email: v.optional(v.string()),
  name: v.string(),
  roles: v.array(
    v.union(
      v.literal('standalone'),
      v.literal('familyAdmin'),
      v.literal('protectedMember'),
      v.literal('groupAdmin'),
      v.literal('groupMember'),
      v.literal('moderator'),
    ),
  ),
  // Operational addition beyond the spec (Section 2.1): stores the sharing
  // prefs wired by `users.updatePrivacySettings` (Section 5.3), which the spec
  // lists as a function but gives no storage for.
  privacySettings: v.optional(
    v.object({
      shareLocation: v.optional(v.boolean()),
      sharePaymentActivity: v.optional(v.boolean()),
      shareCircleAlerts: v.optional(v.boolean()),
    }),
  ),
  createdAt: v.number(),
  lastActiveAt: v.number(),
}).index('by_phone', ['phone']);

// ---------------------------------------------------------------------------
// 2.2 checks
// ---------------------------------------------------------------------------
const checks = defineTable({
  userId: v.id('users'),
  type: checkType,
  inputSummary: v.string(), // redacted/truncated original input
  detectedPatterns: v.array(v.string()), // rule-engine pattern ids
  ruleScore: v.number(), // 0-100 deterministic
  riskLevel,
  scamCategory: v.optional(v.string()),
  aiExplanation: v.optional(v.string()), // LLM gloss only — never a risk field
  recommendedActions: v.array(v.string()),
  linkedQrScanId: v.optional(v.id('qrScans')),
  linkedUrlScanId: v.optional(v.id('urlScans')),
  linkedEntityId: v.optional(v.id('reportedEntities')),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_createdAt', ['userId', 'createdAt']);

// ---------------------------------------------------------------------------
// 2.3 reportedEntities
// ---------------------------------------------------------------------------
const reportedEntities = defineTable({
  identifier: v.string(),
  identifierType,
  riskLevel,
  scamCategory: v.optional(v.string()),
  reportCount: v.number(),
  uniqueReporterIds: v.array(v.id('users')),
  matchedInstitutionId: v.optional(v.id('institutionDirectory')),
  firstReportedAt: v.optional(v.number()),
  lastReportedAt: v.optional(v.number()),
  reviewStatus: v.union(
    v.literal('unreviewed'),
    v.literal('moderatorConfirmed'),
    v.literal('moderatorDismissed'),
  ),
}).index('by_identifier', ['identifier', 'identifierType']);

// ---------------------------------------------------------------------------
// 2.4 qrScans
// ---------------------------------------------------------------------------
const qrScans = defineTable({
  contentHash: v.string(),
  contentType: qrContentType,
  destinationSummary: v.string(),
  riskLevel,
  reasons: v.array(v.string()),
  scanCount: v.number(),
  contributingUserIds: v.array(v.id('users')),
  firstSeenAt: v.number(),
  lastVerifiedAt: v.number(),
}).index('by_contentHash', ['contentHash']);

// ---------------------------------------------------------------------------
// 2.5 urlScans
// ---------------------------------------------------------------------------
const urlScans = defineTable({
  domain: v.string(), // canonical, lowercased
  canonicalUrl: v.string(),
  authenticityStatus: v.union(
    v.literal('verified'),
    v.literal('notAuthentic'),
    v.literal('unverified'),
  ),
  matchedInstitutionId: v.optional(v.id('institutionDirectory')),
  redirectChain: v.array(v.string()),
  domainAgeDays: v.optional(v.number()),
  sslValid: v.optional(v.boolean()),
  reportCount: v.number(),
  uniqueReporterIds: v.array(v.id('users')),
  lastCheckedAt: v.number(),
}).index('by_domain', ['domain']);

// ---------------------------------------------------------------------------
// 2.6 institutionDirectory
// ---------------------------------------------------------------------------
const institutionDirectory = defineTable({
  officialName: v.string(),
  category: v.union(
    v.literal('bank'),
    v.literal('telco'),
    v.literal('hospital'),
    v.literal('government'),
  ),
  subcategory: v.optional(v.string()),
  officialNumbers: v.array(v.string()),
  websiteUrl: v.string(),
  poBox: v.optional(v.string()),
  physicalAddress: v.optional(v.string()),
  mapId: v.optional(v.string()),
  town: v.optional(v.string()),
  verifiedAt: v.number(),
  sourceUrl: v.string(),
})
  .index('by_category', ['category'])
  .searchIndex('search_name', { searchField: 'officialName' });

// ---------------------------------------------------------------------------
// 2.7 directoryIssueReports
// ---------------------------------------------------------------------------
const directoryIssueReports = defineTable({
  institutionEntryId: v.id('institutionDirectory'),
  reporterUserId: v.id('users'),
  description: v.string(),
  status: v.union(v.literal('open'), v.literal('reviewed'), v.literal('resolved')),
  createdAt: v.number(),
})
  .index('by_entry', ['institutionEntryId'])
  .index('by_status', ['status']);

// ---------------------------------------------------------------------------
// 2.8 trustedContacts
// ---------------------------------------------------------------------------
const trustedContacts = defineTable({
  userId: v.id('users'),
  name: v.string(),
  relationship: v.string(),
  phone: v.string(),
  verified: v.boolean(),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.9 familyCircles + familyMemberships
// ---------------------------------------------------------------------------
const familyCircles = defineTable({
  adminUserId: v.id('users'),
  name: v.optional(v.string()),
  createdAt: v.number(),
});

const familyMemberships = defineTable({
  circleId: v.id('familyCircles'),
  userId: v.id('users'),
  role: v.union(v.literal('admin'), v.literal('protected')),
  status: v.union(v.literal('active'), v.literal('pending')),
  sharingLevel: v.union(
    v.literal('alertsOnly'),
    v.literal('withRecipient'),
    v.literal('withAmount'),
    v.literal('full'),
  ),
})
  .index('by_circle', ['circleId'])
  .index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.10 groupCircles + groupMemberships
// ---------------------------------------------------------------------------
const groupCircles = defineTable({
  name: v.string(),
  adminUserId: v.id('users'),
  createdAt: v.number(),
});

const groupMemberships = defineTable({
  groupId: v.id('groupCircles'),
  userId: v.id('users'),
  role: v.union(v.literal('admin'), v.literal('member')),
  status: v.union(v.literal('active'), v.literal('pending')),
})
  .index('by_group', ['groupId'])
  .index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.11 alerts
// ---------------------------------------------------------------------------
const alerts = defineTable({
  circleId: v.string(), // familyCircles or groupCircles id, disambiguated by circleType
  circleType: v.union(v.literal('family'), v.literal('group')),
  relatedCheckId: v.optional(v.id('checks')),
  summary: v.string(),
  riskLevel,
  suggestedAction: v.string(),
  createdAt: v.number(),
}).index('by_circle', ['circleId']);

// ---------------------------------------------------------------------------
// 2.12 literacyLessons + scamExamples
// ---------------------------------------------------------------------------
const literacyLessons = defineTable({
  title: v.string(),
  category: v.string(),
  bullets: v.array(v.string()),
  relatedScamCategory: v.optional(v.string()),
  externalResources: v.array(
    v.object({
      title: v.string(),
      sourceOrg: v.string(),
      url: v.string(),
      resourceType: v.union(
        v.literal('article'),
        v.literal('video'),
        v.literal('officialNotice'),
      ),
    }),
  ),
});

const scamExamples = defineTable({
  textSw: v.optional(v.string()),
  textEn: v.string(),
  scamType: v.string(),
  riskLevel: v.union(v.literal('red'), v.literal('amber'), v.literal('green')),
  patterns: v.array(v.string()),
  notes: v.optional(v.string()),
}).index('by_scamType', ['scamType']);

// ---------------------------------------------------------------------------
// 2.13 scamRadarEvents
// ---------------------------------------------------------------------------
const scamRadarEvents = defineTable({
  scamCategory: v.string(),
  roughLocation: v.string(), // county/town only, never precise coordinates
  reportCountLast24h: v.number(),
  sampleAnonymizedSummary: v.string(),
  generatedAt: v.number(),
}).index('by_location', ['roughLocation']);

// ---------------------------------------------------------------------------
// 2.14 paymentLocks
// ---------------------------------------------------------------------------
const paymentLocks = defineTable({
  userId: v.id('users'),
  checkId: v.optional(v.id('checks')),
  riskLevel: v.union(v.literal('red'), v.literal('amber')),
  lockDurationSeconds: v.number(),
  startedAt: v.number(),
  status: v.union(v.literal('locked'), v.literal('released'), v.literal('overriddenByAdmin')),
  /** Set when an admin overrides a protected member's lock (Section 8 requires these be logged). */
  overriddenByUserId: v.optional(v.id('users')),
  overrideNote: v.optional(v.string()),
  releasedAt: v.optional(v.number()),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.15 safetyScoreEvents
// ---------------------------------------------------------------------------
const safetyScoreEvents = defineTable({
  userId: v.id('users'),
  source: v.union(v.literal('simulatorRound'), v.literal('verifiedCheck'), v.literal('reportSubmitted')),
  delta: v.number(),
  createdAt: v.number(),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.16 floatingShieldPreferences
// ---------------------------------------------------------------------------
const floatingShieldPreferences = defineTable({
  userId: v.id('users'),
  enabled: v.boolean(),
  bubblePosition: v.union(v.literal('left'), v.literal('right')),
  detectionMode: v.union(v.literal('clipboard'), v.literal('accessibility')),
  pausedUntil: v.optional(v.number()),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.17 quarantinedMessages
// ---------------------------------------------------------------------------
const quarantinedMessages = defineTable({
  userId: v.id('users'),
  senderId: v.string(),
  messageSummary: v.string(),
  reason: v.string(),
  status: v.union(
    v.literal('quarantined'),
    v.literal('restored'),
    v.literal('confirmedScam'),
    v.literal('reportedFalsePositive'),
  ),
  createdAt: v.number(),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// 2.18 moderationQueue
// ---------------------------------------------------------------------------
const moderationQueue = defineTable({
  itemType: v.union(v.literal('reportedEntity'), v.literal('directoryIssue'), v.literal('userReport')),
  itemId: v.string(),
  priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
  status: v.union(v.literal('open'), v.literal('inReview'), v.literal('resolved')),
  assignedModeratorId: v.optional(v.id('users')),
  createdAt: v.number(),
}).index('by_status', ['status']);

// ---------------------------------------------------------------------------
// 2.19 pushTokens
// ---------------------------------------------------------------------------
const pushTokens = defineTable({
  userId: v.id('users'),
  token: v.string(),
  platform: v.union(v.literal('ios'), v.literal('android')),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// Reported scams (Section 2 of the brief "reports" + Section 4 submitScamReport)
// ---------------------------------------------------------------------------
const reports = defineTable({
  userId: v.id('users'),
  scamCategory: v.string(),
  type: v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('instagram'), v.literal('phoneCall')),
  evidenceText: v.string(), // redacted on the client; only textual evidence is stored
  screenshotLocalOnly: v.boolean(), // a screenshot never leaves the device
  status: v.union(v.literal('open'), v.literal('in-progress'), v.literal('resolved'), v.literal('cancelled')),
  createdAt: v.number(),
}).index('by_user', ['userId']);

// ---------------------------------------------------------------------------
// Operational tables (beyond the spec — see header comment)
// ---------------------------------------------------------------------------

/** Opaque session token hash → user. Backs the "equivalent session pattern". */
const sessions = defineTable({
  tokenHash: v.string(),
  userId: v.id('users'),
  createdAt: v.number(),
  expiresAt: v.number(), // rolling 30-day inactivity window
  lastActiveAt: v.number(),
})
  .index('by_tokenHash', ['tokenHash'])
  .index('by_user', ['userId']);

/** OTP send attempts, kept for the max-3-per-phone-per-10-min rate limit, plus the code/expiry the verify step checks. */
const otpRequests = defineTable({
  phone: v.string(),
  code: v.string(),
  expiresAt: v.number(),
  requestedAt: v.number(),
})
  .index('by_phone', ['phone'])
  .index('by_phone_time', ['phone', 'requestedAt']);

/** LLM explainer cache: rules-combination hash → generated aiExplanation. */
const aiExplanationCache = defineTable({
  hash: v.string(),
  aiExplanation: v.string(),
  createdAt: v.number(),
}).index('by_hash', ['hash']);

/**
 * Saved recipients (backend brief Section 5). The brief lists
 * `savedRecipients.list/save/reverify` functions but no table in Section 2, so
 * this is added as an operational table to back them. Each saved recipient is
 * owned by one user and tracks the verification confidence gained over time
 * (timesPaid feeds future check confidence per Section 8).
 */
const savedRecipients = defineTable({
  userId: v.id('users'),
  label: v.string(),
  identifier: v.string(), // canonical
  identifierType: identifierType,
  riskLevel: v.optional(riskLevel),
  timesPaid: v.number(),
  lastPaidAt: v.optional(v.number()),
  reverifiedAt: v.optional(v.number()),
}).index('by_user', ['userId']);

/**
 * Payment history log (backend brief Section 8, `paymentHistory.markPaid`).
 * Optional post-payment logging that records who/amount without storing any
 * sensitive payment credential.
 */
const paymentHistory = defineTable({
  userId: v.id('users'),
  recipientId: v.optional(v.id('savedRecipients')),
  identifier: v.string(),
  identifierType: identifierType,
  amountKes: v.optional(v.number()),
  note: v.optional(v.string()),
  checkId: v.optional(v.id('checks')),
  createdAt: v.number(),
}).index('by_user', ['userId']);

export default defineSchema({
  users,
  checks,
  reportedEntities,
  qrScans,
  urlScans,
  institutionDirectory,
  directoryIssueReports,
  trustedContacts,
  familyCircles,
  familyMemberships,
  groupCircles,
  groupMemberships,
  alerts,
  literacyLessons,
  scamExamples,
  scamRadarEvents,
  paymentLocks,
  safetyScoreEvents,
  floatingShieldPreferences,
  quarantinedMessages,
  moderationQueue,
  pushTokens,
  reports,
  sessions,
  otpRequests,
  aiExplanationCache,
  savedRecipients,
  paymentHistory,
});