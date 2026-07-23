/**
 * Auth email rendering. Templates keep the established repobot.emails.json
 * contract — Go-template style variables `{{ .Token }}`,
 * `{{ .ConfirmationURL }}`, and `{{ .SiteURL }}` — so existing customized
 * templates keep working. Overrides arrive in the AUTH_EMAIL_TEMPLATES env
 * value as JSON, or as base64-encoded JSON (the platform stamps base64 so
 * the value survives the dotenv/shell transport); sections not overridden
 * fall back to the defaults below.
 */

export type AuthEmailType = "magicLink" | "confirmation" | "recovery"

export interface AuthEmailTemplate {
    subject: string
    html: string
}

export interface RenderAuthEmailVariables {
    token: string
    confirmationUrl: string
    siteUrl: string
}

const codeHtml = (heading: string, lead: string): string =>
    `<h2>${heading}</h2>\n<p>${lead}</p>\n` +
    `<p style="font-size:32px;font-weight:bold;letter-spacing:6px;font-family:monospace">{{ .Token }}</p>\n` +
    `<p>Or use this link: <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>\n` +
    `<p>If you didn't request this, you can ignore this email.</p>`

export const defaultAuthEmailTemplates: Record<AuthEmailType, AuthEmailTemplate> = {
    magicLink: {
        subject: "Your sign-in code",
        html: codeHtml("Sign in", "Enter this code in the app to sign in:"),
    },
    confirmation: {
        subject: "Your sign-up code",
        html: codeHtml("Confirm your sign-up", "Enter this code in the app to confirm your account:"),
    },
    recovery: {
        subject: "Your password reset code",
        html: codeHtml("Reset your password", "Enter this code in the app to reset your password:"),
    },
}

/**
 * Resolves the effective template for an email type: the AUTH_EMAIL_TEMPLATES
 * override when present and well-formed, else the kernel default. A malformed
 * override never breaks sign-in — it just falls back.
 */
export function resolveAuthEmailTemplate(type: AuthEmailType): AuthEmailTemplate {
    const raw = process.env.AUTH_EMAIL_TEMPLATES
    if (raw !== undefined && raw !== "") {
        try {
            const parsed = parseTemplatesValue(raw)
            const override = parsed[type]
            if (
                override !== undefined &&
                typeof override.subject === "string" &&
                override.subject.length > 0 &&
                typeof override.html === "string" &&
                override.html.length > 0
            ) {
                return { subject: override.subject, html: override.html }
            }
        } catch {
            // Malformed overrides fall back to defaults.
        }
    }
    return defaultAuthEmailTemplates[type]
}

/** Accepts raw JSON or base64-encoded JSON (the platform's transport form). */
function parseTemplatesValue(raw: string): Record<string, Partial<AuthEmailTemplate> | undefined> {
    try {
        return JSON.parse(raw) as Record<string, Partial<AuthEmailTemplate> | undefined>
    } catch {
        return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as Record<
            string,
            Partial<AuthEmailTemplate> | undefined
        >
    }
}

export function renderAuthEmail(
    template: AuthEmailTemplate,
    variables: RenderAuthEmailVariables,
): { subject: string; html: string } {
    const substitute = (value: string): string =>
        value.replace(/\{\{\s*\.(Token|ConfirmationURL|SiteURL)\s*\}\}/g, (_match, name: string) => {
            switch (name) {
                case "Token":
                    return variables.token
                case "ConfirmationURL":
                    return variables.confirmationUrl
                default:
                    return variables.siteUrl
            }
        })
    return { subject: substitute(template.subject), html: substitute(template.html) }
}
