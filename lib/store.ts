import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  QR_CONTENT_LABEL,
  SCAM_CATEGORY_LABEL,
  aiGloss,
  analyzePatterns,
  analyzeUrl,
  classifyQrContent,
  detectClaimedIdentity,
  extractPaymentTarget,
  guessIdentifierType,
  normalisePhone,
} from '@/lib/detection';
import {
  literacyLessons,
  paymentTips,
  reportedEntities,
  scamExamples,
  scamRadarEvents,
  seedAlerts,
  seedChecks,
  seedFamilyCircle,
  seedGroupCircles,
  seedQuarantine,
  seedRecipients,
  seedUser,
  trustedContacts,
  verifiedInstitutions,
} from '@/lib/seed';
import type { Language } from '@/lib/i18n';
import { highestRisk, setThemeMode, type ThemeMode } from '@/lib/theme';
import type {
  Alert,
  Check,
  CheckType,
  FamilyCircle,
  GroupCircle,
  IdentifierType,
  LiteracyLesson,
  PaymentDraft,
  PaymentLock,
  PermissionKey,
  PermissionState,
  QuarantinedMessage,
  RecommendedAction,
  ReportedEntity,
  RiskLevel,
  SafetyScoreEvent,
  SavedRecipient,
  ScamCategory,
  ScamExample,
  ScamRadarEvent,
  SharingLevel,
  TrustedContact,
  User,
  VerifiedInstitution,
} from '@/lib/types';

const PERSIST_KEY = 'dhibiti:state:v1';

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

type CheckInput = {
  type: CheckType;
  text?: string;
  identifier?: string;
  identifierType?: IdentifierType;
};

type DetectionContext = {
  institutions: VerifiedInstitution[];
  contacts: TrustedContact[];
  entities: ReportedEntity[];
  lessons: LiteracyLesson[];
};

function stripProtocolHost(raw: string) {
  return raw.replace(/^https?:\/\//, '').split('/')[0];
}

function findEntity(entities: ReportedEntity[], identifier?: string) {
  if (!identifier) return undefined;
  const needle = identifier.trim().toLowerCase();
  return entities.find((entity) => {
    const value = entity.identifier.toLowerCase();
    if (value === needle) return true;
    if (needle.startsWith('http') && value.startsWith('http')) {
      return stripProtocolHost(value) === stripProtocolHost(needle);
    }
    return false;
  });
}

function lessonFor(lessons: LiteracyLesson[], category: ScamCategory, type: CheckType) {
  const direct = lessons.find((lesson) => lesson.relatedScamCategory === category);
  if (direct) return direct.id;
  if (type === 'number' || type === 'link' || type === 'qr') return 'lesson-merchant-checks';
  return 'lesson-confirmation-messages';
}

function parseWifi(raw: string) {
  const ssid = /S:([^;]*)/i.exec(raw)?.[1] ?? 'Unknown network';
  const security = /T:([^;]*)/i.exec(raw)?.[1] ?? 'nopass';
  const open = /nopass/i.test(security) || security.trim() === '';
  return { ssid, security: open ? 'Open, no password' : security.toUpperCase(), open };
}

const GENERIC_WIFI = ['free', 'airport', 'wifi', 'public', 'guest'];

/**
 * Composes the three detection layers into one Check:
 * rules engine -> community report data -> plain-language explanation.
 */
function buildCheck(input: CheckInput, ctx: DetectionContext, userId: string): Check {
  const text = input.text?.trim() ?? '';
  const analysis = analyzePatterns(text);
  const ruleFactLines: string[] = [];
  const technicalDetails: string[] = [];
  const patterns = [...analysis.patterns];

  let messageRisk: RiskLevel = 'grey';
  let scamCategory = analysis.scamCategory;
  let qrContentType = input.type === 'qr' ? classifyQrContent(text) : undefined;

  // --- money destination -------------------------------------------------
  const explicit = input.identifier?.trim();
  const target = explicit
    ? {
        identifier:
          (input.identifierType ?? guessIdentifierType(explicit)) === 'phone'
            ? normalisePhone(explicit)
            : explicit,
        identifierType: input.identifierType ?? guessIdentifierType(explicit),
        amountKes: undefined as number | undefined,
      }
    : extractPaymentTarget(text);

  const entity = findEntity(ctx.entities, target?.identifier);
  const institutionMatch = target
    ? ctx.institutions.find((institution) =>
        institution.officialNumbers.some((number) => number === target.identifier),
      )
    : undefined;

  // --- message / content risk -------------------------------------------
  if (input.type === 'number') {
    messageRisk = entity?.riskLevel ?? 'grey';
    if (entity) {
      ruleFactLines.push(
        entity.reportCount > 0
          ? `${entity.displayName ?? entity.identifier} has been reported ${entity.reportCount} times by ${entity.uniqueReporters} different people for ${SCAM_CATEGORY_LABEL[entity.scamCategory].toLowerCase()}.`
          : `No reports found for ${entity.displayName ?? entity.identifier}.`,
      );
      for (const note of entity.notes ?? []) ruleFactLines.push(note);
      technicalDetails.push(
        `Community lookup: ${entity.reportCount} reports, ${entity.uniqueReporters} unique reporters, status ${entity.reviewStatus}.`,
      );
    } else if (institutionMatch) {
      messageRisk = 'blue';
      ruleFactLines.push(
        `${institutionMatch.name} is in Dhibiti's verified institution directory.`,
      );
    } else {
      ruleFactLines.push(
        'We have no information about this identifier yet. That is not the same as it being safe.',
      );
      technicalDetails.push('Community lookup: no records.');
    }
  } else if (patterns.length > 0) {
    messageRisk = analysis.suggestedRiskLevel;
    for (const pattern of patterns) ruleFactLines.push(pattern.label);
    for (const combination of analysis.combinations) ruleFactLines.push(combination);
  } else if (/^m-?pesa:/i.test(text) || /^safaricom:/i.test(text)) {
    messageRisk = 'blue';
    ruleFactLines.push('The sender ID matches a verified shortcode in our directory.');
  } else if (text.length > 0) {
    messageRisk = 'green';
    ruleFactLines.push('No known scam language, payment pressure or credential request found.');
  }

  technicalDetails.push(
    `Rule score: ${analysis.ruleScore}/100 (${patterns.length} matched rules, ${analysis.combinations.length} combination boosts).`,
  );
  if (patterns.length > 0) {
    technicalDetails.push(`Matched rules: ${patterns.map((pattern) => pattern.id).join(', ')}.`);
  }

  // --- link / QR specific layers ----------------------------------------
  let urlRisk: RiskLevel | undefined;
  if (input.type === 'link' || qrContentType === 'url') {
    const rawUrl = explicit ?? target?.identifier ?? text;
    const urlEntity = findEntity(ctx.entities, rawUrl);
    const urlAnalysis = analyzeUrl(rawUrl, urlEntity);
    urlRisk = urlAnalysis.riskLevel;
    for (const fact of urlAnalysis.facts) ruleFactLines.push(fact);
    for (const detail of urlAnalysis.technical) technicalDetails.push(detail);
    if (urlAnalysis.riskLevel === 'red' && scamCategory === 'none') {
      scamCategory = 'qr-merchant-phishing';
    }
  }

  if (qrContentType === 'crypto') {
    ruleFactLines.push(
      'This code asks for a crypto payment. Crypto transfers cannot be reversed once sent.',
    );
    urlRisk = 'red';
    scamCategory = scamCategory === 'none' ? 'crypto-investment' : scamCategory;
  }

  if (qrContentType === 'wifi') {
    const wifi = parseWifi(text);
    ruleFactLines.push(`This code sets up a Wi-Fi network: "${wifi.ssid}" (${wifi.security}).`);
    const generic = GENERIC_WIFI.some((word) => wifi.ssid.toLowerCase().includes(word));
    if (wifi.open && generic) {
      ruleFactLines.push(
        'It is an open network with a generic name, which is often used to watch what people do online.',
      );
      urlRisk = 'amber';
    }
    ruleFactLines.push('Dhibiti never connects you automatically. You stay in control.');
    technicalDetails.push(`Wi-Fi payload: SSID ${wifi.ssid}, security ${wifi.security}.`);
  }

  // --- recipient panel ---------------------------------------------------
  let recipientRisk: RiskLevel | undefined;
  if (target && input.type !== 'number') {
    if (entity) {
      recipientRisk = entity.riskLevel;
      ruleFactLines.push(
        entity.reportCount > 0
          ? `${entity.displayName ?? entity.identifier} has been reported ${entity.reportCount} times for ${SCAM_CATEGORY_LABEL[entity.scamCategory].toLowerCase()}.`
          : `No reports found for ${entity.displayName ?? entity.identifier}.`,
      );
      for (const note of entity.notes ?? []) technicalDetails.push(note);
    } else if (institutionMatch) {
      recipientRisk = 'blue';
      ruleFactLines.push(`The destination matches ${institutionMatch.name}'s official details.`);
    } else {
      recipientRisk = 'grey';
      ruleFactLines.push(
        'We have no history for this payment destination, so treat it as unverified.',
      );
    }
  } else if (input.type === 'number') {
    recipientRisk = messageRisk;
  }

  const claimed = text ? detectClaimedIdentity(text, ctx.institutions, ctx.contacts) : undefined;
  if (claimed) {
    ruleFactLines.push(
      claimed.kind === 'institution'
        ? `The sender claims to be ${claimed.name}. Caller ID and sender names can be faked.`
        : `This claims to be from ${claimed.name}. You already have ${claimed.name.split(' ')[0]}'s real number saved.`,
    );
  }

  const riskLevel = highestRisk(messageRisk, recipientRisk, urlRisk);
  const relatedLessonId = lessonFor(ctx.lessons, scamCategory, input.type);

  // --- recommended actions (a verdict is never shown without one) --------
  const actions: RecommendedAction[] = [];
  if (claimed?.kind === 'institution' && riskLevel !== 'green') {
    actions.push({
      id: id('act'),
      label: `Call ${claimed.name} on its verified number`,
      kind: 'call-verified',
      emphasis: 'primary',
      payload: claimed.name,
      helper: 'Do not call back the number that contacted you.',
    });
  } else if (claimed?.kind === 'contact') {
    actions.push({
      id: id('act'),
      label: `Call ${claimed.name} on the saved number`,
      kind: 'call-contact',
      emphasis: 'primary',
      payload: claimed.contactId,
      helper: 'Speak to them directly before any money moves.',
    });
  }

  if (target && riskLevel !== 'green') {
    actions.push({
      id: id('act'),
      label: 'Check this payment before sending',
      kind: 'safe-pay',
      emphasis: actions.length === 0 ? 'primary' : 'secondary',
      payload: target.identifier,
    });
  }

  if (qrContentType === 'url' || input.type === 'link') {
    actions.push({
      id: id('act'),
      label: 'Open a safe, non-interactive preview',
      kind: 'browser',
      emphasis: actions.length === 0 ? 'primary' : 'secondary',
      payload: explicit ?? target?.identifier ?? text,
      helper: 'Nothing you type is sent from the preview.',
    });
  }

  if (riskLevel === 'red' || riskLevel === 'amber') {
    actions.push({
      id: id('act'),
      label: 'Report this to protect others',
      kind: 'report',
      emphasis: actions.length === 0 ? 'primary' : 'secondary',
      payload: target?.identifier,
    });
    actions.push({
      id: id('act'),
      label: 'Share this alert with my family circle',
      kind: 'family',
      emphasis: 'secondary',
      helper: 'Only this event is shared, never your full activity.',
    });
  }

  if (riskLevel === 'green' || riskLevel === 'blue') {
    actions.push({
      id: id('act'),
      label: 'Confirm you were expecting this',
      kind: 'dismiss',
      emphasis: actions.length === 0 ? 'primary' : 'secondary',
      helper: 'Check your own balance rather than trusting a forwarded message.',
    });
  }

  actions.push({
    id: id('act'),
    label:
      scamCategory === 'none'
        ? 'Learn how to check a business is real (2 min)'
        : `Learn how this scam works (60 sec)`,
    kind: 'lesson',
    emphasis: 'secondary',
    payload: relatedLessonId,
  });

  const summarySource = input.type === 'number' ? (target?.identifier ?? '') : text;
  const inputSummary =
    input.type === 'number'
      ? `${target?.identifierType === 'phone' ? 'Number' : (target?.identifierType ?? 'Identifier')} ${target?.identifier ?? summarySource}`
      : summarySource.length > 68
        ? `${summarySource.slice(0, 68).trim()}…`
        : summarySource || 'Empty input';

  return {
    id: id('check'),
    userId,
    type: input.type,
    inputSummary,
    inputText: text || undefined,
    riskLevel,
    recipientRiskLevel: recipientRisk,
    recipientIdentifier: target?.identifier,
    recipientIdentifierType: target?.identifierType,
    detectedPatterns: patterns,
    ruleScore: analysis.ruleScore,
    scamCategory,
    aiExplanation: aiGloss(scamCategory),
    ruleFactLines,
    technicalDetails,
    recommendedActions: actions,
    claimedIdentity: claimed?.name,
    qrContentType,
    relatedLessonId,
    createdAt: Date.now(),
  };
}

export type ReportInput = {
  type: CheckType;
  identifier: string;
  content: string;
  scamCategory: ScamCategory;
  keepScreenshotLocal: boolean;
};

type Store = {
  hydrated: boolean;
  onboarded: boolean;
  user: User;
  language: Language;
  theme: ThemeMode;
  permissions: Record<PermissionKey, PermissionState>;
  /** Demo switch so offline and error states can be reviewed on any flow. */
  simulateOffline: boolean;

  checks: Check[];
  entities: ReportedEntity[];
  contacts: TrustedContact[];
  institutions: VerifiedInstitution[];
  circle: FamilyCircle;
  groups: GroupCircle[];
  alerts: Alert[];
  quarantine: QuarantinedMessage[];
  recipients: SavedRecipient[];
  payments: PaymentDraft[];
  locks: PaymentLock[];
  safetyEvents: SafetyScoreEvent[];
  radar: ScamRadarEvent[];
  lessons: LiteracyLesson[];
  examples: ScamExample[];
  readLessonIds: string[];
  dismissedPromptIds: string[];
  tips: typeof paymentTips;

  hydrate: () => Promise<void>;
  completeOnboarding: (patch: Partial<User>) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  setPermission: (key: PermissionKey, state: PermissionState) => void;
  setSimulateOffline: (value: boolean) => void;

  runCheck: (input: CheckInput) => Check;
  deleteCheck: (checkId: string) => void;
  clearHistory: () => void;
  lookupEntity: (identifier: string) => ReportedEntity | undefined;
  submitReport: (input: ReportInput) => void;

  restoreQuarantined: (messageId: string) => void;
  reportFalsePositive: (messageId: string) => void;

  addTrustedContact: (contact: Omit<TrustedContact, 'id'>) => void;
  inviteFamilyMember: (input: { name: string; phone: string; role: 'protected' | 'admin' }) => void;
  setMemberSharing: (userId: string, level: SharingLevel) => void;
  setMemberLock: (userId: string, seconds: number) => void;

  createGroup: (input: { name: string; kind: 'chama' | 'sacco' }) => string;
  inviteGroupMember: (groupId: string, input: { name: string; phone: string }) => void;
  broadcastGroupAlert: (groupId: string, input: { summary: string; detail: string }) => void;
  shareCheckWithFamily: (checkId: string) => void;

  createPayment: (input: {
    recipientLabel: string;
    identifier: string;
    identifierType: IdentifierType;
    amountKes: number;
    context?: string;
    relatedCheckId?: string;
  }) => PaymentDraft;
  startLock: (paymentId: string) => PaymentLock;
  releaseLock: (lockId: string) => void;
  markPaid: (paymentId: string, note: string) => void;
  abandonPayment: (paymentId: string) => void;

  addSafetyEvent: (source: SafetyScoreEvent['source'], delta: number) => void;
  markLessonRead: (lessonId: string) => void;
  dismissPrompt: (promptId: string) => void;
};

export const useStore = create<Store>((set, get) => ({
  hydrated: false,
  onboarded: false,
  user: seedUser,
  language: 'en',
  theme: 'dark',
  permissions: {
    contacts: 'undetermined',
    notifications: 'undetermined',
    camera: 'undetermined',
    sms: 'undetermined',
  },
  simulateOffline: false,

  checks: seedChecks,
  entities: reportedEntities,
  contacts: trustedContacts,
  institutions: verifiedInstitutions,
  circle: seedFamilyCircle,
  groups: seedGroupCircles,
  alerts: seedAlerts,
  quarantine: seedQuarantine,
  recipients: seedRecipients,
  payments: [],
  locks: [],
  safetyEvents: [
    { id: 'score-1', userId: 'user-1', source: 'verified-check', delta: 6, createdAt: Date.now() },
    {
      id: 'score-2',
      userId: 'user-1',
      source: 'report-submitted',
      delta: 8,
      createdAt: Date.now(),
    },
    {
      id: 'score-3',
      userId: 'user-1',
      source: 'simulator-round',
      delta: 10,
      createdAt: Date.now(),
    },
  ],
  radar: scamRadarEvents,
  lessons: literacyLessons,
  examples: scamExamples,
  readLessonIds: ['lesson-reversal'],
  dismissedPromptIds: [],
  tips: paymentTips,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PERSIST_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          const saved = parsed as {
            onboarded?: boolean;
            user?: User;
            language?: Language;
            theme?: ThemeMode;
            permissions?: Record<PermissionKey, PermissionState>;
          };
          const theme = saved.theme ?? get().theme;
          // Keep the theme-aware `colors.*` palette in sync before the first paint.
          setThemeMode(theme);
          set({
            onboarded: saved.onboarded ?? false,
            user: saved.user ?? get().user,
            language: saved.language ?? get().language,
            theme,
            permissions: saved.permissions ?? get().permissions,
            hydrated: true,
          });
          return;
        }
      }
    } catch {
      // Local storage is best-effort; the app still works from seed state.
    }
    set({ hydrated: true });
  },

  completeOnboarding: (patch) => {
    const user = { ...get().user, ...patch };
    set({ user, onboarded: true });
    void AsyncStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        onboarded: true,
        user,
        language: get().language,
        theme: get().theme,
        permissions: get().permissions,
      }),
    );
  },

  setLanguage: (language) => {
    set({ language });
    void AsyncStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        onboarded: get().onboarded,
        user: get().user,
        language,
        theme: get().theme,
        permissions: get().permissions,
      }),
    );
  },

  setTheme: (theme) => {
    setThemeMode(theme);
    set({ theme });
    void AsyncStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        onboarded: get().onboarded,
        user: get().user,
        language: get().language,
        theme,
        permissions: get().permissions,
      }),
    );
  },

  setPermission: (key, state) => {
    const permissions = { ...get().permissions, [key]: state };
    set({ permissions });
    void AsyncStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        onboarded: get().onboarded,
        user: get().user,
        language: get().language,
        theme: get().theme,
        permissions,
      }),
    );
  },

  setSimulateOffline: (value) => set({ simulateOffline: value }),

  runCheck: (input) => {
    const state = get();
    const check = buildCheck(
      input,
      {
        institutions: state.institutions,
        contacts: state.contacts,
        entities: state.entities,
        lessons: state.lessons,
      },
      state.user.id,
    );
    set({ checks: [check, ...state.checks] });
    get().addSafetyEvent('verified-check', 2);
    return check;
  },

  deleteCheck: (checkId) =>
    set((state) => ({ checks: state.checks.filter((check) => check.id !== checkId) })),

  clearHistory: () => set({ checks: [] }),

  lookupEntity: (identifier) => findEntity(get().entities, identifier),

  submitReport: (input) => {
    const identifier = input.identifier.trim();
    const existing = findEntity(get().entities, identifier);
    const timestamp = Date.now();

    if (existing) {
      set((state) => ({
        entities: state.entities.map((entity) =>
          entity.identifier === existing.identifier
            ? {
                ...entity,
                reportCount: entity.reportCount + 1,
                uniqueReporters: entity.uniqueReporters + 1,
                lastReportedAt: timestamp,
                reviewStatus:
                  entity.uniqueReporters + 1 >= 5 ? 'confirmed' : ('under-review' as const),
              }
            : entity,
        ),
      }));
    } else if (identifier.length > 0) {
      const identifierType = guessIdentifierType(identifier);
      set((state) => ({
        entities: [
          {
            identifier: identifierType === 'phone' ? normalisePhone(identifier) : identifier,
            identifierType,
            displayName: identifier,
            riskLevel: 'amber',
            scamCategory: input.scamCategory,
            reportCount: 1,
            uniqueReporters: 1,
            firstReportedAt: timestamp,
            lastReportedAt: timestamp,
            reviewStatus: 'unreviewed',
            notes: ['First report from your device.'],
          },
          ...state.entities,
        ],
      }));
    }

    get().addSafetyEvent('report-submitted', 5);
  },

  restoreQuarantined: (messageId) =>
    set((state) => ({
      quarantine: state.quarantine.map((message) =>
        message.id === messageId ? { ...message, status: 'restored' } : message,
      ),
    })),

  reportFalsePositive: (messageId) =>
    set((state) => ({
      quarantine: state.quarantine.map((message) =>
        message.id === messageId ? { ...message, status: 'reported-false-positive' } : message,
      ),
    })),

  addTrustedContact: (contact) =>
    set((state) => ({ contacts: [...state.contacts, { ...contact, id: id('contact') }] })),

  inviteFamilyMember: ({ name, phone, role }) =>
    set((state) => ({
      circle: {
        ...state.circle,
        members: [
          ...state.circle.members,
          {
            userId: id('user'),
            name,
            phone: normalisePhone(phone),
            role,
            status: 'pending',
            sharingLevel: 'alertsOnly',
          },
        ],
      },
    })),

  setMemberSharing: (userId, level) =>
    set((state) => ({
      circle: {
        ...state.circle,
        members: state.circle.members.map((member) =>
          member.userId === userId ? { ...member, sharingLevel: level } : member,
        ),
      },
    })),

  setMemberLock: (userId, seconds) =>
    set((state) => ({
      circle: {
        ...state.circle,
        members: state.circle.members.map((member) =>
          member.userId === userId ? { ...member, lockSeconds: seconds } : member,
        ),
      },
    })),

  createGroup: ({ name, kind }) => {
    const groupId = id('group');
    set((state) => ({
      groups: [
        ...state.groups,
        {
          id: groupId,
          name,
          kind,
          adminUserId: state.user.id,
          members: [
            {
              userId: state.user.id,
              name: `${state.user.name} (you)`,
              phone: state.user.phone,
              role: 'admin',
              status: 'active',
              sharingLevel: 'alertsOnly',
            },
          ],
          broadcastAlerts: [],
        },
      ],
    }));
    return groupId;
  },

  inviteGroupMember: (groupId, { name, phone }) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members: [
                ...group.members,
                {
                  userId: id('user'),
                  name,
                  phone: normalisePhone(phone),
                  role: 'protected',
                  status: 'pending',
                  sharingLevel: 'alertsOnly',
                },
              ],
            }
          : group,
      ),
    })),

  broadcastGroupAlert: (groupId, { summary, detail }) => {
    const alertId = id('alert');
    const group = get().groups.find((item) => item.id === groupId);
    set((state) => ({
      alerts: [
        {
          id: alertId,
          circleId: groupId,
          circleKind: 'group',
          memberName: group?.name ?? 'Group',
          summary,
          detail,
          riskLevel: 'red',
          suggestedAction:
            'Do not pay any new Paybill or number. Confirm with the group official on a saved number.',
          createdAt: Date.now(),
        },
        ...state.alerts,
      ],
      groups: state.groups.map((item) =>
        item.id === groupId
          ? { ...item, broadcastAlerts: [alertId, ...item.broadcastAlerts] }
          : item,
      ),
    }));
  },

  shareCheckWithFamily: (checkId) => {
    const state = get();
    const check = state.checks.find((item) => item.id === checkId);
    if (!check) return;
    const protectedMember = state.circle.members.find((member) => member.role === 'protected');
    set({
      alerts: [
        {
          id: id('alert'),
          circleId: state.circle.id,
          circleKind: 'family',
          relatedCheckId: check.id,
          memberName: state.user.name,
          summary: `${SCAM_CATEGORY_LABEL[check.scamCategory]} shared with your family circle`,
          detail: check.ruleFactLines[0] ?? check.inputSummary,
          riskLevel: check.riskLevel,
          suggestedAction:
            'Warn the people in your circle about this pattern and the number behind it.',
          contactPhone: protectedMember?.phone,
          createdAt: Date.now(),
        },
        ...state.alerts,
      ],
    });
  },

  createPayment: ({
    recipientLabel,
    identifier,
    identifierType,
    amountKes,
    context,
    relatedCheckId,
  }) => {
    const state = get();
    const entity = findEntity(state.entities, identifier);
    const institution = state.institutions.find((item) =>
      item.officialNumbers.includes(identifier),
    );
    const saved = state.recipients.find((recipient) => recipient.identifier === identifier);
    const relatedCheck = relatedCheckId
      ? state.checks.find((check) => check.id === relatedCheckId)
      : undefined;

    const contextAnalysis = context ? analyzePatterns(context) : undefined;
    const recipientRiskLevel: RiskLevel = entity
      ? entity.riskLevel
      : institution
        ? 'blue'
        : saved && saved.timesPaid > 3
          ? 'green'
          : 'grey';

    const ruleFactLines: string[] = [];
    const technicalDetails: string[] = [];

    if (entity && entity.reportCount > 0) {
      ruleFactLines.push(
        `${entity.displayName ?? entity.identifier} has been reported ${entity.reportCount} times by ${entity.uniqueReporters} people for ${SCAM_CATEGORY_LABEL[entity.scamCategory].toLowerCase()}.`,
      );
      for (const note of entity.notes ?? []) ruleFactLines.push(note);
    } else if (entity) {
      ruleFactLines.push(`No reports found for ${entity.displayName ?? entity.identifier}.`);
      for (const note of entity.notes ?? []) ruleFactLines.push(note);
    } else if (institution) {
      ruleFactLines.push(`This destination matches ${institution.name}'s official details.`);
    } else {
      ruleFactLines.push('We have no history for this destination, so treat it as unverified.');
    }

    if (saved) {
      ruleFactLines.push(
        `You have paid this recipient ${saved.timesPaid} time${saved.timesPaid === 1 ? '' : 's'} before.`,
      );
    } else {
      ruleFactLines.push('You have never paid this recipient from this device before.');
    }

    if (amountKes >= 15_000) {
      ruleFactLines.push(
        `KES ${amountKes.toLocaleString('en-KE')} is a large amount for a first-time recipient.`,
      );
    }

    if (contextAnalysis && contextAnalysis.patterns.length > 0) {
      for (const pattern of contextAnalysis.patterns) ruleFactLines.push(pattern.label);
      for (const combination of contextAnalysis.combinations) ruleFactLines.push(combination);
      technicalDetails.push(`Context rule score: ${contextAnalysis.ruleScore}/100.`);
    }

    if (relatedCheck) {
      ruleFactLines.push(
        `This came from a check you ran: ${SCAM_CATEGORY_LABEL[relatedCheck.scamCategory].toLowerCase()}.`,
      );
    }

    technicalDetails.push(
      `Recipient lookup: ${entity ? `${entity.reportCount} reports, status ${entity.reviewStatus}` : 'no records'}.`,
    );

    const messageRiskLevel = relatedCheck?.riskLevel ?? contextAnalysis?.suggestedRiskLevel;
    const riskLevel = highestRisk(recipientRiskLevel, messageRiskLevel);
    const scamCategory =
      relatedCheck?.scamCategory ?? contextAnalysis?.scamCategory ?? entity?.scamCategory ?? 'none';

    const actions: RecommendedAction[] = [];
    const institutionForCallback =
      relatedCheck?.claimedIdentity ??
      (entity?.scamCategory === 'fake-bank-rep' ? 'KCB Bank Kenya' : undefined);

    if (riskLevel === 'red' || riskLevel === 'amber') {
      if (institutionForCallback) {
        actions.push({
          id: id('act'),
          label: `Call ${institutionForCallback} on its verified number`,
          kind: 'call-verified',
          emphasis: 'primary',
          payload: institutionForCallback,
          helper: 'Use the directory number, never the one that contacted you.',
        });
      }
      actions.push({
        id: id('act'),
        label: 'Confirm with a trusted contact first',
        kind: 'call-contact',
        emphasis: actions.length === 0 ? 'primary' : 'secondary',
      });
      actions.push({
        id: id('act'),
        label: 'Report this destination',
        kind: 'report',
        emphasis: 'secondary',
        payload: identifier,
      });
    } else {
      actions.push({
        id: id('act'),
        label: 'Confirm the amount and account with the recipient',
        kind: 'dismiss',
        emphasis: 'primary',
        helper: 'No known risk found is not a guarantee.',
      });
    }

    actions.push({
      id: id('act'),
      label: 'Learn how to verify a merchant (2 min)',
      kind: 'lesson',
      emphasis: 'secondary',
      payload: 'lesson-merchant-checks',
    });

    const payment: PaymentDraft = {
      id: id('pay'),
      recipientLabel,
      identifier,
      identifierType,
      amountKes,
      context,
      riskLevel,
      recipientRiskLevel,
      messageRiskLevel,
      ruleFactLines,
      aiExplanation: aiGloss(scamCategory),
      technicalDetails,
      recommendedActions: actions,
      relatedCheckId,
      relatedLessonId:
        scamCategory === 'none'
          ? 'lesson-paybill-basics'
          : lessonFor(state.lessons, scamCategory, 'number'),
      firstTimeRecipient: !saved || saved.timesPaid === 0,
      status: 'pending',
      createdAt: Date.now(),
    };

    set({ payments: [payment, ...state.payments] });
    return payment;
  },

  startLock: (paymentId) => {
    const state = get();
    const payment = state.payments.find((item) => item.id === paymentId);
    const protectedMember = state.circle.members.find(
      (member) => member.userId === state.user.id && member.role === 'protected',
    );
    const mandatory = Boolean(protectedMember?.lockSeconds);
    const lock: PaymentLock = {
      id: id('lock'),
      paymentId,
      riskLevel: payment?.riskLevel ?? 'amber',
      lockDurationSeconds: protectedMember?.lockSeconds ?? 900,
      startedAt: Date.now(),
      status: 'locked',
      mandatory,
    };
    set({ locks: [lock, ...state.locks] });
    return lock;
  },

  releaseLock: (lockId) =>
    set((state) => ({
      locks: state.locks.map((lock) =>
        lock.id === lockId ? { ...lock, status: 'released' } : lock,
      ),
    })),

  markPaid: (paymentId, note) =>
    set((state) => {
      const payment = state.payments.find((item) => item.id === paymentId);
      const existing = payment
        ? state.recipients.find((recipient) => recipient.identifier === payment.identifier)
        : undefined;

      const recipients: SavedRecipient[] = payment
        ? existing
          ? state.recipients.map((recipient) =>
              recipient.identifier === payment.identifier
                ? {
                    ...recipient,
                    timesPaid: recipient.timesPaid + 1,
                    lastPaidAt: Date.now(),
                  }
                : recipient,
            )
          : [
              {
                id: id('rec'),
                label: payment.recipientLabel,
                identifier: payment.identifier,
                identifierType: payment.identifierType,
                riskLevel: payment.recipientRiskLevel,
                timesPaid: 1,
                lastPaidAt: Date.now(),
              },
              ...state.recipients,
            ]
        : state.recipients;

      return {
        recipients,
        payments: state.payments.map((item) =>
          item.id === paymentId ? { ...item, status: 'paid', paidNote: note } : item,
        ),
      };
    }),

  abandonPayment: (paymentId) =>
    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.id === paymentId ? { ...payment, status: 'abandoned' } : payment,
      ),
    })),

  addSafetyEvent: (source, delta) =>
    set((state) => ({
      safetyEvents: [
        { id: id('score'), userId: state.user.id, source, delta, createdAt: Date.now() },
        ...state.safetyEvents,
      ],
    })),

  markLessonRead: (lessonId) =>
    set((state) => ({
      readLessonIds: state.readLessonIds.includes(lessonId)
        ? state.readLessonIds
        : [...state.readLessonIds, lessonId],
    })),

  dismissPrompt: (promptId) =>
    set((state) => ({
      dismissedPromptIds: state.dismissedPromptIds.includes(promptId)
        ? state.dismissedPromptIds
        : [...state.dismissedPromptIds, promptId],
    })),
}));

export { QR_CONTENT_LABEL, SCAM_CATEGORY_LABEL };
