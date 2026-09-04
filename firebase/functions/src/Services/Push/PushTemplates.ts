import { RpcError } from "../../Utils/RpcError.js"

/**
 * The push kernel's template registry, mirroring MailTemplates: a
 * notification is a template key plus variables — never inline strings at
 * the call site. Templates use `{{variable}}` placeholders in title and
 * body. Unlike mail there is no HTML escaping: notifications are plain text
 * rendered by the OS/browser, so values are substituted verbatim.
 */

export interface PushTemplate {
    title: string
    body: string
}

export const pushTemplates = {
    /** The scheduled digest exemplar (docs/push.md): recent site activity. */
    activityDigest: {
        title: "Your activity digest",
        body: "{{pageviews}} pageviews in the last day. Open the app to see what's new.",
    },
} satisfies Record<string, PushTemplate>

export type PushTemplateKey = keyof typeof pushTemplates

/**
 * Renders a template's title and body by substituting `{{variable}}`
 * placeholders. Every placeholder must be supplied — a missing variable is a
 * programming error and throws INTERNAL rather than sending a broken
 * notification.
 */
export function renderPushTemplate(
    templateKey: PushTemplateKey,
    variables: Record<string, string>,
): PushTemplate {
    const template = pushTemplates[templateKey]
    const substitute = (value: string): string =>
        value.replace(/\{\{\s*([A-Za-z][A-Za-z0-9]*)\s*\}\}/g, (_match, name: string) => {
            const replacement = variables[name]
            if (replacement === undefined) {
                throw new RpcError(
                    "INTERNAL",
                    `Push template "${templateKey}" needs variable "${name}" but it was not supplied.`,
                )
            }
            return replacement
        })
    return {
        title: substitute(template.title),
        body: substitute(template.body),
    }
}
