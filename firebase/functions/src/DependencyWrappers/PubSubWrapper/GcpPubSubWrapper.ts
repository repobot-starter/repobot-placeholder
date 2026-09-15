import { PubSub } from "@google-cloud/pubsub"
import { PubSubWrapper } from "./PubSubWrapper.js"
import { prefixedTopicName } from "./TopicName.js"

/** gRPC status codes the publish retry path distinguishes. */
const GRPC_NOT_FOUND = 5
const GRPC_ALREADY_EXISTS = 6

/**
 * Production implementation: publishes to real GCP PubSub topics. Topic names
 * are namespaced with the environment's TOPIC_PREFIX (shared GCP project).
 */
export class GcpPubSubWrapper implements PubSubWrapper {
    private readonly pubSub = new PubSub()

    public async publishBytes(topicName: string, bytes: Uint8Array): Promise<void> {
        const fullName = prefixedTopicName(topicName)
        const topic = this.pubSub.topic(fullName)
        const message = { data: Buffer.from(bytes) }
        try {
            await topic.publishMessage(message)
        } catch (error) {
            // A missing topic must not fail the user's mutation when we can
            // create it: topics are namespaced per environment, so creating
            // one here can never touch another tenant. Publish-only topics
            // (no subscriber to make the deploy create them) land here on
            // their first event. If creation is not permitted, surface the
            // original NOT_FOUND rather than the permission error.
            if ((error as { code?: number })?.code !== GRPC_NOT_FOUND) {
                throw error
            }
            try {
                await this.pubSub.createTopic(fullName)
            } catch (createError) {
                if ((createError as { code?: number })?.code !== GRPC_ALREADY_EXISTS) {
                    throw error
                }
            }
            await topic.publishMessage(message)
        }
    }
}
