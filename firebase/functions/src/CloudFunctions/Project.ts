import { fromBinary } from "@bufbuild/protobuf"
import { onMessagePublished } from "firebase-functions/v2/pubsub"
import { ProjectCreatedSchema } from "../../generated/Protobufs/base/project/v1/project_pb.js"
import {
    MessagePublishedCloudEvent,
    prefixedTopicName,
    registerPubSubHandler,
} from "../DependencyWrappers/PubSubWrapper/index.js"
import { projectCreatedSubscriber } from "../Services/Project/ProjectCreatedSubscriber.js"

// Exported for the test harness's TestPubSubWrapper.
export async function handleProjectCreated(event: MessagePublishedCloudEvent): Promise<void> {
    const bytes = Buffer.from(event.data.message.data, "base64")
    const message = fromBinary(ProjectCreatedSchema, bytes)
    await projectCreatedSubscriber.handleProjectCreated(message)
}

// Lets the emulator PubSub wrapper dispatch published messages to this
// handler inline (no PubSub emulator required).
registerPubSubHandler(ProjectCreatedSchema.typeName, handleProjectCreated)

export const project__message__created = onMessagePublished(
    {
        // Topic name = the fully qualified protobuf type name, namespaced by
        // the environment's TOPIC_PREFIX in deployed (shared-project) envs.
        topic: prefixedTopicName(ProjectCreatedSchema.typeName),
        retry: true,
    },
    handleProjectCreated,
)
