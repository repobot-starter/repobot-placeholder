import { expect } from "chai"
import { FakeMailWrapper, setMailWrapperForTests } from "../../src/DependencyWrappers/MailWrapper/index.js"
import {
    DEFAULT_MAIL_DAILY_QUOTA,
    mailQuotaService,
    mailService,
    resolveMailDailyQuota,
} from "../../src/Services/Mail/index.js"
import { builtinAuthService } from "../../src/Services/Identity/BuiltinAuth/BuiltinAuthService.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"

/**
 * Runs a block with an env override; the validated-env cache is reset around
 * it so the quota service sees the override.
 */
async function withEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map<string, string | undefined>()
    for (const [name, value] of Object.entries(overrides)) {
        originals.set(name, process.env[name])
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, value] of originals) {
            if (value === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = value
            }
        }
        resetValidatedEnvForTests()
    }
}

const receiptRequest = {
    toEmail: "buyer@example.com",
    templateKey: "purchaseReceipt",
    variables: { productName: "Book", amountLabel: "$1.00", orderReference: "csn_1" },
} as const

describe("MailQuota", function () {
    afterEach(function () {
        setMailWrapperForTests(undefined)
    })

    describe("resolveMailDailyQuota", function () {
        it("defaults to 200/day when unset, empty, or zero", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: undefined }, async () => {
                expect(resolveMailDailyQuota()).to.equal(DEFAULT_MAIL_DAILY_QUOTA)
            })
            await withEnv({ MAIL_DAILY_QUOTA: "" }, async () => {
                expect(resolveMailDailyQuota()).to.equal(DEFAULT_MAIL_DAILY_QUOTA)
            })
            await withEnv({ MAIL_DAILY_QUOTA: "0" }, async () => {
                expect(resolveMailDailyQuota()).to.equal(DEFAULT_MAIL_DAILY_QUOTA)
            })
        })

        it("uses the staged value, with negative meaning unlimited", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: "5" }, async () => {
                expect(resolveMailDailyQuota()).to.equal(5)
            })
            await withEnv({ MAIL_DAILY_QUOTA: "-1" }, async () => {
                expect(resolveMailDailyQuota()).to.equal(Number.POSITIVE_INFINITY)
            })
        })
    })

    describe("mailQuotaService.tryReserveSend", function () {
        it("reserves under the limit and counts remaining sends down", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: "3" }, async () => {
                expect(await mailQuotaService.remainingToday()).to.equal(3)
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                expect(await mailQuotaService.remainingToday()).to.equal(1)
                expect(await mailQuotaService.isQuotaExhausted()).to.equal(false)
            })
        })

        it("refuses template sends at the limit and reports exhaustion", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: "2" }, async () => {
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(false)
                expect(await mailQuotaService.remainingToday()).to.equal(0)
                expect(await mailQuotaService.isQuotaExhausted()).to.equal(true)
            })
        })

        it("lets auth mail keep sending until twice the quota", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: "2" }, async () => {
                // Template mail exhausts the quota...
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template")).to.equal(false)
                // ...but auth mail still has a full quota's worth of headroom
                // (the shared counter runs to 2x the quota for auth).
                expect(await mailQuotaService.tryReserveSend("auth")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("auth")).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("auth")).to.equal(false)
            })
        })

        it("treats a negative quota as unlimited", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: "-1" }, async () => {
                for (let index = 0; index < 25; index += 1) {
                    expect(await mailQuotaService.tryReserveSend("template")).to.equal(true)
                }
                expect(await mailQuotaService.remainingToday()).to.equal(Number.POSITIVE_INFINITY)
                expect(await mailQuotaService.isQuotaExhausted()).to.equal(false)
            })
        })

        it("resets at the UTC day rollover", async function () {
            await withEnv({ MAIL_DAILY_QUOTA: "1" }, async () => {
                const today = new Date("2026-08-03T23:59:00Z")
                const tomorrow = new Date("2026-08-04T00:01:00Z")
                expect(await mailQuotaService.tryReserveSend("template", today)).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template", today)).to.equal(false)
                expect(await mailQuotaService.isQuotaExhausted(today)).to.equal(true)
                expect(await mailQuotaService.tryReserveSend("template", tomorrow)).to.equal(true)
                expect(await mailQuotaService.remainingToday(tomorrow)).to.equal(0)
            })
        })
    })

    describe("enforcement in the send paths", function () {
        it("degrades sendTemplatedMail to false beyond the quota", async function () {
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            await withEnv({ MAIL_DAILY_QUOTA: "1" }, async () => {
                expect(await mailService.sendTemplatedMail(receiptRequest)).to.equal(true)
                expect(await mailService.sendTemplatedMail(receiptRequest)).to.equal(false)
            })
            expect(mail.sentMessages).to.have.length(1)
        })

        it("counts auth code emails and refuses them loudly at 2x quota", async function () {
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            await withEnv({ MAIL_DAILY_QUOTA: "1" }, async () => {
                // Distinct addresses keep auth's per-address resend throttle
                // out of the picture; the global quota is what's under test.
                await builtinAuthService.sendSignInCode("one@example.com", "https://site.example")
                await builtinAuthService.sendSignInCode("two@example.com", "https://site.example")
                await expect(
                    builtinAuthService.sendSignInCode("three@example.com", "https://site.example"),
                ).to.be.rejectedWith(/daily email quota/)
            })
            expect(mail.sentMessages).to.have.length(2)
        })

        it("keeps sign-in mail deliverable after a template-mail flood", async function () {
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            await withEnv({ MAIL_DAILY_QUOTA: "1" }, async () => {
                expect(await mailService.sendTemplatedMail(receiptRequest)).to.equal(true)
                expect(await mailService.sendTemplatedMail(receiptRequest)).to.equal(false)
                await builtinAuthService.sendSignInCode("user@example.com", "https://site.example")
            })
            expect(mail.lastMessageTo("user@example.com")).to.not.equal(undefined)
        })
    })
})
