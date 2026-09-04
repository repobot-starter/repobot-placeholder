export interface FormatMinorUnitsOptions {
    /** Render whole amounts without cents, e.g. "$14" instead of "$14.00". */
    trimWholeCents?: boolean
}

/**
 * Formats an amount in a currency's minor units (cents for USD) for display,
 * e.g. formatMinorUnits(2400, "usd") -> "$24.00". With trimWholeCents,
 * whole amounts drop the cents ("$14", but still "$9.50").
 */
export function formatMinorUnits(
    amountMinorUnits: number,
    currency: string,
    options?: FormatMinorUnitsOptions,
): string {
    const trimCents = options?.trimWholeCents === true && amountMinorUnits % 100 === 0
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        ...(trimCents ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    }).format(amountMinorUnits / 100)
}
