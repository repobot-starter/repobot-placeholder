/**
 * Auth email rendering. Templates keep the established repobot.emails.json
 * contract — Go-template style variables `{{ .Token }}`,
 * `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, and `{{ .AppName }}` — so
 * existing customized templates keep working. Overrides arrive in the
 * AUTH_EMAIL_TEMPLATES env value as JSON, or as base64-encoded JSON (the
 * platform stamps base64 so the value survives the dotenv/shell transport);
 * sections not overridden fall back to the defaults below.
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
    /** Resolves {{ .AppName }}: the app's display name for the wordmark. */
    appName?: string
}

// The default templates render as a centered card (inline styles only —
// email clients strip <style> blocks) with the app's name as a wordmark, so
// a project that never customizes its emails still sends something that
// reads as the product, not as boilerplate.
const cardHtml = (heading: string, lead: string, action: string[]): string =>
    [
        `<div style="background:#f5f6f8;padding:32px 16px;font-family:-apple-system,'Segoe UI',Arial,Helvetica,sans-serif">`,
        `<div style="max-width:440px;margin:0 auto;background:#ffffff;border:1px solid #e5e8ec;border-radius:12px;padding:32px">`,
        `<p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:#1f6feb">{{ .AppName }}</p>`,
        `<h2 style="margin:0 0 8px;font-size:22px;color:#1a1f26">${heading}</h2>`,
        `<p style="margin:0 0 16px;font-size:15px;color:#4b5563">${lead}</p>`,
        ...action,
        `<p style="margin:0;font-size:13px;color:#8a919c">If you didn't request this, you can ignore this email.</p>`,
        `</div>`,
        `</div>`,
    ].join("\n")

// Code-first: the app's UI asks the user to type this code, with the link
// as a fallback.
const codeHtml = (heading: string, lead: string): string =>
    cardHtml(heading, lead, [
        `<p style="margin:0 0 16px;font-size:32px;font-weight:bold;letter-spacing:6px;font-family:monospace;color:#1a1f26">{{ .Token }}</p>`,
        `<p style="margin:0 0 24px;font-size:14px;color:#4b5563">Or use this link: <a href="{{ .ConfirmationURL }}" style="color:#1f6feb">{{ .ConfirmationURL }}</a></p>`,
    ])

// Link-first: the only action is clicking the button — no code, because the
// app has no surface to type one into for this flow.
const buttonHtml = (heading: string, lead: string, buttonLabel: string): string =>
    cardHtml(heading, lead, [
        `<p style="margin:0 0 24px"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1f6feb;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:8px">${buttonLabel}</a></p>`,
        `<p style="margin:0 0 24px;font-size:13px;color:#8a919c">If the button doesn't work, copy and paste this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#1f6feb;word-break:break-all">{{ .ConfirmationURL }}</a></p>`,
    ])

export const defaultAuthEmailTemplates: Record<AuthEmailType, AuthEmailTemplate> = {
    magicLink: {
        subject: "Your sign-in code",
        html: codeHtml("Sign in", "Enter this code in the app to sign in:"),
    },
    // Sign-up confirmation is link-only: unlike sign-in and recovery, the
    // app has no code-entry step after sign-up, so a code would strand the
    // user. Clicking the button verifies the email and signs them in.
    confirmation: {
        subject: "Confirm your email",
        html: buttonHtml(
            "Confirm your email",
            "Click the button below to verify your email address. You'll be signed in automatically.",
            "Verify email",
        ),
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
    const substitute = (value: string, escapeForHtml: boolean): string =>
        value.replace(/\{\{\s*\.(Token|ConfirmationURL|SiteURL|AppName)\s*\}\}/g, (_match, name: string) => {
            switch (name) {
                case "Token":
                    return variables.token
                case "ConfirmationURL":
                    return variables.confirmationUrl
                case "AppName": {
                    // The app name is the one free-form variable (env-provided),
                    // so it gets escaped in the body but stays literal in the
                    // subject line.
                    const appName = variables.appName ?? "Your app"
                    return escapeForHtml ? escapeHtml(appName) : appName
                }
                default:
                    return variables.siteUrl
            }
        })
    return {
        subject: substitute(template.subject, false),
        html: substitute(template.html, true),
    }
}

function escapeHtml(value: string): string {
    return value.replace(
        /[&<>"]/g,
        (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char,
    )
}
