/**
 * Canonicalization utilities (backend brief Section 2.10).
 *
 * Principle 2 of the brief: every shared-cache table (QR, URL, phone,
 * Paybill/Till) is keyed by a normalized, canonical identifier, never a raw
 * user-submitted string. All lookups and writes go through these functions.
 */

/** Strips spaces/dashes/parentheses, normalizes to +254XXXXXXXXX. */
export function canonicalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`;
  return `+${digits}`;
}

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'mc_cid',
  'mc_eid',
];

/**
 * Lowercases host, strips tracking query params, resolves to scheme+host+path
 * with no trailing-slash inconsistency. Safe for shared-cache keying.
 */
export function canonicalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Unparseable — keep the trimmed input as-is (avoids throwing on junk).
    return raw.trim().toLowerCase();
  }

  parsed.hash = '';
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (TRACKING_PARAMS.includes(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';

  return parsed.toString();
}

/**
 * Normalizes a decoded QR payload, then SHA-256 hashes it for `qrScans.contentHash`.
 * `contentHash` is the cache key — we deliberately do not store raw payloads in
 * shared/community tables (privacy principle 4).
 */
export async function canonicalizeQrPayload(raw: string): Promise<string> {
  const normalized = raw
    .trim()
    .replace(/https?:\/\//gi, (match) => match.toLowerCase())
    .replace(/\b[A-Z0-9.-]+\.(?:co\.ke|com|org|net|ke|info|xyz|top|shop)\b/gi, (host) =>
      host.toLowerCase(),
    );
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized),
  );
  return hex(digest);
}

/** Strips non-numeric characters; returns null when the length is implausible for KE. */
export function canonicalizePaybillTill(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return /^\d{5,7}$/.test(digits) ? digits : null;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return hex(digest);
}

/** Messages must never carry a raw payload hash; the hash then is keyed, not raw. */
export function ruleCombinationHash(fields: string[]): string {
  return fields
    .map((field) => field.trim().replace(/\s+/g, ' ').toLowerCase())
    .join('|');
}