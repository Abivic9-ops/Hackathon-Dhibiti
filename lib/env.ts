/**
 * Typed, client-safe environment access.
 *
 * Only variables prefixed `EXPO_PUBLIC_` are inlined into the app bundle by
 * Expo, and only those belong here. Anything else — Safe Browsing malware
 * keys, VirusTotal, IPQualityScore, Numverify, Truecaller, Africa's Talking,
 * GROQ, … — MUST NOT be EXPO_PUBLIC_. They are server-secret values read only
 * inside Convex functions (see convex/lib/env.ts), so they never ship to a
 * phone. Keeping this file free of those secrets is what stops them leaking
 * into the app's JS bundle.
 */

/**
 * Convex client URL (EXPO_PUBLIC_CONVEX_URL, written by `npx convex dev`).
 * Empty → the app boots fully offline and every network action fails with a
 * readable "not connected" error instead of crashing.
 */
export const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? '';

/**
 * Convex site URL (EXPO_PUBLIC_CONVEX_SITE_URL), the public HTTP gateway used
 * for file uploads and Hono endpoints. Optional.
 */
export const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? '';

/**
 * Optional self-hosted data backend (Supabase/PostgREST-style). Leave empty to
 * run with the Convex backend alone in development.
 */
export const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
export const backendAnonKey = process.env.EXPO_PUBLIC_BACKEND_ANON_KEY ?? '';

/** True when a Convex deployment has been configured for this environment. */
export const convexConfigured = convexUrl.length > 0;

/** True when the optional custom backend has been configured. */
export const backendConfigured = backendUrl.length > 0 && backendAnonKey.length > 0;
