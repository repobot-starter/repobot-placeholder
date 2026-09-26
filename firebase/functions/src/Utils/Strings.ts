/**
 * "displayName" -> "Display Name". Used for default form field titles.
 */
export function camelCaseToWords(value: string): string {
    const spaced = value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
