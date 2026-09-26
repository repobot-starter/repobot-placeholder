/**
 * The repo's boundary with email delivery, sent through the
 * platform-provisioned SMTP account. Two callers: the auth kernel's emails
 * (sign-in codes, confirmations, recovery) and the mail kernel
 * (Services/Mail), which all other transactional email goes through.
 */

export interface SendMailRequest {
    toEmail: string
    subject: string
    html: string
    /** Overrides the deploy-time SMTP_SENDER_* env (live sender-domain changes). */
    sender?: { email: string; name: string }
}

export interface MailWrapper {
    /** True when a delivery route is configured (SMTP_HOST set, or fake). */
    isConfigured(): boolean
    sendMail(request: SendMailRequest): Promise<void>
}
