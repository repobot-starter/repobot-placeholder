/**
 * The repo's boundary with push-notification delivery. One caller: the push
 * kernel (Services/Push), which every domain's notifications go through.
 *
 * Channels are per device platform: WEB (Web Push over the platform-minted
 * VAPID keypair), IOS (APNs token-based auth over the customer's connected
 * Apple push key), and ANDROID (FCM HTTP v1 over the customer's Firebase
 * service account). Each channel degrades independently to not-configured
 * while its credentials are missing — log-and-skip, exactly like empty
 * SMTP_HOST does for mail, never a boot failure.
 */

export const allPushChannels = ["WEB", "IOS", "ANDROID"] as const
export type PushChannel = (typeof allPushChannels)[number]

/** The native channels deliver to a device token instead of a subscription. */
export type NativePushChannel = Exclude<PushChannel, "WEB">

/** The rendered notification handed to a transport: plain text, no markup. */
export interface PushNotification {
    title: string
    body: string
}

/** The browser-issued Web Push subscription (endpoint + encryption keys). */
export interface WebPushSubscription {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

/**
 * "SENT" = handed to the push service. "SUBSCRIPTION_GONE" = the push service
 * reported the subscription no longer exists (HTTP 404/410) — the caller
 * should drop the registration rather than retry forever.
 */
export type WebPushSendOutcome = "SENT" | "SUBSCRIPTION_GONE"

/**
 * The native twin of WebPushSendOutcome: "TOKEN_GONE" means the push
 * service reported the device token invalid or unregistered (app removed,
 * token rotated) — the caller drops the registration.
 */
export type NativePushSendOutcome = "SENT" | "TOKEN_GONE"

export interface PushWrapper {
    /**
     * True when the channel has a delivery route. Per-channel, all gated on
     * PUSH_MODE=live: WEB needs the staged VAPID keypair, IOS the APNS_*
     * credentials, ANDROID the FCM service account.
     */
    isConfigured(channel: PushChannel): boolean
    sendWebPush(
        subscription: WebPushSubscription,
        notification: PushNotification,
    ): Promise<WebPushSendOutcome>
    /** APNs (IOS) / FCM (ANDROID) delivery to one registered device token. */
    sendNativePush(
        channel: NativePushChannel,
        deviceToken: string,
        notification: PushNotification,
    ): Promise<NativePushSendOutcome>
}
