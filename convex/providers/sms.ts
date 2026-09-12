/**
 * SMS OTP provider (backend brief Section 1 / 11.4).
 *
 * Abstracted behind one function so the real gateway can be swapped without
 * touching calling code. The mock "sends" nothing — it logs to the console and
 * returns the code so the phone-OTP flow can be exercised end-to-end today.
 * Replace `sendOtp` with the real provider (Africa's Talking, Twilio, etc.)
 * once credentials exist; the code/expiry contract does not change.
 */

export type OtpDeliveryResult = {
  provider: 'mock' | 'real';
  status: 'sent' | 'failed';
  /** Present only for the mock provider — lets testers read the code on-screen. */
  devCode?: string;
};

export async function sendOtp(phone: string, code: string): Promise<OtpDeliveryResult> {
  // TODO(integration): replace with a real Kenya-capable SMS gateway.
  // The gateway key must be read from a Convex environment variable, e.g.
  // process.env.SMS_OTP_API_KEY — never committed or hard-coded.
  console.log(`[mock-sms] OTP for ${phone}: ${code}`);
  return { provider: 'mock', status: 'sent', devCode: code };
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}