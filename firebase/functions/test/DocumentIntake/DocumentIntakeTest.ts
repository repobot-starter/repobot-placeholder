import { expect } from "chai"
import { documentIntakeService, PDF_CONTENT_TYPE } from "../../src/Services/DocumentIntake/index.js"
import { storageService } from "../../src/Services/Storage/StorageService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { RpcError } from "../../src/Utils/RpcError.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { addDefaults } from "../Utils/TestContext.js"
import { makeTestPdf } from "./TestPdf.js"

describe("DocumentIntake", function () {
    describe("pdf text extraction", function () {
        it("extracts per-page text from a real PDF", async function () {
            const bytes = makeTestPdf([
                ["Letter of Credit LC-2026-0042", "Latest date of shipment: 2026-09-30"],
                ["Documents required:", "Commercial invoice in triplicate"],
            ])
            const extracted = await documentIntakeService.extractPdfText(bytes)

            expect(extracted.pageCount).to.equal(2)
            expect(extracted.pages[0].pageNumber).to.equal(1)
            expect(extracted.pages[0].text).to.contain("Letter of Credit LC-2026-0042")
            expect(extracted.pages[0].text).to.contain("Latest date of shipment: 2026-09-30")
            expect(extracted.pages[1].text).to.contain("Commercial invoice in triplicate")
            // The joined text carries both pages for the AI-extraction input.
            expect(extracted.text).to.contain("LC-2026-0042")
            expect(extracted.text).to.contain("Documents required:")
        })

        it("rejects bytes that are not a PDF", async function () {
            await expect(
                documentIntakeService.extractPdfText(Buffer.from("just some plain text")),
            ).to.be.rejectedWith(RpcError, "could not be read as a PDF")
        })
    })

    describe("upload intake through the storage kernel", function () {
        beforeEach(async function () {
            await addDefaults(this, ["account", "user"])
        })

        it("reads a filed PDF upload and extracts its text", async function () {
            const bytes = makeTestPdf([["Packing list PL-77", "Gross weight 18,400 kg"]])
            const upload = await storageService.writeFile({
                idempotencyKey: "intake-upload-1",
                userId: this.defaults.user!.id,
                visibility: "PRIVATE",
                contentType: PDF_CONTENT_TYPE,
                bytesBase64: bytes.toString("base64"),
                fileName: "packing-list.pdf",
            })
            expect(upload.status).to.equal("READY")

            const extracted = await documentIntakeService.extractUploadText({
                userId: this.defaults.user!.id,
                uploadId: upload.id,
            })
            expect(extracted.pageCount).to.equal(1)
            expect(extracted.text).to.contain("Packing list PL-77")
        })

        it("refuses non-PDF uploads and other users' PRIVATE files", async function () {
            const textUpload = await storageService.writeFile({
                idempotencyKey: "intake-upload-2",
                userId: this.defaults.user!.id,
                visibility: "PRIVATE",
                contentType: "text/plain",
                bytesBase64: Buffer.from("not a pdf").toString("base64"),
            })
            await expect(
                documentIntakeService.extractUploadText({
                    userId: this.defaults.user!.id,
                    uploadId: textUpload.id,
                }),
            ).to.be.rejectedWith(RpcError, "reads PDFs")

            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            const pdfUpload = await storageService.writeFile({
                idempotencyKey: "intake-upload-3",
                userId: this.defaults.user!.id,
                visibility: "PRIVATE",
                contentType: PDF_CONTENT_TYPE,
                bytesBase64: makeTestPdf([["Confidential"]]).toString("base64"),
            })
            await expect(
                documentIntakeService.extractUploadText({
                    userId: stranger.id,
                    uploadId: pdfUpload.id,
                }),
            ).to.be.rejectedWith(RpcError)
        })
    })

    describe("structured extraction in AI_MODE=local", function () {
        // The env schema defaults tests to AI_MODE=openai (Ai tests fake the
        // wrapper); the sandbox fixture path is explicitly local.
        let originalAiMode: string | undefined
        beforeEach(function () {
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

        it("resolves a fixture-marked document deterministically", async function () {
            const bytes = makeTestPdf([
                [
                    "Document intake exemplar",
                    "REPOBOT-INTAKE-FIXTURE: intake-exemplar",
                    "Reference EX-2026-001",
                ],
            ])
            const extracted = await documentIntakeService.extractPdfText(bytes)
            const structured = await documentIntakeService.extractStructured({
                text: extracted.text,
                instructions: "Extract the reference and amount as JSON.",
            })
            expect(structured).to.deep.equal({
                documentKind: "EXEMPLAR",
                title: "Document intake exemplar",
                fields: { reference: "EX-2026-001", amount: 1250.5 },
            })

            // Each call hands out a fresh copy — mutating one result must
            // never poison the registry for the next caller.
            ;(structured as { title: string }).title = "mutated"
            const again = await documentIntakeService.extractStructured({
                text: extracted.text,
                instructions: "Extract the reference and amount as JSON.",
            })
            expect((again as { title: string }).title).to.equal("Document intake exemplar")
        })

        it("fails FAILED_PRECONDITION on documents without a known fixture", async function () {
            await expect(
                documentIntakeService.extractStructured({
                    text: "An arbitrary document the sandbox has no fixture for.",
                    instructions: "Extract anything.",
                }),
            ).to.be.rejectedWith(RpcError, "sample documents")
        })
    })
})
