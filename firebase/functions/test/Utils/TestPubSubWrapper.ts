import {
    getRegisteredPubSubHandler,
    MessagePublishedCloudEvent,
} from "../../src/DependencyWrappers/PubSubWrapper/index.js"

/**
 * The test transport for PubSub. MochaHooks replaces the real
 * pubSubWrapper.publishBytes with a fake that delegates here, so a publish
 * dispatches inline to the same handlers that CloudFunctions registered
 * (test/MochaHooks.ts imports src/index.js to load them). Awaiting a mutation
 * therefore awaits its complete event-driven side effects — for example
 * createProject's OWNER membership — with no PubSub emulator involved.
 */
export class TestPubSubWrapper {
    readonly publishedTopicNames: string[] = []

    public async publishBytes(topicName: string, bytes: Uint8Array): Promise<void> {
        this.publishedTopicNames.push(topicName)

        const handler = getRegisteredPubSubHandler(topicName)
        if (handler === undefined) {
            throw new Error(`No message handler is registered for topic ${topicName}`)
        }

        const cloudEvent: MessagePublishedCloudEvent = {
            data: {
                message: {
                    data: Buffer.from(bytes).toString("base64"),
                },
            },
        }
        await handler(cloudEvent)
    }
}
