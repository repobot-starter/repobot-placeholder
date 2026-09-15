import { MailWrapper, SendMailRequest } from "./MailWrapper.js"

/**
 * In-memory mail sender for the emulator and tests. Messages are recorded
 * (and logged under the emulator so the sign-in code is visible in the
 * console) instead of delivered.
 */
export class FakeMailWrapper implements MailWrapper {
    readonly sentMessages: SendMailRequest[] = []

    isConfigured(): boolean {
        return true
    }

    async sendMail(request: SendMailRequest): Promise<void> {
        this.sentMessages.push(request)
        if (process.env.NODE_ENV !== "test") {
            console.info(`[FakeMail] to=${request.toEmail} subject="${request.subject}"`)
        }
    }

    /** Test helper: the most recent message sent to an address. */
    lastMessageTo(email: string): SendMailRequest | undefined {
        for (let index = this.sentMessages.length - 1; index >= 0; index -= 1) {
            if (this.sentMessages[index].toEmail === email) {
                return this.sentMessages[index]
            }
        }
        return undefined
    }
}
