import { analyticsService } from "../Analytics/AnalyticsService.js"
import { pushService } from "./PushService.js"

/**
 * The push kernel's scheduled-consumer exemplar (docs/push.md): a minimal
 * daily digest — the recent pageview count from the analytics kernel — pushed
 * to every app user with a registered device. It exists to demonstrate the
 * JOBS + PUSH composition, not as a product feature; packs replace the
 * content, not the shape.
 *
 * Safe under the jobs kernel's at-most-once-per-due-time claim: a skipped due
 * time just means no digest that day, and a re-run after a crash sends an
 * identical (harmless) duplicate.
 */
class PushDigestService {
    async sendActivityDigest(now = new Date()): Promise<void> {
        const userIds = await pushService.listUserIdsWithDevices()
        if (userIds.length === 0) {
            return
        }
        const pageviews = await analyticsService.recentPageviewCount(now)
        for (const userId of userIds) {
            // sendPush is best-effort per device and returns false rather
            // than throwing in degraded mode, so one user never blocks the rest.
            await pushService.sendPush({
                toAppUserId: userId,
                templateKey: "activityDigest",
                variables: { pageviews: String(pageviews) },
            })
        }
    }
}

export const pushDigestService = new PushDigestService()
