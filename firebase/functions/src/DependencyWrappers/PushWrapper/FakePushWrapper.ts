import {
    NativePushChannel,
    NativePushSendOutcome,
    PushChannel,
    PushNotification,
    PushWrapper,
    WebPushSendOutcome,
    WebPushSubscription,
} from "./PushWrapper.js"

export interface FakePushSend {
    channel: PushChannel
    /** The subscription endpoint (WEB) or device token (IOS/ANDROID). */
    endpoint: string
    title: string
    body: string
}

/**
 * In-memory push sender for the emulator and tests. Notifications are
 * recorded (and logged under the emulator so the sandbox shows what would
 * have been delivered) instead of sent. Every channel reports configured, so
 * fan-out logic is fully exercisable without credentials.
 */
export class FakePushWrapper implements PushWrapper {
    readonly sentNotifications: FakePushSend[] = []

    /** Test helper: endpoints that should behave like expired subscriptions. */
    readonly goneEndpoints = new Set<string>()

    isConfigured(): boolean {
        return true
    }

    async sendWebPush(
        subscription: WebPushSubscription,
        notification: PushNotification,
    ): Promise<WebPushSendOutcome> {
        if (this.goneEndpoints.has(subscription.endpoint)) {
            return "SUBSCRIPTION_GONE"
        }
        this.sentNotifications.push({
            channel: "WEB",
            endpoint: subscription.endpoint,
            title: notification.title,
            body: notification.body,
        })
        if (process.env.NODE_ENV !== "test") {
            console.info(
                `[FakePush] channel=WEB endpoint=${subscription.endpoint} ` +
                    `title="${notification.title}" body="${notification.body}"`,
            )
        }
        return "SENT"
    }

    async sendNativePush(
        channel: NativePushChannel,
        deviceToken: string,
        notification: PushNotification,
    ): Promise<NativePushSendOutcome> {
        if (this.goneEndpoints.has(deviceToken)) {
            return "TOKEN_GONE"
        }
        this.sentNotifications.push({
            channel,
            endpoint: deviceToken,
            title: notification.title,
            body: notification.body,
        })
        if (process.env.NODE_ENV !== "test") {
            console.info(
                `[FakePush] channel=${channel} token=${deviceToken} ` +
                    `title="${notification.title}" body="${notification.body}"`,
            )
        }
        return "SENT"
    }

    /** Test helper: the most recent notification sent to an endpoint. */
    lastNotificationTo(endpoint: string): FakePushSend | undefined {
        for (let index = this.sentNotifications.length - 1; index >= 0; index -= 1) {
            if (this.sentNotifications[index].endpoint === endpoint) {
                return this.sentNotifications[index]
            }
        }
        return undefined
    }
}
