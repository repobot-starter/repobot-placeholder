/**
 * Client-side thumbnail generation for the photo library: decode in the
 * browser, downscale on a canvas, re-encode as WebP. The functions backend
 * never runs image code — thumbnails ride the normal upload flow as sibling
 * uploads (drive entry thumbUploadId).
 */

/** The thumbnail ladder's long edge; one rung is enough for grid + strip. */
const THUMB_LONG_EDGE = 640

const THUMB_QUALITY = 0.8

/**
 * Builds a WebP thumbnail for an image file. Returns undefined when the
 * file is not a decodable image (callers upload without a thumbnail).
 * EXIF rotation is applied by the decoder (`imageOrientation: from-image`),
 * so thumbnails are always upright regardless of how the camera was held.
 */
export async function makeImageThumbnail(file: File): Promise<Blob | undefined> {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
        return undefined
    }
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
        try {
            const scale = Math.min(1, THUMB_LONG_EDGE / Math.max(bitmap.width, bitmap.height))
            const width = Math.max(1, Math.round(bitmap.width * scale))
            const height = Math.max(1, Math.round(bitmap.height * scale))
            return await encodeBitmap(bitmap, width, height)
        } finally {
            bitmap.close()
        }
    } catch {
        return undefined
    }
}

/**
 * Rotates an image file by the given quarter turns (1 = 90° clockwise) and
 * re-encodes it as WebP at full resolution — the photo pack's rotate action:
 * the client re-encodes and files new bytes; the entry rebinds to them.
 */
export async function rotateImageFile(file: Blob, quarterTurns: number): Promise<Blob | undefined> {
    const turns = ((quarterTurns % 4) + 4) % 4
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
        try {
            const swap = turns % 2 === 1
            const width = swap ? bitmap.height : bitmap.width
            const height = swap ? bitmap.width : bitmap.height
            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            const context = canvas.getContext("2d")
            if (context === null) {
                return undefined
            }
            context.translate(width / 2, height / 2)
            context.rotate((turns * Math.PI) / 2)
            context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
            return await canvasToWebP(canvas)
        } finally {
            bitmap.close()
        }
    } catch {
        return undefined
    }
}

async function encodeBitmap(bitmap: ImageBitmap, width: number, height: number): Promise<Blob | undefined> {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (context === null) {
        return undefined
    }
    context.drawImage(bitmap, 0, 0, width, height)
    return await canvasToWebP(canvas)
}

function canvasToWebP(canvas: HTMLCanvasElement): Promise<Blob | undefined> {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob ?? undefined), "image/webp", THUMB_QUALITY)
    })
}
