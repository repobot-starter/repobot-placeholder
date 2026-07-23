import { and, eq } from "drizzle-orm"
import {
    ProjectMembership,
    projectMembershipInsertSchema,
    ProjectMembershipRole,
    projectMembershipsTable,
} from "../../Data/Project/ProjectMembership.js"
import { projectDb } from "../../Data/ProjectDatabase.js"
import { idempotentInsertAndGet, orderedBatchLoadRowsByIds } from "../../Data/Utils/index.js"
import { ValueOrError } from "../../Utils/DataLoaderUtils.js"
import { RpcError } from "../../Utils/RpcError.js"
import { userService } from "../Identity/UserService.js"
import { projectService } from "./ProjectService.js"

const POSTGRES_UNIQUE_VIOLATION = "23505"

class ProjectMembershipService {
    async addProjectMember(request: AddProjectMemberRequest): Promise<ProjectMembership> {
        const newMembership = projectMembershipInsertSchema.parse(request.fields)

        // Both references cross table (and potentially database) boundaries
        // without FKs; the service layer enforces them.
        await projectService.getProjectByIdOrThrow(newMembership.projectId)
        await userService.getUserByIdOrThrow(newMembership.userId)

        try {
            return await idempotentInsertAndGet(
                projectDb,
                projectMembershipsTable,
                newMembership,
                request.idempotencyKey,
            )
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new RpcError(
                    "ALREADY_EXISTS",
                    `User ${newMembership.userId} is already a member of project ${newMembership.projectId}.`,
                    { cause: error },
                )
            }
            throw error
        }
    }

    /**
     * The user's membership row for a project, or undefined when they are not
     * a member. Authorization checks (see ProjectService.updateProject) build
     * on this.
     */
    async getMembershipForProjectAndUser(
        projectId: string,
        userId: string,
    ): Promise<ProjectMembership | undefined> {
        const rows = await projectDb
            .select()
            .from(projectMembershipsTable)
            .where(
                and(
                    eq(projectMembershipsTable.projectId, projectId),
                    eq(projectMembershipsTable.userId, userId),
                ),
            )
            .limit(1)
        return rows[0]
    }

    async getMembershipsForProject(projectId: string): Promise<ProjectMembership[]> {
        return await projectDb
            .select()
            .from(projectMembershipsTable)
            .where(eq(projectMembershipsTable.projectId, projectId))
            .orderBy(projectMembershipsTable.rowCreatedAt, projectMembershipsTable.id)
    }

    /**
     * Batch-loads memberships by id preserving order, for dataloaders.
     */
    async orderedBatchLoadMembershipsByIds(
        ids: readonly string[],
    ): Promise<ValueOrError<ProjectMembership>[]> {
        return await orderedBatchLoadRowsByIds(projectDb, projectMembershipsTable, ids)
    }
}

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    )
}

export const projectMembershipService = new ProjectMembershipService()

export interface AddProjectMemberRequest {
    idempotencyKey: string
    fields: {
        projectId: string
        userId: string
        role: ProjectMembershipRole
    }
}
