import { expect } from "chai"
import { RpcError } from "../../src/Utils/RpcError.js"
import { buildAddProjectMemberInput, buildUpdateProjectInput } from "../Utils/Factories/ProjectFactory.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { randomName } from "../Utils/Factories/RandomValues.js"
import { asUser, executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { addDefaults } from "../Utils/TestContext.js"

const projectsQuery = `
    query Projects($input: ProjectConnectionInput!) {
        projects(input: $input) { nodes { id } }
    }
`

const projectsQueryVariables = {
    input: {
        connection: {
            pagination: { first: 1 },
            sort: [{ fieldName: "name", direction: "asc" }],
        },
    },
}

describe("Authorization", function () {
    describe("execution gate (layer 1)", function () {
        // The gate throws from the Apollo request pipeline (not a resolver),
        // so executeOperation rejects; over HTTP the client still receives a
        // GraphQL error with extensions.code UNAUTHENTICATED via formatError.
        it("rejects anonymous operations before any resolver runs", async function () {
            await expect(
                executeGql(this.apolloServer, projectsQuery, projectsQueryVariables, null),
            ).to.be.rejectedWith(RpcError, "This operation requires an authenticated caller.")
        })

        it("rejects anonymous mutations", async function () {
            await expect(
                executeGql(
                    this.apolloServer,
                    `mutation UpdateProject($input: UpdateProjectInput!) {
                        updateProject(input: $input) { id }
                    }`,
                    { input: buildUpdateProjectInput({ objectId: "proj_missing", fields: { name: "x" } }) },
                    null,
                ),
            ).to.be.rejectedWith(RpcError, "This operation requires an authenticated caller.")
        })

        it("allows anonymous introspection", async function () {
            const response = await executeGql(
                this.apolloServer,
                `query { __schema { queryType { name } } }`,
                {},
                null,
            )

            expect(response.body.kind).to.equal("single")
            expect(response.body.kind === "single" && response.body.singleResult.errors).to.equal(undefined)
        })

        it("allows any authenticated caller through the gate", async function () {
            // The default test principal is authenticated but has no
            // application user; the gate passes and the resolver runs.
            const response = await executeGql(this.apolloServer, projectsQuery, projectsQueryVariables)

            expect(response.body.kind === "single" && response.body.singleResult.errors).to.equal(undefined)
        })
    })

    describe("project membership (layer 2)", function () {
        beforeEach(async function () {
            await addDefaults(this, ["account", "user", "project"])
        })

        async function attemptUpdate(
            context: Mocha.Context,
            actingUser: { id: string; email: string },
        ): Promise<ReturnType<typeof firstGqlError>> {
            const response = await executeGql(
                context.apolloServer,
                `mutation UpdateProject($input: UpdateProjectInput!) {
                    updateProject(input: $input) { id }
                }`,
                {
                    input: buildUpdateProjectInput({
                        objectId: context.defaults.project!.id,
                        fields: { name: randomName("Renamed") },
                    }),
                },
                asUser(actingUser),
            )
            return firstGqlError(response)
        }

        it("denies non-members", async function () {
            const outsider = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )

            const error = await attemptUpdate(this, outsider)
            expect(error.code).to.equal("PERMISSION_DENIED")
        })

        it("denies VIEWER members (writer role required)", async function () {
            const viewer = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            await this.projectHelper.addProjectMember(
                buildAddProjectMemberInput({
                    projectId: this.defaults.project!.id,
                    userId: viewer.id,
                    role: "VIEWER",
                }),
            )

            const error = await attemptUpdate(this, viewer)
            expect(error.code).to.equal("PERMISSION_DENIED")
        })

        it("allows EDITOR members", async function () {
            const editor = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            await this.projectHelper.addProjectMember(
                buildAddProjectMemberInput({
                    projectId: this.defaults.project!.id,
                    userId: editor.id,
                    role: "EDITOR",
                }),
            )

            const newName = randomName("Renamed by editor")
            const updated = await this.projectHelper.updateProject(
                buildUpdateProjectInput({
                    objectId: this.defaults.project!.id,
                    fields: { name: newName },
                }),
                editor,
            )
            expect(updated.name).to.equal(newName)
        })
    })
})
