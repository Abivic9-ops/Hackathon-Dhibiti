import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

import { requireUser } from './lib/auth';

/** Returns the authenticated user's profile + roles. */
export const getCurrentUser = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId, user } = await requireUser(ctx, args.sessionToken);
    return {
      _id: userId,
      phone: user.phone,
      name: user.name,
      email: user.email,
      roles: user.roles,
      privacySettings: user.privacySettings,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  },
});

/** Updates what's shared with Family/Group circles (Section 5.3). */
export const updatePrivacySettings = mutation({
  args: {
    sessionToken: v.string(),
    settings: v.object({
      shareLocation: v.optional(v.boolean()),
      sharePaymentActivity: v.optional(v.boolean()),
      shareCircleAlerts: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireUser(ctx, args.sessionToken);
    const merged = { ...user.privacySettings, ...args.settings };
    await ctx.db.patch(userId, { privacySettings: merged });
    return merged;
  },
});