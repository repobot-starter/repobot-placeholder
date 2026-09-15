import { expect } from "chai"
import { GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { storageService } from "../../src/Services/Storage/StorageService.js"
import { XLSX_CONTENT_TYPE, xlsxService } from "../../src/Services/Xlsx/XlsxService.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { addDefaults, TestContext } from "../Utils/TestContext.js"

/** ISO yyyy-mm for `monthsAgo` calendar months before the current month (UTC). */
function isoMonth(monthsAgo: number): string {
    const now = new Date()
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1))
    return date.toISOString().slice(0, 7)
}

async function connectBooks(context: TestContext, user: GqlUser): Promise<void> {
    await context.quickBooksHelper.connectMyBooks(
        { idempotencyKey: `books-${user.id}`, provider: "QUICKBOOKS" },
        user,
    )
}

describe("Flow", function () {
    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
    })

    describe("templates", function () {
        it("creates an empty grid with the months spelled out", async function () {
            const template = await this.flowHelper.createTemplate(this.defaults.user!, {
                idempotencyKey: "tpl-1",
                name: "FY plan",
                startMonth: "2027-11",
                monthCount: 4,
            })
            expect(template.name).to.equal("FY plan")
            expect(template.currency).to.equal("usd")
            expect(template.months).to.deep.equal(["2027-11", "2027-12", "2028-01", "2028-02"])
            expect(template.lines).to.deep.equal([])
        })

        it("replays the idempotency key instead of duplicating the template", async function () {
            const input = {
                idempotencyKey: "tpl-same",
                name: "Plan",
                startMonth: "2027-01",
                monthCount: 3,
            }
            const first = await this.flowHelper.createTemplate(this.defaults.user!, input)
            const second = await this.flowHelper.createTemplate(this.defaults.user!, input)
            expect(second.id).to.equal(first.id)
            expect(await this.flowHelper.listTemplates(this.defaults.user!)).to.have.length(1)
        })

        it("renames and deletes, lines included", async function () {
            const user = this.defaults.user!
            const template = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-del",
                name: "Old name",
                startMonth: "2027-01",
                monthCount: 2,
            })
            await this.flowHelper.addLine(user, {
                idempotencyKey: "line-del",
                templateId: template.id,
                label: "Rent",
                section: "EXPENSES",
            })
            const renamed = await this.flowHelper.renameTemplate(user, template.id, "New name")
            expect(renamed.name).to.equal("New name")

            expect(await this.flowHelper.deleteTemplate(user, template.id)).to.equal(true)
            expect(await this.flowHelper.listTemplates(user)).to.deep.equal([])
        })

        it("rejects out-of-range grids and scopes templates to their owner", async function () {
            const user = this.defaults.user!
            await expect(
                this.flowHelper.createTemplate(user, {
                    idempotencyKey: "tpl-big",
                    name: "Too big",
                    startMonth: "2027-01",
                    monthCount: 25,
                }),
            ).to.be.rejected

            const template = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-own",
                name: "Mine",
                startMonth: "2027-01",
                monthCount: 2,
            })
            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            expect(await this.flowHelper.listTemplates(stranger)).to.deep.equal([])
            await expect(this.flowHelper.getTemplate(stranger, template.id)).to.be.rejectedWith(
                "no such template",
            )
            await expect(this.flowHelper.deleteTemplate(stranger, template.id)).to.be.rejectedWith(
                "no such template",
            )
        })
    })

    describe("live actuals in the grid", function () {
        it("serves linkable categories only once the books are connected", async function () {
            const user = this.defaults.user!
            const before = await this.flowHelper.getLinkableCategories(user)
            expect(before.incomeCategories).to.deep.equal([])
            expect(before.expenseCategories).to.deep.equal([])

            await connectBooks(this, user)
            const after = await this.flowHelper.getLinkableCategories(user)
            expect(after.incomeCategories).to.contain("Design services")
            expect(after.expenseCategories).to.contain("Payroll")
        })

        it("auto-populates actuals for linked rows and computes variance; future months stay null", async function () {
            const user = this.defaults.user!
            await connectBooks(this, user)

            // Two past months (including current) and two future months.
            const template = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-grid",
                name: "Grid",
                startMonth: isoMonth(1),
                monthCount: 4,
            })
            const linked = await this.flowHelper.addLine(user, {
                idempotencyKey: "line-linked",
                templateId: template.id,
                label: "Design revenue",
                section: "INCOME",
                linkedCategory: "Design services",
            })
            expect(linked.budgetsMinorUnits).to.deep.equal([0, 0, 0, 0])
            expect(linked.actualsMinorUnits[0]).to.be.a("number").greaterThan(0)
            expect(linked.actualsMinorUnits[1]).to.be.a("number").greaterThan(0)
            expect(linked.actualsMinorUnits[2]).to.equal(null)
            expect(linked.actualsMinorUnits[3]).to.equal(null)
            // With zero budgets, variance equals the actual.
            expect(linked.variancesMinorUnits[0]).to.equal(linked.actualsMinorUnits[0])
            expect(linked.variancesMinorUnits[2]).to.equal(null)

            const budgeted = await this.flowHelper.updateLine(user, {
                lineId: linked.id,
                budgetsMinorUnits: [100_000, 200_000, 300_000, 400_000],
            })
            expect(budgeted.variancesMinorUnits[0]).to.equal(
                (budgeted.actualsMinorUnits[0] as number) - 100_000,
            )
            expect(budgeted.variancesMinorUnits[3]).to.equal(null)

            // Unlinked rows never carry actuals.
            const unlinked = await this.flowHelper.addLine(user, {
                idempotencyKey: "line-free",
                templateId: template.id,
                label: "New office build-out",
                section: "EXPENSES",
            })
            expect(unlinked.actualsMinorUnits).to.deep.equal([null, null, null, null])

            // Clearing the link (empty string) turns actuals off again.
            const cleared = await this.flowHelper.updateLine(user, {
                lineId: linked.id,
                linkedCategory: "",
            })
            expect(cleared.linkedCategory).to.equal(null)
            expect(cleared.actualsMinorUnits).to.deep.equal([null, null, null, null])
        })

        it("rejects budgets that do not cover every grid month", async function () {
            const user = this.defaults.user!
            const template = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-len",
                name: "Lengths",
                startMonth: "2027-01",
                monthCount: 3,
            })
            const line = await this.flowHelper.addLine(user, {
                idempotencyKey: "line-len",
                templateId: template.id,
                label: "Rent",
                section: "EXPENSES",
            })
            await expect(
                this.flowHelper.updateLine(user, { lineId: line.id, budgetsMinorUnits: [1, 2] }),
            ).to.be.rejectedWith("exactly 3")
        })

        it("seeds a plan from the latest actual month", async function () {
            const user = this.defaults.user!
            await connectBooks(this, user)
            const template = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-seed",
                name: "Seeded",
                startMonth: isoMonth(0),
                monthCount: 3,
            })
            expect(template.lines).to.deep.equal([])

            const seeded = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-seed-2",
                name: "Seeded for real",
                startMonth: isoMonth(0),
                monthCount: 3,
                seedFromActuals: true,
            })
            const income = seeded.lines.filter((line) => line.section === "INCOME")
            const expenses = seeded.lines.filter((line) => line.section === "EXPENSES")
            expect(income.map((line) => line.label)).to.contain("Design services")
            expect(expenses.map((line) => line.label)).to.contain("Payroll")
            // The seed is the latest actual replicated across the grid — so
            // in the current month, budget equals actual and variance is 0.
            const payroll = expenses.find((line) => line.label === "Payroll")!
            expect(payroll.budgetsMinorUnits[0]).to.equal(payroll.actualsMinorUnits[0])
            expect(payroll.variancesMinorUnits[0]).to.equal(0)
            expect(payroll.budgetsMinorUnits[1]).to.equal(payroll.budgetsMinorUnits[0])
        })
    })

    describe("xlsx export + import", function () {
        it("round-trips a template through the exported workbook", async function () {
            const user = this.defaults.user!
            await connectBooks(this, user)
            const template = await this.flowHelper.createTemplate(user, {
                idempotencyKey: "tpl-xl",
                name: "Quarterly plan",
                startMonth: isoMonth(1),
                monthCount: 3,
                seedFromActuals: true,
            })
            await this.flowHelper.updateLine(user, {
                lineId: template.lines[0].id,
                budgetsMinorUnits: [123_456, 200_000, 5],
            })

            const upload = await this.flowHelper.exportTemplateXlsx(user, template.id, "xl-1")
            expect(upload.contentType).to.equal(XLSX_CONTENT_TYPE)
            expect(upload.visibility).to.equal("PRIVATE")
            expect(upload.status).to.equal("READY")
            expect(upload.fileName).to.match(/^quarterly-plan-\d{4}-\d{2}-\d{2}\.xlsx$/)

            // The workbook carries the importable plan and the computed view.
            const file = await storageService.readFileBytes({ userId: user.id, uploadId: upload.id })
            const sheets = await xlsxService.parseWorkbook(file.bytes)
            expect(sheets.map((sheet) => sheet.name)).to.deep.equal(["Budget", "Actuals vs budget"])

            const imported = await this.flowHelper.importTemplateXlsx(user, {
                idempotencyKey: "xl-import-1",
                uploadId: upload.id,
                name: "Imported plan",
            })
            expect(imported.name).to.equal("Imported plan")
            expect(imported.months).to.deep.equal(template.months)
            const original = await this.flowHelper.getTemplate(user, template.id)
            expect(imported.lines.map((line) => line.label)).to.deep.equal(
                original.lines.map((line) => line.label),
            )
            expect(imported.lines.map((line) => line.budgetsMinorUnits)).to.deep.equal(
                original.lines.map((line) => line.budgetsMinorUnits),
            )
            expect(imported.lines.map((line) => line.linkedCategory)).to.deep.equal(
                original.lines.map((line) => line.linkedCategory),
            )
        })

        it("imports a hand-built Budget sheet and refuses shapeless workbooks", async function () {
            const user = this.defaults.user!
            const bytes = await xlsxService.buildWorkbook({
                sheets: [
                    {
                        name: "Budget",
                        columns: [
                            { header: "Line" },
                            { header: "Section" },
                            { header: "Linked category" },
                            { header: "2027-01" },
                            { header: "2027-02" },
                        ],
                        rows: [
                            ["Consulting", "INCOME", null, 1234.56, 2000],
                            ["Rent", "EXPENSES", null, 500, null],
                        ],
                    },
                ],
            })
            const upload = await storageService.writeFile({
                idempotencyKey: "up-budget",
                userId: user.id,
                visibility: "PRIVATE",
                contentType: XLSX_CONTENT_TYPE,
                bytesBase64: bytes.toString("base64"),
                fileName: "plan.xlsx",
            })
            const imported = await this.flowHelper.importTemplateXlsx(user, {
                idempotencyKey: "xl-import-2",
                uploadId: upload.id,
                name: "From Excel",
            })
            expect(imported.months).to.deep.equal(["2027-01", "2027-02"])
            expect(imported.lines.map((line) => line.label)).to.deep.equal(["Consulting", "Rent"])
            expect(imported.lines[0].budgetsMinorUnits).to.deep.equal([123_456, 200_000])
            // Empty cells read as zero budget.
            expect(imported.lines[1].budgetsMinorUnits).to.deep.equal([50_000, 0])

            const junk = await xlsxService.buildWorkbook({
                sheets: [
                    {
                        name: "Notes",
                        columns: [{ header: "Whatever" }],
                        rows: [["hello"]],
                    },
                ],
            })
            const junkUpload = await storageService.writeFile({
                idempotencyKey: "up-junk",
                userId: user.id,
                visibility: "PRIVATE",
                contentType: XLSX_CONTENT_TYPE,
                bytesBase64: junk.toString("base64"),
                fileName: "junk.xlsx",
            })
            await expect(
                this.flowHelper.importTemplateXlsx(user, {
                    idempotencyKey: "xl-import-3",
                    uploadId: junkUpload.id,
                    name: "Junk",
                }),
            ).to.be.rejectedWith("ISO months")
        })

        it("refuses importing an upload the caller does not own", async function () {
            const user = this.defaults.user!
            const upload = await storageService.writeFile({
                idempotencyKey: "up-own",
                userId: user.id,
                visibility: "PRIVATE",
                contentType: XLSX_CONTENT_TYPE,
                bytesBase64: (
                    await xlsxService.buildWorkbook({
                        sheets: [
                            {
                                name: "Budget",
                                columns: [
                                    { header: "Line" },
                                    { header: "Section" },
                                    { header: "Linked category" },
                                    { header: "2027-01" },
                                ],
                                rows: [["Rent", "EXPENSES", null, 100]],
                            },
                        ],
                    })
                ).toString("base64"),
                fileName: "mine.xlsx",
            })
            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            await expect(
                this.flowHelper.importTemplateXlsx(stranger, {
                    idempotencyKey: "xl-import-4",
                    uploadId: upload.id,
                    name: "Stolen",
                }),
            ).to.be.rejected
        })
    })
})
