/**
 * Client half of the managed forms kernel (docs/landing.md): deployed sites
 * POST form submissions to a reserved path on their own origin, where the
 * platform's site router resolves the site from the Host header and forwards
 * to the control plane. Same-origin by design — no CORS, no baked-in site
 * ids, and it works identically on platform subdomains and custom domains.
 *
 * Outside a deployed site (sandbox dev server, local preview) the reserved
 * path does not exist, so `submitForm` falls back to a localStorage write —
 * the submit interaction always completes for the visitor.
 */

/** The reserved same-origin path the site router listens on. */
export const FORMS_SUBMIT_PATH = "/__forms/submit"

/**
 * The honeypot field name. Forms render it as a visually hidden input that
 * humans never fill; the platform silently drops submissions where it is
 * non-empty. The leading underscore marks it as machinery — the platform
 * never shows underscore-prefixed fields to the site owner.
 */
export const FORMS_HONEYPOT_FIELD = "_trap"

export interface SubmitFormRequest {
    /** The site's name for this form: "inquiry", "proofing-selection", "rsvp", ... */
    formKey: string
    /** The submitted fields; structured values (arrays, objects) are fine. */
    fields: Record<string, unknown>
    /**
     * localStorage key written when managed delivery is unreachable, so the
     * visitor's submit still completes in sandboxes and local previews.
     */
    fallbackStorageKey?: string
}

export interface SubmitFormResult {
    /** True when the platform accepted the submission; false on fallback. */
    delivered: boolean
}

/**
 * Submits one form through the managed pipeline, falling back to local
 * persistence when the pipeline is unreachable. Never throws: a visitor's
 * "send" click must always land on the confirmation state.
 */
export async function submitForm(request: SubmitFormRequest): Promise<SubmitFormResult> {
    try {
        const response = await fetch(FORMS_SUBMIT_PATH, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ formKey: request.formKey, fields: request.fields }),
        })
        if (response.ok) {
            return { delivered: true }
        }
    } catch {
        // Network failure — treated the same as a non-2xx below.
    }
    // Non-2xx or unreachable: the sandbox dev server (no site router), a
    // rate-limited burst, or an outage. Keep the visitor's submission.
    writeFallback(request)
    return { delivered: false }
}

function writeFallback(request: SubmitFormRequest): void {
    if (request.fallbackStorageKey === undefined) {
        return
    }
    try {
        localStorage.setItem(
            request.fallbackStorageKey,
            JSON.stringify({ formKey: request.formKey, ...request.fields }),
        )
    } catch {
        // Storage full or blocked — nothing else to do.
    }
}
