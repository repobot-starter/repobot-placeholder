/**
 * The seam between services and PubSub. Services publish serialized protobuf
 * bytes to a topic named after the message's fully qualified protobuf type
 * name (for example "base.project.v1.ProjectCreated"); they never touch the
 * GCP client directly, so tests and the emulator can swap the transport.
 */
export interface PubSubWrapper {
    publishBytes(topicName: string, bytes: Uint8Array): Promise<void>
}
