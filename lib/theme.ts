import { useSyncExternalStore } from 'react';

import type { RiskLevel } from '@/lib/types';

export type ThemeMode = 'dark' | 'light';

/**
 * React Native parseable color values (hex).
 * Use these for icon props, StatusBar, navigation tints and SVG paint —
 * anywhere Uniwind className tokens cannot resolve.
 *
 * The `dark` palette is Dhibiti's primary theme. The `light` palette keeps the
 * exact same brand hues (blue / teal / mint guard the identity and the risk
 * traffic-light stays vivid) but swaps the near-black blue surfaces for cold
 * near-white ones, so the app reads identically in both modes.
 */
export const palettes = {
  dark: {
    ink: '#0B0F1A',
    inkRaised: '#0D1220',
    surface: '#141A28',
    surfaceSecondary: '#1A2130',
    surfaceTertiary: '#212A3B',
    border: '#232C3D',
    separator: '#2C374A',
    foreground: '#F7F9FC',
    muted: '#8A93A6',
    brandBlue: '#2E7DE1',
    brandTeal: '#0FBF9F',
    brandMint: '#28E0B0',
    riskRed: '#FF4D5E',
    riskAmber: '#FFB020',
    riskGreen: '#2ECC71',
    riskBlue: '#2E7DE1',
    riskGrey: '#8892A0',
  },
  light: {
    ink: '#F4F6FA',
    inkRaised: '#EEF1F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#E9EDF4',
    surfaceTertiary: '#E1E6EF',
    border: '#D9DFEA',
    separator: '#C5CDDA',
    foreground: '#0B0F1A',
    muted: '#56627A',
    brandBlue: '#1D5FC0',
    brandTeal: '#0E8F74',
    brandMint: '#0E9C7F',
    riskRed: '#E5484D',
    riskAmber: '#E08A00',
    riskGreen: '#0E9C6E',
    riskBlue: '#1D5FC0',
    riskGrey: '#6B7482',
  },
} as const;

/**
 * The primary CTA gradient. Kept deliberately vivid in both modes (teal→mint on
 * a light canvas still reads premium), so the gradient array is static while
 * the accent *text* colours below adapt to the active theme.
 */
export const brandGradient: readonly [string, string] = [
  palettes.dark.brandTeal,
  palettes.dark.brandMint,
];

let currentMode: ThemeMode = 'dark';
const themeListeners = new Set<() => void>();

/** Switch the active palette. Emits so every `useTheme()` subscriber re-renders. */
export function setThemeMode(mode: ThemeMode) {
  if (mode === currentMode) return;
  currentMode = mode;
  themeListeners.forEach((listener) => listener());
}

export function getThemeMode(): ThemeMode {
  return currentMode;
}

/** Subscribe to palette changes. Returns an unsubscribe function (for useSyncExternalStore). */
export function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

/**
 * Re-render the calling component whenever the active theme changes.
 * Call this from any component that reads `colors.*` directly (hex props),
 * so the values refresh even if the component did not otherwise re-render.
 */
export function useTheme(): ThemeMode {
  // False positive: React commits to useSyncExternalStore (not a zustand store
  // hook); the custom rule matches on the `...Store` call-site suffix instead.
  // oxlint-disable-next-line store/no-unstable-zustand-selector
  return useSyncExternalStore(subscribeTheme, getThemeMode, () => 'dark');
}

const PALETTE_KEYS = Object.keys(palettes.dark);

/**
 * Theme-aware accessor for `colors.*`. Every read resolves against the
 * currently active palette, so reading these during a render always yields
 * the right values for this theme.
 */
export const colors = new Proxy(palettes.dark, {
  get: (_target, prop) => {
    if (typeof prop !== 'string' || !PALETTE_KEYS.includes(prop)) return undefined;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- prop is guarded by the `includes` check above
    return palettes[currentMode][prop as keyof typeof palettes.dark];
  },
});

type RiskColorKey = keyof typeof palettes.dark;

/** Which palette key drives each risk level's icon/badge colour. */
const RISK_COLOR_KEY: Record<RiskLevel, RiskColorKey> = {
  red: 'riskRed',
  amber: 'riskAmber',
  green: 'riskGreen',
  blue: 'riskBlue',
  grey: 'riskGrey',
};

type RiskMeta = {
  /** Short verdict word shown in badges and pills. */
  label: string;
  /** Canonical meaning — never paraphrased differently per screen. */
  meaning: string;
  /** Canonical required user-facing action text. */
  action: string;
  color: string;
  textClass: string;
  softBgClass: string;
  borderClass: string;
  dotClass: string;
};

/**
 * Canonical traffic-light system. Reused verbatim everywhere.
 * Green is never worded as "safe".
 */
const RISK_BASE: Record<RiskLevel, Omit<RiskMeta, 'color'>> = {
  red: {
    label: 'High risk',
    meaning: 'High-risk or repeatedly reported',
    action: 'Do not answer, reply, click, or pay',
    textClass: 'text-risk-red',
    softBgClass: 'bg-risk-red-soft',
    borderClass: 'border-risk-red',
    dotClass: 'bg-risk-red',
  },
  amber: {
    label: 'Suspicious',
    meaning: 'Suspicious or unverified',
    action: 'Verify independently before acting',
    textClass: 'text-risk-amber',
    softBgClass: 'bg-risk-amber-soft',
    borderClass: 'border-risk-amber',
    dotClass: 'bg-risk-amber',
  },
  green: {
    label: 'No known risk found',
    meaning: 'Low risk based on available evidence',
    action: 'No known risk found — this is not a guarantee. Verify anything unexpected.',
    textClass: 'text-risk-green',
    softBgClass: 'bg-risk-green-soft',
    borderClass: 'border-risk-green',
    dotClass: 'bg-risk-green',
  },
  blue: {
    label: 'Verified sender',
    meaning: 'Verified official sender or shortcode',
    action: 'Confirm that the message content is also expected',
    textClass: 'text-risk-blue',
    softBgClass: 'bg-risk-blue-soft',
    borderClass: 'border-risk-blue',
    dotClass: 'bg-risk-blue',
  },
  grey: {
    label: 'Unknown',
    meaning: 'No useful information yet',
    action: 'Treat this as unknown, not as safe. Verify before you act.',
    textClass: 'text-risk-grey',
    softBgClass: 'bg-risk-grey-soft',
    borderClass: 'border-risk-grey',
    dotClass: 'bg-risk-grey',
  },
};

/**
 * RISK[level].color must follow the active theme (icons paint with it), while
 * the Tailwind class fields are already theme-aware via CSS. A small proxy
 * keeps every existing `RISK[level].color` read live without touching callers.
 */
export const RISK: Record<RiskLevel, RiskMeta> = new Proxy(
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- RISK_BASE only omits `color`, supplied live below
  RISK_BASE as Record<RiskLevel, RiskMeta>,
  {
    get: (target, level) => {
      if (typeof level !== 'string' || !(level in target)) return undefined;
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by the `in` check above
      const key = level as RiskLevel;
      return { ...target[key], color: palettes[currentMode][RISK_COLOR_KEY[key]] };
    },
  },
);

export const riskRank: Record<RiskLevel, number> = {
  red: 4,
  amber: 3,
  grey: 2,
  blue: 1,
  green: 0,
};

export function highestRisk(...levels: (RiskLevel | undefined)[]): RiskLevel {
  const present = levels.filter((level): level is RiskLevel => Boolean(level));
  if (present.length === 0) return 'grey';
  return present.reduce((worst, level) => (riskRank[level] > riskRank[worst] ? level : worst));
}
