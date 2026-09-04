import { expect } from "chai"
import { SignJWT } from "jose"
import { randomUUID } from "node:crypto"
import { createServer, Server } from "node:http"
import { AddressInfo } from "node:net"
import { buildDocumentsExpressApp } from "../../src/CloudFunctions/Documents.js"
import { Upload } from "../../src/Data/Storage/Upload.js"
import {
    buildPrintableHtmlDocument,
    DocumentGenerationService,
    documentGenerationService,
} from "../../src/Services/Documents/DocumentGenerationService.js"
import { validateDocumentOverrides } from "../../src/Services/Documents/DocumentOverrideValidation.js"
import { getDocumentTemplate, listDocumentTemplates } from "../../src/Services/Documents/DocumentTemplates.js"
import { DocumentTemplateSchema } from "../../src/Services/Documents/DocumentTemplateTypes.js"
import {
    getPdfRenderer,
    PdfRenderRequest,
    setPdfRendererForTests,
} from "../../src/Services/Documents/PdfRenderClient.js"
import { readLocalObject } from "../../src/Services/Storage/LocalStorageStore.js"
import { WriteFileRequest } from "../../src/Services/Storage/StorageService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { RpcError } from "../../src/Utils/RpcError.js"

const testSchema: DocumentTemplateSchema = {
    name: "Test",
    fields: {
        title: { type: "string", required: true },
        contactEmail: { type: "string", format: "email" },
        issuedOn: { type: "string", format: "date" },
        amount: { type: "number" },
        paid: { type: "boolean" },
        lineItems: {
            type: "array",
            items: {
                type: "object",
                fields: {
                    description: { type: "string", required: true },
                    total: { type: "string" },
                },
            },
        },
    },
}

/**
 * A bearer token the test harness's verifier accepts (AUTH_MODE=local with
 * the fixed LOCAL_AUTH_SECRET — the same technique as AuthTest).
 */
async function signLocalToken(claims: { sub: string; email: string }): Promise<string> {
    const secret = Buffer.from(process.env.LOCAL_AUTH_SECRET!, "hex")
    return await new SignJWT({ email: claims.email })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(claims.sub)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret)
}

function expectRpcError(block: () => void, status: string, messagePart: string): void {
    try {
        block()
    } catch (error) {
        expect(error).to.be.instanceOf(RpcError)
        expect((error as RpcError).status).to.equal(status)
        expect((error as RpcError).message).to.contain(messagePart)
        return
    }
    expect.fail("Expected an RpcError but none was thrown.")
}

describe("Documents", function () {
    describe("validateDocumentOverrides", function () {
        it("accepts overrides that match the schema", function () {
            const overrides = {
                title: "Hello",
                contactEmail: "a@b.co",
                issuedOn: "2026-07-24",
                amount: 12.5,
                paid: false,
                lineItems: [{ description: "Work", total: "$5.00" }],
            }
            expect(validateDocumentOverrides({ schema: testSchema, overrides })).to.equal(overrides)
        })

        it("rejects keys the schema does not declare", function () {
            expectRpcError(
                () =>
                    validateDocumentOverrides({
                        schema: testSchema,
                        overrides: { title: "x", tittle: "typo" },
                    }),
                "INVALID_ARGUMENT",
                "overrides.tittle is not defined",
            )
        })

        it("rejects a missing required field", function () {
            expectRpcError(
                () => validateDocumentOverrides({ schema: testSchema, overrides: {} }),
                "INVALID_ARGUMENT",
                "overrides.title is required",
            )
        })

        it("rejects type mismatches", function () {
            expectRpcError(
                () =>
                    validateDocumentOverrides({
                        schema: testSchema,
                        overrides: { title: "x", amount: "12" },
                    }),
                "INVALID_ARGUMENT",
                "overrides.amount must be a number",
            )
        })

        it("rejects malformed email and date formats", function () {
            expectRpcError(
                () =>
                    validateDocumentOverrides({
                        schema: testSchema,
                        overrides: { title: "x", contactEmail: "not-an-email" },
                    }),
                "INVALID_ARGUMENT",
                "must be a valid email",
            )
            expectRpcError(
                () =>
                    validateDocumentOverrides({
                        schema: testSchema,
                        overrides: { title: "x", issuedOn: "July 4" },
                    }),
                "INVALID_ARGUMENT",
                "must be a valid YYYY-MM-DD date",
            )
        })

        it("validates array items with their index in the error path", function () {
            expectRpcError(
                () =>
                    validateDocumentOverrides({
                        schema: testSchema,
                        overrides: {
                            title: "x",
                            lineItems: [{ description: "ok" }, { total: "$1.00" }],
                        },
                    }),
                "INVALID_ARGUMENT",
                "overrides.lineItems[1].description is required",
            )
        })
    })

    describe("buildPrintableHtmlDocument", function () {
        it("wraps a fragment in a complete printable document", function () {
            const document = buildPrintableHtmlDocument("<p>Hi</p>", "p { color: red; }", "Letter")
            expect(document).to.contain("<!DOCTYPE html>")
            expect(document).to.contain("size: Letter;")
            expect(document).to.contain("p { color: red; }")
            expect(document).to.contain('<div class="doc-sheet"><p>Hi</p></div>')
        })

        it("injects print styles into a full document's head", function () {
            const html = "<!doctype html><html><head><title>t</title></head><body><p>Hi</p></body></html>"
            const document = buildPrintableHtmlDocument(html, "p { margin: 0; }", "A4")
            expect(document).to.contain("<title>t</title>")
            expect(document).to.contain("size: A4;")
            expect(document.match(/<html/g)).to.have.length(1)
        })

        it("uses the template's page size in @page", function () {
            expect(buildPrintableHtmlDocument("<p>x</p>", "", "A4")).to.contain("size: A4;")
            expect(buildPrintableHtmlDocument("<p>x</p>", "", "Letter")).to.contain("size: Letter;")
        })

        it("maps landscape page sizes to CSS orientation", function () {
            expect(buildPrintableHtmlDocument("<p>x</p>", "", "Letter-landscape")).to.contain(
                "size: Letter landscape;",
            )
            expect(buildPrintableHtmlDocument("<p>x</p>", "", "A4-landscape")).to.contain(
                "size: A4 landscape;",
            )
        })
    })

    describe("template files", function () {
        it("loads the invoice template from the repo", function () {
            const keys = listDocumentTemplates().map((template) => template.key)
            expect(keys).to.contain("invoice")
            const invoice = getDocumentTemplate("invoice")
            expect(invoice.name).to.equal("Invoice")
            expect(invoice.pageSize).to.equal("Letter")
            expect(invoice.html).to.contain("{{invoiceNumber}}")
        })

        it("ships a sample that passes its own schema", function () {
            const invoice = getDocumentTemplate("invoice")
            expect(() =>
                validateDocumentOverrides({
                    schema: { name: invoice.name, fields: invoice.fields },
                    overrides: invoice.sample,
                }),
            ).to.not.throw()
        })

        it("spells out the known templates for an unknown key", function () {
            expectRpcError(() => getDocumentTemplate("missing"), "NOT_FOUND", "invoice")
        })
    })

    describe("DocumentGenerationService", function () {
        it("renders overrides through Mustache and hands the renderer printable HTML", async function () {
            const renderRequests: PdfRenderRequest[] = []
            const service = new DocumentGenerationService(() => ({
                renderHtmlToPdf: async (request) => {
                    renderRequests.push(request)
                    return Buffer.from("%PDF-fake")
                },
            }))

            const invoice = getDocumentTemplate("invoice")
            const generated = await service.generateDocument({
                templateKey: "invoice",
                overrides: invoice.sample,
            })

            expect(generated.fileName).to.match(/^invoice-\d{4}-\d{2}-\d{2}-[a-z0-9]+\.pdf$/)
            expect(generated.pdf.toString()).to.equal("%PDF-fake")
            expect(renderRequests).to.have.length(1)
            const rendered = renderRequests[0]
            expect(rendered.pageSize).to.equal("Letter")
            // The Mustache tags are gone; the sample's values are in.
            expect(rendered.html).to.not.contain("{{")
            expect(rendered.html).to.contain("INV-2026-0142")
            expect(rendered.html).to.contain("Brand identity design")
            expect(rendered.html).to.contain("size: Letter;")
        })

        it("refuses overrides that fail the template schema", async function () {
            const service = new DocumentGenerationService(() => ({
                renderHtmlToPdf: async () => Buffer.from(""),
            }))
            await expect(
                service.generateDocument({
                    templateKey: "invoice",
                    overrides: { invoiceNumber: "INV-1" },
                }),
            ).to.be.rejectedWith("overrides.businessName is required")
        })
    })

    describe("generateAndFileDocument", function () {
        const fakeUpload: Upload = {
            id: "upld_test",
            rowCreatedAt: new Date(),
            rowUpdatedAt: new Date(),
            userId: "user_1",
            storageKey: "uploads/upld_test",
            contentType: "application/pdf",
            sizeBytes: 9,
            visibility: "PRIVATE",
            status: "READY",
            profile: "DEFAULT",
            fileName: "invoice-test.pdf",
        }

        it("files the rendered PDF through the storage kernel's writeFile", async function () {
            const written: WriteFileRequest[] = []
            const service = new DocumentGenerationService(
                () => ({ renderHtmlToPdf: async () => Buffer.from("%PDF-fake") }),
                () => ({
                    writeFile: async (request) => {
                        written.push(request)
                        return fakeUpload
                    },
                }),
            )

            const invoice = getDocumentTemplate("invoice")
            const filed = await service.generateAndFileDocument({
                templateKey: "invoice",
                overrides: invoice.sample,
                idempotencyKey: "doc-file-1",
                userId: "user_1",
                visibility: "PRIVATE",
            })

            expect(filed.upload).to.equal(fakeUpload)
            expect(filed.fileName).to.match(/^invoice-\d{4}-\d{2}-\d{2}-[a-z0-9]+\.pdf$/)
            expect(written).to.have.length(1)
            const request = written[0]
            expect(request.contentType).to.equal("application/pdf")
            expect(Buffer.from(request.bytesBase64, "base64").toString()).to.equal("%PDF-fake")
            expect(request.fileName).to.equal(filed.fileName)
            expect(request.idempotencyKey).to.equal("doc-file-1")
            expect(request.userId).to.equal("user_1")
            expect(request.visibility).to.equal("PRIVATE")
        })

        it("lands a READY, servable upload in the storage kernel (STORAGE_MODE=local)", async function () {
            setPdfRendererForTests({
                renderHtmlToPdf: async () => Buffer.from("%PDF-filed"),
            })
            try {
                const invoice = getDocumentTemplate("invoice")
                const filed = await documentGenerationService.generateAndFileDocument({
                    templateKey: "invoice",
                    overrides: invoice.sample,
                    idempotencyKey: randomUUID(),
                    userId: undefined,
                    visibility: "PUBLIC",
                })

                expect(filed.upload.status).to.equal("READY")
                expect(filed.upload.contentType).to.equal("application/pdf")
                expect(filed.upload.sizeBytes).to.equal("%PDF-filed".length)
                expect(filed.upload.fileName).to.equal(filed.fileName)
                const bytes = await readLocalObject(filed.upload.storageKey)
                expect(bytes?.toString()).to.equal("%PDF-filed")
            } finally {
                setPdfRendererForTests(undefined)
            }
        })
    })

    describe("documents__request__api", function () {
        let server: Server
        let baseUrl: string
        let authHeaders: Record<string, string>

        beforeEach(function (done) {
            setPdfRendererForTests({
                renderHtmlToPdf: async () => Buffer.from("%PDF-endpoint-fake"),
            })
            server = createServer(buildDocumentsExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                void signLocalToken({ sub: "documents-test-user", email: "documents@example.test" }).then(
                    (token) => {
                        authHeaders = { Authorization: `Bearer ${token}` }
                        done()
                    },
                )
            })
        })

        afterEach(function (done) {
            setPdfRendererForTests(undefined)
            server.close(() => done())
        })

        it("lists the repo's templates on GET /templates", async function () {
            const response = await fetch(`${baseUrl}/templates`)
            expect(response.status).to.equal(200)
            const body = (await response.json()) as {
                templates: { key: string; name: string; sample: Record<string, unknown> }[]
            }
            const invoice = body.templates.find((template) => template.key === "invoice")
            expect(invoice?.name).to.equal("Invoice")
            expect(invoice?.sample.invoiceNumber).to.be.a("string")
        })

        it("refuses an unauthenticated POST /generate", async function () {
            const invoice = getDocumentTemplate("invoice")
            const response = await fetch(`${baseUrl}/generate`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ templateKey: "invoice", overrides: invoice.sample }),
            })
            expect(response.status).to.equal(401)
            const body = (await response.json()) as { error: { code: string; message: string } }
            expect(body.error.code).to.equal("UNAUTHENTICATED")
            expect(body.error.message).to.contain("requires an authenticated caller")
        })

        it("streams PDF bytes with a download file name on POST /generate", async function () {
            const invoice = getDocumentTemplate("invoice")
            const response = await fetch(`${baseUrl}/generate`, {
                method: "POST",
                headers: { "content-type": "application/json", ...authHeaders },
                body: JSON.stringify({ templateKey: "invoice", overrides: invoice.sample }),
            })
            expect(response.status).to.equal(200)
            expect(response.headers.get("content-type")).to.contain("application/pdf")
            expect(response.headers.get("content-disposition")).to.match(
                /attachment; filename="invoice-.*\.pdf"/,
            )
            expect(Buffer.from(await response.arrayBuffer()).toString()).to.equal("%PDF-endpoint-fake")
        })

        it("maps validation failures to 400 with the field spelled out", async function () {
            const response = await fetch(`${baseUrl}/generate`, {
                method: "POST",
                headers: { "content-type": "application/json", ...authHeaders },
                body: JSON.stringify({ templateKey: "invoice", overrides: { bogus: true } }),
            })
            expect(response.status).to.equal(400)
            const body = (await response.json()) as { error: { code: string; message: string } }
            expect(body.error.code).to.equal("INVALID_ARGUMENT")
            expect(body.error.message).to.contain("bogus")
        })

        it("maps an unknown template to 404", async function () {
            const response = await fetch(`${baseUrl}/generate`, {
                method: "POST",
                headers: { "content-type": "application/json", ...authHeaders },
                body: JSON.stringify({ templateKey: "missing", overrides: {} }),
            })
            expect(response.status).to.equal(404)
        })
    })

    describe("PdfRenderClient (DOCUMENTS_MODE=platform)", function () {
        afterEach(function () {
            setPdfRendererForTests(undefined)
            resetValidatedEnvForTests()
        })

        it("fails at first use with the setup spelled out when the render URL is missing", async function () {
            const originalMode = process.env.DOCUMENTS_MODE
            const originalUrl = process.env.DOCUMENTS_RENDER_URL
            process.env.DOCUMENTS_MODE = "platform"
            delete process.env.DOCUMENTS_RENDER_URL
            resetValidatedEnvForTests()
            setPdfRendererForTests(undefined)
            try {
                await expect(
                    getPdfRenderer().renderHtmlToPdf({ html: "<p>x</p>", pageSize: "Letter" }),
                ).to.be.rejectedWith("DOCUMENTS_RENDER_URL is not set")
            } finally {
                if (originalMode === undefined) {
                    delete process.env.DOCUMENTS_MODE
                } else {
                    process.env.DOCUMENTS_MODE = originalMode
                }
                if (originalUrl !== undefined) {
                    process.env.DOCUMENTS_RENDER_URL = originalUrl
                }
            }
        })
    })
})
