import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { z } from "zod"
import { readLocalObject } from "../Services/Storage/LocalStorageStore.js"
import { maxUploadSizeBytesAcrossProfiles } from "../Services/Storage/StorageConfig.js"
import { storageService } from "../Services/Storage/StorageService.js"
import { httpStatusFromRpcStatus, RpcError } from "../Utils/RpcError.js"

/**
 * The storage kernel's HTTP surface. Clients derive this URL from their
 * GraphQL URL by swapping the trailing function name (storage__request__api),
 * which holds in every environment because the emulator and the platform
 * deployer treat all exports uniformly.
 *
 * PUT /upload?token=... exists only when STORAGE_MODE=local: the token-guarded
 * upload slot that createUpload minted. Bytes are written to the local
 * storage root and the row is finalized in the same request. In gcs mode
 * clients PUT directly to the V4 signed GCS URL and this route refuses.
 *
 * GET /file/<id> is the stable serving URL in BOTH modes — the one URL apps
 * embed in <img> tags and links. PUBLIC files serve freely; PRIVATE files
 * require the short-lived download token minted by fileUrl. Local mode
 * streams the bytes from disk; gcs mode 302s to a fresh short-lived signed
 * GCS URL, so the bucket never needs public ACLs and clients never see
 * bucket credentials. See docs/storage.md.
 */
export const storage__request__api = onRequest({ cors: true }, buildStorageExpressApp())

export function buildStorageExpressApp(): express.Express {
    const app = express()

    app.put(
        "/upload",
        // The body is the file itself; accept any content type as raw bytes.
        // The transport limit is the largest profile cap; the per-upload cap
        // is enforced against the row's own profile in the service.
        express.raw({ type: "*/*", limit: maxUploadSizeBytesAcrossProfiles() }),
        asyncRoute(async (request, response) => {
            const token = z.string().min(1).parse(request.query.token)
            const upload = await storageService.receiveLocalUploadBytes({
                token,
                contentType: request.header("content-type"),
                bytes: requestBytes(request),
            })
            response.json({ uploadId: upload.id, status: upload.status })
        }),
    )

    app.get(
        "/file/:uploadId",
        asyncRoute(async (request, response) => {
            const uploadId = z.string().min(1).parse(request.params.uploadId)
            const token = typeof request.query.token === "string" ? request.query.token : undefined
            const plan = await storageService.resolveServing({ uploadId, token })

            if (plan.kind === "redirect") {
                response.redirect(302, plan.redirectUrl)
                return
            }
            const bytes = await readLocalObject(plan.upload.storageKey)
            if (bytes === undefined) {
                throw new RpcError("NOT_FOUND", "The stored file is missing.")
            }
            response.status(200)
            response.setHeader("content-type", plan.upload.contentType)
            response.setHeader("content-length", String(bytes.length))
            response.send(bytes)
        }),
    )

    return app
}

/**
 * The PUT body as raw bytes. The firebase-functions runtime pre-parses
 * text/* and application/json bodies before the route's express.raw can run
 * (req.body arrives as a string or object, and the stream is spent), so fall
 * back to the exact bytes the runtime preserved in rawBody.
 */
function requestBytes(request: Request): Buffer {
    if (Buffer.isBuffer(request.body)) {
        return request.body
    }
    const rawBody = (request as Request & { rawBody?: unknown }).rawBody
    if (Buffer.isBuffer(rawBody)) {
        return rawBody
    }
    if (typeof request.body === "string") {
        return Buffer.from(request.body)
    }
    return Buffer.alloc(0)
}

type RouteHandler = (request: Request, response: Response) => Promise<void>

function asyncRoute(handler: RouteHandler): RouteHandler {
    return async (request, response) => {
        try {
            await handler(request, response)
        } catch (error) {
            if (error instanceof z.ZodError) {
                response.status(400).json({
                    error: {
                        code: "INVALID_ARGUMENT",
                        message: error.issues[0]?.message ?? "Invalid request.",
                    },
                })
                return
            }
            if (error instanceof RpcError) {
                response
                    .status(httpStatusFromRpcStatus(error.status))
                    .json({ error: { code: error.status, message: error.message } })
                return
            }
            console.error("Unexpected storage API failure.", error)
            response.status(500).json({ error: { code: "INTERNAL", message: "Unexpected storage failure." } })
        }
    }
}
