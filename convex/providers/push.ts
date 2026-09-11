/**
 * Push notification provider (backend brief Section 11.5 / 10).
 *
 * Expo push notifications — pairs directly with the Expo frontend. Mocked
 * behind one function so the real Expo push API is swapped in without touching
 * calling code. Only ever invoked from inside a Convex `action`.
 */

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type PushResult = {
  provider: 'mock' | 'expo';
  status: 'sent' | 'failed';
};

/**
 * Sends a push to a single device token. Mock: logs and returns success so the
 * whole notify flow is exercisable offline. Replace with the Expo push API
 * (`expo/notifications` server endpoint) when credentials exist.
 */
export async function sendPush(
  token: string,
  platform: 'ios' | 'android',
  payload: PushPayload,
): Promise<PushResult> {
  console.log(`[mock-push] ${platform} -> ${token.slice(0, 8)}… : ${payload.title} — ${payload.body}`);
  return { provider: 'mock', status: 'sent' };
}
