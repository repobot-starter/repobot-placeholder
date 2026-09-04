import { PubSub } from "@google-cloud/pubsub"
import { SubscriberClient } from "@google-cloud/pubsub/build/src/v1/index.js"
import { ProjectCreatedSchema } from "../generated/Protobufs/base/project/v1/project_pb.js"
import { prefixedTopicName } from "./DependencyWrappers/PubSubWrapper/TopicName.js"

export const DEFAULT_DEAD_LETTER_TOPIC = "default-dead-letter"
const MAX_DELIVERY_ATTEMPTS = 5
const DEAD_LETTER_RETENTION_SECONDS = 7 * 24 * 60 * 60

// Every event topic. Topic name = the fully qualified protobuf type name
// (namespaced by TOPIC_PREFIX in deployed environments).
const topicNames = [ProjectCreatedSchema.typeName].map(prefixedTopicName)

/**
 * Idempotently configures PubSub for the current GCP project:
 *   - ensures every event topic and the dead-letter topic exist,
 *   - gives every subscription a dead-letter policy (5 attempts, then the
 *     message moves to "default-dead-letter"),
 *   - sets the dead-letter topic's retention so unconsumed messages survive
 *     long enough to be replayed after a fix.
 *
 * Run via scripts/configure-pubsub.ts after deploy (the firebase deploy
 * creates the subscriptions for onMessagePublished functions; this pass then
 * attaches the dead-letter policy). Not needed locally: the emulator wrapper
 * dispatches inline.
 */
export async function configurePubSub(): Promise<void> {
    const pubSub = new PubSub()
    const subscriberClient = new SubscriberClient()
    const projectId =
        process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT ?? (await pubSub.auth.getProjectId())

    const deadLetterTopicName = prefixedTopicName(DEFAULT_DEAD_LETTER_TOPIC)
    const deadLetterTopicResourceName = `projects/${projectId}/topics/${deadLetterTopicName}`

    await ensureTopicExists(pubSub, deadLetterTopicName)
    const deadLetterTopic = pubSub.topic(deadLetterTopicName)
    await deadLetterTopic.setMetadata({
        messageRetentionDuration: { seconds: DEAD_LETTER_RETENTION_SECONDS },
    })

    for (const topicName of topicNames) {
        await ensureTopicExists(pubSub, topicName)

        const [subscriptions] = await pubSub.topic(topicName).getSubscriptions()
        if (subscriptions.length === 0) {
            console.warn(`configure-pubsub: topic ${topicName} has no subscriptions yet.`)
            continue
        }

        for (const subscription of subscriptions) {
            console.log(`configure-pubsub: setting dead-letter policy on ${subscription.name}`)
            await subscriberClient.updateSubscription({
                subscription: {
                    name: subscription.name,
                    deadLetterPolicy: {
                        deadLetterTopic: deadLetterTopicResourceName,
                        maxDeliveryAttempts: MAX_DELIVERY_ATTEMPTS,
                    },
                },
                updateMask: { paths: ["dead_letter_policy"] },
            })
        }
    }

    console.log("configure-pubsub: done.")
}

async function ensureTopicExists(pubSub: PubSub, topicName: string): Promise<void> {
    const [exists] = await pubSub.topic(topicName).exists()
    if (!exists) {
        console.log(`configure-pubsub: creating topic ${topicName}`)
        await pubSub.createTopic(topicName)
    }
}
