import { expect } from "chai"
import { XLSX_CONTENT_TYPE, xlsxService } from "../../src/Services/Xlsx/XlsxService.js"
import { RpcError } from "../../src/Utils/RpcError.js"
import { addDefaults } from "../Utils/TestContext.js"

describe("Xlsx", function () {
    describe("build + parse round trip", function () {
        it("renders sheets to a workbook and parses the same values back", async function () {
            const bytes = await xlsxService.buildWorkbook({
                sheets: [
                    {
                        name: "Revenue",
                        columns: [
                            { header: "Month", width: 12 },
                            { header: "Amount", numberFormat: "#,##0.00" },
                        ],
                        rows: [
                            ["2026-07", 12500.5],
                            ["2026-08", 14020],
                        ],
                    },
                    {
                        name: "Notes",
                        columns: [{ header: "Note" }],
                        rows: [["Numbers are illustrative"]],
                    },
                ],
            })
            expect(bytes.length).to.be.greaterThan(0)

            const sheets = await xlsxService.parseWorkbook(bytes)
            expect(sheets.map((sheet) => sheet.name)).to.deep.equal(["Revenue", "Notes"])
            expect(sheets[0].rows[0]).to.deep.equal(["Month", "Amount"])
            expect(sheets[0].rows[1]).to.deep.equal(["2026-07", 12500.5])
            expect(sheets[0].rows[2]).to.deep.equal(["2026-08", 14020])
            expect(sheets[1].rows[1]).to.deep.equal(["Numbers are illustrative"])
        })

        it("caps worksheet names at Excel's 31-character limit", async function () {
            const bytes = await xlsxService.buildWorkbook({
                sheets: [
                    {
                        name: "A very long worksheet name that Excel would reject outright",
                        columns: [{ header: "Value" }],
                        rows: [[1]],
                    },
                ],
            })
            const sheets = await xlsxService.parseWorkbook(bytes)
            expect(sheets[0].name).to.have.length(31)
        })

        it("rejects an empty workbook and unreadable bytes", async function () {
            await expect(xlsxService.buildWorkbook({ sheets: [] })).to.be.rejectedWith(
                RpcError,
                "at least one sheet",
            )
            await expect(
                xlsxService.parseWorkbook(Buffer.from("definitely not a zip archive")),
            ).to.be.rejectedWith(RpcError, "not a readable xlsx workbook")
        })
    })

    describe("storage admission", function () {
        beforeEach(async function () {
            await addDefaults(this, ["account", "user"])
        })

        it("files a workbook through the storage kernel as a READY xlsx upload", async function () {
            const upload = await xlsxService.writeWorkbook({
                idempotencyKey: "xlsx-admission-1",
                userId: this.defaults.user!.id,
                visibility: "PRIVATE",
                fileName: "report.xlsx",
                sheets: [{ name: "Data", columns: [{ header: "Value" }], rows: [[42]] }],
            })
            expect(upload.status).to.equal("READY")
            expect(upload.contentType).to.equal(XLSX_CONTENT_TYPE)
            expect(upload.fileName).to.equal("report.xlsx")
            expect(upload.sizeBytes).to.be.greaterThan(0)
        })
    })
})
