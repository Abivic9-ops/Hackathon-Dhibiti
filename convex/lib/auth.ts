/**
 * Session helpers for the phone+OTP auth flow (backend brief Section 1).
 *
 * The spec allows "Convex Auth OR an equivalent JWT-session pattern". The
 * foundation pass uses an opaque-session-token pattern: on verifyOtp the server
 * issues a random token, stores only its SHA-256 hash in the `sessions` table
 * (30-day rolling inactivity), and every protected function re-verifies the
 * token through `requireUser`. Revocable, stateless-to-the-client, and it needs
 * no external SMS dependency to be exercised end-to-end today.
 */

import type { Doc } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { hashToken } from './canonicalize';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const OTP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_PER_WINDOW = 3;
export const OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes

export function newToken(): string {
  return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
}

export async function createSession(
  ctx: MutationCtx,
  userId: Doc<'users'>['_id'],
): Promise<string> {
  const token = newToken();
  const tokenHash = await hashToken(token);
  const now = Date.now();
  await ctx.db.insert('sessions', {
    tokenHash,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    lastActiveAt: now,
  });
  return token;
}

export type AuthenticatedUser = {
  userId: Doc<'users'>['_id'];
  user: Doc<'users'>;
};

/**
 * Verifies a session token and returns the owning user. Extends the inactivity
 * window on every successful use (silent refresh). Throws when invalid/expired.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string,
): Promise<AuthenticatedUser> {
  const tokenHash = await hashToken(sessionToken);
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_tokenHash', (q) => q.eq('tokenHash', tokenHash))
    .unique();

  if (!session) throw new Error('Invalid session. Please sign in again.');
  if (session.expiresAt < Date.now()) throw new Error('Session expired. Please sign in again.');

  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error('Account no longer exists.');

  const now = Date.now();
  if (
    'patch' in ctx.db &&
    (session.lastActiveAt < now - SESSION_TTL_MS / 2 ||
      session.expiresAt < now + SESSION_TTL_MS / 2)
  ) {
    await ctx.db.patch(session._id, {
      lastActiveAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
  }

  return { userId: user._id, user };
}

/** Throws unless the user holds the given role. */
export function assertRole(user: Doc<'users'>, role: Doc<'users'>['roles'][number]): void {
  if (!user.roles.includes(role)) {
    throw new Error(`This action requires the "${role}" role.`);
  }
}

/** Throws unless the caller owns the resource (simple equality check). */
export function assertOwns<T>(userId: Doc<'users'>['_id'], ownerId: T): T {
  if (ownerId !== (userId as unknown as T)) {
    throw new Error('You do not have permission to access this resource.');
  }
  return ownerId;
}

/**
 * Anti-abuse shared middleware: duplicate reports/shares are idempotent no-ops.
 * Returns true when the userId is already present.
 */
export function hasAlreadyContributed(
  uniqueIds: Doc<'users'>['_id'][],
  userId: Doc<'users'>['_id'],
): boolean {
  return uniqueIds.some((id) => id === userId);
}

/** Throws unless the user holds the `moderator` role (Section 14 / 13.3). */
export function assertModerator(user: Doc<'users'>): void {
  if (!user.roles.includes('moderator')) {
    throw new Error('This action requires the moderator role.');
  }
}

export type FamilyMembershipMatch = {
  membership: Doc<'familyMemberships'>;
  circle: Doc<'familyCircles'>;
};

/**
 * Shared membership check (Section 13.3): returns the caller's active family
 * membership + circle, or throws. Prevents ad hoc per-function access checks.
 */
export async function assertFamilyMembership(
  db: QueryCtx['db'],
  userId: Doc<'users'>['_id'],
): Promise<FamilyMembershipMatch> {
  const memberships = await db
    .query('familyMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  const active = memberships.find((m) => m.status === 'active');
  if (!active) throw new Error('You are not part of any family circle.');

  const circle = await db.get(active.circleId);
  if (!circle) throw new Error('Your family circle no longer exists.');
  return { membership: active, circle };
}

/**
 * Shared membership check for group circles (Section 13.3). Returns the
 * caller's active group memberships.
 */
export async function assertGroupMembership(
  db: QueryCtx['db'],
  userId: Doc<'users'>['_id'],
): Promise<Doc<'groupMemberships'>[]> {
  const memberships = await db
    .query('groupMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();
  return memberships.filter((m) => m.status === 'active');
}