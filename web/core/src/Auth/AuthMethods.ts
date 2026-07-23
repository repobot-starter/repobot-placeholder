/**
 * The auth method registry: one place that names every sign-in method the
 * kernel knows how to render and wire. Templates opt into methods via the
 * AUTH_METHODS env value (comma-separated), so adding a method to a product
 * is config — not code spread across three platforms.
 */
export type AuthMethod = "email-code" | "password" | "google" | "anonymous"

export type OAuthProvider = "google"

export const allAuthMethods: readonly AuthMethod[] = ["email-code", "password", "google", "anonymous"]

export interface ResolveAuthMethodsInput {
    /** Raw AUTH_METHODS value, e.g. "google, email-code". Unknown names are ignored. */
    methodsValue?: string
    /** Legacy VITE_AUTH_GOOGLE_ENABLED flag; appends "google" when not already listed. */
    googleEnabled?: boolean
}

/**
 * Parses the configured method list into a deduped, validated array,
 * preserving the configured order (which is also the render order of the
 * sign-in surface). Falls back to email codes — the one method every
 * provisioned project supports with zero extra setup.
 */
export function resolveAuthMethods(input: ResolveAuthMethodsInput): AuthMethod[] {
    const known = new Set(allAuthMethods)
    const resolved: AuthMethod[] = []
    for (const raw of (input.methodsValue ?? "").split(",")) {
        const name = raw.trim().toLowerCase() as AuthMethod
        if (known.has(name) && !resolved.includes(name)) {
            resolved.push(name)
        }
    }
    if (resolved.length === 0) {
        resolved.push("email-code")
    }
    if (input.googleEnabled === true && !resolved.includes("google")) {
        resolved.push("google")
    }
    return resolved
}
