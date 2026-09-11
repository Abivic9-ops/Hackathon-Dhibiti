/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as auth from "../auth.js";
import type * as checks from "../checks.js";
import type * as crons from "../crons.js";
import type * as educationSeed from "../educationSeed.js";
import type * as explainVerdict from "../explainVerdict.js";
import type * as familyCircles from "../familyCircles.js";
import type * as floatingShield from "../floatingShield.js";
import type * as groupCircles from "../groupCircles.js";
import type * as institutionDirectory from "../institutionDirectory.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_canonicalize from "../lib/canonicalize.js";
import type * as lib_explain from "../lib/explain.js";
import type * as lib_rulesEngine from "../lib/rulesEngine.js";
import type * as lib_seedInstitutions from "../lib/seedInstitutions.js";
import type * as literacyLessons from "../literacyLessons.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as numbers from "../numbers.js";
import type * as paymentLocks from "../paymentLocks.js";
import type * as payments from "../payments.js";
import type * as providers_domainReputation from "../providers/domainReputation.js";
import type * as providers_llm from "../providers/llm.js";
import type * as providers_push from "../providers/push.js";
import type * as providers_sms from "../providers/sms.js";
import type * as qrScans from "../qrScans.js";
import type * as quarantine from "../quarantine.js";
import type * as reportedEntities from "../reportedEntities.js";
import type * as reports from "../reports.js";
import type * as safetyScore from "../safetyScore.js";
import type * as savedRecipients from "../savedRecipients.js";
import type * as scamExamples from "../scamExamples.js";
import type * as scamRadar from "../scamRadar.js";
import type * as urlScans from "../urlScans.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  auth: typeof auth;
  checks: typeof checks;
  crons: typeof crons;
  educationSeed: typeof educationSeed;
  explainVerdict: typeof explainVerdict;
  familyCircles: typeof familyCircles;
  floatingShield: typeof floatingShield;
  groupCircles: typeof groupCircles;
  institutionDirectory: typeof institutionDirectory;
  "lib/auth": typeof lib_auth;
  "lib/canonicalize": typeof lib_canonicalize;
  "lib/explain": typeof lib_explain;
  "lib/rulesEngine": typeof lib_rulesEngine;
  "lib/seedInstitutions": typeof lib_seedInstitutions;
  literacyLessons: typeof literacyLessons;
  moderation: typeof moderation;
  notifications: typeof notifications;
  numbers: typeof numbers;
  paymentLocks: typeof paymentLocks;
  payments: typeof payments;
  "providers/domainReputation": typeof providers_domainReputation;
  "providers/llm": typeof providers_llm;
  "providers/push": typeof providers_push;
  "providers/sms": typeof providers_sms;
  qrScans: typeof qrScans;
  quarantine: typeof quarantine;
  reportedEntities: typeof reportedEntities;
  reports: typeof reports;
  safetyScore: typeof safetyScore;
  savedRecipients: typeof savedRecipients;
  scamExamples: typeof scamExamples;
  scamRadar: typeof scamRadar;
  urlScans: typeof urlScans;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
