import { isEmulator, isTest } from "../../Utils/Environment.js"
import { FakePushWrapper } from "./FakePushWrapper.js"
import { PushWrapper } from "./PushWrapper.js"
import { WebPushWrapper } from "./WebPushWrapper.js"

export * from "./FakePushWrapper.js"
export * from "./PushWrapper.js"
export * from "./WebPushWrapper.js"

let instance: PushWrapper | undefined

/**
 * The push sender the push kernel uses. Real Web Push when deployed; an
 * in-memory fake under the emulator and in tests (the same split as
 * MailWrapper).
 */
export function getPushWrapper(): PushWrapper {
    if (instance === undefined) {
        instance = isEmulator() || isTest() ? new FakePushWrapper() : new WebPushWrapper()
    }
    return instance
}

/** Test-only: substitutes a wrapper (pass undefined to restore the default). */
export function setPushWrapperForTests(wrapper: PushWrapper | undefined): void {
    instance = wrapper
}
