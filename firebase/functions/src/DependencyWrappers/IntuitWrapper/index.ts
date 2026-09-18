import { IntuitApiWrapper } from "./IntuitApiWrapper.js"
import { IntuitWrapper } from "./IntuitWrapper.js"

export * from "./IntuitApiWrapper.js"
export * from "./IntuitWrapper.js"

let instance: IntuitWrapper | undefined

/**
 * The Intuit client the QuickBooks domain calls when QUICKBOOKS_MODE=intuit.
 * Constructed lazily so booting without QUICKBOOKS_CLIENT_ID/SECRET (every
 * local sandbox, and every deploy still on the simulation) never fails;
 * local mode never touches this wrapper at all. Tests may replace it via
 * setIntuitWrapperForTests.
 */
export function getIntuitWrapper(): IntuitWrapper {
    if (instance === undefined) {
        instance = new IntuitApiWrapper()
    }
    return instance
}

/** Test-only: substitutes a fake; pass undefined to restore the real client. */
export function setIntuitWrapperForTests(wrapper: IntuitWrapper | undefined): void {
    instance = wrapper
}
