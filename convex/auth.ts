import { v } from 'convex/values';
import { mutation } from './_generated/server';

import { canonicalizePhone, hashToken } from './lib/canonicalize';
import { createSession, requireUser } from './lib/auth';
import { OTP_MAX_PER_WINDOW, OTP_TTL_MS, OTP_WINDOW_MS } from './lib/auth';
import { generateOtpCode, sendOtp } from './providers/sms';

const OTP_VALIDATOR = v.string();

/**
 * Requests an SMS OTP for a Kenyan phone number. Rate-limited server-side:
 * max 3 requests per phone per rolling 10 minutes (backend brief Section 13.2).
 */
export const requestOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = canonicalizePhone(args.phone);
    const now = Date.now();
    const windowStart = now - OTP_WINDOW_MS;

    const recent = await ctx.db
      .query('otpRequests')
      .withIndex('by_phone_time', (q) => q.eq('phone', phone).gt('requestedAt', windowStart))
      .collect();

    if (recent.length >= OTP_MAX_PER_WINDOW) {
      // Cooldown is deliberately opaque so it can't be used to enumerate sends.
      throw new Error(
        'Too many codes requested recently. Wait a few minutes and try again.',
      );
    }

    const code = generateOtpCode();
    await ctx.db.insert('otpRequests', {
      phone,
      code,
      expiresAt: now + OTP_TTL_MS,
      requestedAt: now,
    });

    const delivery = await sendOtp(phone, code);
    return { phone, expiresInSeconds: OTP_TTL_MS / 1000, delivery };
  },
});

/**
 * Verifies a phone+code pair, creates (or updates) the user, and issues a
 * 30-day session token. `isNewUser` lets the client decide whether to show
 * the profile-completion step.
 */
export const verifyOtp = mutation({
  args: { phone: v.string(), code: OTP_VALIDATOR },
  handler: async (ctx, args) => {
    const phone = canonicalizePhone(args.phone);
    const request = await ctx.db
      .query('otpRequests')
      .withIndex('by_phone_time', (q) => q.eq('phone', phone))
      .order('desc')
      .first();

    if (!request || request.code !== args.code) {
      throw new Error('That code is incorrect. Check it and try again.');
    }
    if (request.expiresAt < Date.now()) {
      throw new Error('That code has expired. Request a new one.');
    }

    let user = await ctx.db.query('users').withIndex('by_phone', (q) => q.eq('phone', phone)).unique();
    let isNewUser = false;

    if (!user) {
      const now = Date.now();
      const id = await ctx.db.insert('users', {
        phone,
        name: '',
        roles: ['standalone'],
        createdAt: now,
        lastActiveAt: now,
      });
      user = await ctx.db.get(id);
      isNewUser = true;
    }

    if (!user) throw new Error('Could not create your account.');
    await ctx.db.patch(user._id, { lastActiveAt: Date.now(), phone });

    const sessionToken = await createSession(ctx, user._id);
    return {
      sessionToken,
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
      isNewUser,
    };
  },
});

/** One-time profile completion after first verification. */
export const completeProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);

    const name = args.name.trim();
    if (name.length < 2) throw new Error('Please enter your name.');

    const patch: Partial<{ name: string; email?: string }> = { name };
    if (args.email && args.email.trim().length > 0) patch.email = args.email.trim();
    await ctx.db.patch(user._id, patch);
    return { _id: user._id, ...patch };
  },
});

/** Terminates a session server-side (token is immediately invalid). */
export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken);
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_tokenHash', (q) => q.eq('tokenHash', tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});