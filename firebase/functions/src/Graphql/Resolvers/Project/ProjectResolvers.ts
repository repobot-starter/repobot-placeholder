import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { projectMembershipService } from "../../../Services/Project/ProjectMembershipService.js"
import { projectService } from "../../../Services/Project/ProjectService.js"
import { RpcError } from "../../../Utils/RpcError.js"

export const projectResolvers: GqlResolvers = {
    Query: {
        project: async (_parent, { id }) => {
            return await projectService.getProjectByIdOrThrow(id)
        },

        projects: async (_parent, { input }) => {
            return await projectService.listProjects({
                connection: input.connection,
                filters: input.filters,
            })
        },
    },

    Mutation: {
        createProject: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Creating a project requires an authenticated user.")
            }
            return await projectService.createProject({
                idempotencyKey: input.idempotencyKey,
                createdByUserId: userId,
                fields: input.fields,
            })
        },

        updateProject: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Updating a project requires an authenticated user.")
            }
            return await projectService.updateProject({
                objectId: input.objectId,
                idempotencyKey: input.idempotencyKey,
                actingUserId: userId,
                fields: input.fields,
            })
        },

        addProjectMember: async (_parent, { input }) => {
            return await projectMembershipService.addProjectMember({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },
    },

    Project: {
        // Field resolvers hydrate relations via per-request dataloaders; the
        // parent row only carries ids.
        createdBy: async (project, _args, context) => {
            return await context.userDataloader.load(project.createdByUserId)
        },
        memberships: async (project) => {
            return await projectMembershipService.getMembershipsForProject(project.id)
        },
        createdTime: (project) => project.rowCreatedAt,
        archivedAt: (project) => project.archivedAt ?? undefined,
        description: (project) => project.description ?? undefined,
    },

    ProjectMembership: {
        user: async (membership, _args, context) => {
            return await context.userDataloader.load(membership.userId)
        },
        project: async (membership, _args, context) => {
            return await context.projectDataloader.load(membership.projectId)
        },
        createdTime: (membership) => membership.rowCreatedAt,
    },
}
