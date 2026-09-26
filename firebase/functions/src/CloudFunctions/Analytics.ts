import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { z } from "zod"
import { analyticsService } from "../Services/Analytics/AnalyticsService.js"

/**
 * The analytics kernel's HTTP surface (docs/analytics.md): the pageview
 * beacon. POST /pageview records one first-party, cookieless pageview —
 * the client sends only the path; the visitor identity is a daily-salted
 * hash of the request's IP + user agent computed server-side and never
 * stored raw.
 *
 * The endpoint is deliberately public (a pageview ping precedes any
 * sign-in) and deliberately boring: tiny body cap, fire-and-forget 204,
 * and a swallow-everything error path — analytics must never break or
 * slow the app it measures.
 */
export const analytics__request__api = onRequest({ cors: true }, buildAnalyticsExpressApp())

const pageviewBody = z.object({
    /** The visited path; normalization (query strip, caps) is server-side. */
    path: z.string().min(1).max(2048),
})

export function buildAnalyticsExpressApp(): express.Express {
    const app = express()
    app.use(express.json({ limit: "4kb" }))

    app.post("/pageview", async (request: Request, response: Response) => {
        try {
            const body = pageviewBody.parse(request.body)
            await analyticsService.recordPageview({
                path: body.path,
                ip: clientIpFor(request),
                userAgent: request.header("user-agent") ?? "",
            })
            response.status(204).end()
        } catch (error) {
            if (error instanceof z.ZodError) {
                response.status(400).json({
                    error: {
                        code: "INVALID_ARGUMENT",
                        message: error.issues[0]?.message ?? "Invalid pageview.",
                    },
                })
                return
            }
            // A failing beacon must never surface to the visitor's page —
            // log it and answer 204 like nothing happened.
            console.error("Recording a pageview failed.", error)
            response.status(204).end()
        }
    })

    return app
}

/**
 * The visitor's IP: the first X-Forwarded-For hop (the Cloud Functions
 * frontend appends its own addresses after the client's), else the socket
 * address. Used only as hash input — never stored.
 */
function clientIpFor(request: Request): string {
    const forwarded = request.header("x-forwarded-for")
    if (forwarded !== undefined && forwarded.trim() !== "") {
        return forwarded.split(",")[0]?.trim() ?? ""
    }
    return request.ip ?? ""
}
