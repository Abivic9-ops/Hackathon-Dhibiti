/**
 * Dhibiti local data model.
 * Shapes mirror the intended Convex tables 1:1 so the mock layer can be swapped
 * for real reactive queries without touching screen code.
 */

export type RiskLevel = 'red' | 'amber' | 'green' | 'blue' | 'grey';

export type CheckType = 'sms' | 'call' | 'qr' | 'number' | 'link';

export type IdentifierType = 'phone' | 'paybill' | 'till' | 'url' | 'account' | 'crypto';

export type ScamCategory =
  | 'mpesa-reversal'
  | 'fake-safaricom-agent'
  | 'fake-bank-rep'
  | 'police-impersonation'
  | 'family-emergency'
  | 'fake-job-loan'
  | 'prize-lottery'
  | 'sim-swap'
  | 'fake-delivery'
  | 'qr-merchant-phishing'
  | 'crypto-investment'
  | 'none';

export type PatternCategory =
  | 'urgency'
  | 'secrecy'
  | 'payment-pressure'
  | 'impersonation'
  | 'credential-request'
  | 'reversal-claim'
  | 'reward-bait'
  | 'authority-threat'
  | 'emotional-pressure'
  | 'new-destination'
  | 'link-obfuscation'
  | 'lookalike-domain'
  | 'crypto-irreversible'
  | 'network-config';

export type DetectedPattern = {
  id: string;
  /** Rule-based fact line, plain language, shown in "Why we flagged this". */
  label: string;
  category: PatternCategory;
  /** Verbatim excerpt that triggered the rule (may be Kiswahili or Sheng). */
  evidence?: string;
  weight: number;
};

export type ActionKind =
  | 'call-verified'
  | 'call-contact'
  | 'safe-pay'
  | 'lookup'
  | 'report'
  | 'lesson'
  | 'browser'
  | 'family'
  | 'dismiss'
  | 'quarantine';

export type RecommendedAction = {
  id: string;
  label: string;
  kind: ActionKind;
  emphasis: 'primary' | 'secondary';
  /** Institution name, contact id, identifier or lesson id, depending on kind. */
  payload?: string;
  helper?: string;
};

export type QrContentType = 'url' | 'mobile-money' | 'phone' | 'crypto' | 'wifi' | 'vcard' | 'text';

export type Check = {
  id: string;
  userId: string;
  type: CheckType;
  inputSummary: string;
  inputText?: string;
  riskLevel: RiskLevel;
  /** Independent second panel: risk of the money destination, when one exists. */
  recipientRiskLevel?: RiskLevel;
  recipientIdentifier?: string;
  recipientIdentifierType?: IdentifierType;
  detectedPatterns: DetectedPattern[];
  ruleScore: number;
  scamCategory: ScamCategory;
  /** LLM-layer gloss: explains, never decides. */
  aiExplanation: string;
  ruleFactLines: string[];
  technicalDetails: string[];
  recommendedActions: RecommendedAction[];
  claimedIdentity?: string;
  qrContentType?: QrContentType;
  relatedLessonId?: string;
  createdAt: number;
};

export type ReportedEntity = {
  identifier: string;
  identifierType: IdentifierType;
  displayName?: string;
  riskLevel: RiskLevel;
  scamCategory: ScamCategory;
  reportCount: number;
  uniqueReporters: number;
  firstReportedAt: number;
  lastReportedAt: number;
  reviewStatus: 'unreviewed' | 'under-review' | 'confirmed';
  /** Extra structural facts surfaced in the recipient panel. */
  notes?: string[];
  domainAgeDays?: number;
  merchantVerified?: boolean;
};

export type TrustedContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  verified: boolean;
};

export type VerifiedInstitution = {
  id: string;
  name: string;
  category: 'bank' | 'telco' | 'government' | 'merchant' | 'hospital';
  officialNumbers: string[];
  aliases: string[];
  note?: string;
};

/** User profile as returned by the Convex backend (auth + roles). */
export type AuthUser = {
  _id: string;
  phone: string;
  name: string;
  email?: string | null;
  roles: string[];
};

export type SharingLevel = 'alertsOnly' | 'withRecipient' | 'withAmount' | 'full';

export type CircleMember = {
  userId: string;
  name: string;
  phone: string;
  role: 'protected' | 'admin';
  status: 'active' | 'pending';
  sharingLevel: SharingLevel;
  /** Admin-configured mandatory hold for high-risk payments, in seconds. */
  lockSeconds?: number;
};

export type FamilyCircle = {
  id: string;
  adminUserId: string;
  members: CircleMember[];
};

export type GroupCircle = {
  id: string;
  name: string;
  kind: 'chama' | 'sacco';
  adminUserId: string;
  members: CircleMember[];
  broadcastAlerts: string[];
};

export type Alert = {
  id: string;
  circleId: string;
  circleKind: 'family' | 'group';
  relatedCheckId?: string;
  memberName: string;
  summary: string;
  detail: string;
  riskLevel: RiskLevel;
  suggestedAction: string;
  contactPhone?: string;
  createdAt: number;
};

export type LessonCategory =
  | 'scam-patterns'
  | 'mobile-money'
  | 'banks-merchants'
  | 'rights-recourse';

export type LiteracyLesson = {
  id: string;
  title: string;
  category: LessonCategory;
  durationLabel: string;
  intro: string;
  bullets: string[];
  example?: { label: string; text: string };
  relatedScamCategory: ScamCategory;
};

export type ScamExample = {
  id: string;
  text_sw: string;
  text_en: string;
  scamType: ScamCategory;
  riskLevel: RiskLevel;
  patterns: string[];
  notes: string;
};

export type ScamRadarEvent = {
  id: string;
  scamCategory: ScamCategory;
  roughLocation: string;
  reportCountLast24h: number;
  sampleAnonymizedSummary: string;
  relatedLessonId: string;
  relatedInstitutionId?: string;
};

export type PaymentLock = {
  id: string;
  paymentId: string;
  riskLevel: RiskLevel;
  lockDurationSeconds: number;
  startedAt: number;
  status: 'locked' | 'released' | 'overridden-by-admin';
  mandatory: boolean;
  /** Server-side lock _id, when this lock was started on the backend. */
  serverId?: string;
};

export type SafetyScoreEvent = {
  id: string;
  userId: string;
  source: 'simulator-round' | 'verified-check' | 'report-submitted';
  delta: number;
  createdAt: number;
};

export type QuarantinedMessage = {
  id: string;
  sender: string;
  body: string;
  reason: string;
  riskLevel: RiskLevel;
  receivedAt: number;
  status: 'quarantined' | 'restored' | 'reported-false-positive';
};

export type SavedRecipient = {
  id: string;
  label: string;
  identifier: string;
  identifierType: IdentifierType;
  riskLevel: RiskLevel;
  timesPaid: number;
  lastPaidAt?: number;
};

export type PaymentDraft = {
  id: string;
  recipientLabel: string;
  identifier: string;
  identifierType: IdentifierType;
  amountKes: number;
  context?: string;
  riskLevel: RiskLevel;
  recipientRiskLevel: RiskLevel;
  messageRiskLevel?: RiskLevel;
  ruleFactLines: string[];
  aiExplanation: string;
  technicalDetails: string[];
  recommendedActions: RecommendedAction[];
  relatedCheckId?: string;
  relatedLessonId?: string;
  firstTimeRecipient: boolean;
  status: 'pending' | 'paid' | 'abandoned';
  paidNote?: string;
  createdAt: number;
};

/** A stand-in for a real camera QR scan while capture is simulated in this build. */
export type QrSample = {
  id: string;
  label: string;
  raw: string;
};

export type PermissionKey = 'contacts' | 'notifications' | 'camera' | 'sms';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'standalone' | 'family-admin' | 'protected-member';
  county: string;
};
