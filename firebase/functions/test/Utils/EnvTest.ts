import { expect } from "chai"
import { resetValidatedEnvForTests, validatedEnv } from "../../src/Utils/Env.js"

/**
 * Runs a block with the given env vars temporarily set, restoring the
 * originals (and the validated-env cache) afterwards.
 */
function withEnv(overrides: Record<string, string>, block: () => void): void {
    const originals = new Map<string, string | undefined>(
        Object.keys(overrides).map((key) => [key, process.env[key]]),
    )
    Object.assign(process.env, overrides)
    resetValidatedEnvForTests()
    try {
        block()
    } finally {
        for (const [key, value] of originals) {
            if (value === undefined) {
                delete process.env[key]
            } else {
                process.env[key] = value
            }
        }
        resetValidatedEnvForTests()
    }
}

describe("Env validation", function () {
    // Platforms compose env files line by line; `FOO=` is their natural
    // spelling of "no value". A defaulted enum staged that way must fall
    // back to its default instead of refusing boot (this exact shape — an
    // unconnected QuickBooks integration writing QUICKBOOKS_ENVIRONMENT= —
    // once bricked every deployed backend at env validation).
    it("treats empty string as unset for defaulted enums", function () {
        withEnv({ QUICKBOOKS_ENVIRONMENT: "" }, () => {
            expect(validatedEnv().QUICKBOOKS_ENVIRONMENT).to.equal("production")
        })
    })

    it("treats empty string as unset for optional variables", function () {
        withEnv({ DEPLOY_POSTURE: "", SMTP_HOST: "" }, () => {
            const env = validatedEnv()
            expect(env.DEPLOY_POSTURE).to.equal(undefined)
            expect(env.SMTP_HOST).to.equal(undefined)
        })
    })

    it("still rejects genuinely invalid enum values", function () {
        withEnv({ QUICKBOOKS_ENVIRONMENT: "staging" }, () => {
            expect(() => validatedEnv()).to.throw(/QUICKBOOKS_ENVIRONMENT/)
        })
    })

    it("still requires DATABASE_URL to be non-empty", function () {
        withEnv({ DATABASE_URL: "" }, () => {
            expect(() => validatedEnv()).to.throw(/DATABASE_URL is required/)
        })
    })
})
