import webPush from "web-push"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import { ApnsCredentials, sendApnsNotification } from "./ApnsTransport.js"
import { parseFcmServiceAccount, sendFcmNotification } from "./FcmTransport.js"
import {
    NativePushChannel,
    NativePushSendOutcome,
    PushChannel,
    PushNotification,
    PushWrapper,
    WebPushSendOutcome,
    WebPushSubscription,
} from "./PushWrapper.js"

/**
 * The real push sender, used in deployed environments. All channels gate on
 * PUSH_MODE=live plus their staged credentials: WEB on the platform-minted
 * VAPID keypair (PUSH_CREDENTIALS step), IOS on the customer's APNs key
 * (APNS_* env), ANDROID on their Firebase service account
 * (FCM_SERVICE_ACCOUNT). A channel with missing credentials reports
 * not-configured and the push service degrades to log-and-skip — the same
 * posture as mail with empty SMTP_HOST, never a boot failure.
 */
export class WebPushWrapper implements PushWrapper {
    isConfigured(channel: PushChannel): boolean {
        const env = validatedEnv()
        if (env.PUSH_MODE !== "live") {
            return false
        }
        switch (channel) {
            case "WEB":
                return Boolean(env.VAPID_PUBLIC_KEY) && Boolean(env.VAPID_PRIVATE_KEY)
            case "IOS":
                return this.apnsCredentials() !== undefined
            case "ANDROID":
                return (
                    Boolean(env.FCM_SERVICE_ACCOUNT) &&
                    parseFcmServiceAccount(env.FCM_SERVICE_ACCOUNT ?? "") !== undefined
                )
        }
    }

    async sendNativePush(
        channel: NativePushChannel,
        deviceToken: string,
        notification: PushNotification,
    ): Promise<NativePushSendOutcome> {
        if (!this.isConfigured(channel)) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                `The ${channel} push channel is not configured for this environment.`,
            )
        }
        if (channel === "IOS") {
            const credentials = this.apnsCredentials()
            return sendApnsNotification(credentials!, deviceToken, notification)
        }
        const account = parseFcmServiceAccount(validatedEnv().FCM_SERVICE_ACCOUNT ?? "")
        return sendFcmNotification(account!, deviceToken, notification)
    }

    private apnsCredentials(): ApnsCredentials | undefined {
        const env = validatedEnv()
        if (!env.APNS_TEAM_ID || !env.APNS_KEY_ID || !env.APNS_PRIVATE_KEY || !env.APNS_BUNDLE_ID) {
            return undefined
        }
        return {
            teamId: env.APNS_TEAM_ID,
            keyId: env.APNS_KEY_ID,
            privateKey: env.APNS_PRIVATE_KEY,
            bundleId: env.APNS_BUNDLE_ID,
            environment: env.APNS_ENVIRONMENT,
        }
    }

    async sendWebPush(
        subscription: WebPushSubscription,
        notification: PushNotification,
    ): Promise<WebPushSendOutcome> {
        if (!this.isConfigured("WEB")) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Web push is not configured for this environment (PUSH_MODE=live with a VAPID keypair is required).",
            )
        }
        const env = validatedEnv()
        try {
            await webPush.sendNotification(
                { endpoint: subscription.endpoint, keys: subscription.keys },
                JSON.stringify({ title: notification.title, body: notification.body }),
                {
                    vapidDetails: {
                        // The VAPID subject identifies the sender to the push
                        // service; the app's own site URL when the platform
                        // staged one, a mailto fallback otherwise.
                        subject: env.APP_BASE_URL || "mailto:push@localhost",
                        publicKey: env.VAPID_PUBLIC_KEY ?? "",
                        privateKey: env.VAPID_PRIVATE_KEY ?? "",
                    },
                },
            )
            return "SENT"
        } catch (error) {
            // 404/410 = the subscription no longer exists at the push service
            // (browser unsubscribed or the registration expired). The caller
            // prunes the device row; anything else propagates.
            if (
                error instanceof webPush.WebPushError &&
                (error.statusCode === 404 || error.statusCode === 410)
            ) {
                return "SUBSCRIPTION_GONE"
            }
            throw error
        }
    }
}
