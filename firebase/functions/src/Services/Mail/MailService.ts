import { getMailWrapper } from "../../DependencyWrappers/MailWrapper/index.js"
import { mailQuotaService } from "./MailQuotaService.js"
import { MailTemplateKey, renderMailTemplate } from "./MailTemplates.js"

/**
 * The mail kernel: transactional email as template key + variables over the
 * shared MailWrapper transport. Domains compose this service (the payments
 * receipt is the exemplar) instead of touching SMTP or building HTML inline.
 *
 * Sandbox/deployed split follows the transport: under the emulator and in
 * tests the FakeMailWrapper records messages instead of delivering them; on a
 * deploy without the EMAIL capability (no SMTP_HOST) sends degrade to a log
 * line and report false, so mail stays best-effort and never fails the
 * calling flow.
 */
class MailService {
    /** True when messages will actually be delivered (or recorded by the fake). */
    isConfigured(): boolean {
        return getMailWrapper().isConfigured()
    }

    /**
     * Renders the template and sends it. Returns true when the message was
     * handed to the transport; false in degraded mode (no delivery route) or
     * when the daily send quota is exhausted (MailQuotaService, docs/mail.md),
     * which callers may ignore — transactional mail is best-effort by design.
     */
    async sendTemplatedMail(request: {
        toEmail: string
        templateKey: MailTemplateKey
        variables: Record<string, string>
    }): Promise<boolean> {
        const rendered = renderMailTemplate(request.templateKey, request.variables)
        const wrapper = getMailWrapper()
        if (!wrapper.isConfigured()) {
            console.info(
                `[Mail] degraded mode, not sent: template=${request.templateKey} ` +
                    `to=${request.toEmail} subject="${rendered.subject}"`,
            )
            return false
        }
        // Quota exhaustion degrades exactly like a missing transport; the
        // warning logs once per day inside the quota service, not per send.
        if (!(await mailQuotaService.tryReserveSend("template"))) {
            return false
        }
        await wrapper.sendMail({ toEmail: request.toEmail, ...rendered })
        return true
    }
}

export const mailService = new MailService()
