/**
 * Shared display formatters for money and percentages — the single home for
 * the formatting every dashboard surface (DataTable cells, StatCard values,
 * detail rows) needs. Match these outputs when adding native twins (see the
 * iOS/Android MoneyFormat helpers).
 */

export interface FormatCurrencyMinorUnitsOptions {
    /** Render whole amounts without cents, e.g. "$14" instead of "$14.00". */
    trimWholeCents?: boolean
}

/**
 * Formats an amount in a currency's minor units (cents for USD) for display,
 * e.g. formatCurrencyMinorUnits(2400, "usd") -> "$24.00". With
 * trimWholeCents, whole amounts drop the cents ("$14", but still "$9.50").
 */
export function formatCurrencyMinorUnits(
    amountMinorUnits: number,
    currency: string,
    options?: FormatCurrencyMinorUnitsOptions,
): string {
    const trimCents = options?.trimWholeCents === true && amountMinorUnits % 100 === 0
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        ...(trimCents ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    }).format(amountMinorUnits / 100)
}

/**
 * Formats a ratio as a percentage for display, e.g.
 * formatPercent(0.065) -> "6.5%" and formatPercent(0.2, 0) -> "20%".
 */
export function formatPercent(ratio: number, fractionDigits = 1): string {
    return `${(ratio * 100).toFixed(fractionDigits)}%`
}
