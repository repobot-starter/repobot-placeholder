/**
 * The analytics kernel's config surface — the one place a project tunes its
 * first-party pageview analytics. Everything else (the beacon endpoint, the
 * visitor hashing, the rollup job) is kernel machinery that consuming
 * features never reimplement.
 */
export const analyticsConfig = {
    /**
     * Days a raw pageview event survives before the rollup job prunes it.
     * The daily salt rotates every UTC day, so even inside this window
     * hashes are unlinkable across days.
     */
    rawRetentionDays: 7,

    /** Days a daily rollup row survives before it is pruned. */
    aggregateRetentionDays: 90,

    /**
     * UTC days the rollup job recomputes on each run (today and yesterday):
     * enough to converge around the midnight boundary while keeping the
     * recompute cheap.
     */
    rollupWindowDays: 2,

    /** Hard cap on a stored path; longer paths are truncated, not dropped. */
    maxPathLength: 512,
}
