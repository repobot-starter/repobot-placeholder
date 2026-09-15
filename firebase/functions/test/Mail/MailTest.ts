import { expect } from "chai"
import {
    FakeMailWrapper,
    MailWrapper,
    setMailWrapperForTests,
} from "../../src/DependencyWrappers/MailWrapper/index.js"
import { mailService, renderMailTemplate } from "../../src/Services/Mail/index.js"

/** A transport with no delivery route, for exercising degraded mode. */
class UnconfiguredMailWrapper implements MailWrapper {
    sendAttempts = 0

    isConfigured(): boolean {
        return false
    }

    async sendMail(): Promise<void> {
        this.sendAttempts += 1
    }
}

describe("Mail", function () {
    afterEach(function () {
        setMailWrapperForTests(undefined)
    })

    describe("renderMailTemplate", function () {
        it("substitutes variables into subject and html", function () {
            const rendered = renderMailTemplate("purchaseReceipt", {
                productName: "The Lighthouse Letters",
                amountLabel: "$12.00",
                orderReference: "csn_123",
            })
            expect(rendered.subject).to.equal("Your receipt for The Lighthouse Letters")
            expect(rendered.html).to.contain("The Lighthouse Letters")
            expect(rendered.html).to.contain("$12.00")
            expect(rendered.html).to.contain("csn_123")
        })

        it("HTML-escapes variable values in the body", function () {
            const rendered = renderMailTemplate("purchaseReceipt", {
                productName: `<script>alert("x")</script>`,
                amountLabel: "$1.00",
                orderReference: "csn_123",
            })
            expect(rendered.html).to.not.contain("<script>")
            expect(rendered.html).to.contain("&lt;script&gt;")
        })

        it("throws INTERNAL when a template variable is missing", function () {
            expect(() => renderMailTemplate("purchaseReceipt", { productName: "Book" })).to.throw(
                /needs variable/,
            )
        })
    })

    describe("mailService.sendTemplatedMail", function () {
        it("renders and hands the message to the transport", async function () {
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)

            const sent = await mailService.sendTemplatedMail({
                toEmail: "buyer@example.com",
                templateKey: "purchaseReceipt",
                variables: {
                    productName: "The Lighthouse Letters",
                    amountLabel: "$12.00",
                    orderReference: "csn_123",
                },
            })

            expect(sent).to.equal(true)
            const message = mail.lastMessageTo("buyer@example.com")
            expect(message).to.not.equal(undefined)
            expect(message?.subject).to.equal("Your receipt for The Lighthouse Letters")
            expect(message?.html).to.contain("$12.00")
        })

        it("degrades to a no-op when no delivery route is configured", async function () {
            const unconfigured = new UnconfiguredMailWrapper()
            setMailWrapperForTests(unconfigured)

            const sent = await mailService.sendTemplatedMail({
                toEmail: "buyer@example.com",
                templateKey: "purchaseReceipt",
                variables: {
                    productName: "Book",
                    amountLabel: "$1.00",
                    orderReference: "csn_1",
                },
            })

            expect(sent).to.equal(false)
            expect(unconfigured.sendAttempts).to.equal(0)
        })
    })
})
