/**
 * Typed view over `repobot.deploy.json`'s "capabilities" array — the
 * platform provisioning manifest. Same idea as `projectManifest.ts`, with
 * one difference: the deploy manifest only exists in composed/customer
 * trees (compose-pack.sh stamps it from the pack catalog), so it is
 * glob-imported instead of statically imported. The kernel tree, where the
 * file is absent, runs unrestricted — the sandbox backs every kernel in
 * local mode, so all capability chrome stays exercisable there.
 *
 * Kernel chrome that only works when a capability's backing service is
 * provisioned (e.g. the avatar upload, which needs STORAGE) must gate on
 * `hasDeployCapability` rather than render unconditionally: a client-only
 * pack ships this file with no STORAGE, and an upload surface there would
 * fail at runtime once deployed (and force the manifest checker to demand
 * capabilities the project never wanted).
 */
const manifests = import.meta.glob<{ capabilities?: unknown }>("../../../../repobot.deploy.json", {
    eager: true,
    import: "default",
})

const manifest = Object.values(manifests)[0]

/** Declared capabilities, or null when no manifest ships (the kernel tree). */
const declaredCapabilities: readonly string[] | null =
    manifest === undefined
        ? null
        : Array.isArray(manifest.capabilities)
          ? manifest.capabilities.filter((capability): capability is string => typeof capability === "string")
          : []

/**
 * Whether the deploy manifest declares a capability ("STORAGE",
 * "DOCUMENTS", ...). A tree without the manifest is unrestricted.
 */
export function hasDeployCapability(capability: string): boolean {
    return declaredCapabilities === null || declaredCapabilities.includes(capability)
}
