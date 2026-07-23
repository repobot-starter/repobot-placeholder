import { onMessagePublished } from "firebase-functions/v2/pubsub"
import { deadLetterService } from "../Services/Messages/DeadLetterService.js"
import { DEFAULT_DEAD_LETTER_TOPIC } from "../ConfigurePubSub.js"
import { prefixedTopicName } from "../DependencyWrappers/PubSubWrapper/index.js"

export const messages__message__dead_letter = onMessagePublished(
    {
        topic: prefixedTopicName(DEFAULT_DEAD_LETTER_TOPIC),
        // Never retry dead letter consumption; the topic retains messages for
        // manual replay after the underlying bug is fixed.
        retry: false,
    },
    async (event) => {
        deadLetterService.log(event)
    },
)
