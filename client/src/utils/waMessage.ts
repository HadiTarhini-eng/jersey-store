/**
 * WhatsApp click-to-message helpers.
 *
 * What this file does TODAY:
 * - Builds `https://wa.me/<digits>?text=<preformatted message>` URLs that an
 *   admin clicks to open WhatsApp Web/app and send a message to the customer
 *   with one tap. Works on every device, no credentials, no infra.
 *
 * What this file is the extension point FOR LATER:
 * - Replacing `triggerWhatsAppNotification` with a server call to a real push
 *   provider (Meta Cloud API or Twilio) once you have a verified business
 *   phone, an approved message template, and the env vars wired. The whole
 *   site can keep calling the same helper — only the body of that one
 *   function changes.
 *
 * Why not push automatically right now? WhatsApp explicitly forbids cold
 * "transactional" pushes without a pre-approved Message Template tied to a
 * registered business phone. Even a free wa.me link requires the user (you,
 * the shop) to be in the loop on the first send. So the practical UX today
 * is: admin clicks "Notify customer", message draft opens, admin hits send.
 */

import type { AddressSnapshot } from '../types';

export interface CustomerNotificationContext {
  /** Customer's phone — sanitised to digits inside; falls back to shipping phone. */
  phone:        string | null | undefined;
  /** Customer-facing greeting (first name, full name, or "there"). */
  firstName:    string | null | undefined;
  /** Shop's display name for the message signature. */
  shopName:     string;
  /** Pre-built message body — pass whatever the context needs the customer to read. */
  message:      string;
}

/**
 * Strip every non-digit so the result is wa.me-ready. Returns null when the
 * remaining string is too short to plausibly be a phone number (so callers
 * can hide the button gracefully).
 */
export function phoneToWaNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 ? digits : null;
}

/** Best-effort customer first-name resolver from an address snapshot. */
export function resolveFirstName(shipping: AddressSnapshot | undefined | null): string {
  const full = shipping?.fullName?.trim() ?? '';
  if (!full) return 'there';
  return full.split(/\s+/)[0];
}

/**
 * Build the wa.me URL for a single-shot notification. Returns null when the
 * recipient phone is missing or unusable — the caller should hide the trigger
 * button rather than render a broken link.
 */
export function buildWhatsAppUrl(ctx: CustomerNotificationContext): string | null {
  const digits = phoneToWaNumber(ctx.phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(ctx.message)}`;
}

// ── Canned messages ──────────────────────────────────────────────────────────
//
// Plain string builders — keep them here so wording stays consistent and
// translatable in one place.

export function newOrderMessage(orderNumber: string, firstName: string, shopName: string): string {
  return [
    `Hi ${firstName}, this is ${shopName}.`,
    '',
    `Thanks for placing order *${orderNumber}*! We've got it and we'll be in touch as soon as it's confirmed.`,
    '',
    'Reply here any time if you have questions.',
  ].join('\n');
}

export function welcomeMessage(firstName: string, shopName: string): string {
  return [
    `Hi ${firstName}, welcome to ${shopName}! 👋`,
    '',
    "Your account is set up — message us here any time about sizing, custom prints, or delivery.",
  ].join('\n');
}

/**
 * Future hook: programmatic push.
 *
 * To wire real notifications later, replace the body of this function with a
 * fetch to a tiny backend endpoint (e.g. `POST /admin/notifications/whatsapp`)
 * that posts to `graph.facebook.com/v17.0/<PHONE_NUMBER_ID>/messages` using a
 * Meta-approved message template. Required:
 *   - env: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN
 *   - one approved template (e.g. "order_confirmation")
 *   - rate-limiting + retry on the server
 *
 * Until then this is a no-op — callers use `buildWhatsAppUrl` to open a
 * pre-filled chat that the admin sends manually.
 */
export async function triggerWhatsAppNotification(_ctx: CustomerNotificationContext): Promise<{ ok: false; reason: 'not-configured' }> {
  return { ok: false, reason: 'not-configured' };
}
