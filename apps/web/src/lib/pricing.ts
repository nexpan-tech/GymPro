// Centralised SaaS plan-price formatting.
//
// Enterprise (and any negotiated plan) is stored with price 0 to mean CUSTOM
// pricing. The UI must NEVER render "₹0" — it shows "Custom" instead. Use these
// helpers everywhere a plan/license price is displayed.

export type PlanInterval = "MONTHLY" | "YEARLY";

/** Plain INR formatting (no "custom" handling — for non-plan amounts). */
export function inr(n: number): string {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** Suffix for a billing interval ("/mo" | "/yr"). */
export function intervalSuffix(interval?: PlanInterval | null): string {
  return interval ? `/${interval === "YEARLY" ? "yr" : "mo"}` : "";
}

/**
 * Format a plan/license price. Returns "Custom" when the price is 0 / falsy
 * (Enterprise & negotiated plans) so the UI never shows ₹0. Otherwise returns
 * e.g. "₹1,999/mo".
 */
export function planPriceLabel(price: number | null | undefined, interval?: PlanInterval | null): string {
  if (!price || price <= 0) return "Custom";
  return `${inr(price)}${intervalSuffix(interval)}`;
}

/** Custom-aware amount (no interval suffix) — e.g. invoice/next-charge amounts. */
export function planAmountLabel(price: number | null | undefined): string {
  return !price || price <= 0 ? "Custom" : inr(price);
}

/** True when a plan should be presented as "Contact Sales" (custom pricing). */
export function isCustomPrice(price: number | null | undefined): boolean {
  return !price || price <= 0;
}
