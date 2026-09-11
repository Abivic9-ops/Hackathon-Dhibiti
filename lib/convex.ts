import { ConvexReactClient } from 'convex/react';
import { convexUrl } from '@/lib/env';

/**
 * Singleton client for the deployed Dhibiti backend.
 *
 * The URL is injected at build time from EXPO_PUBLIC_CONVEX_URL (written by
 * `npx convex dev` into .env.local) and read through the typed accessor in
 * lib/env.ts. When it is missing the app still boots fully offline:
 * `backendConfigured` is false and every network action fails with a
 * "not configured" error instead of crashing.
 *
 * Only client-safe variables live in lib/env.ts — this module is the single
 * gateway between the app bundle and Convex. It never touches server secrets.
 */
export const convex: ConvexReactClient | null = convexUrl
  ? new ConvexReactClient(convexUrl)
  : null;

export const backendConfigured = Boolean(convexUrl);