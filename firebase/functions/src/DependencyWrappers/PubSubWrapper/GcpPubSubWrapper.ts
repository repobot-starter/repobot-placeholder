import { PubSub } from "@google-cloud/pubsub"
import { PubSubWrapper } from "./PubSubWrapper.js"
import { prefixedTopicName } from "./TopicName.js"

/**
 * Production implementation: publishes to real GCP PubSub topics. Topic names
 * are namespaced with the environment's TOPIC_PREFIX (shared GCP project).
 */
export class GcpPubSubWrapper implements PubSubWrapper {
    private readonly pubSub = new PubSub()

    public async publishBytes(topicName: string, bytes: Uint8Array): Promise<void> {
        const topic = this.pubSub.topic(prefixedTopicName(topicName))
        await topic.publishMessage({ data: Buffer.from(bytes) })
    }
}
