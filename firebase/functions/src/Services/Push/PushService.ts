import { and, eq } from "drizzle-orm"
import { getPushWrapper } from "../../DependencyWrappers/PushWrapper/index.js"
import { WebPushSubscription } from "../../DependencyWrappers/PushWrapper/PushWrapper.js"
import {
    allPushDevicePlatforms,
    PushDevice,
    PushDevicePlatform,
    pushDevicesTable,
} from "../../Data/Push/PushDevice.js"
import { pushDb } from "../../Data/PushDatabase.js"
import { RpcError } from "../../Utils/RpcError.js"
import { PushTemplateKey, renderPushTemplate } from "./PushTemplates.js"

/** Endpoints and subscription blobs are bounded so a client can't store megabytes. */
const maxEndpointLength = 2048
const maxSubscriptionJsonLength = 8192

/**
 * The push kernel: notifications as template key + variables, fanned out to
 * every device the user registered, per channel, through the shared
 * PushWrapper transport (docs/push.md). Domains compose this service — the
 * scheduled activity digest is the exemplar — and never touch Web Push, VAPID
 * keys, or per-channel plumbing.
 *
 * Sandbox/deployed split follows the transport: under the emulator and in
 * tests the FakePushWrapper records notifications instead of delivering
 * them; on a deploy without push configured (PUSH_MODE=local or no VAPID
 * keypair) sends degrade to a log line and report false, so push stays
 * best-effort and never fails the calling flow. Channels degrade
 * independently — a channel without its credentials (VAPID keypair, APNS_*
 * key, FCM service account) skips its devices and logs, exactly like mail
 * with empty SMTP_HOST.
 */
class PushService {
    /** True when the channel has a delivery route (or the fake records it). */
    isChannelConfigured(platform: PushDevicePlatform): boolean {
        return getPushWrapper().isConfigured(platform)
    }

    /**
     * Renders the template and fans it out to the user's registered devices.
     * Returns true when at least one notification was handed to a transport;
     * false in degraded mode (no devices, or no configured channel for any of
     * them), which callers may ignore — push is best-effort by design.
     *
     * Subscriptions the push service reports gone (unsubscribed/expired) are
     * pruned here, so registrations converge on reality without a sweeper.
     */
    async sendPush(request: {
        toAppUserId: string
        templateKey: PushTemplateKey
        variables: Record<string, string>
    }): Promise<boolean> {
        const rendered = renderPushTemplate(request.templateKey, request.variables)
        const wrapper = getPushWrapper()
        const devices = await pushDb
            .select()
            .from(pushDevicesTable)
            .where(eq(pushDevicesTable.userId, request.toAppUserId))
        if (devices.length === 0) {
            console.info(
                `[Push] no registered devices, not sent: template=${request.templateKey} ` +
                    `toAppUserId=${request.toAppUserId} title="${rendered.title}"`,
            )
            return false
        }

        let handedOff = 0
        for (const device of devices) {
            if (!wrapper.isConfigured(device.platform)) {
                console.info(
                    `[Push] channel ${device.platform} not configured, skipped: ` +
                        `template=${request.templateKey} device=${device.id}`,
                )
                continue
            }
            try {
                if (device.platform === "WEB") {
                    const subscription = parseWebPushSubscription(device.subscriptionJson)
                    const outcome = await wrapper.sendWebPush(subscription, rendered)
                    if (outcome === "SUBSCRIPTION_GONE") {
                        await pushDb.delete(pushDevicesTable).where(eq(pushDevicesTable.id, device.id))
                        console.info(`[Push] pruned gone subscription: device=${device.id}`)
                        continue
                    }
                } else {
                    // Native registrations carry the APNs/FCM device token in
                    // the endpoint column (docs/push.md); tokens the push
                    // service reports gone are pruned like web subscriptions.
                    const outcome = await wrapper.sendNativePush(device.platform, device.endpoint, rendered)
                    if (outcome === "TOKEN_GONE") {
                        await pushDb.delete(pushDevicesTable).where(eq(pushDevicesTable.id, device.id))
                        console.info(`[Push] pruned gone device token: device=${device.id}`)
                        continue
                    }
                }
                handedOff += 1
            } catch (error) {
                // Best-effort per device: a failed send never fails the flow
                // the push rides on, and never blocks the remaining devices.
                console.warn(`[Push] send failed: device=${device.id}`, error)
            }
        }
        return handedOff > 0
    }

    /**
     * Registers (or rotates) a push destination for the user. Upsert keyed on
     * the endpoint: re-registering refreshes the subscription JSON, moves the
     * row to the (possibly different) signed-in user, and bumps rotated_at —
     * a browser subscription belongs to whoever last enabled it there.
     */
    async registerDevice(request: {
        userId: string
        platform: PushDevicePlatform
        endpoint: string
        subscriptionJson: string
    }): Promise<PushDevice> {
        if (!allPushDevicePlatforms.includes(request.platform)) {
            throw new RpcError("INVALID_ARGUMENT", `Unknown push platform "${request.platform}".`)
        }
        if (request.endpoint.trim() === "" || request.endpoint.length > maxEndpointLength) {
            throw new RpcError("INVALID_ARGUMENT", "The push endpoint must be a non-empty URL.")
        }
        if (request.subscriptionJson.length > maxSubscriptionJsonLength) {
            throw new RpcError("INVALID_ARGUMENT", "The push subscription JSON is too large.")
        }
        if (request.platform === "WEB") {
            const subscription = tryParseWebPushSubscription(request.subscriptionJson)
            if (subscription === undefined || subscription.endpoint !== request.endpoint) {
                throw new RpcError(
                    "INVALID_ARGUMENT",
                    "subscriptionJson must be the browser's PushSubscription JSON " +
                        "(endpoint matching the endpoint argument, plus keys.p256dh and keys.auth).",
                )
            }
        }

        const now = new Date()
        const [device] = await pushDb
            .insert(pushDevicesTable)
            .values({
                userId: request.userId,
                platform: request.platform,
                endpoint: request.endpoint,
                subscriptionJson: request.subscriptionJson,
                rotatedAt: now,
            })
            .onConflictDoUpdate({
                target: pushDevicesTable.endpoint,
                set: {
                    userId: request.userId,
                    platform: request.platform,
                    subscriptionJson: request.subscriptionJson,
                    rotatedAt: now,
                    rowUpdatedAt: now,
                },
            })
            .returning()
        return device
    }

    /**
     * Removes the user's registration for the endpoint. Owner-scoped: another
     * user's registration of the same endpoint is untouched. Returns whether
     * a registration was removed (false = already gone, idempotent).
     */
    async unregisterDevice(request: { userId: string; endpoint: string }): Promise<boolean> {
        const deleted = await pushDb
            .delete(pushDevicesTable)
            .where(
                and(
                    eq(pushDevicesTable.userId, request.userId),
                    eq(pushDevicesTable.endpoint, request.endpoint),
                ),
            )
            .returning({ id: pushDevicesTable.id })
        return deleted.length > 0
    }

    /** Distinct user ids with at least one registered device (digest fan-out). */
    async listUserIdsWithDevices(): Promise<string[]> {
        const rows = await pushDb.selectDistinct({ userId: pushDevicesTable.userId }).from(pushDevicesTable)
        return rows.map((row) => row.userId)
    }
}

function tryParseWebPushSubscription(subscriptionJson: string): WebPushSubscription | undefined {
    let parsed: unknown
    try {
        parsed = JSON.parse(subscriptionJson)
    } catch {
        return undefined
    }
    if (typeof parsed !== "object" || parsed === null) {
        return undefined
    }
    const candidate = parsed as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
    if (
        typeof candidate.endpoint !== "string" ||
        candidate.endpoint === "" ||
        typeof candidate.keys?.p256dh !== "string" ||
        candidate.keys.p256dh === "" ||
        typeof candidate.keys?.auth !== "string" ||
        candidate.keys.auth === ""
    ) {
        return undefined
    }
    return {
        endpoint: candidate.endpoint,
        keys: { p256dh: candidate.keys.p256dh, auth: candidate.keys.auth },
    }
}

function parseWebPushSubscription(subscriptionJson: string): WebPushSubscription {
    const subscription = tryParseWebPushSubscription(subscriptionJson)
    if (subscription === undefined) {
        // Registration validates the JSON, so a bad stored blob is a
        // programming error, not a user mistake.
        throw new RpcError("INTERNAL", "A stored web push subscription is not valid subscription JSON.")
    }
    return subscription
}

export const pushService = new PushService()
