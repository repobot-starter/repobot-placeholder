import { existsSync, readdirSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Session-gated digital delivery: a product delivers whatever single file
 * lives in /firebase/functions/delivery/<productKey>/. Adding a deliverable
 * to a product is dropping a file into that directory — no new code. The
 * payments API's GET /delivery endpoint streams it only after verifying the
 * checkout session is PAID (see CloudFunctions/Payments.ts).
 */

export interface DeliveryFile {
    /** The file name offered to the buyer (content-disposition). */
    fileName: string
    /** Absolute path to the file on disk. */
    filePath: string
}

/** The delivery file for a product, or undefined when it has none. */
export function findDeliveryFile(productKey: string): DeliveryFile | undefined {
    const deliveryRoot = resolveDeliveryRoot()
    if (deliveryRoot === undefined || productKey === "") {
        return undefined
    }
    const productDir = join(deliveryRoot, productKey)
    if (!existsSync(productDir)) {
        return undefined
    }
    const fileNames = readdirSync(productDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
        .map((entry) => entry.name)
        .sort()
    if (fileNames.length === 0) {
        return undefined
    }
    const fileName = basename(fileNames[0])
    return { fileName, filePath: join(productDir, fileName) }
}

/**
 * The delivery directory relative to this module. Two layouts exist: tests
 * run the TypeScript sources (src/Services/Payments -> three levels up) and
 * deployed code runs compiled output (lib/src/Services/Payments -> four
 * levels up); both land on the functions package root. Unlike documents
 * templates, a missing directory is not an error — most packs deliver
 * nothing.
 */
function resolveDeliveryRoot(): string | undefined {
    const moduleDir = dirname(fileURLToPath(import.meta.url))
    for (const levelsUp of ["../../..", "../../../.."]) {
        const candidate = join(moduleDir, levelsUp, "delivery")
        if (existsSync(candidate)) {
            return candidate
        }
    }
    return undefined
}
