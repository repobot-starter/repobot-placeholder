import {
    GqlAddProjectMemberInput,
    GqlCreateProjectInput,
    GqlProject,
    GqlProjectConnection,
    GqlProjectConnectionInput,
    GqlProjectMembership,
    GqlUpdateProjectInput,
    GqlUser,
} from "../../generated/GraphqlResolverTypes.js"
import { asUser, executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const projectGqlFields = `
    id
    name
    description
    status
    createdTime
    archivedAt
    createdBy {
        id
        email
        displayName
    }
    memberships {
        id
        role
        createdTime
        user { id email }
        project { id name }
    }
`

const pageInfoGqlFields = `
    hasPreviousPage
    hasNextPage
    startCursor
    endCursor
`

export class ProjectTestHelper extends BaseTestHelper {
    /**
     * Creates a project as the given user (createProject attributes the
     * project to the authenticated principal).
     */
    async createProject(input: GqlCreateProjectInput, user: GqlUser): Promise<GqlProject> {
        return await executeGqlAt(
            this.server,
            `mutation CreateProject($input: CreateProjectInput!) {
                createProject(input: $input) { ${projectGqlFields} }
            }`,
            { input },
            "createProject",
            asUser(user),
        )
    }

    /**
     * Creates a project via the mutation, then reads it back through the
     * project query (blackbox round trip).
     */
    async createAndGetProject(input: GqlCreateProjectInput, user: GqlUser): Promise<GqlProject> {
        const created = await this.createProject(input, user)
        return await this.getProjectById(created.id)
    }

    async getProjectById(id: string): Promise<GqlProject> {
        return await executeGqlAt(
            this.server,
            `query Project($id: Id!) {
                project(id: $id) { ${projectGqlFields} }
            }`,
            { id },
            "project",
        )
    }

    /**
     * Updates a project as the given user, who must hold a writer role on the
     * project (OWNER or EDITOR).
     */
    async updateProject(input: GqlUpdateProjectInput, user: GqlUser): Promise<GqlProject> {
        return await executeGqlAt(
            this.server,
            `mutation UpdateProject($input: UpdateProjectInput!) {
                updateProject(input: $input) { ${projectGqlFields} }
            }`,
            { input },
            "updateProject",
            asUser(user),
        )
    }

    async addProjectMember(input: GqlAddProjectMemberInput): Promise<GqlProjectMembership> {
        return await executeGqlAt(
            this.server,
            `mutation AddProjectMember($input: AddProjectMemberInput!) {
                addProjectMember(input: $input) {
                    id
                    role
                    createdTime
                    user { id email }
                    project { id name }
                }
            }`,
            { input },
            "addProjectMember",
        )
    }

    async getProjects(input: GqlProjectConnectionInput): Promise<GqlProjectConnection> {
        return await executeGqlAt(
            this.server,
            `query Projects($input: ProjectConnectionInput!) {
                projects(input: $input) {
                    nodes { ${projectGqlFields} }
                    pageInfo { ${pageInfoGqlFields} }
                }
            }`,
            { input },
            "projects",
        )
    }
}
