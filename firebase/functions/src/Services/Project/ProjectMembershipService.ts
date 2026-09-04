import { and, eq, inArray } from "drizzle-orm"
import {
    ProjectMembership,
    projectMembershipInsertSchema,
    ProjectMembershipRole,
    projectMembershipsTable,
} from "../../Data/Project/ProjectMembership.js"
import { projectDb } from "../../Data/ProjectDatabase.js"
import {
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    orderedBatchLoadRowsByIds,
    updateRowReturning,
} from "../../Data/Utils/index.js"
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
     * Changes a member's role. Managing members is OWNER-only (per-resource
     * authorization, layer 2 of docs/authorization.md); the check lives here
     * in the service so every entry point inherits it. A project must always
     * keep at least one OWNER, so the last OWNER cannot be demoted.
     */
    async updateProjectMember(request: UpdateProjectMemberRequest): Promise<ProjectMembership> {
        const membership = await getRowByIdOrThrow(projectDb, projectMembershipsTable, request.objectId)
        await this.requireOwnerRole(membership.projectId, request.actingUserId)
        if (membership.role === "OWNER" && request.fields.role !== "OWNER") {
            await this.assertNotLastOwner(membership)
        }
        return await updateRowReturning(projectDb, projectMembershipsTable, membership.id, {
            role: request.fields.role,
        })
    }

    /**
     * Removes a member from a project. OWNER-only, and the last OWNER cannot
     * be removed (the project would become unmanageable).
     */
    async removeProjectMember(request: RemoveProjectMemberRequest): Promise<void> {
        const membership = await getRowByIdOrThrow(projectDb, projectMembershipsTable, request.objectId)
        await this.requireOwnerRole(membership.projectId, request.actingUserId)
        if (membership.role === "OWNER") {
            await this.assertNotLastOwner(membership)
        }
        await projectDb.delete(projectMembershipsTable).where(eq(projectMembershipsTable.id, membership.id))
    }

    private async requireOwnerRole(projectId: string, userId: string): Promise<void> {
        const membership = await this.getMembershipForProjectAndUser(projectId, userId)
        if (membership === undefined || membership.role !== "OWNER") {
            throw new RpcError(
                "PERMISSION_DENIED",
                "You need one of the roles [OWNER] on this project to manage its members.",
            )
        }
    }

    private async assertNotLastOwner(membership: ProjectMembership): Promise<void> {
        const memberships = await this.getMembershipsForProject(membership.projectId)
        const ownerCount = memberships.filter((entry) => entry.role === "OWNER").length
        if (ownerCount <= 1) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "A project must keep at least one OWNER. Promote another member first.",
            )
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
     * Batch-loads each project's memberships in one grouped query, aligned
     * with the input order (a project with no memberships gets []). This is
     * what Project.memberships resolves through — one query for a whole
     * page of projects, never one per row.
     */
    async orderedBatchLoadMembershipsByProjectIds(
        projectIds: readonly string[],
    ): Promise<ProjectMembership[][]> {
        const rows = await projectDb
            .select()
            .from(projectMembershipsTable)
            .where(inArray(projectMembershipsTable.projectId, [...projectIds]))
            .orderBy(projectMembershipsTable.rowCreatedAt, projectMembershipsTable.id)
        const byProjectId = new Map<string, ProjectMembership[]>()
        for (const row of rows) {
            const group = byProjectId.get(row.projectId)
            if (group === undefined) {
                byProjectId.set(row.projectId, [row])
            } else {
                group.push(row)
            }
        }
        return projectIds.map((projectId) => byProjectId.get(projectId) ?? [])
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

export interface UpdateProjectMemberRequest {
    objectId: string
    idempotencyKey: string
    /** The authenticated user performing the change; must be an OWNER of the project. */
    actingUserId: string
    fields: {
        role: ProjectMembershipRole
    }
}

export interface RemoveProjectMemberRequest {
    objectId: string
    /** The authenticated user performing the removal; must be an OWNER of the project. */
    actingUserId: string
}
