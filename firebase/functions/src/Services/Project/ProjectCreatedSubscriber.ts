import { ProjectCreated } from "../../../generated/Protobufs/base/project/v1/project_pb.js"
import { projectMembershipService } from "./ProjectMembershipService.js"

/**
 * Consumes ProjectCreated events. Demonstrates the event-driven flow: the
 * creator's OWNER membership is added here, not inside createProject, so new
 * creation side effects are additive subscribers rather than mutation edits.
 */
class ProjectCreatedSubscriber {
    async handleProjectCreated(message: ProjectCreated): Promise<void> {
        console.info(
            `ProjectCreated: project ${message.projectId} ("${message.name}") ` +
                `created by user ${message.createdByUserId}`,
        )

        // Deterministic idempotency key: PubSub redeliveries (at-least-once)
        // land on the existing membership instead of erroring.
        await projectMembershipService.addProjectMember({
            idempotencyKey: `project-created-owner:${message.projectId}`,
            fields: {
                projectId: message.projectId,
                userId: message.createdByUserId,
                role: "OWNER",
            },
        })
    }
}

export const projectCreatedSubscriber = new ProjectCreatedSubscriber()
