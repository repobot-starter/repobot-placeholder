import { randomUUID } from "node:crypto"
import { expect } from "chai"
import { GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { FakeMailWrapper, setMailWrapperForTests } from "../../src/DependencyWrappers/MailWrapper/index.js"
import { executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { addDefaults, TestContext } from "../Utils/TestContext.js"

/** Creates another user in the default account (each caller is their own member). */
async function createUser(context: TestContext, email?: string): Promise<GqlUser> {
    return await context.identityHelper.createAndGetUser(
        buildCreateUserInput({
            fields: buildCreateUserFields({
                accountId: context.defaults.account!.id,
                ...(email === undefined ? {} : { email }),
            }),
        }),
    )
}

describe("Cfo", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
    })

    describe("membership bootstrap", function () {
        it("makes the first user the advisor and later users clients", async function () {
            const advisor = this.defaults.user!
            const first = await this.cfoHelper.getMyMembership(advisor)
            expect(first.role).to.equal("ADVISOR")
            expect(first.user.id).to.equal(advisor.id)

            // Repeat calls return the same membership.
            const again = await this.cfoHelper.getMyMembership(advisor)
            expect(again.id).to.equal(first.id)

            const walkIn = await createUser(this)
            const second = await this.cfoHelper.getMyMembership(walkIn)
            expect(second.role).to.equal("CLIENT")
        })

        it("rejects anonymous callers", async function () {
            await expect(
                executeGql(this.apolloServer, `query CfoMyMembership { cfoMyMembership { id } }`, {}, null),
            ).to.be.rejected
        })
    })

    describe("invites", function () {
        it("invites an email, sends the invite mail, and accepts on first touch", async function () {
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            try {
                const advisor = this.defaults.user!
                await this.cfoHelper.getMyMembership(advisor)

                const invite = await this.cfoHelper.inviteClient(advisor, {
                    idempotencyKey: randomUUID(),
                    email: "Client.One@Example.com",
                    siteName: "Clearline",
                    signInUrl: "https://clearline.example/login",
                })
                expect(invite.status).to.equal("PENDING")
                expect(invite.email).to.equal("client.one@example.com")
                expect(invite.role).to.equal("CLIENT")

                const message = mail.lastMessageTo("client.one@example.com")
                expect(message).to.not.equal(undefined)
                expect(message?.subject).to.contain("invited you to Clearline")
                expect(message?.html).to.contain("https://clearline.example/login")

                // The invitee signs up with the invited address and joins as a client.
                const invitee = await createUser(this, "client.one@example.com")
                const membership = await this.cfoHelper.getMyMembership(invitee)
                expect(membership.role).to.equal("CLIENT")

                const invites = await this.cfoHelper.listInvites(advisor)
                expect(invites.find((row) => row.id === invite.id)?.status).to.equal("ACCEPTED")
            } finally {
                setMailWrapperForTests(undefined)
            }
        })

        it("re-inviting a pending email returns the existing invite", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const first = await this.cfoHelper.inviteClient(advisor, {
                idempotencyKey: randomUUID(),
                email: "repeat@example.com",
                siteName: "Clearline",
                signInUrl: "https://clearline.example/login",
            })
            const second = await this.cfoHelper.inviteClient(advisor, {
                idempotencyKey: randomUUID(),
                email: "repeat@example.com",
                siteName: "Clearline",
                signInUrl: "https://clearline.example/login",
            })
            expect(second.id).to.equal(first.id)
        })

        it("revokes a pending invite; a revoked email joins as a plain client", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const invite = await this.cfoHelper.inviteClient(advisor, {
                idempotencyKey: randomUUID(),
                email: "revoked@example.com",
                siteName: "Clearline",
                signInUrl: "https://clearline.example/login",
            })
            const revoked = await this.cfoHelper.revokeInvite(advisor, invite.id)
            expect(revoked.status).to.equal("REVOKED")

            const invitee = await createUser(this, "revoked@example.com")
            const membership = await this.cfoHelper.getMyMembership(invitee)
            expect(membership.role).to.equal("CLIENT")
        })

        it("only the advisor may invite or list", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const client = await createUser(this)
            await this.cfoHelper.getMyMembership(client)

            const response = await executeGql(
                this.apolloServer,
                `mutation CfoInviteClient($input: CfoInviteClientInput!) {
                    cfoInviteClient(input: $input) { id }
                }`,
                {
                    input: {
                        idempotencyKey: randomUUID(),
                        email: "someone@example.com",
                        siteName: "Clearline",
                        signInUrl: "https://clearline.example/login",
                    },
                },
                { authSubject: `test:${client.id}`, email: client.email, userId: client.id },
            )
            expect(firstGqlError(response).code).to.equal("PERMISSION_DENIED")
        })
    })

    describe("per-user connections", function () {
        it("gives each client their own deterministic company", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const clientA = await createUser(this)
            const clientB = await createUser(this)

            const connectionA = await this.cfoHelper.connectMyBooks(clientA, {
                idempotencyKey: randomUUID(),
            })
            const connectionB = await this.cfoHelper.connectMyBooks(clientB, {
                idempotencyKey: randomUUID(),
                provider: "XERO",
            })
            expect(connectionA.realmId).to.not.equal(connectionB.realmId)
            expect(connectionB.provider).to.equal("XERO")

            // Idempotent per user: connecting again returns the same row.
            const retried = await this.cfoHelper.connectMyBooks(clientA, {
                idempotencyKey: randomUUID(),
            })
            expect(retried.id).to.equal(connectionA.id)

            // Connecting also enrolled both clients in the roster.
            const clients = await this.cfoHelper.listClients(advisor)
            const rosterUserIds = clients.map((client) => client.membership.user.id)
            expect(rosterUserIds).to.include(clientA.id)
            expect(rosterUserIds).to.include(clientB.id)
        })

        it("serves internally consistent per-client books to the advisor", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const client = await createUser(this)
            const connection = await this.cfoHelper.connectMyBooks(client, {
                idempotencyKey: randomUUID(),
            })

            const view = await this.cfoHelper.getClient(advisor, client.id)
            expect(view.connection?.id).to.equal(connection.id)
            expect(view.snapshot?.companyName).to.equal(connection.companyName)
            expect(view.profitAndLoss).to.have.length(13)
            expect(view.balanceSheet).to.have.length(13)
            for (const period of view.profitAndLoss) {
                expect(period.netIncomeMinorUnits).to.equal(
                    period.totalIncomeMinorUnits - period.totalExpensesMinorUnits,
                )
            }
            for (const period of view.balanceSheet) {
                expect(period.totalAssetsMinorUnits).to.equal(
                    period.totalLiabilitiesMinorUnits + period.totalEquityMinorUnits,
                )
            }
        })

        it("a client reads their own books but not another member's", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const clientA = await createUser(this)
            const clientB = await createUser(this)
            await this.cfoHelper.connectMyBooks(clientA, { idempotencyKey: randomUUID() })
            await this.cfoHelper.connectMyBooks(clientB, { idempotencyKey: randomUUID() })

            const own = await this.cfoHelper.getClient(clientA, clientA.id)
            expect(own.membership.user.id).to.equal(clientA.id)

            const response = await executeGql(
                this.apolloServer,
                `query CfoClient($clientUserId: Id!) {
                    cfoClient(clientUserId: $clientUserId) { membership { id } }
                }`,
                { clientUserId: clientB.id },
                { authSubject: `test:${clientA.id}`, email: clientA.email, userId: clientA.id },
            )
            expect(firstGqlError(response).code).to.equal("PERMISSION_DENIED")
        })

        it("disconnecting clears the client's books", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const client = await createUser(this)
            await this.cfoHelper.connectMyBooks(client, { idempotencyKey: randomUUID() })
            expect(await this.cfoHelper.disconnectMyBooks(client)).to.equal(true)

            const view = await this.cfoHelper.getClient(advisor, client.id)
            expect(view.connection ?? null).to.equal(null)
            expect(view.snapshot ?? null).to.equal(null)
            expect(view.profitAndLoss).to.have.length(0)
        })
    })

    describe("statement export", function () {
        it("exports a client's statements for the advisor as a PRIVATE xlsx", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const client = await createUser(this)
            await this.cfoHelper.connectMyBooks(client, { idempotencyKey: randomUUID() })

            const upload = await this.cfoHelper.exportClientStatementsXlsx(advisor, {
                idempotencyKey: randomUUID(),
                clientUserId: client.id,
            })
            expect(upload.status).to.equal("READY")
            expect(upload.visibility).to.equal("PRIVATE")
            expect(upload.contentType).to.equal(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            expect(upload.fileName).to.match(/-all-\d{4}-\d{2}-\d{2}\.xlsx$/)
        })

        it("fails FAILED_PRECONDITION for a member without a connection", async function () {
            const advisor = this.defaults.user!
            await this.cfoHelper.getMyMembership(advisor)
            const client = await createUser(this)
            await this.cfoHelper.getMyMembership(client)

            const response = await executeGql(
                this.apolloServer,
                `mutation CfoExportClientStatementsXlsx($input: CfoExportClientStatementsXlsxInput!) {
                    cfoExportClientStatementsXlsx(input: $input) { id }
                }`,
                { input: { idempotencyKey: randomUUID(), clientUserId: client.id } },
                { authSubject: `test:${advisor.id}`, email: advisor.email, userId: advisor.id },
            )
            expect(firstGqlError(response).code).to.equal("FAILED_PRECONDITION")
        })
    })
})
