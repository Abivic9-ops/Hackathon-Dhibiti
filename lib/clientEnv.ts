/**
 * Typed, client-safe environment access for Dhibiti.
 *
 * ONLY these keys may be read inside the app bundle. Every one is prefixed
 * `EXPO_PUBLIC_` (Expo inlines them at build time) and they are public by
 * design — never put a server-only secret here.
 *
 * Server-only secrets (Google Safe Browsing, VirusTotal, IPQualityScore,
 * Numverify, urlscan.io, Truecaller, Africa's Talking, GROQ…) live in Convex
 * env vars and are read ONLY through `convex/lib/serverEnv.ts`. Importing that
 * file (or any file that imports it) into app code would be a leak — it must
 * never happen.
 */

export type ClientEnv<TSource extends { [key: string]: string | undefined }> = {
  backing: TSource;
  readonly convexUrl: string;
  readonly convexSiteUrl: string;
  readonly siteUrl: string;
  readonly backendUrl: string;
  readonly backendAnonKey: string;
};

/** Default empty — lets the app boot offline while Convex URLs are injected. */
export function readClientEnv<TSource extends { [key: string]: string | undefined }>(
  source: TSource,
): ClientEnv<TSource> {
  const get = (name: string) => source[name]?.trim() ?? '';
  return {
    backing: source,
    convexUrl: get('EXPO_PUBLIC_CONVEX_URL'),
    convexSiteUrl: get('EXPO_PUBLIC_CONVEX_SITE_URL'),
    siteUrl: get('EXPO_PUBLIC_CONVEX_SITE_URL'),
    backendUrl: get('EXPO_PUBLIC_BACKEND_URL'),
    backendAnonKey: get('EXPO_PUBLIC_BACKEND_ANON_KEY'),
  };
}

let cached: ClientEnv<typeof globalThis.process.env> | undefined;

/**
 * Read the typed env once and memoise it. `process.env` can be read at module
 * scope in an Expo bundle, but mockable + cached access is safer and lets the
 * invite/logic tests swap values without importing the real `.env` file.
 */
export function clientEnv(): ClientEnv<typeof globalThis.process.env> {
  if (!cached) cached = readClientEnv(globalThis.process?.env ?? {});
  return cached;
}

/** Test-only reset so tests can inject a fresh env between cases. */
export function resetClientEnv(): void {
  cached = undefined;
}
