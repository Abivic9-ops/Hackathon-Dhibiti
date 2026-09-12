/**
 * Server-only environment access for Dhibiti's Convex backend.
 *
 * These secrets are NEVER available to the app. They live in Convex env vars
 * (`npx convex env set KEY value` → pushed to the backend, read as
 * `process.env.KEY` inside server functions) or, for local `convex dev`, in
 * the device/git-ignored `.env.local` under CONVEX_DEV_ equivalents. Because
 * they are not `EXPO_PUBLIC_`, they are never inlined by Expo and can never
 * reach the app bundle.
 *
 * ⚠️  Do NOT import this file (or `lib/env.ts`) into `lib/`, `app/`,
 * `components/`, or any code that ships to the device. Importing it here is
 * the only safe place.
 */

export type ServerEnvKey =
  // URL safety & reputation
  | 'SAFE_BROWSING_API_KEY'
  | 'VIRUSTOTAL_API_KEY'
  | 'IPQUALITYSCORE_API_KEY'
  | 'URLSCAN_IO_API_KEY'
  // Phone number intelligence
  | 'NUMVERIFY_API_KEY'
  | 'AFRICAS_TALKING_SMS_API_KEY'
  | 'TRUE_CALLER_CLIENT_ID'
  // AI explanation (GROQ API — free tier model, e.g. llama-3.x via GROQ)
  | 'GROQ_API_KEY'
  // SMS OTP delivery (Africa's Talking/AT gateway)
  | 'SMS_OTP_API_KEY';

const SERVER_KEYS: Record<ServerEnvKey, (s: NodeJS.ProcessEnv) => string> = {
  SAFE_BROWSING_API_KEY: (s) => s.SAFE_BROWSING_API_KEY ?? '',
  VIRUSTOTAL_API_KEY: (s) => s.VIRUSTOTAL_API_KEY ?? '',
  IPQUALITYSCORE_API_KEY: (s) => s.IPQUALITYSCORE_API_KEY ?? '',
  URLSCAN_IO_API_KEY: (s) => s.URLSCAN_IO_API_KEY ?? '',
  NUMVERIFY_API_KEY: (s) => s.NUMVERIFY_API_KEY ?? '',
  AFRICAS_TALKING_SMS_API_KEY: (s) => s.AFRICAS_TALKING_SMS_API_KEY ?? '',
  TRUE_CALLER_CLIENT_ID: (s) => s.TRUE_CALLER_CLIENT_ID ?? '',
  GROQ_API_KEY: (s) => s.GROQ_API_KEY ?? '',
  SMS_OTP_API_KEY: (s) => s.SMS_OTP_API_KEY ?? '',
};

let cachedSecrets: Record<ServerEnvKey, string> | undefined;

/** Read one server secret, memoised per process. Returns '' when unset. */
export function serverSecret(key: ServerEnvKey): string {
  if (!cachedSecrets) {
    cachedSecrets = Object.fromEntries(
      (Object.keys(SERVER_KEYS) as ServerEnvKey[]).map((k) => [k, SERVER_KEYS[k](process.env)]),
    ) as Record<ServerEnvKey, string>;
  }
  return cachedSecrets[key];
}

/** True when every required server secret is configured for this deployment. */
export function serverSecretsConfigured(required: ServerEnvKey[]): boolean {
  return required.every((key) => serverSecret(key).length > 0);
}
