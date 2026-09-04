import { isEmulator } from "../../Utils/Environment.js"
import { EmulatorPubSubWrapper } from "./EmulatorPubSubWrapper.js"
import { GcpPubSubWrapper } from "./GcpPubSubWrapper.js"
import { PubSubWrapper } from "./PubSubWrapper.js"

export * from "./EmulatorPubSubWrapper.js"
export * from "./GcpPubSubWrapper.js"
export * from "./PubSubWrapper.js"
export * from "./TopicName.js"

/**
 * The singleton that services publish through. In the emulator, messages are
 * dispatched to registered handlers inline; in production they go to GCP.
 * Tests replace publishBytes with a fake wired to TestPubSubWrapper.
 */
export const pubSubWrapper: PubSubWrapper = isEmulator()
    ? new EmulatorPubSubWrapper()
    : new GcpPubSubWrapper()
