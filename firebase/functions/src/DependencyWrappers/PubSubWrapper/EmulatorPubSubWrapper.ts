import { checkArgument } from "../../Utils/RpcError.js"
import { PubSubWrapper } from "./PubSubWrapper.js"

// The subset of a PubSub CloudEvent that message handlers consume.
export type MessagePublishedCloudEvent = {
    data: {
        message: {
            data: string // base64-encoded protobuf bytes
        }
    }
}

export type PubSubHandler = (event: MessagePublishedCloudEvent) => Promise<void>

const handlersByTopicName = new Map<string, PubSubHandler>()

/**
 * CloudFunctions modules register their message handlers here at import time.
 * The emulator wrapper (and the test harness's TestPubSubWrapper) dispatch
 * published messages to these handlers inline, so event-driven flows work
 * end-to-end without a PubSub emulator.
 */
export function registerPubSubHandler(topicName: string, handler: PubSubHandler): void {
    handlersByTopicName.set(topicName, handler)
}

export function getRegisteredPubSubHandler(topicName: string): PubSubHandler | undefined {
    return handlersByTopicName.get(topicName)
}

/**
 * Emulator implementation: dispatches to the registered handler inline.
 * Awaiting publishBytes therefore awaits the complete downstream processing.
 */
export class EmulatorPubSubWrapper implements PubSubWrapper {
    public async publishBytes(topicName: string, bytes: Uint8Array): Promise<void> {
        const handler = getRegisteredPubSubHandler(topicName)
        checkArgument(handler !== undefined, `No message handler is registered for topic ${topicName}`)

        await handler({
            data: {
                message: {
                    data: Buffer.from(bytes).toString("base64"),
                },
            },
        })
    }
}
