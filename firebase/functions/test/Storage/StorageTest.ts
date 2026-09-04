import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { createServer, Server } from "node:http"
import { AddressInfo } from "node:net"
import { expect } from "chai"
import { buildStorageExpressApp } from "../../src/CloudFunctions/Storage.js"
import { setStorageWrapperForTests } from "../../src/DependencyWrappers/StorageWrapper/index.js"
import { resetValidatedEnvForTests, validatedEnv } from "../../src/Utils/Env.js"
import {
    asUser,
    executeGql,
    executeGqlAt,
    firstGqlError,
    testHarnessPrincipal,
} from "../Utils/Gql/GqlUtils.js"
import { FakeStorageWrapper } from "../Utils/Helpers/FakeStorageWrapper.js"
import { addDefaults } from "../Utils/TestContext.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"

const createUploadMutation = `
    mutation CreateUpload($input: CreateUploadInput!) {
        createUpload(input: $input) {
            uploadId
            uploadUrl
            headersJson
            upload {
                id
                contentType
                sizeBytes
                visibility
                status
            }
        }
    }
`

const finalizeUploadMutation = `
    mutation FinalizeUpload($input: FinalizeUploadInput!) {
        finalizeUpload(input: $input) {
            id
            status
            sizeBytes
        }
    }
`

const writeFileMutation = `
    mutation WriteFile($input: WriteFileInput!) {
        writeFile(input: $input) {
            id
            contentType
            sizeBytes
            visibility
            status
            fileName
        }
    }
`

const deleteUploadMutation = `
    mutation DeleteUpload($input: DeleteUploadInput!) {
        deleteUpload(input: $input)
    }
`

const fileUrlQuery = `
    query FileUrl($uploadId: Id!) {
        fileUrl(uploadId: $uploadId) {
            url
        }
    }
`

interface GqlUploadSlotResult {
    uploadId: string
    uploadUrl: string
    headersJson: string
    upload: {
        id: string
        contentType: string
        sizeBytes: number
        visibility: string
        status: string
    }
}

interface GqlUploadResult {
    id: string
    status: string
    sizeBytes: number
}

interface GqlWriteFileResult {
    id: string
    contentType: string
    sizeBytes: number
    visibility: string
    status: string
    fileName: string | null
}

function createUploadInput(
    overrides: Partial<{ contentType: string; sizeBytes: number; visibility: string }> = {},
): Record<string, unknown> {
    return {
        input: {
            idempotencyKey: randomUUID(),
            fields: {
                contentType: "image/png",
                sizeBytes: 4,
                visibility: "PUBLIC",
                ...overrides,
            },
        },
    }
}

function writeFileInput(
    overrides: Partial<{
        contentType: string
        bytesBase64: string
        visibility: string
        fileName: string
        idempotencyKey: string
    }> = {},
): Record<string, unknown> {
    const { idempotencyKey, ...fieldOverrides } = overrides
    return {
        input: {
            idempotencyKey: idempotencyKey ?? randomUUID(),
            fields: {
                contentType: "image/png",
                bytesBase64: PNG_BYTES.toString("base64"),
                visibility: "PUBLIC",
                ...fieldOverrides,
            },
        },
    }
}

/**
 * Runs a block with an env override; the validated-env cache is reset around
 * it so services see the override.
 */
async function withEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map<string, string | undefined>()
    for (const [name, value] of Object.entries(overrides)) {
        originals.set(name, process.env[name])
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, value] of originals) {
            if (value === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = value
            }
        }
        resetValidatedEnvForTests()
    }
}

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const PDF_BYTES = Buffer.from("%PDF-1.4 server-side")

describe("Storage", function () {
    describe("HTTP surface (storage__request__api, STORAGE_MODE=local)", function () {
        let server: Server
        let baseUrl: string

        beforeEach(function (done) {
            server = createServer(buildStorageExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                done()
            })
        })

        afterEach(function (done) {
            server.close(() => done())
        })

        async function putBytes(uploadUrl: string, headersJson: string, body: Buffer): Promise<Response> {
            return await fetch(`${baseUrl}${uploadUrl}`, {
                method: "PUT",
                headers: JSON.parse(headersJson) as Record<string, string>,
                body,
            })
        }

        it("runs the full lifecycle: create, PUT bytes, finalize, serve, delete", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)

            const slot = await executeGqlAt<GqlUploadSlotResult>(
                this.apolloServer,
                createUploadMutation,
                createUploadInput(),
                "createUpload",
                principal,
            )
            expect(slot.upload.status).to.equal("PENDING")
            expect(slot.uploadUrl).to.match(/^\/upload\?token=/)
            expect(JSON.parse(slot.headersJson)).to.deep.equal({ "Content-Type": "image/png" })

            // Serving and finalize both refuse before the bytes arrive.
            const notReady = await fetch(`${baseUrl}/file/${slot.uploadId}`)
            expect(notReady.status).to.equal(404)

            const putResponse = await putBytes(slot.uploadUrl, slot.headersJson, PNG_BYTES)
            expect(putResponse.status).to.equal(200)

            const finalized = await executeGqlAt<GqlUploadResult>(
                this.apolloServer,
                finalizeUploadMutation,
                { input: { uploadId: slot.uploadId } },
                "finalizeUpload",
                principal,
            )
            expect(finalized.status).to.equal("READY")
            expect(finalized.sizeBytes).to.equal(PNG_BYTES.length)

            // PUBLIC: the stable serving URL works with no token.
            const fileUrl = await executeGqlAt<{ url: string }>(
                this.apolloServer,
                fileUrlQuery,
                { uploadId: slot.uploadId },
                "fileUrl",
                principal,
            )
            expect(fileUrl.url).to.equal(`/file/${slot.uploadId}`)
            const served = await fetch(`${baseUrl}${fileUrl.url}`)
            expect(served.status).to.equal(200)
            expect(served.headers.get("content-type")).to.contain("image/png")
            expect(Buffer.from(await served.arrayBuffer())).to.deep.equal(PNG_BYTES)

            // Delete removes the object and the row.
            const deleted = await executeGqlAt<boolean>(
                this.apolloServer,
                deleteUploadMutation,
                { input: { uploadId: slot.uploadId } },
                "deleteUpload",
                principal,
            )
            expect(deleted).to.equal(true)
            const gone = await fetch(`${baseUrl}/file/${slot.uploadId}`)
            expect(gone.status).to.equal(404)
        })

        it("serves PRIVATE files only with the owner-minted token", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)

            const slot = await executeGqlAt<GqlUploadSlotResult>(
                this.apolloServer,
                createUploadMutation,
                createUploadInput({ visibility: "PRIVATE" }),
                "createUpload",
                principal,
            )
            await putBytes(slot.uploadUrl, slot.headersJson, PNG_BYTES)
            await executeGqlAt(
                this.apolloServer,
                finalizeUploadMutation,
                { input: { uploadId: slot.uploadId } },
                "finalizeUpload",
                principal,
            )

            // No token: refused.
            const bare = await fetch(`${baseUrl}/file/${slot.uploadId}`)
            expect(bare.status).to.equal(403)

            // The owner's fileUrl carries a token that serves.
            const fileUrl = await executeGqlAt<{ url: string }>(
                this.apolloServer,
                fileUrlQuery,
                { uploadId: slot.uploadId },
                "fileUrl",
                principal,
            )
            expect(fileUrl.url).to.match(new RegExp(`^/file/${slot.uploadId}\\?token=`))
            const served = await fetch(`${baseUrl}${fileUrl.url}`)
            expect(served.status).to.equal(200)

            // An upload-scoped token can never download.
            const uploadToken = new URL(`${baseUrl}${slot.uploadUrl}`).searchParams.get("token")
            assert(uploadToken !== null)
            const crossScope = await fetch(
                `${baseUrl}/file/${slot.uploadId}?token=${encodeURIComponent(uploadToken)}`,
            )
            expect(crossScope.status).to.equal(403)
        })

        it("refuses PUT bytes exceeding the declared slot's rules", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            const slot = await executeGqlAt<GqlUploadSlotResult>(
                this.apolloServer,
                createUploadMutation,
                createUploadInput(),
                "createUpload",
                principal,
            )

            // Mismatched content type.
            const mismatched = await fetch(`${baseUrl}${slot.uploadUrl}`, {
                method: "PUT",
                headers: { "Content-Type": "application/pdf" },
                body: PNG_BYTES,
            })
            expect(mismatched.status).to.equal(400)

            // A forged token.
            const forged = await fetch(`${baseUrl}/upload?token=forged`, {
                method: "PUT",
                headers: { "Content-Type": "image/png" },
                body: PNG_BYTES,
            })
            expect(forged.status).to.equal(401)
        })
    })

    describe("ownership", function () {
        async function createSecondUserPrincipal(context: Mocha.Context): Promise<ReturnType<typeof asUser>> {
            const account = context.defaults.account!
            const other = await context.identityHelper.createAndGetUser(
                buildCreateUserInput({
                    fields: buildCreateUserFields({ accountId: account.id }),
                }),
            )
            return asUser(other)
        }

        it("refuses finalize, private fileUrl, and delete from a non-owner", async function () {
            await addDefaults(this, ["account", "user"])
            const owner = asUser(this.defaults.user!)
            const stranger = await createSecondUserPrincipal(this)

            const slot = await executeGqlAt<GqlUploadSlotResult>(
                this.apolloServer,
                createUploadMutation,
                createUploadInput({ visibility: "PRIVATE" }),
                "createUpload",
                owner,
            )

            const finalizeDenied = await executeGql(
                this.apolloServer,
                finalizeUploadMutation,
                { input: { uploadId: slot.uploadId } },
                stranger,
            )
            expect(firstGqlError(finalizeDenied).code).to.equal("PERMISSION_DENIED")

            const deleteDenied = await executeGql(
                this.apolloServer,
                deleteUploadMutation,
                { input: { uploadId: slot.uploadId } },
                stranger,
            )
            expect(firstGqlError(deleteDenied).code).to.equal("PERMISSION_DENIED")

            // Finalize as the owner, then check the private URL stays owner-only.
            const server = createServer(buildStorageExpressApp())
            await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
            try {
                const address = server.address() as AddressInfo
                const uploadToken = new URL(
                    `http://127.0.0.1:${address.port}${slot.uploadUrl}`,
                ).searchParams.get("token")
                assert(uploadToken !== null)
                await fetch(`http://127.0.0.1:${address.port}${slot.uploadUrl}`, {
                    method: "PUT",
                    headers: JSON.parse(slot.headersJson) as Record<string, string>,
                    body: PNG_BYTES,
                })
            } finally {
                await new Promise<void>((resolve) => server.close(() => resolve()))
            }
            await executeGqlAt(
                this.apolloServer,
                finalizeUploadMutation,
                { input: { uploadId: slot.uploadId } },
                "finalizeUpload",
                owner,
            )

            const urlDenied = await executeGql(
                this.apolloServer,
                fileUrlQuery,
                { uploadId: slot.uploadId },
                stranger,
            )
            expect(firstGqlError(urlDenied).code).to.equal("PERMISSION_DENIED")
        })

        // The gate throws from the Apollo request pipeline (not a resolver),
        // matching the payments precedent for anonymous callers.
        it("requires an authenticated caller", async function () {
            await expect(
                executeGql(this.apolloServer, createUploadMutation, createUploadInput(), null),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })
    })

    describe("validation", function () {
        it("refuses a content type outside the allowlist", async function () {
            const response = await executeGql(
                this.apolloServer,
                createUploadMutation,
                createUploadInput({ contentType: "application/x-msdownload" }),
                testHarnessPrincipal,
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("INVALID_ARGUMENT")
            expect(error.message).to.contain("not allowed")
        })

        it("refuses a declared size above the cap and non-positive sizes", async function () {
            const tooBig = await executeGql(
                this.apolloServer,
                createUploadMutation,
                createUploadInput({ sizeBytes: 20 * 1024 * 1024 + 1 }),
                testHarnessPrincipal,
            )
            expect(firstGqlError(tooBig).code).to.equal("INVALID_ARGUMENT")

            const zero = await executeGql(
                this.apolloServer,
                createUploadMutation,
                createUploadInput({ sizeBytes: 0 }),
                testHarnessPrincipal,
            )
            expect(firstGqlError(zero).code).to.equal("INVALID_ARGUMENT")
        })

        it("refuses finalize before any bytes arrived", async function () {
            const slot = await executeGqlAt<GqlUploadSlotResult>(
                this.apolloServer,
                createUploadMutation,
                createUploadInput(),
                "createUpload",
            )
            const response = await executeGql(this.apolloServer, finalizeUploadMutation, {
                input: { uploadId: slot.uploadId },
            })
            expect(firstGqlError(response).code).to.equal("FAILED_PRECONDITION")
        })
    })

    describe("writeFile (server-side write path)", function () {
        let server: Server
        let baseUrl: string

        beforeEach(function (done) {
            server = createServer(buildStorageExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                done()
            })
        })

        afterEach(function (done) {
            server.close(() => done())
        })

        it("files inline bytes end to end, with record parity against the browser flow", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)

            // The browser flow for the same file, as the parity baseline.
            const slot = await executeGqlAt<GqlUploadSlotResult>(
                this.apolloServer,
                createUploadMutation,
                createUploadInput(),
                "createUpload",
                principal,
            )
            await fetch(`${baseUrl}${slot.uploadUrl}`, {
                method: "PUT",
                headers: JSON.parse(slot.headersJson) as Record<string, string>,
                body: PNG_BYTES,
            })
            const browserFiled = await executeGqlAt<GqlUploadResult>(
                this.apolloServer,
                finalizeUploadMutation,
                { input: { uploadId: slot.uploadId } },
                "finalizeUpload",
                principal,
            )

            const filed = await executeGqlAt<GqlWriteFileResult>(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({ fileName: "pixel.png" }),
                "writeFile",
                principal,
            )

            // The same record shape the browser path returns, already READY —
            // the only intended difference is the fileName only this path carries.
            expect(Object.keys(filed).sort()).to.deep.equal(
                ["contentType", "fileName", "id", "sizeBytes", "status", "visibility"].sort(),
            )
            expect(filed.status).to.equal(browserFiled.status)
            expect(filed.sizeBytes).to.equal(browserFiled.sizeBytes)
            expect(filed.contentType).to.equal("image/png")
            expect(filed.visibility).to.equal("PUBLIC")
            expect(filed.fileName).to.equal("pixel.png")

            // The bytes landed in the local store and serve through /file/<id>.
            const served = await fetch(`${baseUrl}/file/${filed.id}`)
            expect(served.status).to.equal(200)
            expect(served.headers.get("content-type")).to.contain("image/png")
            expect(Buffer.from(await served.arrayBuffer())).to.deep.equal(PNG_BYTES)
        })

        it("refuses HTML and other content types outside the allowlist", async function () {
            const html = await executeGql(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({
                    contentType: "text/html",
                    bytesBase64: Buffer.from("<script>alert(1)</script>").toString("base64"),
                }),
                testHarnessPrincipal,
            )
            const htmlError = firstGqlError(html)
            expect(htmlError.code).to.equal("INVALID_ARGUMENT")
            expect(htmlError.message).to.contain("not allowed")

            const exe = await executeGql(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({ contentType: "application/x-msdownload" }),
                testHarnessPrincipal,
            )
            expect(firstGqlError(exe).code).to.equal("INVALID_ARGUMENT")
        })

        it("refuses bytes above the kernel cap and empty bytes", async function () {
            const tooBig = await executeGql(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({
                    bytesBase64: Buffer.alloc(20 * 1024 * 1024 + 1).toString("base64"),
                }),
                testHarnessPrincipal,
            )
            expect(firstGqlError(tooBig).code).to.equal("INVALID_ARGUMENT")

            const empty = await executeGql(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({ bytesBase64: "" }),
                testHarnessPrincipal,
            )
            expect(firstGqlError(empty).code).to.equal("INVALID_ARGUMENT")
        })

        it("refuses bytesBase64 that is not valid base64", async function () {
            const response = await executeGql(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({ bytesBase64: "not-valid!!!" }),
                testHarnessPrincipal,
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("INVALID_ARGUMENT")
            expect(error.message).to.contain("base64")
        })

        it("replays the idempotency key without rewriting the bytes", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            const key = randomUUID()

            const first = await executeGqlAt<GqlWriteFileResult>(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({ idempotencyKey: key }),
                "writeFile",
                principal,
            )
            // A retry with the same key but different bytes gets the original
            // row back; the second payload never lands.
            const replay = await executeGqlAt<GqlWriteFileResult>(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({
                    idempotencyKey: key,
                    bytesBase64: Buffer.from([0xde, 0xad, 0xbe, 0xef]).toString("base64"),
                }),
                "writeFile",
                principal,
            )
            expect(replay.id).to.equal(first.id)
            expect(replay.sizeBytes).to.equal(PNG_BYTES.length)

            const served = await fetch(`${baseUrl}/file/${first.id}`)
            expect(Buffer.from(await served.arrayBuffer())).to.deep.equal(PNG_BYTES)
        })

        it("requires an authenticated caller", async function () {
            await expect(
                executeGql(this.apolloServer, writeFileMutation, writeFileInput(), null),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })

        it("lets only the owner manage the filed upload", async function () {
            await addDefaults(this, ["account", "user"])
            const owner = asUser(this.defaults.user!)
            const stranger = asUser(
                await this.identityHelper.createAndGetUser(
                    buildCreateUserInput({
                        fields: buildCreateUserFields({ accountId: this.defaults.account!.id }),
                    }),
                ),
            )

            const filed = await executeGqlAt<GqlWriteFileResult>(
                this.apolloServer,
                writeFileMutation,
                writeFileInput({ visibility: "PRIVATE" }),
                "writeFile",
                owner,
            )

            const urlDenied = await executeGql(
                this.apolloServer,
                fileUrlQuery,
                { uploadId: filed.id },
                stranger,
            )
            expect(firstGqlError(urlDenied).code).to.equal("PERMISSION_DENIED")

            const deleteDenied = await executeGql(
                this.apolloServer,
                deleteUploadMutation,
                { input: { uploadId: filed.id } },
                stranger,
            )
            expect(firstGqlError(deleteDenied).code).to.equal("PERMISSION_DENIED")
        })
    })

    describe("STORAGE_MODE=gcs (stubbed wrapper)", function () {
        const gcsEnv = {
            STORAGE_MODE: "gcs",
            STORAGE_BUCKET: "test-bucket",
            STORAGE_PREFIX: "env-slug",
        }

        afterEach(function () {
            setStorageWrapperForTests(undefined)
        })

        it("mints signed upload/download URLs under the environment prefix and verifies at finalize", async function () {
            const fake = new FakeStorageWrapper()
            setStorageWrapperForTests(fake)
            await withEnv(gcsEnv, async () => {
                const slot = await executeGqlAt<GqlUploadSlotResult>(
                    this.apolloServer,
                    createUploadMutation,
                    createUploadInput({ visibility: "PRIVATE" }),
                    "createUpload",
                )
                expect(slot.uploadUrl).to.contain("https://storage.fake/test-bucket/")
                expect(fake.signedUploadRequests).to.have.length(1)
                const key = fake.signedUploadRequests[0].key
                expect(key).to.equal(`env-slug/uploads/${slot.uploadId}`)

                // Finalize refuses until the object exists in the bucket.
                const early = await executeGql(this.apolloServer, finalizeUploadMutation, {
                    input: { uploadId: slot.uploadId },
                })
                expect(firstGqlError(early).code).to.equal("FAILED_PRECONDITION")

                fake.simulateUploadedObject("test-bucket", key, {
                    sizeBytes: PNG_BYTES.length,
                    contentType: "image/png",
                })
                const finalized = await executeGqlAt<GqlUploadResult>(
                    this.apolloServer,
                    finalizeUploadMutation,
                    { input: { uploadId: slot.uploadId } },
                    "finalizeUpload",
                )
                expect(finalized.status).to.equal("READY")
                expect(finalized.sizeBytes).to.equal(PNG_BYTES.length)

                // PRIVATE resolves to a signed GCS download URL for the owner.
                const fileUrl = await executeGqlAt<{ url: string }>(
                    this.apolloServer,
                    fileUrlQuery,
                    { uploadId: slot.uploadId },
                    "fileUrl",
                )
                expect(fileUrl.url).to.contain("signature=download")

                // Delete removes the object through the wrapper and the row.
                await executeGqlAt(
                    this.apolloServer,
                    deleteUploadMutation,
                    { input: { uploadId: slot.uploadId } },
                    "deleteUpload",
                )
                expect(fake.deletedKeys).to.deep.equal([`test-bucket/${key}`])
            })
        })

        it("keeps the stable /file URL for PUBLIC files and refuses the local PUT route", async function () {
            const fake = new FakeStorageWrapper()
            setStorageWrapperForTests(fake)
            await withEnv(gcsEnv, async () => {
                const slot = await executeGqlAt<GqlUploadSlotResult>(
                    this.apolloServer,
                    createUploadMutation,
                    createUploadInput(),
                    "createUpload",
                )
                const key = fake.signedUploadRequests[0].key
                fake.simulateUploadedObject("test-bucket", key, {
                    sizeBytes: PNG_BYTES.length,
                    contentType: "image/png",
                })
                await executeGqlAt(
                    this.apolloServer,
                    finalizeUploadMutation,
                    { input: { uploadId: slot.uploadId } },
                    "finalizeUpload",
                )
                const fileUrl = await executeGqlAt<{ url: string }>(
                    this.apolloServer,
                    fileUrlQuery,
                    { uploadId: slot.uploadId },
                    "fileUrl",
                )
                expect(fileUrl.url).to.equal(`/file/${slot.uploadId}`)

                // The local-mode ingest route refuses in gcs mode.
                const server = createServer(buildStorageExpressApp())
                await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
                try {
                    const address = server.address() as AddressInfo
                    const refused = await fetch(`http://127.0.0.1:${address.port}/upload?token=any`, {
                        method: "PUT",
                        headers: { "Content-Type": "image/png" },
                        body: PNG_BYTES,
                    })
                    expect(refused.status).to.equal(409)

                    // PUBLIC serving 302s to a fresh signed GCS URL.
                    const served = await fetch(`http://127.0.0.1:${address.port}/file/${slot.uploadId}`, {
                        redirect: "manual",
                    })
                    expect(served.status).to.equal(302)
                    expect(served.headers.get("location")).to.contain("signature=download")
                } finally {
                    await new Promise<void>((resolve) => server.close(() => resolve()))
                }
            })
        })

        it("writeFile writes the object through the wrapper under the environment prefix", async function () {
            const fake = new FakeStorageWrapper()
            setStorageWrapperForTests(fake)
            await withEnv(gcsEnv, async () => {
                const filed = await executeGqlAt<GqlWriteFileResult>(
                    this.apolloServer,
                    writeFileMutation,
                    writeFileInput({
                        contentType: "application/pdf",
                        bytesBase64: PDF_BYTES.toString("base64"),
                        visibility: "PRIVATE",
                        fileName: "invoice-2026-08-09.pdf",
                    }),
                    "writeFile",
                )
                // READY in one call: the wrapper write plus the same finalize
                // verification the browser flow uses.
                expect(filed.status).to.equal("READY")
                expect(filed.sizeBytes).to.equal(PDF_BYTES.length)
                expect(filed.fileName).to.equal("invoice-2026-08-09.pdf")

                expect(fake.signedUploadRequests).to.have.length(0)
                expect(fake.uploadedObjects).to.have.length(1)
                const written = fake.uploadedObjects[0]
                expect(written.bucket).to.equal("test-bucket")
                expect(written.key).to.equal(`env-slug/uploads/${filed.id}`)
                expect(written.contentType).to.equal("application/pdf")
                expect(written.bytes.equals(PDF_BYTES)).to.equal(true)

                // PRIVATE download still resolves through the signed-URL path.
                const fileUrl = await executeGqlAt<{ url: string }>(
                    this.apolloServer,
                    fileUrlQuery,
                    { uploadId: filed.id },
                    "fileUrl",
                )
                expect(fileUrl.url).to.contain("signature=download")
            })
        })

        it("writeFile fails with the setup spelled out when STORAGE_BUCKET is missing", async function () {
            const fake = new FakeStorageWrapper()
            setStorageWrapperForTests(fake)
            await withEnv({ STORAGE_MODE: "gcs", STORAGE_BUCKET: undefined }, async () => {
                const response = await executeGql(
                    this.apolloServer,
                    writeFileMutation,
                    writeFileInput(),
                    testHarnessPrincipal,
                )
                const error = firstGqlError(response)
                expect(error.code).to.equal("FAILED_PRECONDITION")
                expect(error.message).to.contain("STORAGE_BUCKET")
            })
        })

        it("fails at first use with the setup spelled out when STORAGE_BUCKET is missing", async function () {
            const fake = new FakeStorageWrapper()
            setStorageWrapperForTests(fake)
            await withEnv({ STORAGE_MODE: "gcs", STORAGE_BUCKET: undefined }, async () => {
                const response = await executeGql(
                    this.apolloServer,
                    createUploadMutation,
                    createUploadInput(),
                    testHarnessPrincipal,
                )
                const error = firstGqlError(response)
                expect(error.code).to.equal("FAILED_PRECONDITION")
                expect(error.message).to.contain("STORAGE_BUCKET")
            })
        })
    })

    describe("boot guard for the local mode", function () {
        // Deployed = neither emulator nor tests, faked via env overrides. The
        // sibling kernels' local modes are lifted to their deployed values so
        // only the storage guard is under test.
        const deployedBase = {
            NODE_ENV: "production",
            FUNCTIONS_EMULATOR: undefined,
            AUTH_MODE: "builtin",
            PAYMENTS_MODE: "stripe",
            STORAGE_MODE: "local",
        }

        it("refuses STORAGE_MODE=local on deployed production posture", async function () {
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: "prod" }, async () => {
                expect(() => validatedEnv()).to.throw("Production must set STORAGE_MODE=gcs")
            })
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: undefined }, async () => {
                expect(() => validatedEnv()).to.throw("Production must set STORAGE_MODE=gcs")
            })
        })

        it("allows STORAGE_MODE=local on dev-posture deploys (disk fallback before storage is provisioned)", async function () {
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: "dev" }, async () => {
                expect(validatedEnv().STORAGE_MODE).to.equal("local")
            })
        })
    })
})
