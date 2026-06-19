import { prisma } from './prisma.js';

export type CouponType = 'percent' | 'fixed';

export type ResolvedCoupon = {
  code: string;
  type: CouponType;
  value: number;
  discount: number; // dollars, capped at subtotal
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const normalizeCouponCode = (code?: string | null) => String(code || '').trim().toUpperCase();

// Validate a coupon against a subtotal. Returns null when no code is supplied,
// or throws a friendly Error when the code is invalid/unavailable.
export const resolveCoupon = async (rawCode: string | null | undefined, subtotal: number): Promise<ResolvedCoupon | null> => {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  const coupon = await prisma.coupons.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    throw new Error('This coupon code is not valid.');
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    throw new Error('This coupon has expired.');
  }
  if (coupon.max_redemptions != null && coupon.times_redeemed >= coupon.max_redemptions) {
    throw new Error('This coupon is no longer available.');
  }
  if (subtotal < Number(coupon.min_subtotal)) {
    throw new Error(`Add $${Number(coupon.min_subtotal).toFixed(2)} minimum to use this code.`);
  }

  const value = Number(coupon.value);
  const type = (coupon.type === 'fixed' ? 'fixed' : 'percent') as CouponType;
  let discount = type === 'percent' ? subtotal * (value / 100) : value;
  discount = round2(Math.min(Math.max(0, discount), subtotal));

  return { code, type, value, discount };
};

// Increment redemption count after a successful payment. Safe no-op if no code.
export const incrementCouponRedemption = async (code?: string | null) => {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return;
  await prisma.coupons
    .updateMany({ where: { code: normalized }, data: { times_redeemed: { increment: 1 } } })
    .catch((error) => console.error('Failed to increment coupon redemption', error));
};
