import { MessagePublishedCloudEvent } from "../../DependencyWrappers/PubSubWrapper/index.js"

/**
 * Handles messages that exhausted their delivery attempts (see
 * src/ConfigurePubSub.ts: every subscription dead-letters to
 * "default-dead-letter" after 5 attempts).
 *
 * The starter behavior is to log for triage. The operational play is: fix the
 * bug that poisoned the message, then replay from the dead-letter subscription
 * in the GCP console.
 */
class DeadLetterService {
    log(event: MessagePublishedCloudEvent): void {
        console.warn("Dead-lettered PubSub message received.", {
            messageDataBase64: event.data.message.data,
        })
    }
}

export const deadLetterService = new DeadLetterService()
