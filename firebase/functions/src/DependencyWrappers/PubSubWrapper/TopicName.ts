/**
 * Deployed environments share a GCP project with other environments, so every
 * Pub/Sub topic is namespaced by TOPIC_PREFIX (injected by the platform at
 * deploy time, e.g. "acme-shop-dev-x1y2z3."). Locally and in tests the prefix
 * is empty and topic names are the bare protobuf type names.
 *
 * Use this for every topic reference: onMessagePublished({ topic }), publish
 * calls, and configure-pubsub. The prefix is read at module-evaluation /
 * function-discovery time. NOTE: firebase-tools runs function discovery in a
 * sanitized environment — .env does NOT reach it — so the platform's deployer
 * bakes the assignment into the generated deploy entry module (imported
 * before this code evaluates). Env-only configuration would bind triggers to
 * the bare names while the runtime publishes to the prefixed ones.
 */
export function prefixedTopicName(baseName: string): string {
    return `${process.env.TOPIC_PREFIX ?? ""}${baseName}`
}
