import { formatCurrencyMinorUnits } from "@ui"

/**
 * Formats an amount in a currency's minor units (cents for USD) for display,
 * e.g. formatMoney(2400, "usd") -> "$24.00". Thin wrapper over the design
 * system's `formatCurrencyMinorUnits` so shop call sites keep their local name.
 */
export function formatMoney(amountMinorUnits: number, currency: string): string {
    return formatCurrencyMinorUnits(amountMinorUnits, currency)
}
