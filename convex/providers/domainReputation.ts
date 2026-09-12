/**
 * URL/domain reputation provider (backend brief Section 11.2).
 *
 * A Safe-Browsing-style threat-intel API plus WHOIS/domain-age lookup, mocked
 * behind one clean interface (`checkDomainReputation`) so the provider can be
 * swapped without touching calling code. Integration discipline (Section 11):
 * this is only ever called from inside a Convex `action`, never a query or
 * mutation, and every caller wraps it in a try/catch that degrades gracefully.
 */

export type DomainReputation = {
  /** Days since the domain was first registered, if determinable. */
  domainAgeDays?: number;
  /** TLS certificate validity + organization handled separately by checkTls. */
  sslValid?: boolean;
  /** Safe-browsing verdict: 'known_bad', 'suspicious' or 'clean'. */
  status: 'known_bad' | 'suspicious' | 'clean' | 'unknown';
  /** Human-readable notes from the reputation source. */
  notes: string[];
};

const LOOKALIKE_MARKERS = ['mpesa-secure', 'safaricom-verify', 'kcb-login', 'equity-verify', 'mpesa-refund', 'mpess'];

/**
 * Mock reputation lookup. Currently derives everything deterministically from
 * the domain string so the flow is exercisable offline. Replace the body with
 * a real threat-intel + WHOIS call when credentials exist; the return contract
 * does not change.
 */
export async function checkDomainReputation(domain: string): Promise<DomainReputation> {
  const host = domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

  // Simulated latency so the "Checking…" loading state is visible in dev.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const notes: string[] = [];
  const lower = host;
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const lookalike = LOOKALIKE_MARKERS.some((marker) => lower.includes(marker));

  if (isIp) {
    return { sslValid: false, status: 'suspicious', notes: ['Host is a bare IP address.'] };
  }
  if (lookalike) {
    return { domainAgeDays: 40, sslValid: true, status: 'suspicious', notes: ['Domain pattern matches a known lookalike list.'] };
  }

  // Deterministic pseudo-age/status for well-formed domains so callers always
  // have something to work with offline.
  notes.push('Mock reputation source — no live threat-intel data configured.');
  return {
    domainAgeDays: 900,
    sslValid: true,
    status: lower.endsWith('.co.ke') ? 'clean' : 'unknown',
    notes,
  };
}

export type TlsResult = {
  valid: boolean;
  orgMatch?: string | undefined;
};

/**
 * TLS certificate check (Section 11.3). Mocked: reports valid with an optional
 * certificate-organization match. Swap for a real handshake when credentialed.
 */
export async function checkTls(_domain: string): Promise<TlsResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { valid: true, orgMatch: undefined };
}
