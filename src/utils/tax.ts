// -------------------------------------------------------------------------
// Self-managed US sales tax
// -------------------------------------------------------------------------
// Sales tax is collected ONLY for orders shipped to a state where the business
// is registered to collect it (its "nexus" states). To start, we collect for
// New York only.
//
// HOW TO MAINTAIN:
//   - Add/remove states in SALES_TAX_RATES below.
//   - The value is the COMBINED decimal rate to charge (state + local).
//
// IMPORTANT: Confirm the exact rate(s) with your accountant. Local (city/
// county) rates vary within a state, and some products may be exempt (for
// example, in NY most clothing items under $110 are exempt from state tax).
// This module applies one flat rate per state to the product subtotal.
// -------------------------------------------------------------------------

export type TaxBreakdown = {
  rate: number; // decimal rate applied, e.g. 0.08875
  amount: number; // tax amount in dollars
  state: string; // normalized 2-letter state code the rate was based on
  label: string; // display label, e.g. "Sales Tax (NY 8.875%)"
};

// State code -> combined sales tax rate (decimal). Edit to match your nexus.
export const SALES_TAX_RATES: Record<string, number> = {
  NY: 0.08875, // New York — placeholder combined rate; confirm with your accountant
};

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA',
  COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA',
  HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
  KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
  MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
  MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH', OKLAHOMA: 'OK',
  OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT',
  VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI',
  WYOMING: 'WY', 'DISTRICT OF COLUMBIA': 'DC', 'WASHINGTON DC': 'DC',
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const formatRate = (rate: number) => `${(rate * 100).toFixed(3).replace(/\.?0+$/, '')}%`;

export const normalizeStateCode = (state?: string | null): string => {
  const raw = String(state || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw.length === 2) return raw;
  return US_STATE_NAME_TO_CODE[raw] || raw.slice(0, 2);
};

export const getTaxRateForState = (state?: string | null): number =>
  SALES_TAX_RATES[normalizeStateCode(state)] ?? 0;

// Calculate sales tax for a taxable amount (product subtotal) shipped to `state`.
export const calculateTax = (taxableAmount: number, state?: string | null): TaxBreakdown => {
  const code = normalizeStateCode(state);
  const rate = getTaxRateForState(code);
  const amount = round2(Math.max(0, Number(taxableAmount) || 0) * rate);
  return {
    rate,
    amount,
    state: code,
    label: rate > 0 ? `Sales Tax (${code} ${formatRate(rate)})` : 'Sales Tax',
  };
};
