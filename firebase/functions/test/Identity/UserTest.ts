import { expect } from "chai"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { buildUpdateUserInput } from "../Utils/Factories/UserFactory.js"
import { newIdempotencyKey, randomName } from "../Utils/Factories/RandomValues.js"
import { addDefaults } from "../Utils/TestContext.js"

describe("Users", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account"])
    })

    it("creates a user and hydrates its account through the dataloader", async function () {
        const input = buildCreateUserInput({
            fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
        })
        const user = await this.identityHelper.createAndGetUser(input)

        expect(user.id).to.match(/^user_/)
        expect(user.email).to.equal(input.fields.email.toLowerCase())
        expect(user.displayName).to.equal(input.fields.displayName)
        expect(user.status).to.equal("ACTIVE")
        expect(user.createdTime).to.be.a("string")
        expect(user.account?.id).to.equal(this.defaults.account!.id)
    })

    it("is idempotent: the same idempotencyKey returns the same row", async function () {
        const idempotencyKey = newIdempotencyKey()
        const firstInput = buildCreateUserInput({
            idempotencyKey,
            fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
        })
        const secondInput = buildCreateUserInput({
            idempotencyKey,
            fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
        })

        const user1 = await this.identityHelper.createUser(firstInput)
        const user2 = await this.identityHelper.createUser(secondInput)

        expect(user2.id).to.equal(user1.id)
        // The second request's fields were ignored; the original row wins.
        expect(user2.email).to.equal(user1.email)
        expect(user2.displayName).to.equal(firstInput.fields.displayName)
    })

    it("updates displayName and status", async function () {
        const user = await this.identityHelper.createAndGetUser(
            buildCreateUserInput({
                fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
            }),
        )

        const newDisplayName = randomName("Renamed")
        const updated = await this.identityHelper.updateUser(
            buildUpdateUserInput({
                objectId: user.id,
                fields: { displayName: newDisplayName, status: "DISABLED" },
            }),
        )

        expect(updated.id).to.equal(user.id)
        expect(updated.displayName).to.equal(newDisplayName)
        expect(updated.status).to.equal("DISABLED")
        // Untouched fields survive partial updates.
        expect(updated.email).to.equal(user.email)
    })

    it("lists users with filters", async function () {
        const accountId = this.defaults.account!.id
        const activeUser = await this.identityHelper.createAndGetUser(
            buildCreateUserInput({ fields: buildCreateUserFields({ accountId }) }),
        )
        const disabledUser = await this.identityHelper.createAndGetUser(
            buildCreateUserInput({ fields: buildCreateUserFields({ accountId }) }),
        )
        await this.identityHelper.updateUser(
            buildUpdateUserInput({ objectId: disabledUser.id, fields: { status: "DISABLED" } }),
        )

        const connection = {
            pagination: { first: 50 },
            sort: [{ fieldName: "email", direction: "asc" as const }],
        }

        const byEmail = await this.identityHelper.getUsers({
            filters: { email: activeUser.email },
            connection,
        })
        expect(byEmail.nodes.map((node) => node?.id)).to.deep.equal([activeUser.id])

        const disabledOnly = await this.identityHelper.getUsers({
            filters: { statuses: ["DISABLED"] },
            connection,
        })
        expect(disabledOnly.nodes.map((node) => node?.id)).to.include(disabledUser.id)
        expect(disabledOnly.nodes.map((node) => node?.id)).to.not.include(activeUser.id)
    })

    it("paginates users with cursors", async function () {
        const accountId = this.defaults.account!.id
        for (let index = 0; index < 3; index += 1) {
            await this.identityHelper.createUser(
                buildCreateUserInput({ fields: buildCreateUserFields({ accountId }) }),
            )
        }

        const sort = [{ fieldName: "email", direction: "asc" as const }]
        const firstPage = await this.identityHelper.getUsers({
            connection: { pagination: { first: 2 }, sort },
        })
        expect(firstPage.nodes).to.have.length(2)
        expect(firstPage.pageInfo.hasNextPage).to.equal(true)
        expect(firstPage.pageInfo.endCursor).to.be.a("string")

        const secondPage = await this.identityHelper.getUsers({
            connection: { pagination: { first: 50, after: firstPage.pageInfo.endCursor }, sort },
        })
        expect(secondPage.pageInfo.hasPreviousPage).to.equal(true)
        const firstPageIds = firstPage.nodes.map((node) => node?.id)
        for (const node of secondPage.nodes) {
            expect(firstPageIds).to.not.include(node?.id)
        }
    })
})
