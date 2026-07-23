# PubSub Events

Domain events decouple side effects from write paths. Exemplar: `ProjectCreated` — published by `firebase/functions/src/Services/Project/ProjectService.ts`, consumed by the subscriber in `firebase/functions/src/CloudFunctions/Project.ts`, which adds the creator's OWNER membership.

## The pieces

- **Schema**: protobuf message in `protobufs/` (e.g. `protobufs/base/project/v1/project.proto`). The topic name is the fully qualified message name (`base.project.v1.ProjectCreated`), always wrapped in `prefixedTopicName(...)` (from `firebase/functions/src/DependencyWrappers/PubSubWrapper/TopicName.ts`) wherever a real topic is referenced (`onMessagePublished`, configure-pubsub). Deployed environments share a GCP project, so the platform injects a per-environment `TOPIC_PREFIX`; locally the prefix is empty.
- **Publisher**: services publish encoded bytes via the `pubSubWrapper` (`firebase/functions/src/DependencyWrappers/PubSubWrapper/`). In deployed environments this is GCP Pub/Sub; under the emulator it dispatches to registered handlers inline, so local dev and tests exercise the full flow without infrastructure.
- **Subscriber**: an `onMessagePublished` function decodes the protobuf and delegates to a service method.
- **Dead-lettering**: delivery retries max out at 5 attempts, then messages land on the `default-dead-letter` topic, handled by `firebase/functions/src/Services/Messages/DeadLetterService.ts` (logs today; extend deliberately). Topic/subscription policies are configured idempotently by `firebase/functions/scripts/configure-pubsub.ts` at postdeploy.

## Recipe: add an event

1. Add the message to the domain's `.proto` (new file for a new domain), run `npm run codegen`.
2. Publish from the service after the write commits, encoding with the generated type.
3. Add a subscriber function next to the domain's CloudFunctions file; export it from `firebase/functions/src/index.ts`.
4. Blackbox-test it: the test pubsub wrapper runs subscribers inline, so asserting on the side effect after the triggering mutation covers the whole path.

## Never

- Never publish raw JSON — events are protobuf-typed contracts.
- Never do the side effect synchronously in the write path _and_ in the subscriber — pick the event.
