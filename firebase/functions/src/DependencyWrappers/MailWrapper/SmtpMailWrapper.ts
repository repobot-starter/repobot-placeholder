import nodemailer, { type Transporter } from "nodemailer"
import { RpcError } from "../../Utils/RpcError.js"
import { MailWrapper, SendMailRequest } from "./MailWrapper.js"

/**
 * The real SMTP sender, used in deployed environments. The account is
 * injected by the platform at deploy time (SMTP_* env vars); when SMTP_HOST
 * is empty the auth service runs in degraded mode (signups auto-confirm,
 * OTP/recovery emails unavailable) and this wrapper is never asked to send.
 */
export class SmtpMailWrapper implements MailWrapper {
    private transporter: Transporter | undefined

    isConfigured(): boolean {
        const host = process.env.SMTP_HOST
        return host !== undefined && host !== ""
    }

    async sendMail(request: SendMailRequest): Promise<void> {
        if (!this.isConfigured()) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Email delivery is not configured for this environment (SMTP_HOST is empty).",
            )
        }
        const senderEmail = process.env.SMTP_SENDER_EMAIL ?? ""
        const senderName = process.env.SMTP_SENDER_NAME ?? ""
        await this.getTransporter().sendMail({
            from: senderName !== "" ? `"${senderName}" <${senderEmail}>` : senderEmail,
            to: request.toEmail,
            subject: request.subject,
            html: request.html,
        })
    }

    private getTransporter(): Transporter {
        if (this.transporter === undefined) {
            const port = Number(process.env.SMTP_PORT ?? "587")
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port,
                secure: port === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            })
        }
        return this.transporter
    }
}
