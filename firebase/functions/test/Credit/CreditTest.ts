import { expect } from "chai"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { storageService } from "../../src/Services/Storage/StorageService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { addDefaults, TestContext } from "../Utils/TestContext.js"

/**
 * The bundled sample set the credit pack ships for the sandbox demo
 * (web/app/public/samples/credit/). Testing against the actual files pins
 * that the shipped demo path works: the PDFs parse, their fixture markers
 * resolve, and the deliberately imperfect set produces a real report.
 */
const samplesDir = join(import.meta.dirname, "../../../../web/app/public/samples/credit")

async function uploadSample(user: GqlUser, fileName: string, idempotencyKey: string): Promise<string> {
    const bytes = readFileSync(join(samplesDir, fileName))
    const upload = await storageService.writeFile({
        idempotencyKey,
        userId: user.id,
        visibility: "PRIVATE",
        contentType: "application/pdf",
        bytesBase64: bytes.toString("base64"),
        fileName,
    })
    return upload.id
}

async function ingestSampleLc(context: TestContext, user: GqlUser) {
    const uploadId = await uploadSample(user, "sample-letter-of-credit.pdf", `up-lc-${user.id}`)
    return await context.creditHelper.ingestLc(user, {
        idempotencyKey: `lc-${user.id}`,
        uploadId,
    })
}

describe("Credit", function () {
    // Ingestion resolves structured extraction from the bundled fixtures,
    // which is the AI_MODE=local path (the suite default is openai).
    let originalAiMode: string | undefined
    beforeEach(async function () {
        originalAiMode = process.env.AI_MODE
        process.env.AI_MODE = "local"
        resetValidatedEnvForTests()
        await addDefaults(this, ["account", "user"])
    })
    afterEach(function () {
        if (originalAiMode === undefined) {
            delete process.env.AI_MODE
        } else {
            process.env.AI_MODE = originalAiMode
        }
        resetValidatedEnvForTests()
    })

    describe("LC ingestion", function () {
        it("extracts the MT700 breakdown from the dropped sample LC", async function () {
            const lc = await ingestSampleLc(this, this.defaults.user!)

            expect(lc.reference).to.equal("LC-2026-0815")
            expect(lc.issuingBank).to.equal("First Meridian Bank")
            expect(lc.applicant).to.equal("Atlas Trading GmbH")
            expect(lc.beneficiary).to.equal("Pacific Textiles Ltd")
            expect(lc.currency).to.equal("usd")
            expect(lc.amountMinorUnits).to.equal(18450000)
            expect(lc.tolerancePercent).to.equal(5)
            expect(lc.expiryDate).to.equal("2027-06-30")
            expect(lc.latestShipmentDate).to.equal("2027-05-31")
            expect(lc.presentationPeriodDays).to.equal(21)
            expect(lc.portOfLoading).to.equal("Shanghai")
            expect(lc.portOfDischarge).to.equal("Hamburg")
            expect(lc.partialShipments).to.equal("NOT_ALLOWED")
            expect(lc.transhipment).to.equal("ALLOWED")
            expect(lc.documentsRequired).to.deep.equal([
                "Signed commercial invoice in triplicate",
                "Full set clean on board ocean bills of lading",
                "Packing list in duplicate",
            ])
            expect(lc.documents).to.deep.equal([])

            // Before any documents: the credit is in force and the shipment
            // window is open (dates are fixed in mid-2027).
            const codes = lc.findings.map((finding) => finding.code)
            expect(codes).to.contain("LC_IN_FORCE")
            expect(codes).to.contain("SHIPMENT_WINDOW_OPEN")
            expect(lc.findings.every((finding) => finding.severity === "OK")).to.equal(true)
        })

        it("replays the idempotency key instead of duplicating the LC", async function () {
            const first = await ingestSampleLc(this, this.defaults.user!)
            const second = await ingestSampleLc(this, this.defaults.user!)
            expect(second.id).to.equal(first.id)
            expect(await this.creditHelper.listLcs(this.defaults.user!)).to.have.length(1)
        })

        it("refuses a supporting document dropped as the LC", async function () {
            const uploadId = await uploadSample(
                this.defaults.user!,
                "sample-commercial-invoice.pdf",
                "up-wrong-kind",
            )
            await expect(
                this.creditHelper.ingestLc(this.defaults.user!, {
                    idempotencyKey: "lc-wrong-kind",
                    uploadId,
                }),
            ).to.be.rejectedWith("does not read as a letter of credit")
        })
    })

    describe("document drop + discrepancy report", function () {
        it("finds the sample set's deliberate discrepancies and passes the clean checks", async function () {
            const user = this.defaults.user!
            const lc = await ingestSampleLc(this, user)

            const invoiceUpload = await uploadSample(user, "sample-commercial-invoice.pdf", "up-inv")
            const invoice = await this.creditHelper.attachDocument(user, {
                idempotencyKey: "doc-inv",
                lcId: lc.id,
                uploadId: invoiceUpload,
                fileName: "sample-commercial-invoice.pdf",
            })
            expect(invoice.kind).to.equal("COMMERCIAL_INVOICE")
            expect(invoice.amountMinorUnits).to.equal(19530000)

            const blUpload = await uploadSample(user, "sample-bill-of-lading.pdf", "up-bl")
            const billOfLading = await this.creditHelper.attachDocument(user, {
                idempotencyKey: "doc-bl",
                lcId: lc.id,
                uploadId: blUpload,
                fileName: "sample-bill-of-lading.pdf",
            })
            expect(billOfLading.kind).to.equal("BILL_OF_LADING")
            expect(billOfLading.shipmentDate).to.equal("2027-06-04")

            const plUpload = await uploadSample(user, "sample-packing-list.pdf", "up-pl")
            const packingList = await this.creditHelper.attachDocument(user, {
                idempotencyKey: "doc-pl",
                lcId: lc.id,
                uploadId: plUpload,
                fileName: "sample-packing-list.pdf",
            })
            expect(packingList.kind).to.equal("PACKING_LIST")

            const refreshed = await this.creditHelper.getLc(user, lc.id)
            expect(refreshed.documents).to.have.length(3)

            const byCode = new Map(refreshed.findings.map((finding) => [finding.code, finding]))
            // The invoice draws 195,300 against 184,500 +5% = 193,725: over.
            expect(byCode.get("AMOUNT_OVER_TOLERANCE")?.severity).to.equal("DISCREPANCY")
            expect(byCode.get("AMOUNT_OVER_TOLERANCE")?.documentId).to.equal(invoice.id)
            // The B/L ships 2027-06-04 against a 2027-05-31 deadline: late.
            expect(byCode.get("LATE_SHIPMENT")?.severity).to.equal("DISCREPANCY")
            expect(byCode.get("LATE_SHIPMENT")?.documentId).to.equal(billOfLading.id)
            // The clean checks still pass: ports match, presentation window
            // open (21 days from shipment), credit in force.
            expect(byCode.get("LC_IN_FORCE")?.severity).to.equal("OK")
            expect(byCode.get("PRESENTATION_WINDOW_OPEN")?.severity).to.equal("OK")
            expect(byCode.has("PORT_OF_LOADING_MISMATCH")).to.equal(false)
            expect(byCode.has("PORT_OF_DISCHARGE_MISMATCH")).to.equal(false)
            expect(byCode.has("CURRENCY_MISMATCH")).to.equal(false)
            // Worst findings lead the report.
            expect(refreshed.findings[0].severity).to.equal("DISCREPANCY")
        })

        it("removes a document and its findings", async function () {
            const user = this.defaults.user!
            const lc = await ingestSampleLc(this, user)
            const invoiceUpload = await uploadSample(user, "sample-commercial-invoice.pdf", "up-inv-rm")
            const invoice = await this.creditHelper.attachDocument(user, {
                idempotencyKey: "doc-inv-rm",
                lcId: lc.id,
                uploadId: invoiceUpload,
            })

            expect(await this.creditHelper.removeDocument(user, invoice.id)).to.equal(true)
            const refreshed = await this.creditHelper.getLc(user, lc.id)
            expect(refreshed.documents).to.deep.equal([])
            expect(refreshed.findings.map((finding) => finding.code)).to.not.contain("AMOUNT_OVER_TOLERANCE")
        })
    })

    describe("ownership", function () {
        it("scopes LCs strictly to their owner", async function () {
            const owner = this.defaults.user!
            const lc = await ingestSampleLc(this, owner)

            const stranger = await this.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                }),
            )
            expect(await this.creditHelper.listLcs(stranger)).to.deep.equal([])
            await expect(this.creditHelper.getLc(stranger, lc.id)).to.be.rejectedWith(
                "no such letter of credit",
            )
            await expect(this.creditHelper.deleteLc(stranger, lc.id)).to.be.rejectedWith(
                "no such letter of credit",
            )
        })

        it("deletes an LC together with its documents", async function () {
            const user = this.defaults.user!
            const lc = await ingestSampleLc(this, user)
            const uploadId = await uploadSample(user, "sample-packing-list.pdf", "up-pl-del")
            await this.creditHelper.attachDocument(user, {
                idempotencyKey: "doc-pl-del",
                lcId: lc.id,
                uploadId,
            })

            expect(await this.creditHelper.deleteLc(user, lc.id)).to.equal(true)
            expect(await this.creditHelper.listLcs(user)).to.deep.equal([])
            await expect(this.creditHelper.getLc(user, lc.id)).to.be.rejectedWith("no such letter of credit")
        })
    })
})
