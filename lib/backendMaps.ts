/**
 * Server -> local shape mappers for the Convex backend.
 *
 * The app keeps its own local data model (lib/types.ts) so screens never need
 * to know about the wire shape; these functions translate between the two.
 * They are pure — no store imports — so they stay unit-testable.
 */

import type {
  Alert,
  CheckType,
  CircleMember,
  FamilyCircle,
  GroupCircle,
  IdentifierType,
  LessonCategory,
  LiteracyLesson,
  RiskLevel,
  ReportedEntity,
  SavedRecipient,
  ScamCategory,
  ScamExample,
  ScamRadarEvent,
  SharingLevel,
  VerifiedInstitution,
} from '@/lib/types';

// --- Scam category vocabulary ------------------------------------------------
// The server rules engine + radar + reports use snake_case categories; the
// app (and the server's education seed) use kebab-case. Translate both ways.

const SNAKE_TO_KEBAB: Record<string, ScamCategory> = {
  mpesa_reversal_scam: 'mpesa-reversal',
  fake_agent: 'fake-safaricom-agent',
  fake_bank_rep: 'fake-bank-rep',
  police_impersonation: 'police-impersonation',
  family_emergency_scam: 'family-emergency',
  job_loan_scam: 'fake-job-loan',
  prize_scam: 'prize-lottery',
  sim_swap_attempt: 'sim-swap',
  delivery_scam: 'fake-delivery',
  qr_merchant_phishing: 'qr-merchant-phishing',
  crypto_investment: 'crypto-investment',
  none: 'none',
};

const KEBAB_CATEGORIES = new Set<string>([
  'mpesa-reversal',
  'fake-safaricom-agent',
  'fake-bank-rep',
  'police-impersonation',
  'family-emergency',
  'fake-job-loan',
  'prize-lottery',
  'sim-swap',
  'fake-delivery',
  'qr-merchant-phishing',
  'crypto-investment',
  'none',
]);

/** Server snake_case (or already-kebab) category -> local kebab category. */
export function toLocalScamCategory(value: string | null | undefined): ScamCategory {
  if (!value) return 'none';
  if (KEBAB_CATEGORIES.has(value)) return value as ScamCategory;
  return SNAKE_TO_KEBAB[value] ?? 'none';
}

const KEBAB_TO_SNAKE: Record<ScamCategory, string> = {
  'mpesa-reversal': 'mpesa_reversal_scam',
  'fake-safaricom-agent': 'fake_agent',
  'fake-bank-rep': 'fake_bank_rep',
  'police-impersonation': 'police_impersonation',
  'family-emergency': 'family_emergency_scam',
  'fake-job-loan': 'job_loan_scam',
  'prize-lottery': 'prize_scam',
  'sim-swap': 'sim_swap_attempt',
  'fake-delivery': 'delivery_scam',
  'qr-merchant-phishing': 'qr_merchant_phishing',
  'crypto-investment': 'crypto_investment',
  none: 'none',
};

/** Local kebab category -> server snake_case category (fallback generic). */
export function toServerScamCategory(value: ScamCategory): string {
  return KEBAB_TO_SNAKE[toLocalScamCategory(value)] ?? 'generic_scam';
}

// --- Reports -----------------------------------------------------------------

const REPORT_TYPE_FOR: Record<CheckType, 'sms' | 'whatsapp' | 'instagram' | 'phoneCall'> = {
  sms: 'sms',
  call: 'phoneCall',
  qr: 'sms',
  number: 'sms',
  link: 'sms',
};

export function toServerReportType(checkType: CheckType): 'sms' | 'whatsapp' | 'instagram' | 'phoneCall' {
  return REPORT_TYPE_FOR[checkType] ?? 'sms';
}

// --- Lessons -----------------------------------------------------------------

const LESSON_CATEGORIES: Record<LessonCategory, LessonCategory> = {
  'scam-patterns': 'scam-patterns',
  'mobile-money': 'mobile-money',
  'banks-merchants': 'banks-merchants',
  'rights-recourse': 'rights-recourse',
};

export function toLocalLessonCategory(value: string | null | undefined): LessonCategory {
  const kebab = (value ?? '').replace(/_/g, '-');
  return LESSON_CATEGORIES[kebab as LessonCategory] ?? 'scam-patterns';
}

function lessonDurationLabel(bulletCount: number): string {
  if (bulletCount >= 7) return '2 min';
  if (bulletCount >= 5) return '90 sec';
  return '60 sec';
}

/** Server literacyLessons row (list / getById) -> local LiteracyLesson. */
export function toLocalLesson(row: {
  _id: string;
  title: string;
  category: string;
  bullets: string[];
  relatedScamCategory: string;
}): LiteracyLesson {
  return {
    id: row._id,
    title: row.title,
    category: toLocalLessonCategory(row.category),
    durationLabel: lessonDurationLabel(row.bullets.length),
    intro: '',
    bullets: row.bullets,
    relatedScamCategory: toLocalScamCategory(row.relatedScamCategory),
  };
}

// --- Scam Simulator examples -------------------------------------------------

/** Server scamExamples row -> local ScamExample. */
export function toLocalExample(row: {
  _id: string;
  textSw: string;
  textEn: string;
  scamType: string;
  riskLevel: RiskLevel;
  patterns: string[];
  notes: string;
}): ScamExample {
  return {
    id: row._id,
    text_sw: row.textSw,
    text_en: row.textEn,
    scamType: toLocalScamCategory(row.scamType),
    riskLevel: row.riskLevel,
    patterns: row.patterns,
    notes: row.notes,
  };
}

// --- Scam Radar --------------------------------------------------------------

/** Rough locator the backend actually writes (reports carry no precise place). */
export const NATIONWIDE_LOCATION = 'Nationwide';

/** The institution users will be pointed to when a pattern claims this brand. */
const INSTITUTION_KEYWORD_BY_CATEGORY: Partial<Record<ScamCategory, string>> = {
  'mpesa-reversal': 'safaricom',
  'fake-safaricom-agent': 'safaricom',
  'police-impersonation': 'dci',
  'fake-bank-rep': 'bank',
  'qr-merchant-phishing': 'bank',
};

export function toLocalRadarEvent(
  row: {
    _id: string;
    scamCategory: string;
    roughLocation: string;
    reportCountLast24h: number;
    sampleAnonymizedSummary: string;
  },
  lessons: LiteracyLesson[],
  institutions: VerifiedInstitution[],
): ScamRadarEvent {
  const category = toLocalScamCategory(row.scamCategory);
  const lesson =
    lessons.find((item) => item.relatedScamCategory === category) ?? lessons.find((item) => item.category === 'scam-patterns');
  const keyword = INSTITUTION_KEYWORD_BY_CATEGORY[category];
  const institution = keyword
    ? institutions.find((item) => item.name.toLowerCase().includes(keyword))
    : undefined;
  return {
    id: row._id,
    scamCategory: category,
    roughLocation: row.roughLocation === 'nationwide' ? NATIONWIDE_LOCATION : row.roughLocation,
    reportCountLast24h: row.reportCountLast24h,
    sampleAnonymizedSummary: row.sampleAnonymizedSummary,
    relatedLessonId: lesson?.id ?? '',
    relatedInstitutionId: institution?.id,
  };
}

// --- Saved recipients ---------------------------------------------------------

/** Server savedRecipients row -> local SavedRecipient. */
export function toLocalRecipient(row: {
  _id: string;
  label: string;
  identifier: string;
  identifierType: IdentifierType;
  riskLevel: RiskLevel;
  timesPaid: number;
  lastPaidAt?: number;
}): SavedRecipient {
  return {
    id: row._id,
    label: row.label,
    identifier: row.identifier,
    identifierType: row.identifierType,
    riskLevel: row.riskLevel,
    timesPaid: row.timesPaid,
    lastPaidAt: row.lastPaidAt,
  };
}

// --- Family & group circles --------------------------------------------------

function toLocalCircleMember(
  member: {
    userId: string;
    name: string;
    role: 'admin' | 'protected';
    status: 'active' | 'pending';
    sharingLevel?: SharingLevel;
  },
): CircleMember {
  return {
    userId: member.userId,
    name: member.name,
    phone: '',
    role: member.role,
    status: member.status,
    sharingLevel: member.sharingLevel ?? 'alertsOnly',
  };
}

/** familyCircles.getMyCircleAsAdmin -> local FamilyCircle. */
export function toLocalFamilyCircle(view: {
  circle: { _id: string; name?: string; adminUserId: string };
  members: Array<{
    userId: string;
    name: string;
    role: 'admin' | 'protected';
    status: 'active' | 'pending';
    sharingLevel: SharingLevel;
  }>;
}): FamilyCircle {
  return {
    id: view.circle._id,
    adminUserId: view.circle.adminUserId,
    members: view.members.map(toLocalCircleMember),
  };
}

/** familyCircles.getMyCircleAsProtectedMember -> minimal local circle. */
export function toLocalProtectedCircle(
  me: { userId: string; name: string; phone: string },
  status: { status: 'none' | 'alert-shared' | 'no-alert-yet'; sharingLevel?: SharingLevel } | undefined,
): FamilyCircle {
  return {
    id: '',
    adminUserId: '',
    members: [
      {
        userId: me.userId,
        name: me.name,
        phone: me.phone,
        role: 'protected',
        status: 'active',
        sharingLevel: status?.sharingLevel ?? 'alertsOnly',
      },
    ],
  };
}

const SACCO_RE = /sacco|sac\b|credit|crédit/i;

function guessGroupKind(name: string): 'chama' | 'sacco' {
  return SACCO_RE.test(name) ? 'sacco' : 'chama';
}

function toLocalGroupMember(
  member: { userId: string; name: string; role: 'admin' | 'member'; status: 'active' | 'pending' },
): { userId: string; name: string; phone: string; role: 'protected' | 'admin'; status: 'active' | 'pending'; sharingLevel: SharingLevel } {
  return {
    userId: member.userId,
    name: member.name,
    phone: '',
    role: member.role === 'admin' ? 'admin' : 'protected',
    status: member.status,
    sharingLevel: 'alertsOnly',
  };
}

/** groupCircles.getMyCircles + getCircleAsAdmin -> local GroupCircle. */
export function toLocalGroupCircle(
  group: {
    _id: string;
    name: string;
    adminUserId: string;
    role?: 'admin' | 'member';
  },
  members: Array<{ userId: string; name: string; role: 'admin' | 'member'; status: 'active' | 'pending' }> = [],
  broadcastAlertIds: string[] = [],
): GroupCircle {
  const kind = guessGroupKind(group.name);
  return {
    id: group._id,
    name: group.name,
    kind,
    adminUserId: group.adminUserId,
    members: members.length > 0
      ? members.map(toLocalGroupMember)
      : [
          {
            userId: group.adminUserId,
            name: group.role === 'member' ? 'You' : 'You',
            phone: '',
            role: group.role === 'member' ? 'protected' : 'admin',
            status: 'active',
            sharingLevel: 'alertsOnly',
          },
        ],
    broadcastAlerts: broadcastAlertIds,
  };
}

// --- Alerts ------------------------------------------------------------------

/** Server alerts row (shared by family + group circles) -> local Alert. */
export function toLocalAlert(
  row: {
    _id: string;
    circleId: string;
    circleType: 'family' | 'group';
    relatedCheckId?: string;
    summary: string;
    riskLevel: RiskLevel;
    suggestedAction: string;
    createdAt: number;
  },
  memberName: string,
): Alert {
  return {
    id: row._id,
    circleId: row.circleId,
    circleKind: row.circleType,
    relatedCheckId: row.relatedCheckId,
    memberName,
    summary: row.summary,
    detail: row.summary,
    riskLevel: row.riskLevel,
    suggestedAction: row.suggestedAction,
    createdAt: row.createdAt,
  };
}

// --- Reported entities -------------------------------------------------------

/** Server reportedEntities row -> local ReportedEntity. */
export function toLocalEntity(row: {
  _id: string;
  identifier: string;
  identifierType: IdentifierType;
  riskLevel: RiskLevel;
  scamCategory: string;
  reportCount: number;
  uniqueReporters: number;
  firstReportedAt: number;
  lastReportedAt: number;
  reviewStatus: 'unreviewed' | 'under-review' | 'confirmed';
}): ReportedEntity {
  return {
    identifier: row.identifier,
    identifierType: row.identifierType,
    displayName: row.identifier,
    riskLevel: row.riskLevel,
    scamCategory: toLocalScamCategory(row.scamCategory),
    reportCount: row.reportCount,
    uniqueReporters: row.uniqueReporters,
    firstReportedAt: row.firstReportedAt,
    lastReportedAt: row.lastReportedAt,
    reviewStatus: row.reviewStatus,
  };
}

// --- Safety score ------------------------------------------------------------

/** Local safety-event source -> server source string. */
export function toServerSafetySource(
  source: 'simulator-round' | 'verified-check' | 'report-submitted',
): 'simulatorRound' | 'verifiedCheck' | 'reportSubmitted' {
  if (source === 'verified-check') return 'verifiedCheck';
  if (source === 'report-submitted') return 'reportSubmitted';
  return 'simulatorRound';
}