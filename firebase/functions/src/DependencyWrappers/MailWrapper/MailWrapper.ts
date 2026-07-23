/**
 * The Identity domain's boundary with email delivery. Auth emails (sign-in
 * codes, sign-up confirmations, password recovery) are the kernel's only
 * outbound mail, sent through the platform-provisioned SMTP account.
 */

export interface SendMailRequest {
    toEmail: string
    subject: string
    html: string
}

export interface MailWrapper {
    /** True when a delivery route is configured (SMTP_HOST set, or fake). */
    isConfigured(): boolean
    sendMail(request: SendMailRequest): Promise<void>
}
