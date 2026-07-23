/**
 * True when running inside the Firebase emulator suite.
 */
export function isEmulator(): boolean {
    return process.env.FUNCTIONS_EMULATOR === "true"
}

/**
 * True when running under the test harness (test/MochaHooks.ts sets this).
 */
export function isTest(): boolean {
    return process.env.NODE_ENV === "test"
}
