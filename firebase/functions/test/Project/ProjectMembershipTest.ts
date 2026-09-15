import { expect } from "chai"
import {
    buildAddProjectMemberInput,
    buildUpdateProjectMemberInput,
} from "../Utils/Factories/ProjectFactory.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { asUser, executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { addDefaults, TestContext } from "../Utils/TestContext.js"

describe("Project membership management", function () {
    beforeEach(async function () {
        // The default user is the project's creator, so the ProjectCreated
        // subscriber has already made them the OWNER.
        await addDefaults(this, ["account", "user", "project"])
    })

    async function createMember(
        context: TestContext,
        role: "OWNER" | "EDITOR" | "VIEWER",
    ): Promise<{ user: { id: string; email: string }; membershipId: string }> {
        const user = await context.identityHelper.createAndGetUser(
            buildCreateUserInput({
                fields: buildCreateUserFields({ accountId: context.defaults.account!.id }),
            }),
        )
        const membership = await context.projectHelper.addProjectMember(
            buildAddProjectMemberInput({
                projectId: context.defaults.project!.id,
                userId: user.id,
                role,
            }),
        )
        return { user, membershipId: membership.id }
    }

    describe("updateProjectMember", function () {
        it("lets an OWNER change a member's role", async function () {
            const owner = this.defaults.user!
            const { membershipId } = await createMember(this, "VIEWER")

            const updated = await this.projectHelper.updateProjectMember(
                buildUpdateProjectMemberInput({ objectId: membershipId, fields: { role: "EDITOR" } }),
                owner,
            )

            expect(updated.id).to.equal(membershipId)
            expect(updated.role).to.equal("EDITOR")

            const reloaded = await this.projectHelper.getProjectById(this.defaults.project!.id)
            const roles = reloaded.memberships.map((entry) => entry.role).sort()
            expect(roles).to.deep.equal(["EDITOR", "OWNER"])
        })

        it("denies EDITOR members (OWNER required)", async function () {
            const { user: editor } = await createMember(this, "EDITOR")
            const { membershipId } = await createMember(this, "VIEWER")

            const response = await executeGql(
                this.apolloServer,
                `mutation UpdateProjectMember($input: UpdateProjectMemberInput!) {
                    updateProjectMember(input: $input) { id }
                }`,
                {
                    input: buildUpdateProjectMemberInput({
                        objectId: membershipId,
                        fields: { role: "EDITOR" },
                    }),
                },
                asUser(editor),
            )
            expect(firstGqlError(response).code).to.equal("PERMISSION_DENIED")
        })

        it("denies non-members", async function () {
            const outsider = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            const { membershipId } = await createMember(this, "VIEWER")

            const response = await executeGql(
                this.apolloServer,
                `mutation UpdateProjectMember($input: UpdateProjectMemberInput!) {
                    updateProjectMember(input: $input) { id }
                }`,
                {
                    input: buildUpdateProjectMemberInput({
                        objectId: membershipId,
                        fields: { role: "OWNER" },
                    }),
                },
                asUser(outsider),
            )
            expect(firstGqlError(response).code).to.equal("PERMISSION_DENIED")
        })

        it("refuses to demote the last OWNER", async function () {
            const owner = this.defaults.user!
            const ownerMembership = this.defaults.project!.memberships[0]

            const response = await executeGql(
                this.apolloServer,
                `mutation UpdateProjectMember($input: UpdateProjectMemberInput!) {
                    updateProjectMember(input: $input) { id }
                }`,
                {
                    input: buildUpdateProjectMemberInput({
                        objectId: ownerMembership.id,
                        fields: { role: "VIEWER" },
                    }),
                },
                asUser(owner),
            )
            expect(firstGqlError(response).code).to.equal("FAILED_PRECONDITION")
        })

        it("allows demoting an OWNER when another OWNER remains", async function () {
            const owner = this.defaults.user!
            const { membershipId } = await createMember(this, "OWNER")

            const updated = await this.projectHelper.updateProjectMember(
                buildUpdateProjectMemberInput({ objectId: membershipId, fields: { role: "VIEWER" } }),
                owner,
            )
            expect(updated.role).to.equal("VIEWER")
        })
    })

    describe("removeProjectMember", function () {
        it("lets an OWNER remove a member", async function () {
            const owner = this.defaults.user!
            const { membershipId } = await createMember(this, "EDITOR")

            const removed = await this.projectHelper.removeProjectMember({ objectId: membershipId }, owner)
            expect(removed).to.equal(true)

            const reloaded = await this.projectHelper.getProjectById(this.defaults.project!.id)
            expect(reloaded.memberships).to.have.length(1)
            expect(reloaded.memberships[0].role).to.equal("OWNER")
        })

        it("denies VIEWER members (OWNER required)", async function () {
            const { user: viewer } = await createMember(this, "VIEWER")
            const { membershipId } = await createMember(this, "EDITOR")

            const response = await executeGql(
                this.apolloServer,
                `mutation RemoveProjectMember($input: RemoveProjectMemberInput!) {
                    removeProjectMember(input: $input)
                }`,
                { input: { objectId: membershipId } },
                asUser(viewer),
            )
            expect(firstGqlError(response).code).to.equal("PERMISSION_DENIED")
        })

        it("refuses to remove the last OWNER", async function () {
            const owner = this.defaults.user!
            const ownerMembership = this.defaults.project!.memberships[0]

            const response = await executeGql(
                this.apolloServer,
                `mutation RemoveProjectMember($input: RemoveProjectMemberInput!) {
                    removeProjectMember(input: $input)
                }`,
                { input: { objectId: ownerMembership.id } },
                asUser(owner),
            )
            expect(firstGqlError(response).code).to.equal("FAILED_PRECONDITION")
        })

        it("rejects anonymous callers before any resolver runs", async function () {
            const { membershipId } = await createMember(this, "VIEWER")

            await expect(
                executeGql(
                    this.apolloServer,
                    `mutation RemoveProjectMember($input: RemoveProjectMemberInput!) {
                        removeProjectMember(input: $input)
                    }`,
                    { input: { objectId: membershipId } },
                    null,
                ),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })
    })
})
