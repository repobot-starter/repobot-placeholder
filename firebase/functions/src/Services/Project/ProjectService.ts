import { create, toBinary } from "@bufbuild/protobuf"
import { timestampFromDate } from "@bufbuild/protobuf/wkt"
import { ilike, inArray } from "drizzle-orm"
import { ProjectCreatedSchema } from "../../../generated/Protobufs/base/project/v1/project_pb.js"
import {
    Project,
    projectInsertSchema,
    projectsTable,
    ProjectStatus,
    projectUpdateSchema,
} from "../../Data/Project/Project.js"
import { projectDb } from "../../Data/ProjectDatabase.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    orderedBatchLoadRowsByIds,
    updateRowReturning,
} from "../../Data/Utils/index.js"
import { ProjectMembershipRole } from "../../Data/Project/ProjectMembership.js"
import { pubSubWrapper } from "../../DependencyWrappers/PubSubWrapper/index.js"
import { ValueOrError } from "../../Utils/DataLoaderUtils.js"
import { RpcError } from "../../Utils/RpcError.js"
import { userService } from "../Identity/UserService.js"
import { projectMembershipService } from "./ProjectMembershipService.js"

class ProjectService {
    /**
     * Creates a project and publishes ProjectCreated. Side effects that hang
     * off creation (for example the creator's OWNER membership) live in the
     * message subscriber (CloudFunctions/Project.ts), not here: the mutation
     * stays fast and new creation side effects never require touching it.
     */
    async createProject(request: CreateProjectRequest): Promise<Project> {
        const newProject = projectInsertSchema.parse({
            ...request.fields,
            status: "ACTIVE",
            createdByUserId: request.createdByUserId,
        })

        // created_by_user_id crosses domains (Identity), so there is no FK;
        // the service layer enforces the reference instead.
        await userService.getUserByIdOrThrow(newProject.createdByUserId)

        const project = await idempotentInsertAndGet(
            projectDb,
            projectsTable,
            newProject,
            request.idempotencyKey,
        )

        const message = create(ProjectCreatedSchema, {
            projectId: project.id,
            name: project.name,
            createdByUserId: project.createdByUserId,
            createdAt: timestampFromDate(project.rowCreatedAt),
        })
        await pubSubWrapper.publishBytes(
            ProjectCreatedSchema.typeName,
            toBinary(ProjectCreatedSchema, message),
        )

        return project
    }

    /**
     * Per-resource authorization exemplar (layer 2 of the model in
     * docs/authorization.md): the acting user must hold a writer role on the
     * project. The check lives here in the service - not the resolver - so
     * every caller (GraphQL, subscribers, future entry points) goes through it.
     */
    async updateProject(request: UpdateProjectRequest): Promise<Project> {
        await this.requireProjectRole(request.objectId, request.actingUserId, ["OWNER", "EDITOR"])

        const { doArchive, ...fields } = request.fields
        const updateValue = projectUpdateSchema.parse({
            ...withoutNullProperties(fields),
            ...(doArchive === true ? { status: "ARCHIVED", archivedAt: new Date() } : {}),
            ...(doArchive === false ? { status: "ACTIVE", archivedAt: null } : {}),
        })
        return await updateRowReturning(projectDb, projectsTable, request.objectId, updateValue)
    }

    private async requireProjectRole(
        projectId: string,
        userId: string,
        allowedRoles: readonly ProjectMembershipRole[],
    ): Promise<void> {
        const membership = await projectMembershipService.getMembershipForProjectAndUser(projectId, userId)
        if (membership === undefined || !allowedRoles.includes(membership.role)) {
            throw new RpcError(
                "PERMISSION_DENIED",
                `You need one of the roles [${allowedRoles.join(", ")}] on this project.`,
            )
        }
    }

    async getProjectByIdOrThrow(projectId: string): Promise<Project> {
        return await getRowByIdOrThrow(projectDb, projectsTable, projectId)
    }

    async listProjects(request: ListProjectsRequest): Promise<ListRowsResult<Project>> {
        const filters = request.filters
        return await listRows(projectDb, projectsTable, request.connection, {
            filters: [
                filters?.name ? ilike(projectsTable.name, `%${filters.name}%`) : undefined,
                filters?.statuses && filters.statuses.length > 0
                    ? inArray(projectsTable.status, filters.statuses)
                    : undefined,
            ],
            sortColumnKeys: ["name", "status", "rowCreatedAt"],
        })
    }

    /**
     * Batch-loads projects by id preserving order, for dataloaders.
     */
    async orderedBatchLoadProjectsByIds(ids: readonly string[]): Promise<ValueOrError<Project>[]> {
        return await orderedBatchLoadRowsByIds(projectDb, projectsTable, ids)
    }
}

function withoutNullProperties<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, entryValue]) => entryValue !== null && entryValue !== undefined),
    ) as Partial<T>
}

export const projectService = new ProjectService()

export interface CreateProjectRequest {
    idempotencyKey: string
    createdByUserId: string
    fields: {
        name: string
        description?: string | null
    }
}

export interface UpdateProjectRequest {
    objectId: string
    idempotencyKey: string
    /** The authenticated user performing the update; must be OWNER or EDITOR. */
    actingUserId: string
    fields: {
        name?: string | null
        description?: string | null
        doArchive?: boolean | null
    }
}

export interface ListProjectsRequest {
    connection: ConnectionParameters
    filters?: {
        name?: string | null
        statuses?: ProjectStatus[] | null
    } | null
}
