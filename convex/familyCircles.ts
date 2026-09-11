/**
 * Family Circle module (backend brief Section 7 / 2.9).
 *
 * A family circle has one `familyAdmin` and one or more `protectedMember`s.
 * The protected-member view (`getMyCircleAsProtectedMember`) deliberately
 * returns only a status ("an alert was shared"), never a raw activity feed —
 * the privacy rule in §4.4. All access is gated by the shared
 * `assertFamilyMembership` helper (Section 13.3).
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';

import { assertFamilyMembership, requireUser } from './lib/auth';
import { canonicalizePhone } from './lib/canonicalize';

function summarizeMembership(row: Doc<'familyMemberships'>) {
  return {
    userId: row.userId,
    role: row.role,
    status: row.status,
    sharingLevel: row.sharingLevel,
  };
}

export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireUser(ctx, args.sessionToken);

    // A user can only have one family circle; creating again is a no-op.
    const existing = await ctx.db
      .query('familyCircles')
      .filter((q) => q.eq(q.field('adminUserId'), userId))
      .first();
    if (existing) {
      return { _id: existing._id, created: false };
    }

    const id = await ctx.db.insert('familyCircles', {
      adminUserId: userId,
      name: args.name?.trim() || undefined,
      createdAt: Date.now(),
    });

    await ctx.db.insert('familyMemberships', {
      circleId: id,
      userId,
      role: 'admin',
      status: 'active',
      sharingLevel: 'alertsOnly',
    });

    // Promote the role so the user can manage their circle and override locks.
    if (!user.roles.includes('familyAdmin')) {
      await ctx.db.patch(userId, { roles: [...user.roles, 'familyAdmin'] });
    }

    return { _id: id, created: true };
  },
});

export const inviteMember = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal('admin'), v.literal('protected')),
    sharingLevel: v.optional(
      v.union(v.literal('alertsOnly'), v.literal('withRecipient'), v.literal('withAmount'), v.literal('full')),
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const { membership } = await assertFamilyMembership(ctx.db, user._id);
    if (membership.role !== 'admin') {
      throw new Error('Only the family admin can invite members.');
    }

    const phone = canonicalizePhone(args.phone);
    const name = args.name.trim();
    if (name.length < 2) throw new Error('Please enter the member\u2019s name.');

    // The invited person may already have an account (by phone) or may not yet.
    const invitedUser = await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phone', phone))
      .unique();

    let invitedUserId = invitedUser?._id;

    if (!invitedUserId) {
      const now = Date.now();
      const newUserId = await ctx.db.insert('users', {
        phone,
        name,
        roles: ['standalone'],
        createdAt: now,
        lastActiveAt: now,
      });
      invitedUserId = newUserId;
    }

    // One membership per user per circle — idempotent.
    const circleMembers = await ctx.db
      .query('familyMemberships')
      .withIndex('by_circle', (q) => q.eq('circleId', membership.circleId))
      .collect();
    const dup = circleMembers.find((m) => m.userId === invitedUserId);
    if (dup) return { _id: dup._id, created: false };

    const invitationId = await ctx.db.insert('familyMemberships', {
      circleId: membership.circleId,
      userId: invitedUserId,
      role: args.role,
      status: 'pending',
      sharingLevel: args.sharingLevel ?? 'alertsOnly',
    });

    return { _id: invitationId, created: true };
  },
});

/** Accepts a pending invite (the invited user confirms they join). */
export const acceptInvite = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const pending = await ctx.db
      .query('familyMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const invite = pending.find((m) => m.status === 'pending');
    if (!invite) throw new Error('No pending invite to accept.');
    await ctx.db.patch(invite._id, { status: 'active' });
    return { _id: invite._id, status: 'active' };
  },
});

export const updateSharingLevel = mutation({
  args: {
    sessionToken: v.string(),
    memberUserId: v.id('users'),
    sharingLevel: v.union(v.literal('alertsOnly'), v.literal('withRecipient'), v.literal('withAmount'), v.literal('full')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const { membership, circle } = await assertFamilyMembership(ctx.db, user._id);
    if (membership.role !== 'admin') {
      throw new Error('Only the family admin can change sharing settings.');
    }
    const target = await ctx.db
      .query('familyMemberships')
      .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
      .collect();
    const member = target.find((m) => m.userId === args.memberUserId);
    if (!member) throw new Error('That member is not in your circle.');
    await ctx.db.patch(member._id, { sharingLevel: args.sharingLevel });
    return summarizeMembership({ ...member, sharingLevel: args.sharingLevel });
  },
});

export const removeMember = mutation({
  args: { sessionToken: v.string(), memberUserId: v.id('users') },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const { membership, circle } = await assertFamilyMembership(ctx.db, user._id);
    if (membership.role !== 'admin') {
      throw new Error('Only the family admin can remove members.');
    }
    if (args.memberUserId === user._id) {
      throw new Error('You cannot remove yourself.');
    }
    const target = await ctx.db
      .query('familyMemberships')
      .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
      .collect();
    const member = target.find((m) => m.userId === args.memberUserId);
    if (!member) throw new Error('That member is not in your circle.');
    await ctx.db.delete(member._id);
    return { removed: true };
  },
});

export const getMyCircleAsAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const { membership, circle } = await assertFamilyMembership(ctx.db, user._id);
    if (membership.role !== 'admin') throw new Error('You are not the family admin.');

    const memberships = await ctx.db
      .query('familyMemberships')
      .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
      .collect();
    const names = new Map<string, string>();
    for (const m of memberships) {
      const memberUser = await ctx.db.get(m.userId);
      if (memberUser) names.set(m.userId, memberUser.name || memberUser.phone);
    }

    return {
      circle: { _id: circle._id, name: circle.name ?? undefined, adminUserId: circle.adminUserId },
      members: memberships.map((m) => ({
        userId: m.userId,
        name: names.get(m.userId) ?? 'Unknown',
        role: m.role,
        status: m.status,
        sharingLevel: m.sharingLevel,
      })),
    };
  },
});

/**
 * Protected-member view: returns only a status, never a raw activity feed
 * (§4.4 privacy rule).
 */
export const getMyCircleAsProtectedMember = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const memberships = await ctx.db
      .query('familyMemberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    const active = memberships.find((m) => m.status === 'active' && m.role === 'protected');
    if (!active) {
      return { status: 'none' };
    }
    // Whether an alert has ever been shared with this member's circle.
    const alert = await ctx.db
      .query('alerts')
      .withIndex('by_circle', (q) => q.eq('circleId', active.circleId))
      .order('desc')
      .first();
    return {
      status: alert ? 'alert-shared' : 'no-alert-yet',
      sharingLevel: active.sharingLevel,
    };
  },
});
