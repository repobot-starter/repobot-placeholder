/**
 * Formats an amount in a currency's minor units (cents for USD) for display,
 * e.g. formatMoney(2400, "usd") -> "$24.00".
 */
export function formatMoney(amountMinorUnits: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(amountMinorUnits / 100)
}
