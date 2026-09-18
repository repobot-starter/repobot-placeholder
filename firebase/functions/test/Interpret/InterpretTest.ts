import { expect } from "chai"
import { interpretService } from "../../src/Services/Interpret/InterpretService.js"
import { PDF_CONTENT_TYPE } from "../../src/Services/DocumentIntake/index.js"
import { storageService } from "../../src/Services/Storage/StorageService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { addDefaults } from "../Utils/TestContext.js"
import { makeTestPdf } from "../DocumentIntake/TestPdf.js"

/**
 * The interpret pack's domain (packs/interpret). The sandbox path is the one
 * worth pinning: unlike the credit pack's fixture-marked samples, this
 * service must produce a useful reading of ANY PDF with AI_MODE=local, which
 * is what makes the pack demo without credentials.
 */
describe("Interpret", function () {
    let originalAiMode: string | undefined

    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
        originalAiMode = process.env.AI_MODE
        process.env.AI_MODE = "local"
        resetValidatedEnvForTests()
    })

    afterEach(function () {
        if (originalAiMode === undefined) {
            delete process.env.AI_MODE
        } else {
            process.env.AI_MODE = originalAiMode
        }
        resetValidatedEnvForTests()
    })

    async function fileTestPdf(context: Mocha.Context, pages: string[][], key: string): Promise<string> {
        const upload = await storageService.writeFile({
            idempotencyKey: key,
            userId: context.defaults.user!.id,
            visibility: "PRIVATE",
            contentType: PDF_CONTENT_TYPE,
            bytesBase64: makeTestPdf(pages).toString("base64"),
            fileName: "document.pdf",
        })
        return upload.id
    }

    it("reads an arbitrary document without any fixture", async function () {
        const uploadId = await fileTestPdf(
            this,
            [
                [
                    "Commercial Invoice CI-2026-4417",
                    "Issued 2026-03-14 by Harbor Trading Company of Portland Oregon",
                    "Total amount due USD 18,450.00 payable within thirty days of receipt",
                    "Remit questions to accounts@harbortrading.example",
                ],
            ],
            "interpret-1",
        )

        const reading = await interpretService.interpretDocument({
            userId: this.defaults.user!.id,
            uploadId,
        })

        // The type comes from the document's own words, not a fixture marker.
        expect(reading.documentType).to.equal("Invoice")
        expect(reading.pageCount).to.equal(1)
        expect(reading.summary).to.contain("invoice")
        expect(reading.keyPoints.length).to.be.greaterThan(0)

        // The pattern extractors find the concrete facts.
        const labels = reading.fields.map((field) => field.label)
        expect(labels).to.include("Email")
        expect(labels).to.include("Date")
        expect(labels).to.include("Amount")
        const email = reading.fields.find((field) => field.label === "Email")
        expect(email?.value).to.equal("accounts@harbortrading.example")
        const date = reading.fields.find((field) => field.label === "Date")
        expect(date?.value).to.equal("2026-03-14")
    })

    it("titles the document from its own first line and counts pages", async function () {
        const uploadId = await fileTestPdf(
            this,
            [
                ["Master Services Agreement", "This agreement is made between the parties below."],
                ["Schedule A", "Deliverables and milestones are listed in this schedule."],
            ],
            "interpret-2",
        )

        const reading = await interpretService.interpretDocument({
            userId: this.defaults.user!.id,
            uploadId,
        })

        expect(reading.title).to.equal("Master Services Agreement")
        expect(reading.documentType).to.equal("Contract or agreement")
        expect(reading.pageCount).to.equal(2)
    })

    it("still reads a document that states no recognizable type or fields", async function () {
        const uploadId = await fileTestPdf(this, [["Notes to self", "Buy milk"]], "interpret-3")

        const reading = await interpretService.interpretDocument({
            userId: this.defaults.user!.id,
            uploadId,
        })

        // No throw, no empty summary: the generic fallback still says something.
        expect(reading.documentType).to.equal("Document")
        expect(reading.summary).to.contain("1 page")
        expect(reading.fields).to.deep.equal([])
    })
})
