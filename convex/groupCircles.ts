/**
 * Group Circle module (chama / SACCO) — backend brief Section 7 / 2.10.
 *
 * `broadcastAlert` surfaces a Red/Amber warning to every active member of a
 * group. Access is gated by active membership (Section 13.3), and only an
 * admin or a member can broadcast (admins and members can both raise a concern
 * in a chama setting).
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

import { requireUser } from './lib/auth';
import { canonicalizePhone } from './lib/canonicalize';

function memberSummary(row: Doc<'groupMemberships'>) {
  return { userId: row.userId, role: row.role, status: row.status };
}

export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireUser(ctx, args.sessionToken);
    const name = args.name.trim();
    if (name.length < 2) throw new Error('Please name the group.');

    const id = await ctx.db.insert('groupCircles', {
      name,
      adminUserId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert('groupMemberships', {
      groupId: id,
      userId,
      role: 'admin',
      status: 'active',
    });

    if (!user.roles.includes('groupAdmin')) {
      await ctx.db.patch(userId, { roles: [...user.roles, 'groupAdmin'] });
    }

    return { _id: id, name };
  },
});

export const inviteMember = mutation({
  args: { sessionToken: v.string(), groupId: v.id('groupCircles'), name: v.string(), phone: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);

    // Only an active member can invite a new member.
    const memberships = await ctx.db
      .query('groupMemberships')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect();
    const caller = memberships.find((m) => m.userId === user._id && m.status === 'active');
    if (!caller) throw new Error('You are not an active member of this group.');

    const phone = canonicalizePhone(args.phone);
    const name = args.name.trim();
    if (name.length < 2) throw new Error('Please enter the member\u2019s name.');

    const invitedUser = await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phone', phone))
      .unique();

    let invitedUserId = invitedUser?._id;
    if (!invitedUserId) {
      const now = Date.now();
      invitedUserId = await ctx.db.insert('users', {
        phone,
        name,
        roles: ['standalone'],
        createdAt: now,
        lastActiveAt: now,
      });
    }

    const dup = memberships.find((m) => m.userId === invitedUserId);
    if (dup) return { _id: dup._id, created: false };

    const membershipId = await ctx.db.insert('groupMemberships', {
      groupId: args.groupId,
      userId: invitedUserId,
      role: 'member',
      status: 'pending',
    });
    return { _id: membershipId, created: true };
  },
});

export const acceptInvite = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireUser(ctx, args.sessionToken);
    const pending = await ctx.db
      .query('groupMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const invite = pending.find((m) => m.status === 'pending');
    if (!invite) throw new Error('No pending invite to accept.');
    await ctx.db.patch(invite._id, { status: 'active' });
    return { _id: invite._id, status: 'active' };
  },
});

/** Broadcasts a Red/Amber warning to every active member of the group. */
export const broadcastAlert = mutation({
  args: {
    sessionToken: v.string(),
    groupId: v.id('groupCircles'),
    summary: v.string(),
    suggestedAction: v.string(),
    riskLevel: v.union(v.literal('red'), v.literal('amber'), v.literal('green'), v.literal('blue'), v.literal('grey')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const memberships = await ctx.db
      .query('groupMemberships')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect();
    const caller = memberships.find((m) => m.userId === user._id);
    if (!caller || caller.status !== 'active') {
      throw new Error('You are not an active member of this group.');
    }

    const summary = args.summary.trim();
    if (summary.length === 0) throw new Error('Please add a summary.');
    const suggestedAction = args.suggestedAction.trim() || 'Verify before paying any new number or Paybill.';

    // One alert row per circle, consumed by all members (keeps write volume low).
    const id = await ctx.db.insert('alerts', {
      circleId: args.groupId,
      circleType: 'group',
      summary,
      riskLevel: args.riskLevel,
      suggestedAction,
      createdAt: Date.now(),
    });

    // Notify each active member (fire-and-forget).
    const activeMembers = memberships.filter((m) => m.status === 'active');
    for (const m of activeMembers) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendAlert, {
        userId: m.userId,
        alertId: id,
      });
    }

    const row = await ctx.db.get(id);
    if (!row) throw new Error('Could not broadcast the alert.');
    return {
      _id: row._id,
      summary: row.summary,
      riskLevel: row.riskLevel,
      notifiedMembers: activeMembers.length,
      createdAt: row.createdAt,
    };
  },
});

export const getMyCircles = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const memberships = await ctx.db
      .query('groupMemberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    const active = memberships.filter((m) => m.status === 'active');

    const circles = [];
    for (const m of active) {
      const group = await ctx.db.get(m.groupId);
      if (group) {
        circles.push({
          _id: group._id,
          name: group.name,
          adminUserId: group.adminUserId,
          role: m.role,
        });
      }
    }
    return circles;
  },
});

/** Admin view of a group plus its members. */
export const getCircleAsAdmin = query({
  args: { sessionToken: v.string(), groupId: v.id('groupCircles') },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const memberships = await ctx.db
      .query('groupMemberships')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect();
    const caller = memberships.find((m) => m.userId === user._id && m.status === 'active');
    if (!caller) throw new Error('You are not a member of this group.');

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error('Group not found.');

    const names = new Map<string, string>();
    for (const m of memberships) {
      const memberUser = await ctx.db.get(m.userId);
      if (memberUser) names.set(m.userId, memberUser.name || memberUser.phone);
    }

    return {
      circle: { _id: group._id, name: group.name, adminUserId: group.adminUserId },
      members: memberships.map((m) => ({
        ...memberSummary(m),
        name: names.get(m.userId) ?? 'Unknown',
      })),
    };
  },
});
