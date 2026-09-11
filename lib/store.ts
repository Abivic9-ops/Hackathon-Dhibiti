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
  toLocalAlert,
  toLocalEntity,
  toLocalExample,
  toLocalFamilyCircle,
  toLocalGroupCircle,
  toLocalLesson,
  toLocalProtectedCircle,
  toLocalRadarEvent,
  toLocalRecipient,
  toServerReportType,
  toServerSafetySource,
  toServerScamCategory,
} from '@/lib/backendMaps';
import { backendConfigured, convex } from '@/lib/convex';
import { paymentTips } from '@/lib/static';
import type { Language } from '@/lib/i18n';
import { highestRisk, setThemeMode, type ThemeMode } from '@/lib/theme';
import type { ConvexReactClient } from 'convex/react';
import type {
  Alert,
  AuthUser,
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

const EMPTY_USER: User = { id: '', name: '', phone: '', role: 'standalone', county: '' };
const EMPTY_CIRCLE: FamilyCircle = { id: '', adminUserId: '', members: [] };

/** True when the value looks like a Convex document id (`kkv5…` style). */
function isServerId(value: string): boolean {
  return /^[a-z][a-z0-9]{31}$/.test(value);
}

const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

type PersistedState = {
  onboarded: boolean;
  user: User;
  language: Language;
  theme: ThemeMode;
  permissions: Record<PermissionKey, PermissionState>;
  sessionToken: string | null;
  authUser: AuthUser | null;
};

// One write path for the whole app state, so a session token set after login is
// never dropped by a later theme/language save that only knows a subset.
function persist(): void {
  const state = useStore.getState();
  const snapshot: PersistedState = {
    onboarded: state.onboarded,
    user: state.user,
    language: state.language,
    theme: state.theme,
    permissions: state.permissions,
    sessionToken: state.sessionToken,
    authUser: state.authUser,
  };
  void AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(snapshot));
}

function mapRole(roles: string[]): User['role'] {
  return roles.includes('familyAdmin') ? 'family-admin' : 'standalone';
}

// The imperative Convex client's methods are typed against `FunctionReference`
// objects, but our store calls the backend by function name string. These two
// bridges keep the single typed entry point for every network action.
function client(): ConvexReactClient {
  if (!convex || !backendConfigured) {
    throw new Error('Dhibiti Cloud is not connected in this build.');
  }
  return convex;
}

const callMutation = <T>(name: string, args: Record<string, unknown>) =>
  client().mutation(name as never, args as never) as Promise<T>;

const callQuery = <T>(name: string, args: Record<string, unknown>) =>
  client().query(name as never, args as never) as Promise<T>;

function toAuthUser(profile: {
  _id: string;
  phone: string;
  name: string;
  email?: string | null;
  roles: string[];
}): AuthUser {
  return { _id: profile._id, phone: profile.phone, name: profile.name, email: profile.email, roles: profile.roles };
}

/** Server institutionDirectory entry -> local VerifiedInstitution shape. */
function toVerifiedInstitution(
  entry: {
    _id: string;
    officialName: string;
    category: string;
    subcategory?: string | null;
    officialNumbers: string[];
  },
): VerifiedInstitution {
  const category = entry.category as VerifiedInstitution['category'];
  return {
    id: entry._id,
    name: entry.officialName,
    category,
    officialNumbers: entry.officialNumbers,
    aliases: [entry.officialName, entry.subcategory ?? ''].filter((value) => value.length > 0),
    note: entry.subcategory ?? undefined,
  };
}

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

/**
 * Picks the most relevant library lesson for a category. Falls back to the
 * merchant-verification lesson, then to the first library lesson, and returns
 * an empty string when the library is empty (the learner screen then offers
 * the full library instead of a broken lesson).
 */
function lessonFor(lessons: LiteracyLesson[], category: ScamCategory): string {
  const direct = lessons.find((lesson) => lesson.relatedScamCategory === category);
  if (direct) return direct.id;
  const fallback =
    lessons.find((lesson) => lesson.category === 'banks-merchants') ??
    lessons.find((lesson) => lesson.category === 'mobile-money') ??
    lessons[0];
  return fallback?.id ?? '';
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
  const relatedLessonId = lessonFor(ctx.lessons, scamCategory);

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
  /** Opaque 30-day session token issued by `auth:verifyOtp`. */
  sessionToken: string | null;
  /** Server-side profile for the signed-in user (null when offline/unsigned). */
  authUser: AuthUser | null;
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

  requestOtp: (
    phone: string,
  ) => Promise<{ phone: string; expiresInSeconds: number; delivery: { provider: string; status: string; devCode?: string } }>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNewUser: boolean }>;
  completeProfile: (name: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;

  /** Refreshes every account-backed slice once; safe to call repeatedly. */
  syncAll: () => Promise<void>;
  refreshInstitutions: () => Promise<void>;
  refreshRadar: () => Promise<void>;
  refreshRecipients: () => Promise<void>;
  refreshLessons: () => Promise<void>;
  refreshExamples: () => Promise<void>;
  refreshCircles: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  /** Small async community lookup merged into `entities` (best-effort). */
  hydrateEntity: (identifier: string, identifierType?: IdentifierType) => Promise<void>;

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
  user: { ...EMPTY_USER },
  sessionToken: null,
  authUser: null,
  language: 'en',
  theme: 'dark',
  permissions: {
    contacts: 'undetermined',
    notifications: 'undetermined',
    camera: 'undetermined',
    sms: 'undetermined',
  },
  simulateOffline: false,

  // Device-local slices start empty; account-backed slices are populated by
  // syncAll() after sign-in. Nothing ships with placeholder persona data.
  checks: [],
  entities: [],
  contacts: [],
  institutions: [],
  circle: { ...EMPTY_CIRCLE },
  groups: [],
  alerts: [],
  quarantine: [],
  recipients: [],
  payments: [],
  locks: [],
  safetyEvents: [],
  radar: [],
  lessons: [],
  examples: [],
  readLessonIds: [],
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
            sessionToken?: string | null;
            authUser?: AuthUser | null;
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
            sessionToken: saved.sessionToken ?? null,
            authUser: saved.authUser ?? null,
            hydrated: true,
          });
          // A stored token is re-validated in the background: an auth error
          // clears it, but a plain network failure keeps the offline session.
          // Refresh also re-syncs the account-backed slices on success, and the
          // public institution directory always refreshes, signed in or not.
          if (get().sessionToken) void get().refreshSession();
          else void get().refreshInstitutions().catch(() => undefined);
          return;
        }
      }
    } catch {
      // Local storage is best-effort; the app still works from empty state.
    }
    set({ hydrated: true });
    void get().refreshInstitutions().catch(() => undefined);
  },

  completeOnboarding: (patch) => {
    const user = { ...get().user, ...patch };
    set({ user, onboarded: true });
    persist();
  },

  setLanguage: (language) => {
    set({ language });
    persist();
  },

  setTheme: (theme) => {
    setThemeMode(theme);
    set({ theme });
    persist();
  },

  setPermission: (key, state) => {
    const permissions = { ...get().permissions, [key]: state };
    set({ permissions });
    persist();
  },

  setSimulateOffline: (value) => set({ simulateOffline: value }),

  requestOtp: async (phone) =>
    callMutation<{
      phone: string;
      expiresInSeconds: number;
      delivery: { provider: string; status: string; devCode?: string };
    }>('auth:requestOtp', { phone }),

  verifyOtp: async (phone, code) => {
    const result = await callMutation<{
      sessionToken: string;
      user: { _id: string; phone: string; name: string; email?: string | null; roles: string[] };
      isNewUser: boolean;
    }>('auth:verifyOtp', { phone, code });
    const authUser = toAuthUser(result.user);
    set((state) => ({
      sessionToken: result.sessionToken,
      authUser,
      user: {
        ...state.user,
        id: authUser._id,
        name: authUser.name || state.user.name,
        phone: authUser.phone,
        email: authUser.email ?? state.user.email,
        role: mapRole(authUser.roles),
      },
    }));
    persist();
    void get().syncAll();
    return { isNewUser: result.isNewUser };
  },

  completeProfile: async (name, email) => {
    const token = get().sessionToken;
    if (!token) throw new Error('Sign in again to continue.');
    const patched = await callMutation<{ _id: string; name: string; email?: string }>(
      'auth:completeProfile',
      { sessionToken: token, name, email: email?.trim() || undefined },
    );
    set((state) => ({
      authUser: state.authUser
        ? { ...state.authUser, name: patched.name, email: patched.email }
        : state.authUser,
      user: { ...state.user, name: patched.name, email: patched.email ?? state.user.email },
    }));
    persist();
    void get().syncAll();
  },

  logout: async () => {
    const token = get().sessionToken;
    // Local sign-out is immediate and works offline; the server call is the
    // best-effort part so the token cannot be used to verify OTPs later.
    set({
      sessionToken: null,
      authUser: null,
      user: { ...EMPTY_USER },
      // Account-backed slices are cleared on sign-out; device-local records
      // (checks, quarantine, contacts, payments, locks) stay on the device.
      radar: [],
      recipients: [],
      lessons: [],
      examples: [],
      circle: { ...EMPTY_CIRCLE },
      groups: [],
      alerts: [],
      safetyEvents: [],
      entities: [],
    });
    persist();
    if (convex && token) {
      try {
        await callMutation<void>('auth:logout', { sessionToken: token });
      } catch {
        // Session already dead or the device is offline — local sign-out stands.
      }
    }
  },

  refreshSession: async () => {
    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    try {
      const profile = await callQuery<{
        _id: string;
        phone: string;
        name: string;
        email?: string | null;
        roles: string[];
      }>('users:getCurrentUser', { sessionToken: token });
      const authUser = toAuthUser(profile);
      set((state) => ({
        authUser,
        user: {
          ...state.user,
          id: authUser._id,
          name: authUser.name || state.user.name,
          phone: authUser.phone,
          email: authUser.email ?? state.user.email,
          role: mapRole(authUser.roles),
        },
      }));
      persist();
      void get().syncAll();
    } catch (error) {
      // Only an auth failure invalidates the token; a network error keeps the
      // offline-first session so the app stays usable without connectivity.
      const message = error instanceof Error ? error.message : '';
      if (/session/i.test(message)) {
        set({ sessionToken: null, authUser: null, user: { ...EMPTY_USER } });
        persist();
      }
    }
  },

  refreshInstitutions: async () => {
    if (!convex || !backendConfigured) return;
    try {
      const rows = await callQuery<
        {
          _id: string;
          officialName: string;
          category: string;
          subcategory?: string | null;
          officialNumbers: string[];
        }[]
      >('institutionDirectory:list', {});
      const mapped = rows.map(toVerifiedInstitution);
      if (mapped.length > 0) set({ institutions: mapped });
    } catch {
      // Offline or temporarily unavailable — keep whatever directory was last seen.
    }
  },

  syncAll: async () => {
    if (!convex || !backendConfigured || !get().sessionToken) return;
    await get().refreshInstitutions().catch(() => undefined);
    await get().refreshLessons().catch(() => undefined);
    await Promise.all([
      get().refreshRadar().catch(() => undefined),
      get().refreshRecipients().catch(() => undefined),
      get().refreshExamples().catch(() => undefined),
      get().refreshCircles().catch(() => undefined),
      get().refreshGroups().catch(() => undefined),
    ]);
  },

  refreshLessons: async () => {
    if (!convex || !backendConfigured || !get().sessionToken) return;
    try {
      const rows = await callQuery<
        {
          _id: string;
          title: string;
          category: string;
          bullets: string[];
          relatedScamCategory: string;
        }[]
      >('literacyLessons:list', {});
      if (rows.length > 0) set({ lessons: rows.map(toLocalLesson) });
    } catch {
      // The lesson library is secondary; failing to load it must not block anything.
    }
  },

  refreshRadar: async () => {
    if (!convex || !backendConfigured || !get().sessionToken) return;
    try {
      const rows = await callQuery<
        {
          _id: string;
          scamCategory: string;
          roughLocation: string;
          reportCountLast24h: number;
          sampleAnonymizedSummary: string;
        }[]
      >('scamRadar:listEvents', {});
      if (rows.length > 0) {
        const { lessons, institutions } = get();
        set({ radar: rows.map((row) => toLocalRadarEvent(row, lessons, institutions)) });
      }
    } catch {
      // Radar needs community reports to exist; an empty or offline feed is fine.
    }
  },

  refreshRecipients: async () => {
    if (!convex || !backendConfigured || !get().sessionToken) return;
    try {
      const rows = await callQuery<
        {
          _id: string;
          label: string;
          identifier: string;
          identifierType: IdentifierType;
          riskLevel: RiskLevel;
          timesPaid: number;
          lastPaidAt?: number;
        }[]
      >('savedRecipients:list', {});
      set({ recipients: rows.map(toLocalRecipient) });
    } catch {
      // Offline — keep the last seen list.
    }
  },

  refreshExamples: async () => {
    if (!convex || !backendConfigured || !get().sessionToken) return;
    try {
      const result = await callQuery<{
        round: {
          _id: string;
          textSw: string;
          textEn: string;
          scamType: string;
          riskLevel: RiskLevel;
          patterns: string[];
          notes: string;
        }[];
      }>('scamExamples:getSimulatorRound', { count: 8 });
      if (result.round.length > 0) set({ examples: result.round.map(toLocalExample) });
    } catch {
      // The simulator falls back to its empty state.
    }
  },

  refreshCircles: async () => {
    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    try {
      // Admin view throws for non-admins and for users with no circle at all.
      const adminView = await callQuery<{
        circle: { _id: string; name?: string; adminUserId: string };
        members: Array<{
          userId: string;
          name: string;
          role: 'admin' | 'protected';
          status: 'active' | 'pending';
          sharingLevel: SharingLevel;
        }>;
      }>('familyCircles:getMyCircleAsAdmin', { sessionToken: token });
      set({ circle: toLocalFamilyCircle(adminView) });
    } catch {
      const protectedView = await callQuery<{
        status: 'none' | 'alert-shared' | 'no-alert-yet';
        sharingLevel?: SharingLevel;
      }>('familyCircles:getMyCircleAsProtectedMember', { sessionToken: token }).catch(() => ({
        status: 'none' as const,
      }));
      const { user, authUser } = get();
      set({
        circle:
          protectedView.status === 'none'
            ? { ...EMPTY_CIRCLE }
            : toLocalProtectedCircle(
                {
                  userId: user.id,
                  name: authUser?.name ?? user.name,
                  phone: authUser?.phone ?? user.phone,
                },
                protectedView,
              ),
      });
    }

    // Family alerts are only fetchable once we know the circle id.
    const circleId = get().circle.id;
    if (!circleId) return;
    type ServerAlertRow = {
      _id: string;
      circleId: string;
      circleType: 'family' | 'group';
      relatedCheckId?: string;
      summary: string;
      riskLevel: RiskLevel;
      suggestedAction: string;
      createdAt: number;
    };
    const rows = await callQuery<ServerAlertRow[]>('alerts:listForCircle', {
      sessionToken: token,
      circleId,
      circleType: 'family',
    }).catch(() => [] as ServerAlertRow[]);
    const familyAlerts = rows.map((row) => toLocalAlert(row, 'Your family circle'));
    set((state) => ({
      alerts: [
        ...familyAlerts,
        ...state.alerts.filter((alert) => alert.circleKind === 'group'),
      ].sort((a, b) => b.createdAt - a.createdAt),
    }));
  },

  refreshGroups: async () => {
    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    try {
      const circles = await callQuery<
        { _id: string; name: string; adminUserId: string; role: 'admin' | 'member' }[]
      >('groupCircles:getMyCircles', { sessionToken: token });

      const groups: GroupCircle[] = [];
      const groupAlerts: Alert[] = [];
      type ServerGroupMember = {
        userId: string;
        name: string;
        role: 'admin' | 'member';
        status: 'active' | 'pending';
      };
      type ServerAlertRow = {
        _id: string;
        circleId: string;
        circleType: 'family' | 'group';
        relatedCheckId?: string;
        summary: string;
        riskLevel: RiskLevel;
        suggestedAction: string;
        createdAt: number;
      };
      for (const circle of circles) {
        const memberRows = await callQuery<{ members: ServerGroupMember[] }>(
          'groupCircles:getCircleAsAdmin',
          { sessionToken: token, groupId: circle._id },
        ).catch(() => ({ members: [] as ServerGroupMember[] }));
        const alertRows = await callQuery<ServerAlertRow[]>('alerts:listForCircle', {
          sessionToken: token,
          circleId: circle._id,
          circleType: 'group',
        }).catch(() => [] as ServerAlertRow[]);
        groups.push(
          toLocalGroupCircle(circle, memberRows.members, alertRows.map((row) => row._id)),
        );
        groupAlerts.push(...alertRows.map((row) => toLocalAlert(row, circle.name)));
      }

      set((state) => ({
        groups,
        alerts: [
          ...groupAlerts,
          ...state.alerts.filter((alert) => alert.circleKind === 'family'),
        ].sort((a, b) => b.createdAt - a.createdAt),
      }));
    } catch {
      // Offline or no groups yet — the empty state covers it.
    }
  },

  hydrateEntity: async (identifier, identifierType) => {
    if (!convex || !backendConfigured || !identifier) return;
    const type = identifierType ?? guessIdentifierType(identifier);
    if (type === 'url') return; // URL registry is deferred to the urlScans phase.
    try {
      const row = await callQuery<
        | {
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
          }
        | undefined
      >('reportedEntities:getByIdentifier', { identifier, identifierType: type });
      if (!row) return;
      const entity = toLocalEntity(row);
      set((state) => {
        if (findEntity(state.entities, entity.identifier)) return state;
        return { entities: [entity, ...state.entities] };
      });
    } catch {
      // Community lookup is best-effort and never blocks a check or a payment.
    }
  },

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
    if (check.recipientIdentifier) {
      void get().hydrateEntity(check.recipientIdentifier, check.recipientIdentifierType);
    }
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

    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    void (async () => {
      try {
        await callMutation('reports:submitScamReport', {
          sessionToken: token,
          type: toServerReportType(input.type),
          content: input.content,
          screenshotLocalOnly: input.keepScreenshotLocal,
        });
      } catch {
        // The local report stands; the cloud copy is best-effort.
      }
      const type = guessIdentifierType(identifier);
      if (type !== 'url' && identifier.length > 0) {
        await callMutation('reportedEntities:submitReport', {
          sessionToken: token,
          identifier,
          identifierType: type,
          scamCategory: toServerScamCategory(input.scamCategory),
        }).catch(() => undefined);
        await get().hydrateEntity(identifier, type).catch(() => undefined);
      }
    })();
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

  inviteFamilyMember: ({ name, phone, role }) => {
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
    }));

    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    void (async () => {
      let circleId = get().circle.id;
      if (!circleId) {
        const created = await callMutation<{ _id: string }>('familyCircles:create', {
          sessionToken: token,
        }).catch(() => undefined);
        if (!created) return;
        circleId = created._id;
      }
      await callMutation('familyCircles:inviteMember', {
        sessionToken: token,
        name,
        phone,
        role,
        sharingLevel: 'alertsOnly',
      }).catch(() => undefined);
      await get().refreshCircles().catch(() => undefined);
    })();
  },

  setMemberSharing: (userId, level) => {
    set((state) => ({
      circle: {
        ...state.circle,
        members: state.circle.members.map((member) =>
          member.userId === userId ? { ...member, sharingLevel: level } : member,
        ),
      },
    }));
    // Only server-backed members can sync their sharing level to the cloud.
    if (!isServerId(userId)) return;
    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    void callMutation('familyCircles:updateSharingLevel', {
      sessionToken: token,
      memberUserId: userId,
      sharingLevel: level,
    }).catch(() => undefined);
  },

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

    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return groupId;
    void (async () => {
      await callMutation('groupCircles:create', { sessionToken: token, name }).catch(
        () => undefined,
      );
      await get().refreshGroups().catch(() => undefined);
    })();
    return groupId;
  },

  inviteGroupMember: (groupId, { name, phone }) => {
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
    }));

    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    const matched = get().groups.find((item) => item.id === groupId);
    const serverGroupId =
      matched && isServerId(matched.id)
        ? matched.id
        : matched
          ? get().groups.find((item) => item.name === matched.name && isServerId(item.id))?.id
          : undefined;
    if (!serverGroupId) return;
    void callMutation('groupCircles:inviteMember', {
      sessionToken: token,
      groupId: serverGroupId,
      name,
      phone,
    })
      .catch(() => undefined)
      .then(() => get().refreshGroups().catch(() => undefined));
  },

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

    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    const matched = get().groups.find((item) => item.id === groupId);
    const serverGroupId =
      matched && isServerId(matched.id)
        ? matched.id
        : matched
          ? get().groups.find((item) => item.name === matched.name && isServerId(item.id))?.id
          : undefined;
    if (!serverGroupId) return;
    void callMutation('groupCircles:broadcastAlert', {
      sessionToken: token,
      groupId: serverGroupId,
      summary,
      suggestedAction: detail,
      riskLevel: 'red',
    }).catch(() => undefined);
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
      payload: lessonFor(state.lessons, scamCategory),
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
      relatedLessonId: lessonFor(state.lessons, scamCategory),
      firstTimeRecipient: !saved || saved.timesPaid === 0,
      status: 'pending',
      createdAt: Date.now(),
    };

    set({ payments: [payment, ...state.payments] });
    if (identifier) void get().hydrateEntity(identifier, identifierType);
    return payment;
  },

  startLock: (paymentId) => {
    const state = get();
    const payment = state.payments.find((item) => item.id === paymentId);
    const protectedMember = state.circle.members.find(
      (member) => member.userId === state.user.id && member.role === 'protected',
    );
    const mandatory = Boolean(protectedMember?.lockSeconds);
    const riskLevel = payment?.riskLevel ?? 'amber';
    const lock: PaymentLock = {
      id: id('lock'),
      paymentId,
      riskLevel,
      lockDurationSeconds: protectedMember?.lockSeconds ?? 900,
      startedAt: Date.now(),
      status: 'locked',
      mandatory,
    };
    set({ locks: [lock, ...state.locks] });

    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token || (riskLevel !== 'red' && riskLevel !== 'amber')) {
      return lock;
    }
    void callMutation<{ _id: string }>('paymentLocks:start', {
      sessionToken: token,
      riskLevel,
      lockDurationSeconds: lock.lockDurationSeconds,
    })
      .then((started) =>
        set((current) => ({
          locks: current.locks.map((item) =>
            item.id === lock.id ? { ...item, serverId: started._id } : item,
          ),
        })),
      )
      .catch(() => undefined);
    return lock;
  },

  releaseLock: (lockId) => {
    const lock = get().locks.find((item) => item.id === lockId);
    set((state) => ({
      locks: state.locks.map((item) =>
        item.id === lockId ? { ...item, status: 'released' } : item,
      ),
    }));
    const token = get().sessionToken;
    if (!lock?.serverId || !convex || !backendConfigured || !token) return;
    void callMutation('paymentLocks:release', {
      sessionToken: token,
      lockId: lock.serverId,
    }).catch(() => undefined);
  },

  markPaid: (paymentId, note) => {
    const payment = get().payments.find((item) => item.id === paymentId);
    set((state) => {
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
    });

    const token = get().sessionToken;
    if (!payment || !convex || !backendConfigured || !token) return;
    void (async () => {
      const saved = get().recipients.find((recipient) => recipient.identifier === payment.identifier);
      await callMutation('payments:markPaid', {
        sessionToken: token,
        recipientId: saved && isServerId(saved.id) ? saved.id : undefined,
        identifier: payment.identifier,
        identifierType: payment.identifierType,
        amountKes: payment.amountKes,
        note: note || undefined,
      }).catch(() => undefined);
      await callMutation('savedRecipients:save', {
        sessionToken: token,
        label: payment.recipientLabel,
        identifier: payment.identifier,
        identifierType: payment.identifierType,
      }).catch(() => undefined);
      await get().refreshRecipients().catch(() => undefined);
    })();
  },

  abandonPayment: (paymentId) =>
    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.id === paymentId ? { ...payment, status: 'abandoned' } : payment,
      ),
    })),

  addSafetyEvent: (source, delta) => {
    set((state) => ({
      safetyEvents: [
        { id: id('score'), userId: state.user.id, source, delta, createdAt: Date.now() },
        ...state.safetyEvents,
      ],
    }));
    const token = get().sessionToken;
    if (!convex || !backendConfigured || !token) return;
    void callMutation('safetyScore:record', {
      sessionToken: token,
      source: toServerSafetySource(source),
      delta,
    }).catch(() => undefined);
  },

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
