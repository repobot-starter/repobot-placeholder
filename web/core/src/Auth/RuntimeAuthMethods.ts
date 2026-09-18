import { allAuthMethods, type AuthMethod } from "./AuthMethods"

/**
 * The runtime (dashboard-toggled) sign-in methods from the auth API's
 * GET /config, or undefined when the project has never live-toggled them,
 * the response is malformed, or the fetch failed — callers then keep their
 * build-time configured methods. Never throws: the login surface already
 * rendered its build-time methods, and a runtime config hiccup must never
 * blank it. Shared by the builtin client and the sandbox's local client,
 * so previews render the same live method list deploys do.
 */
export async function fetchRuntimeAuthMethodsFromUrl(authUrl: string): Promise<AuthMethod[] | undefined> {
    try {
        const response = await fetch(`${authUrl}/config`)
        if (!response.ok) {
            return undefined
        }
        const body = (await response.json()) as { methods?: unknown }
        if (!Array.isArray(body.methods)) {
            return undefined
        }
        const known = new Set<string>(allAuthMethods)
        const methods = body.methods.filter(
            (entry): entry is AuthMethod => typeof entry === "string" && known.has(entry),
        )
        return methods.length > 0 ? methods : undefined
    } catch {
        return undefined
    }
}
