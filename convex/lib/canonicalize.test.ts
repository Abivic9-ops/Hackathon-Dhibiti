import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalizePaybillTill,
  canonicalizePhone,
  canonicalizeQrPayload,
  canonicalizeUrl,
  hashToken,
  ruleCombinationHash,
} from './canonicalize';

void test('canonicalizePhone normalizes every common Kenyan format', () => {
  assert.equal(canonicalizePhone('0712 345 678'), '+254712345678');
  assert.equal(canonicalizePhone('0712345678'), '+254712345678');
  assert.equal(canonicalizePhone('254712345678'), '+254712345678');
  assert.equal(canonicalizePhone('+254 712 345 678'), '+254712345678');
  assert.equal(canonicalizePhone('712345678'), '+254712345678');
  assert.equal(canonicalizePhone('0112345678'), '+254112345678');
});

void test('canonicalizePaybillTill accepts only plausible KE paybill/till lengths', () => {
  assert.equal(canonicalizePaybillTill('522533'), '522533');
  assert.equal(canonicalizePaybillTill(' 522 533 '), '522533');
  assert.equal(canonicalizePaybillTill('6165613'), '6165613'); // 7 digits allowed
  assert.equal(canonicalizePaybillTill('999'), null);
  assert.equal(canonicalizePaybillTill('paybill 12345678'), null); // 8 digits implausible
  assert.equal(canonicalizePaybillTill('abc'), null);
});

void test('canonicalizeUrl strips tracking params and normalizes scheme/host', () => {
  assert.equal(
    canonicalizeUrl('https://mpesa.co.ke/refund?utm_source=scam&q=1'),
    'https://mpesa.co.ke/refund?q=1',
  );
  assert.equal(
    canonicalizeUrl('youtube.com/watch?v=2'),
    'https://youtube.com/watch?v=2',
  );
  assert.equal(canonicalizeUrl('HTTPS://safaricom.co.ke/'), 'https://safaricom.co.ke/');
});

void test('hashToken is deterministic SHA-256 hex', async () => {
  const a = await hashToken('same-token');
  const b = await hashToken('same-token');
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

void test('canonicalizeQrPayload produces a stable 64-char hash, case-sensitive by design', async () => {
  const a = await canonicalizeQrPayload('WIFI:T:WPA;S:Free WiFi;P:pass123;;');
  const b = await canonicalizeQrPayload('WIFI:T:WPA;S:Free WiFi;P:pass123;;');
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.match(a, /^[0-9a-f]{64}$/);
});

void test('canonicalizeQrPayload normalizes embedded URL scheme/domains, not payload case', async () => {
  const a = await canonicalizeQrPayload('https://M-PESA.co.ke/refund?m=today');
  const b = await canonicalizeQrPayload('https://m-pesa.co.ke/refund?m=today');
  assert.equal(a, b);
});

void test('ruleCombinationHash collapses whitespace and case', () => {
  assert.equal(ruleCombinationHash(['REVERSAL', '  Secrecy  ']), 'reversal|secrecy');
});