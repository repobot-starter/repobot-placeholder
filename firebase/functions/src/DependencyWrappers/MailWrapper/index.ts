import { isEmulator, isTest } from "../../Utils/Environment.js"
import { FakeMailWrapper } from "./FakeMailWrapper.js"
import { MailWrapper } from "./MailWrapper.js"
import { SmtpMailWrapper } from "./SmtpMailWrapper.js"

export * from "./FakeMailWrapper.js"
export * from "./MailWrapper.js"
export * from "./SmtpMailWrapper.js"

let instance: MailWrapper | undefined

/**
 * The mail sender the built-in auth service uses. Real SMTP when deployed;
 * an in-memory fake under the emulator and in tests.
 */
export function getMailWrapper(): MailWrapper {
    if (instance === undefined) {
        instance = isEmulator() || isTest() ? new FakeMailWrapper() : new SmtpMailWrapper()
    }
    return instance
}

/** Test-only: substitutes a wrapper (pass undefined to restore the default). */
export function setMailWrapperForTests(wrapper: MailWrapper | undefined): void {
    instance = wrapper
}
