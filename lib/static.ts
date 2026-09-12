/**
 * Static, device-bundled content for Dhibiti.
 *
 * These are NOT mock user data — they are built-in content and dev affordances:
 *  - `paymentTips`: short educational cards shown on the Pay tab (no backend table).
 *  - `qrSamples`: camera is simulated in this build, so these stand in for real
 *    QR scans on the QR check screen. Real captures will replace them on device.
 *
 * Every user record (checks, recipients, alerts, circles, groups, radar,
 * lessons, examples, entities) now comes from the Convex backend or from the
 * device itself — nothing here pretends to be a user's own data.
 */

import type { LessonCategory, QrSample } from '@/lib/types';

export type PaymentTip = {
  id: string;
  title: string;
  body: string;
  /** The library lesson for this tip is resolved by category at render time. */
  lessonCategory: LessonCategory;
};

export const paymentTips: PaymentTip[] = [
  {
    id: 'tip-1',
    title: 'Pay businesses, not people',
    body: 'A registered business collects on a Paybill or Till in its own name.',
    lessonCategory: 'mobile-money',
  },
  {
    id: 'tip-2',
    title: 'Never pay to unlock a prize',
    body: 'Fees to release winnings are always a scam, whatever brand is named.',
    lessonCategory: 'scam-patterns',
  },
  {
    id: 'tip-3',
    title: 'Call back on your own number',
    body: 'Caller ID can be faked. Use the number you already have saved.',
    lessonCategory: 'banks-merchants',
  },
  {
    id: 'tip-4',
    title: 'Already sent money?',
    body: 'Act in the first hour: provider, police OB number, keep evidence.',
    lessonCategory: 'rights-recourse',
  },
];

export const qrSamples: QrSample[] = [
  {
    id: 'qr-invoice',
    label: 'WhatsApp "invoice" code',
    raw: 'https://invoice-pay.kcb-login.com/pay/8842',
  },
  {
    id: 'qr-refund',
    label: 'M-Pesa "refund" code',
    raw: 'https://mpesa-secure-refund.com/verify?ref=88213',
  },
  {
    id: 'qr-paybill',
    label: 'Poster Paybill code',
    raw: 'Paybill 522533 account RENT2026 amount KES 18,000',
  },
  {
    id: 'qr-shop',
    label: 'Shop counter Till code',
    raw: 'Till 888880 buy goods Mama Ndugu Groceries',
  },
  {
    id: 'qr-crypto',
    label: 'Investment group code',
    raw: 'USDT 0x8f2c19b4e77d3a5510cc amount 5000 guaranteed returns',
  },
  {
    id: 'qr-wifi',
    label: 'Cafe Wi-Fi code',
    raw: 'WIFI:S:Free Wifi Airport;T:nopass;P:;;',
  },
];