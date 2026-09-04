import { RpcError } from "../../Utils/RpcError.js"

/**
 * The mail kernel's template registry. A transactional email is a template
 * key plus variables — never inline HTML at the call site. Templates use
 * `{{variable}}` placeholders; values are HTML-escaped at render time, so
 * user- or provider-supplied strings can never inject markup.
 *
 * (Auth emails are the one exception: they keep the platform's
 * repobot.emails.json contract with Go-template variables and live-config
 * overrides — see Services/Identity/BuiltinAuth/AuthEmailTemplates.ts.)
 */

export interface MailTemplate {
    subject: string
    html: string
}

export const mailTemplates = {
    /** The payments kernel's receipt, sent when a purchase is ledgered with a buyer email. */
    purchaseReceipt: {
        subject: "Your receipt for {{productName}}",
        html:
            `<h2>Thanks for your purchase</h2>\n` +
            `<p>This confirms your payment for <strong>{{productName}}</strong>.</p>\n` +
            `<p style="font-size:24px;font-weight:bold">{{amountLabel}}</p>\n` +
            `<p>Order reference: <code>{{orderReference}}</code></p>\n` +
            `<p>Keep this email for your records.</p>`,
    },
    /** The CFO practice domain's client invite, sent when an advisor invites an email. */
    cfoClientInvite: {
        subject: "{{advisorName}} invited you to {{siteName}}",
        html:
            `<h2>You're invited</h2>\n` +
            `<p><strong>{{advisorName}}</strong> uses <strong>{{siteName}}</strong> to keep an eye on their clients' books, and has invited you to join as a client.</p>\n` +
            `<p>Create your account with this email address, connect your accounting software, and your advisor gets live visibility into your numbers — nothing to install, nothing to export.</p>\n` +
            `<p><a href="{{signInUrl}}" style="display:inline-block;padding:10px 18px;background:#1f6feb;color:#ffffff;text-decoration:none;border-radius:6px">Create your account</a></p>\n` +
            `<p>Or open {{signInUrl}} in your browser.</p>`,
    },
    /** The payments kernel's subscription receipt, sent once when a subscription activates. */
    subscriptionStarted: {
        subject: "Your subscription to {{productName}} has started",
        html:
            `<h2>Your subscription is active</h2>\n` +
            `<p>This confirms your subscription to <strong>{{productName}}</strong>.</p>\n` +
            `<p style="font-size:24px;font-weight:bold">{{amountLabel}} / {{intervalLabel}}</p>\n` +
            `<p>Order reference: <code>{{orderReference}}</code></p>\n` +
            `<p>You can manage or cancel your subscription any time from your account's billing settings.</p>`,
    },
} satisfies Record<string, MailTemplate>

export type MailTemplateKey = keyof typeof mailTemplates

/**
 * Renders a template's subject and html by substituting `{{variable}}`
 * placeholders. Every placeholder must be supplied — a missing variable is a
 * programming error and throws INTERNAL rather than sending a broken email.
 */
export function renderMailTemplate(
    templateKey: MailTemplateKey,
    variables: Record<string, string>,
): MailTemplate {
    const template = mailTemplates[templateKey]
    const substitute = (value: string, escape: boolean): string =>
        value.replace(/\{\{\s*([A-Za-z][A-Za-z0-9]*)\s*\}\}/g, (_match, name: string) => {
            const replacement = variables[name]
            if (replacement === undefined) {
                throw new RpcError(
                    "INTERNAL",
                    `Mail template "${templateKey}" needs variable "${name}" but it was not supplied.`,
                )
            }
            return escape ? escapeHtml(replacement) : replacement
        })
    return {
        subject: substitute(template.subject, false),
        html: substitute(template.html, true),
    }
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}
