import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { z } from "zod"
import { documentGenerationService } from "../Services/Documents/DocumentGenerationService.js"
import { listDocumentTemplates } from "../Services/Documents/DocumentTemplates.js"
import { principalService } from "../Services/Identity/PrincipalService.js"
import { validatedEnv } from "../Utils/Env.js"
import { httpStatusFromRpcStatus, RpcError } from "../Utils/RpcError.js"

/**
 * The documents API. Clients derive this URL from their GraphQL URL by
 * swapping the trailing function name (documents__request__api), which holds
 * in every environment because the emulator and the platform deployer treat
 * all exports uniformly.
 *
 * GET /templates lists the repo's document templates (key, name, fields,
 * sample). POST /generate renders one to PDF and streams the bytes back —
 * generation is stateless; nothing is stored server-side.
 *
 * /templates stays open: it serves static repo metadata (the web client
 * fetches it without credentials). /generate requires an authenticated
 * principal — rendering is metered compute, and an open endpoint would be a
 * free PDF service for anyone with the URL. Any session counts, including
 * anonymous guest sessions (the invoice page mints one for signed-out
 * visitors), which keeps callers rate-limitable and revocable.
 */
export const documents__request__api = onRequest({ cors: true }, buildDocumentsExpressApp())

export function buildDocumentsExpressApp(): express.Express {
    const app = express()
    app.use(express.json({ limit: "1mb" }))

    app.get(
        "/templates",
        asyncRoute(async (_request, response) => {
            const templates = listDocumentTemplates().map((template) => ({
                key: template.key,
                name: template.name,
                description: template.description,
                pageSize: template.pageSize,
                fields: template.fields,
                sample: template.sample,
            }))
            response.json({ templates })
        }),
    )

    app.post(
        "/generate",
        asyncRoute(async (request, response) => {
            // The same gate as the GraphQL surface: verification failures
            // throw UNAUTHENTICATED from principalFromAuthorizationHeader;
            // an absent header refuses here.
            const principal = await principalService.principalFromAuthorizationHeader(
                request.headers.authorization,
            )
            if (principal === undefined) {
                throw new RpcError("UNAUTHENTICATED", "This operation requires an authenticated caller.")
            }

            const body = z
                .object({
                    templateKey: z.string().min(1),
                    overrides: z.record(z.unknown()).default({}),
                })
                .parse(request.body)

            // Fail fast with an actionable message when env is misconfigured.
            validatedEnv()

            const generated = await documentGenerationService.generateDocument({
                templateKey: body.templateKey,
                overrides: body.overrides,
            })
            response.status(200)
            response.setHeader("content-type", "application/pdf")
            response.setHeader("content-disposition", `attachment; filename="${generated.fileName}"`)
            response.send(generated.pdf)
        }),
    )

    return app
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
            console.error("Unexpected documents API failure.", error)
            response
                .status(500)
                .json({ error: { code: "INTERNAL", message: "Unexpected documents failure." } })
        }
    }
}
