import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzePatterns,
  analyzeUrl,
  classifyQrContent,
  extractAmount,
  extractPaymentTarget,
  parseWifi,
  resolveScamCategory,
} from './rulesEngine';

void test('reversal message is red and categorized as mpesa_reversal_scam', () => {
  const analysis = analyzePatterns(
    'Nimetuma pesa kwako kimakosa. Tafadhali nirudishie haraka, usimwambie mtu.',
  );
  assert.equal(analysis.scamCategory, 'mpesa_reversal_scam');
  assert.ok(analysis.patterns.some((pattern) => pattern.id === 'reversal_claim'));
  assert.equal(analysis.suggestedRiskLevel, 'red');
});

void test('prize message extracts the paybill and the registration fee', () => {
  const analysis = analyzePatterns(
    'Hongera! Umeshinda KES 250,000. Lipa KES 500 ya usajili kwa paybill 522533.',
  );
  assert.equal(analysis.scamCategory, 'prize_scam');
  assert.ok(analysis.suggestedRiskLevel === 'amber' || analysis.suggestedRiskLevel === 'red');

  const target = extractPaymentTarget('Lipa KES 500 ya usajili kwa paybill 522533');
  assert.equal(target?.identifierType, 'paybill');
  assert.equal(target?.identifier, '522533');
  assert.equal(target?.amountKes, 500);
  assert.equal(extractAmount('KES 250,000'), 250000);
});

void test('police-station family emergency is red with police_impersonation', () => {
  const analysis = analyzePatterns(
    'Mum niko police station Kasarani, nisaidie 15,000 haraka. Usiseme kwa mtu tafadhali.',
  );
  assert.equal(analysis.scamCategory, 'police_impersonation');
  assert.equal(analysis.suggestedRiskLevel, 'red');
  assert.ok(analysis.combinations.length > 0);
});

void test('payment target extraction falls back to phone and URL', () => {
  assert.equal(extractPaymentTarget('Tuma pesa kwa namba hii 0799 987 122')?.identifierType, 'phone');
  assert.equal(
    extractPaymentTarget('Open bit.ly/scam-link now')?.identifierType,
    'url',
  );
  assert.equal(extractPaymentTarget('No destination here mate'), undefined);
});

void test('analyzeUrl flags shorteners, bare IPs, lookalikes and non-official domains', () => {
  const shortener = analyzeUrl('https://bit.ly/abc123');
  assert.ok(shortener.facts.some((fact) => fact.includes('shortener')));
  assert.equal(shortener.riskLevel, 'amber');

  const ip = analyzeUrl('http://185.199.108.133/login');
  assert.ok(ip.facts.some((fact) => fact.includes('raw IP address')));

  const square = analyzeUrl('https://safaricom-verify.com/confirm');
  assert.equal(square.riskLevel, 'amber');
  assert.equal(square.impersonatedBrand, 'safaricom');

  const official = analyzeUrl('https://www.safaricom.co.ke/m-pesa');
  assert.equal(official.riskLevel, 'green');
});

void test('community reports push a URL to red alongside a lookalike', () => {
  const result = analyzeUrl('https://safaricom-verify.com/pay', {
    reportCount: 4,
    scamCategory: 'fake_agent',
  });
  assert.equal(result.riskLevel, 'red');
  assert.ok(result.facts.some((fact) => fact.includes('4 people')));
});

void test('classifyQrContent tells payment, link, wifi and contact codes apart', () => {
  assert.equal(classifyQrContent('https://mpesa.co.ke/refund'), 'url');
  assert.equal(classifyQrContent('*522533#'), 'paybill');
  assert.equal(classifyQrContent('Lipa KES 350 kwa paybill 522533'), 'paybill');
  assert.equal(classifyQrContent('WIFI:T:WPA;S:FiberOne;P:sekrit;;'), 'wifi');
  assert.equal(classifyQrContent('BEGIN:VCARD\nN:John;;'), 'vcard');
  assert.equal(classifyQrContent('Gift of 500 Kes has been received'), 'text');
});

void test('parseWifi extracts ssid, security and openness', () => {
  const open = parseWifi('WIFI:S:CaféFree;T:nopass;;');
  assert.equal(open.ssid, 'CaféFree');
  assert.equal(open.open, true);

  const closed = parseWifi('WIFI:T:WPA;S:FiberOne;P:sekrit;;');
  assert.equal(closed.ssid, 'FiberOne');
  assert.equal(closed.open, false);
  assert.equal(closed.security, 'WPA');
});

void test('resolveScamCategory keeps any concrete hint and falls back otherwise', () => {
  assert.equal(resolveScamCategory('prize_scam', 'none'), 'prize_scam');
  assert.equal(resolveScamCategory('none', 'mpesa_reversal_scam'), 'mpesa_reversal_scam');
});