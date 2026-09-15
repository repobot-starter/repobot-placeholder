import { expect } from "chai"
import * as sinon from "sinon"
import { projectMembershipService } from "../../src/Services/Project/ProjectMembershipService.js"
import { userService } from "../../src/Services/Identity/UserService.js"
import { buildCreateProjectInput } from "../Utils/Factories/ProjectFactory.js"
import { addDefaults } from "../Utils/TestContext.js"

/**
 * The N+1 guard for the exemplar relations. Every relation a field resolver
 * hydrates must go through a per-request dataloader (docs/graphql.md): a
 * page of N parents issues ONE batched query per relation, never one per
 * row. This test resolves a page of projects with their memberships and
 * users and asserts the batch shape at the service boundary — if someone
 * reroutes a field resolver to a per-row service call, the spies catch it.
 * Copy this pattern for new one-to-many relations.
 */
describe("Dataloader batching", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
    })

    it("resolves a page of projects' memberships in one grouped query", async function () {
        const user = this.defaults.user!
        const projectIds: string[] = []
        for (let index = 0; index < 3; index += 1) {
            const project = await this.projectHelper.createProject(buildCreateProjectInput(), user)
            projectIds.push(project.id)
        }

        const groupedLoad = sinon.spy(projectMembershipService, "orderedBatchLoadMembershipsByProjectIds")
        const perRowLoad = sinon.spy(projectMembershipService, "getMembershipsForProject")
        const userBatchLoad = sinon.spy(userService, "orderedBatchLoadUsersByIds")

        const connection = await this.projectHelper.getProjects({
            connection: {
                pagination: { first: 50 },
                sort: [{ fieldName: "name", direction: "asc" as const }],
            },
        })
        const nodes = connection.nodes.filter(
            (node): node is NonNullable<typeof node> => node != null && projectIds.includes(node.id),
        )
        expect(nodes).to.have.length(3)
        for (const node of nodes) {
            // Each project got its own memberships (the OWNER row from the
            // ProjectCreated subscriber), so the grouped loader kept the
            // per-key alignment right.
            expect(node.memberships).to.have.length(1)
            expect(node.memberships[0].user.id).to.equal(user.id)
            expect(node.createdBy.id).to.equal(user.id)
        }

        // The batch shape: one grouped memberships query covering every
        // project on the page — and zero per-row loads.
        expect(groupedLoad.callCount).to.equal(1)
        expect(groupedLoad.firstCall.args[0]).to.have.length(connection.nodes.length)
        expect(perRowLoad.callCount).to.equal(0)

        // Users batch too: createdBy resolves in one tick, membership.user
        // in the next (after memberships load), so at most two batches —
        // never one per row.
        expect(userBatchLoad.callCount).to.be.at.most(2)
    })
})
