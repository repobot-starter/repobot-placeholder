import { GcsStorageWrapper } from "./GcsStorageWrapper.js"
import { StorageWrapper } from "./StorageWrapper.js"

export * from "./GcsStorageWrapper.js"
export * from "./StorageWrapper.js"

let instance: StorageWrapper | undefined

/**
 * The GCS client the storage kernel calls when STORAGE_MODE=gcs.
 * Constructed lazily so booting without a STORAGE_BUCKET (every non-storage
 * deploy, and every local sandbox) never fails; local mode never touches
 * this wrapper at all. Tests may replace it via setStorageWrapperForTests.
 */
export function getStorageWrapper(): StorageWrapper {
    if (instance === undefined) {
        instance = new GcsStorageWrapper()
    }
    return instance
}

/** Test-only: substitutes a fake (undefined restores the real client). */
export function setStorageWrapperForTests(wrapper: StorageWrapper | undefined): void {
    instance = wrapper
}
