import { expect } from "chai"
import {
    buildAddProjectMemberInput,
    buildCreateProjectInput,
    buildUpdateProjectInput,
} from "../Utils/Factories/ProjectFactory.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { newIdempotencyKey, randomName } from "../Utils/Factories/RandomValues.js"
import { addDefaults } from "../Utils/TestContext.js"

const PROJECT_CREATED_TOPIC = "base.project.v1.ProjectCreated"

describe("Projects", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
    })

    it("create publishes ProjectCreated and the subscriber adds the OWNER membership", async function () {
        const user = this.defaults.user!
        const project = await this.projectHelper.createAndGetProject(buildCreateProjectInput(), user)

        // The mutation published the event...
        expect(this.fakes.pubSub.publishBytes.callCount).to.equal(1)
        expect(this.pubSubWrapper.publishedTopicNames).to.deep.equal([PROJECT_CREATED_TOPIC])

        // ...and the inline-dispatched subscriber added the creator as OWNER.
        expect(project.memberships).to.have.length(1)
        expect(project.memberships[0].role).to.equal("OWNER")
        expect(project.memberships[0].user.id).to.equal(user.id)

        // project.createdBy hydrates via the user dataloader.
        expect(project.createdBy.id).to.equal(user.id)
        expect(project.createdBy.email).to.equal(user.email)
        expect(project.status).to.equal("ACTIVE")
    })

    it("is idempotent: the same idempotencyKey returns the same project", async function () {
        const idempotencyKey = newIdempotencyKey()
        const user = this.defaults.user!

        const project1 = await this.projectHelper.createProject(
            buildCreateProjectInput({ idempotencyKey }),
            user,
        )
        const project2 = await this.projectHelper.createProject(
            buildCreateProjectInput({ idempotencyKey }),
            user,
        )

        expect(project2.id).to.equal(project1.id)
        expect(project2.name).to.equal(project1.name)
    })

    it("updates name and description", async function () {
        await addDefaults(this, ["project"])
        const project = this.defaults.project!

        const newName = randomName("Renamed Project")
        const updated = await this.projectHelper.updateProject(
            buildUpdateProjectInput({
                objectId: project.id,
                fields: { name: newName, description: "Updated description." },
            }),
            this.defaults.user!,
        )

        expect(updated.id).to.equal(project.id)
        expect(updated.name).to.equal(newName)
        expect(updated.description).to.equal("Updated description.")
        expect(updated.status).to.equal("ACTIVE")
    })

    it("archives via doArchive", async function () {
        await addDefaults(this, ["project"])
        const project = this.defaults.project!

        const archived = await this.projectHelper.updateProject(
            buildUpdateProjectInput({ objectId: project.id, fields: { doArchive: true } }),
            this.defaults.user!,
        )
        expect(archived.status).to.equal("ARCHIVED")
        expect(archived.archivedAt).to.be.a("string")

        const unarchived = await this.projectHelper.updateProject(
            buildUpdateProjectInput({ objectId: project.id, fields: { doArchive: false } }),
            this.defaults.user!,
        )
        expect(unarchived.status).to.equal("ACTIVE")
        expect(unarchived.archivedAt).to.equal(null)
    })

    it("lists projects with filters", async function () {
        const user = this.defaults.user!
        const activeProject = await this.projectHelper.createAndGetProject(buildCreateProjectInput(), user)
        const archivedProject = await this.projectHelper.createAndGetProject(buildCreateProjectInput(), user)
        await this.projectHelper.updateProject(
            buildUpdateProjectInput({ objectId: archivedProject.id, fields: { doArchive: true } }),
            user,
        )

        const connection = {
            pagination: { first: 50 },
            sort: [{ fieldName: "name", direction: "asc" as const }],
        }

        const activeOnly = await this.projectHelper.getProjects({
            filters: { statuses: ["ACTIVE"] },
            connection,
        })
        const activeIds = activeOnly.nodes.map((node) => node?.id)
        expect(activeIds).to.include(activeProject.id)
        expect(activeIds).to.not.include(archivedProject.id)

        const byName = await this.projectHelper.getProjects({
            filters: { name: activeProject.name },
            connection,
        })
        expect(byName.nodes.map((node) => node?.id)).to.deep.equal([activeProject.id])
    })

    it("resolves membership user and project references", async function () {
        await addDefaults(this, ["project"])
        const project = this.defaults.project!

        const secondUser = await this.identityHelper.createAndGetUser(
            buildCreateUserInput({
                fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
            }),
        )

        const membership = await this.projectHelper.addProjectMember(
            buildAddProjectMemberInput({
                projectId: project.id,
                userId: secondUser.id,
                role: "EDITOR",
            }),
        )
        expect(membership.role).to.equal("EDITOR")
        expect(membership.user.id).to.equal(secondUser.id)
        expect(membership.project.id).to.equal(project.id)

        const reloaded = await this.projectHelper.getProjectById(project.id)
        expect(reloaded.memberships).to.have.length(2)
        const roles = reloaded.memberships.map((entry) => entry.role).sort()
        expect(roles).to.deep.equal(["EDITOR", "OWNER"])
    })
})
