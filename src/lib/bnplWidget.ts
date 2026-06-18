import type { Cart, PartnerPrefill, ThemeOptions } from "@neocash/bnpl-widget";

/** Shared NeoCash widget theme — matches checkout branding. */
export const BNPL_WIDGET_THEME: ThemeOptions = {
  primary: "#8DEB6E",
  primaryStrong: "#2ac12a",
  primarySoft: "#c8f5b3",
  primaryWash: "#f0fde8",
  ink: "#1E4700",
  surface: "#f7f8fa",
  border: "#e9eaf0",
  fontFamily: '"Inter", system-ui, sans-serif',
};

/**
 * NeoCash SessionConfig limits (see @neocash/bnpl-widget `SessionConfig`).
 * `min_amount_kobo` is the minimum financeable portion after the pay-today deposit.
 */
export const BNPL_MIN_FINANCEABLE_NAIRA = 35_000;
export const BNPL_MIN_PAY_NOW_RATE = 0.2;

/** Minimum cart total (naira) eligible for BNPL: financeable floor ÷ (1 − pay-today rate). */
export const BNPL_MIN_ORDER_NAIRA = Math.ceil(
  BNPL_MIN_FINANCEABLE_NAIRA / (1 - BNPL_MIN_PAY_NOW_RATE)
);

/**
 * Minimum placeholder cart for account-area BNPL setup (widget requires a cart).
 * Amounts are in kobo. Uses a total above {@link BNPL_MIN_ORDER_NAIRA} so onboarding
 * always satisfies NeoCash eligibility. Not a real purchase.
 */
export const BNPL_ACCOUNT_SETUP_CART_NAIRA = 50_000;

export const BNPL_ACCOUNT_SETUP_CART: Cart = {
  items: [
    {
      name: "Pay Small Small — account verification",
      qty: 1,
      price: BNPL_ACCOUNT_SETUP_CART_NAIRA * 100,
    },
  ],
  total: BNPL_ACCOUNT_SETUP_CART_NAIRA * 100,
  currency: "NGN",
};

const BNPL_SETUP_STORAGE_KEY = "9ja_bnpl_profile_setup";

export interface BnplProfileSetupRecord {
  applicationId: string;
  completedAt: string;
}

export function buildPartnerPrefill(fields: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}): PartnerPrefill | undefined {
  const prefill: PartnerPrefill = {};
  if (fields.firstName?.trim()) prefill.firstName = fields.firstName.trim();
  if (fields.lastName?.trim()) prefill.lastName = fields.lastName.trim();
  if (fields.phone?.trim()) prefill.phone = fields.phone.trim();
  if (fields.email?.trim()) prefill.email = fields.email.trim();
  return Object.keys(prefill).length > 0 ? prefill : undefined;
}

export function getBnplProfileSetup(): BnplProfileSetupRecord | null {
  try {
    const raw = localStorage.getItem(BNPL_SETUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BnplProfileSetupRecord;
    if (!parsed.applicationId || !parsed.completedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBnplProfileSetup(applicationId: string): void {
  const record: BnplProfileSetupRecord = {
    applicationId,
    completedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(BNPL_SETUP_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* quota / private mode */
  }
}

export function clearBnplProfileSetup(): void {
  try {
    localStorage.removeItem(BNPL_SETUP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
