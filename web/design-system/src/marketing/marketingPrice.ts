import { formatCurrencyMinorUnits } from "../utils/formatters"

/**
 * A whole-unit price as the pricing sections print it: en-US with
 * thousands separators, cents only when present ("$5,800", "$29", "$9.50"),
 * in the section's ISO 4217 `currency` ("eur" prints "€9,000").
 */
export function formatTierPrice(dollars: number, currency = "usd"): string {
    return formatCurrencyMinorUnits(Math.round(dollars * 100), currency, { trimWholeCents: true })
}
