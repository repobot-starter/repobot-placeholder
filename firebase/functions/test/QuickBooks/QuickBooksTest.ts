import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { expect } from "chai"
import {
    OpenAiModelTurn,
    OpenAiModelTurnCallbacks,
    OpenAiModelTurnRequest,
    OpenAiWrapper,
    setOpenAiWrapperForTests,
} from "../../src/DependencyWrappers/OpenAiWrapper/index.js"
import { FakeIntuitWrapper } from "../../src/DependencyWrappers/IntuitWrapper/FakeIntuitWrapper.js"
import { setIntuitWrapperForTests } from "../../src/DependencyWrappers/IntuitWrapper/index.js"
import { GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { aiChatService } from "../../src/Services/Ai/AiChatService.js"
import { executeAiChatTool } from "../../src/Services/Ai/AiChatTools.js"
import { AiChatResponse } from "../../src/Services/Ai/AiChatTypes.js"
import {
    SIMULATED_COMPANY_NAME,
    SIMULATED_STATEMENT_MONTHS,
    SimulatedCompanySnapshot,
} from "../../src/Services/QuickBooks/QuickBooksSimulation.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { RpcError } from "../../src/Utils/RpcError.js"
import { asUser, executeGql, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { QuickBooksTestHelper } from "./QuickBooksTestHelper.js"
import { addDefaults } from "../Utils/TestContext.js"

function connectInput(): { idempotencyKey: string } {
    return { idempotencyKey: randomUUID() }
}

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10)

describe("QuickBooks", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
    })

    describe("connection lifecycle (QUICKBOOKS_MODE=local)", function () {
        it("starts disconnected", async function () {
            const status = await this.quickBooksHelper.getStatus()
            expect(status.connected).to.equal(false)
            expect(status.connection ?? null).to.equal(null)
        })

        // The gate throws from the Apollo request pipeline (not a resolver),
        // so executeOperation rejects; over HTTP the client still receives a
        // GraphQL error with extensions.code UNAUTHENTICATED via formatError.
        it("rejects anonymous callers (the operations are auth-gated)", async function () {
            await expect(
                executeGql(
                    this.apolloServer,
                    `query QuickBooksStatus { quickBooksStatus { connected } }`,
                    {},
                    null,
                ),
            ).to.be.rejectedWith(RpcError, "This operation requires an authenticated caller.")
        })

        it("connects instantly to the simulated sample company", async function () {
            const connection = await this.quickBooksHelper.connectQuickBooks(
                connectInput(),
                this.defaults.user!,
            )
            expect(connection.mode).to.equal("LOCAL")
            expect(connection.provider).to.equal("QUICKBOOKS")
            expect(connection.companyName).to.equal(SIMULATED_COMPANY_NAME)
            expect(connection.realmId).to.have.length.greaterThan(0)

            const status = await this.quickBooksHelper.getStatus()
            expect(status.connected).to.equal(true)
            expect(status.connection?.id).to.equal(connection.id)
        })

        it("connects Xero as a provider and serves the same simulated company", async function () {
            const connection = await this.quickBooksHelper.connectQuickBooks(
                { ...connectInput(), provider: "XERO" },
                this.defaults.user!,
            )
            expect(connection.provider).to.equal("XERO")
            expect(connection.companyName).to.equal(SIMULATED_COMPANY_NAME)

            const status = await this.quickBooksHelper.getStatus()
            expect(status.connection?.provider).to.equal("XERO")

            const snapshot = await this.quickBooksHelper.getCompanySnapshot()
            expect(snapshot.companyName).to.equal(SIMULATED_COMPANY_NAME)
        })

        it("is idempotent, and connecting again returns the existing connection", async function () {
            const user = this.defaults.user!
            const input = connectInput()
            const first = await this.quickBooksHelper.connectQuickBooks(input, user)
            const retried = await this.quickBooksHelper.connectQuickBooks(input, user)
            expect(retried.id).to.equal(first.id)

            const again = await this.quickBooksHelper.connectQuickBooks(connectInput(), user)
            expect(again.id).to.equal(first.id)
        })

        it("requires a user principal to connect", async function () {
            const response = await executeGql(
                this.apolloServer,
                `mutation ConnectQuickBooks($input: ConnectQuickBooksInput!) {
                    connectQuickBooks(input: $input) { id }
                }`,
                { input: connectInput() },
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("UNAUTHENTICATED")
        })

        it("disconnects and the data queries fail again", async function () {
            await this.quickBooksHelper.connectQuickBooks(connectInput(), this.defaults.user!)
            expect(await this.quickBooksHelper.disconnectQuickBooks()).to.equal(true)

            const status = await this.quickBooksHelper.getStatus()
            expect(status.connected).to.equal(false)

            const response = await executeGql(
                this.apolloServer,
                `query QuickBooksCompanySnapshot { quickBooksCompanySnapshot { companyName } }`,
                {},
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("FAILED_PRECONDITION")
        })

        it("fails FAILED_PRECONDITION on data queries before connecting", async function () {
            const response = await executeGql(
                this.apolloServer,
                `query QuickBooksCustomers { quickBooksCustomers { id } }`,
                {},
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("FAILED_PRECONDITION")
        })
    })

    describe("simulated company data (QUICKBOOKS_MODE=local)", function () {
        beforeEach(async function () {
            await this.quickBooksHelper.connectQuickBooks(connectInput(), this.defaults.user!)
        })

        it("serves a deterministic, internally consistent sample company", async function () {
            const snapshot = await this.quickBooksHelper.getCompanySnapshot()
            const invoices = await this.quickBooksHelper.getInvoices()
            const customers = await this.quickBooksHelper.getCustomers()

            expect(snapshot.companyName).to.equal(SIMULATED_COMPANY_NAME)
            expect(snapshot.currency).to.equal("usd")
            expect(invoices).to.have.length(30)
            expect(customers).to.have.length(12)
            expect(snapshot.customerCount).to.equal(12)

            // The snapshot's totals and counts are exactly the invoice list's.
            const byStatus = (status: string) => invoices.filter((invoice) => invoice.status === status)
            expect(snapshot.paidInvoiceCount).to.equal(byStatus("PAID").length)
            expect(snapshot.openInvoiceCount).to.equal(byStatus("OPEN").length)
            expect(snapshot.overdueInvoiceCount).to.equal(byStatus("OVERDUE").length)
            expect(snapshot.paidInvoiceCount).to.be.greaterThan(0)
            expect(snapshot.openInvoiceCount).to.be.greaterThan(0)
            expect(snapshot.overdueInvoiceCount).to.be.greaterThan(0)

            const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0)
            expect(snapshot.revenueMinorUnits).to.equal(
                sum(byStatus("PAID").map((invoice) => invoice.totalMinorUnits)),
            )
            expect(snapshot.overdueMinorUnits).to.equal(
                sum(byStatus("OVERDUE").map((invoice) => invoice.balanceMinorUnits)),
            )
            expect(snapshot.outstandingMinorUnits).to.equal(
                sum(
                    invoices
                        .filter((invoice) => invoice.status !== "PAID")
                        .map((invoice) => invoice.balanceMinorUnits),
                ),
            )

            // Statuses stay honest against the calendar, whenever tests run.
            for (const invoice of byStatus("PAID")) {
                expect(invoice.balanceMinorUnits).to.equal(0)
            }
            for (const invoice of byStatus("OVERDUE")) {
                expect(invoice.balanceMinorUnits).to.be.greaterThan(0)
                expect(invoice.dueDate < todayIsoDate()).to.equal(true)
            }
            for (const invoice of byStatus("OPEN")) {
                expect(invoice.balanceMinorUnits).to.be.greaterThan(0)
                expect(invoice.dueDate >= todayIsoDate()).to.equal(true)
            }

            // Customer open balances roll up from their invoices.
            for (const customer of customers) {
                expect(customer.openBalanceMinorUnits).to.equal(
                    sum(
                        invoices
                            .filter((invoice) => invoice.customerId === customer.id)
                            .map((invoice) => invoice.balanceMinorUnits),
                    ),
                )
            }
        })

        it("serves thirteen trailing months of internally consistent P&L", async function () {
            const periods = await this.quickBooksHelper.getProfitAndLoss()
            expect(periods).to.have.length(SIMULATED_STATEMENT_MONTHS)

            // Months are consecutive, oldest first, ending on the current month.
            const currentMonth = new Date().toISOString().slice(0, 7)
            expect(periods[periods.length - 1].month).to.equal(currentMonth)
            const months = periods.map((period) => period.month)
            expect([...months].sort()).to.deep.equal(months)
            expect(new Set(months).size).to.equal(SIMULATED_STATEMENT_MONTHS)

            const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0)
            for (const period of periods) {
                expect(period.incomeLines.length).to.be.greaterThan(0)
                expect(period.expenseLines.length).to.be.greaterThan(0)
                expect(period.totalIncomeMinorUnits).to.equal(
                    sum(period.incomeLines.map((line) => line.minorUnits)),
                )
                expect(period.totalExpensesMinorUnits).to.equal(
                    sum(period.expenseLines.map((line) => line.minorUnits)),
                )
                expect(period.netIncomeMinorUnits).to.equal(
                    period.totalIncomeMinorUnits - period.totalExpensesMinorUnits,
                )
            }
        })

        it("serves balance sheets that satisfy the accounting identity every month", async function () {
            const periods = await this.quickBooksHelper.getBalanceSheet()
            const pnl = await this.quickBooksHelper.getProfitAndLoss()
            expect(periods).to.have.length(SIMULATED_STATEMENT_MONTHS)
            expect(periods.map((period) => period.month)).to.deep.equal(pnl.map((period) => period.month))

            const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0)
            for (const period of periods) {
                expect(period.totalAssetsMinorUnits).to.equal(
                    sum(period.assetLines.map((line) => line.minorUnits)),
                )
                expect(period.totalLiabilitiesMinorUnits).to.equal(
                    sum(period.liabilityLines.map((line) => line.minorUnits)),
                )
                expect(period.totalEquityMinorUnits).to.equal(
                    sum(period.equityLines.map((line) => line.minorUnits)),
                )
                // Assets = liabilities + equity, exactly.
                expect(period.totalAssetsMinorUnits).to.equal(
                    period.totalLiabilitiesMinorUnits + period.totalEquityMinorUnits,
                )
            }
        })

        it("exports statements as a PRIVATE xlsx upload for the caller", async function () {
            const upload = await this.quickBooksHelper.exportStatementsXlsx(
                { idempotencyKey: randomUUID() },
                this.defaults.user!,
            )
            expect(upload.status).to.equal("READY")
            expect(upload.visibility).to.equal("PRIVATE")
            expect(upload.contentType).to.equal(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            expect(upload.fileName).to.match(/^bluebird-design-co-all-\d{4}-\d{2}-\d{2}\.xlsx$/)
            expect(upload.sizeBytes).to.be.greaterThan(0)

            const single = await this.quickBooksHelper.exportStatementsXlsx(
                { idempotencyKey: randomUUID(), statement: "PROFIT_AND_LOSS" },
                this.defaults.user!,
            )
            expect(single.fileName).to.contain("profit-and-loss")
        })

        it("fails FAILED_PRECONDITION on statements before connecting", async function () {
            await this.quickBooksHelper.disconnectQuickBooks()
            const response = await executeGql(
                this.apolloServer,
                `query QuickBooksProfitAndLoss { quickBooksProfitAndLoss { month } }`,
                {},
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("FAILED_PRECONDITION")
        })

        it("filters invoices by status", async function () {
            const overdue = await this.quickBooksHelper.getInvoices({
                filters: { statuses: ["OVERDUE"] },
            })
            expect(overdue.length).to.be.greaterThan(0)
            expect(overdue.every((invoice) => invoice.status === "OVERDUE")).to.equal(true)

            const openAndOverdue = await this.quickBooksHelper.getInvoices({
                filters: { statuses: ["OPEN", "OVERDUE"] },
            })
            const all = await this.quickBooksHelper.getInvoices()
            expect(openAndOverdue.length).to.equal(all.filter((invoice) => invoice.status !== "PAID").length)
        })
    })

    describe("intuit mode (QUICKBOOKS_MODE=intuit)", function () {
        const REDIRECT_URI = "https://books.example.test/books"
        let fakeIntuit: FakeIntuitWrapper

        beforeEach(function () {
            fakeIntuit = new FakeIntuitWrapper()
            setIntuitWrapperForTests(fakeIntuit)
            process.env.QUICKBOOKS_MODE = "intuit"
            process.env.QUICKBOOKS_CLIENT_ID = "test-intuit-client-id"
            process.env.QUICKBOOKS_CLIENT_SECRET = "test-intuit-client-secret"
            resetValidatedEnvForTests()
        })

        afterEach(function () {
            setIntuitWrapperForTests(undefined)
            delete process.env.QUICKBOOKS_MODE
            delete process.env.QUICKBOOKS_CLIENT_ID
            delete process.env.QUICKBOOKS_CLIENT_SECRET
            resetValidatedEnvForTests()
        })

        /** Runs the begin half and returns the state Intuit would echo back. */
        async function beginAndExtractState(helper: QuickBooksTestHelper, user: GqlUser): Promise<string> {
            const authorizationUrl = await helper.beginAuthorization(REDIRECT_URI, user)
            const url = new URL(authorizationUrl)
            expect(url.searchParams.get("redirect_uri")).to.equal(REDIRECT_URI)
            const state = url.searchParams.get("state")
            expect(state).to.be.a("string").with.length.greaterThan(0)
            return state as string
        }

        it("refuses the instant connects with a pointer to the OAuth flow", async function () {
            const response = await executeGql(
                this.apolloServer,
                `mutation ConnectQuickBooks($input: ConnectQuickBooksInput!) {
                    connectQuickBooks(input: $input) { id }
                }`,
                { input: connectInput() },
                asUser(this.defaults.user!),
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("FAILED_PRECONDITION")
            expect(error.message).to.contain("beginQuickBooksAuthorization")
        })

        it("reports the INTUIT mode on status so clients offer the OAuth connect", async function () {
            const status = await this.quickBooksHelper.getStatus()
            expect(status.mode).to.equal("INTUIT")
            expect(status.connected).to.equal(false)
        })

        it("connects the live company over the OAuth round trip and serves its data", async function () {
            const user = this.defaults.user!
            const state = await beginAndExtractState(this.quickBooksHelper, user)

            const connection = await this.quickBooksHelper.completeAuthorization(
                {
                    idempotencyKey: randomUUID(),
                    code: "auth-code-1",
                    state,
                    realmId: FakeIntuitWrapper.REALM_ID,
                    redirectUri: REDIRECT_URI,
                },
                user,
            )
            expect(connection.mode).to.equal("INTUIT")
            expect(connection.provider).to.equal("QUICKBOOKS")
            expect(connection.realmId).to.equal(FakeIntuitWrapper.REALM_ID)
            expect(connection.companyName).to.equal(FakeIntuitWrapper.COMPANY_NAME)
            expect(fakeIntuit.exchangedCodes).to.deep.equal([
                { code: "auth-code-1", redirectUri: REDIRECT_URI },
            ])

            // Reads now serve the live company through the wrapper — clearly
            // distinct from the simulation's Bluebird Design Co.
            const snapshot = await this.quickBooksHelper.getCompanySnapshot()
            expect(snapshot.companyName).to.equal(FakeIntuitWrapper.COMPANY_NAME)
            expect(snapshot.customerCount).to.equal(2)
            expect(snapshot.paidInvoiceCount).to.equal(1)
            expect(snapshot.openInvoiceCount).to.equal(1)
            expect(snapshot.revenueMinorUnits).to.equal(98_000)
            expect(snapshot.outstandingMinorUnits).to.equal(145_000)

            const pnl = await this.quickBooksHelper.getProfitAndLoss()
            expect(pnl.map((period) => period.month)).to.deep.equal(["2026-07", "2026-08"])
            expect(pnl[0].netIncomeMinorUnits).to.equal(500_000)

            const upload = await this.quickBooksHelper.exportStatementsXlsx(
                { idempotencyKey: randomUUID() },
                user,
            )
            expect(upload.fileName).to.match(/^live-books-inc-all-\d{4}-\d{2}-\d{2}\.xlsx$/)
        })

        it("rejects a tampered state", async function () {
            const user = this.defaults.user!
            const state = await beginAndExtractState(this.quickBooksHelper, user)
            const tampered = state.slice(0, -2) + (state.endsWith("00") ? "11" : "00")

            const response = await executeGql(
                this.apolloServer,
                `mutation CompleteQuickBooksAuthorization($input: CompleteQuickBooksAuthorizationInput!) {
                    completeQuickBooksAuthorization(input: $input) { id }
                }`,
                {
                    input: {
                        idempotencyKey: randomUUID(),
                        code: "auth-code-1",
                        state: tampered,
                        realmId: FakeIntuitWrapper.REALM_ID,
                        redirectUri: REDIRECT_URI,
                    },
                },
                asUser(user),
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("INVALID_ARGUMENT")
            expect(fakeIntuit.exchangedCodes).to.deep.equal([])
        })

        it("refreshes expiring access tokens before reads and persists the rotation", async function () {
            const user = this.defaults.user!
            const state = await beginAndExtractState(this.quickBooksHelper, user)
            // The exchange mints an already-expiring access token, so the
            // first read must refresh before touching the API.
            fakeIntuit.nextAccessTokenExpiresAt = new Date(Date.now() + 1000)
            await this.quickBooksHelper.completeAuthorization(
                {
                    idempotencyKey: randomUUID(),
                    code: "auth-code-1",
                    state,
                    realmId: FakeIntuitWrapper.REALM_ID,
                    redirectUri: REDIRECT_URI,
                },
                user,
            )

            await this.quickBooksHelper.getCustomers()
            expect(fakeIntuit.refreshedTokens).to.deep.equal(["fake-refresh-1"])

            // The rotated tokens were persisted: the next read is fresh.
            await this.quickBooksHelper.getCustomers()
            expect(fakeIntuit.refreshedTokens).to.deep.equal(["fake-refresh-1"])
        })
    })

    describe("advisor tools (AiChatTools)", function () {
        it("returns a JSON error payload when QuickBooks is not connected", async function () {
            const output = await executeAiChatTool("quickbooks_company_snapshot", "{}")
            const parsed = JSON.parse(output) as { error?: string }
            expect(parsed.error).to.contain("not connected")
        })

        it("serves the snapshot, invoices, and customers once connected", async function () {
            await this.quickBooksHelper.connectQuickBooks(connectInput(), this.defaults.user!)

            const snapshot = JSON.parse(
                await executeAiChatTool("quickbooks_company_snapshot", "{}"),
            ) as SimulatedCompanySnapshot
            expect(snapshot.companyName).to.equal(SIMULATED_COMPANY_NAME)
            expect(snapshot.revenueMinorUnits).to.be.greaterThan(0)

            const overdue = JSON.parse(
                await executeAiChatTool("quickbooks_list_invoices", JSON.stringify({ status: "OVERDUE" })),
            ) as { invoices: { status: string }[] }
            expect(overdue.invoices.length).to.equal(snapshot.overdueInvoiceCount)
            expect(overdue.invoices.every((invoice) => invoice.status === "OVERDUE")).to.equal(true)

            const customers = JSON.parse(await executeAiChatTool("quickbooks_list_customers", "{}")) as {
                customers: unknown[]
            }
            expect(customers.customers).to.have.length(snapshot.customerCount)

            const pnl = JSON.parse(await executeAiChatTool("quickbooks_profit_and_loss", "{}")) as {
                periods: { netIncomeMinorUnits: number }[]
            }
            expect(pnl.periods).to.have.length(SIMULATED_STATEMENT_MONTHS)

            const balanceSheet = JSON.parse(await executeAiChatTool("quickbooks_balance_sheet", "{}")) as {
                periods: { totalAssetsMinorUnits: number }[]
            }
            expect(balanceSheet.periods).to.have.length(SIMULATED_STATEMENT_MONTHS)
            expect(balanceSheet.periods[0].totalAssetsMinorUnits).to.be.greaterThan(0)
        })

        it("feeds tool output back through the chat tool loop", async function () {
            await this.quickBooksHelper.connectQuickBooks(connectInput(), this.defaults.user!)

            const fakeOpenAi = new ScriptedOpenAiWrapper()
            setOpenAiWrapperForTests(fakeOpenAi)
            try {
                // Turn 1: the model asks for the company snapshot.
                fakeOpenAi.scriptedTurns.push({
                    play: (callbacks) => {
                        callbacks.onResponseCreated("resp_1")
                        callbacks.onFunctionCallCreated({
                            callId: "call_1",
                            name: "quickbooks_company_snapshot",
                            argumentsJson: "{}",
                        })
                    },
                    turn: {
                        responseId: "resp_1",
                        functionCalls: [
                            { callId: "call_1", name: "quickbooks_company_snapshot", argumentsJson: "{}" },
                        ],
                    },
                })
                // Turn 2: with the numbers in hand, the model answers.
                fakeOpenAi.scriptedTurns.push({
                    play: (callbacks) => {
                        callbacks.onResponseCreated("resp_2")
                        callbacks.onAssistantTextDelta("Revenue is healthy.")
                    },
                    turn: { responseId: "resp_2", functionCalls: [] },
                })

                const snapshots: AiChatResponse[] = []
                const errors: string[] = []
                await withAiMode("openai", async () => {
                    await aiChatService.streamChatResponse(
                        { id: randomUUID(), message: "How is revenue?" },
                        {
                            stream: (response) =>
                                snapshots.push(JSON.parse(JSON.stringify(response)) as AiChatResponse),
                            sendError: (message) => errors.push(message),
                        },
                    )
                })

                expect(errors).to.deep.equal([])
                // The tool ran and its real output went back to the model.
                expect(fakeOpenAi.turnRequests).to.have.length(2)
                const toolOutput = fakeOpenAi.turnRequests[1].input[0] as {
                    call_id: string
                    output: string
                }
                expect(toolOutput.call_id).to.equal("call_1")
                const parsed = JSON.parse(toolOutput.output) as SimulatedCompanySnapshot
                expect(parsed.companyName).to.equal(SIMULATED_COMPANY_NAME)

                const final = snapshots[snapshots.length - 1]
                const functionCall = final.responseItems.find(
                    (item) => item.functionCall !== undefined,
                )?.functionCall
                expect(functionCall?.name).to.equal("quickbooks_company_snapshot")
                expect(functionCall?.status).to.equal("COMPLETED")
                expect(functionCall?.output).to.equal(toolOutput.output)
            } finally {
                setOpenAiWrapperForTests(undefined)
            }
        })
    })
})

/**
 * Runs a block with AI_MODE temporarily overridden (tests default to the
 * schema's "openai" only when set explicitly); mirrors test/Ai/AiTest.ts.
 */
async function withAiMode(mode: string, block: () => Promise<void>): Promise<void> {
    const original = process.env.AI_MODE
    process.env.AI_MODE = mode
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        if (original === undefined) {
            delete process.env.AI_MODE
        } else {
            process.env.AI_MODE = original
        }
        resetValidatedEnvForTests()
    }
}

/** One scripted model turn: emit the given callbacks, then return the turn. */
interface ScriptedTurn {
    play: (callbacks: OpenAiModelTurnCallbacks) => void
    turn: OpenAiModelTurn
}

class ScriptedOpenAiWrapper implements OpenAiWrapper {
    turnRequests: OpenAiModelTurnRequest[] = []
    scriptedTurns: ScriptedTurn[] = []

    async streamModelTurn(
        request: OpenAiModelTurnRequest,
        callbacks: OpenAiModelTurnCallbacks,
    ): Promise<OpenAiModelTurn> {
        this.turnRequests.push(request)
        const scripted = this.scriptedTurns.shift()
        assert(scripted !== undefined, "ScriptedOpenAiWrapper: no scripted turn left")
        scripted.play(callbacks)
        return scripted.turn
    }

    async createRealtimeClientSecret(): Promise<never> {
        throw new Error("Not scripted in this suite.")
    }

    async createEmbeddings(): Promise<never> {
        throw new Error("Not scripted in this suite.")
    }
}
