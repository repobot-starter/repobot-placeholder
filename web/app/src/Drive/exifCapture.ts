/**
 * A minimal built-in JPEG EXIF reader — enough to pull the capture time (and
 * orientation) out of a photo before it uploads, with no dependency and no
 * image decode. The functions never see image bytes: capture metadata is
 * extracted client-side and carried on the drive entry (capturedTime).
 *
 * Scope, deliberately small: JPEG APP1/EXIF only (the format cameras and
 * phones actually emit). Non-JPEG files and JPEGs without EXIF resolve to
 * an empty result — callers fall back to the upload date.
 */

export interface ExifCapture {
    /** DateTimeOriginal (or DateTime) as an ISO-8601 local timestamp. */
    capturedTime?: string
    /** The EXIF orientation tag (1–8) when present. */
    orientation?: number
}

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] // "Exif\0\0"

/** Reads EXIF capture metadata from a JPEG file. Never throws. */
export async function readExifCapture(file: File): Promise<ExifCapture> {
    try {
        // EXIF lives in the first APP segments; 256KB covers real files
        // without pulling a 40MB photo into memory.
        const head = new DataView(await file.slice(0, 256 * 1024).arrayBuffer())
        return parseJpegExif(head)
    } catch {
        return {}
    }
}

function parseJpegExif(view: DataView): ExifCapture {
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
        return {} // Not a JPEG.
    }
    let offset = 2
    while (offset + 4 <= view.byteLength) {
        if (view.getUint8(offset) !== 0xff) {
            return {}
        }
        const marker = view.getUint8(offset + 1)
        if (marker === 0xda) {
            return {} // Start of scan: no EXIF before the image data.
        }
        const segmentLength = view.getUint16(offset + 2)
        if (marker === 0xe1 && isExifSegment(view, offset + 4)) {
            return parseTiff(view, offset + 4 + EXIF_HEADER.length)
        }
        offset += 2 + segmentLength
    }
    return {}
}

function isExifSegment(view: DataView, start: number): boolean {
    if (start + EXIF_HEADER.length > view.byteLength) {
        return false
    }
    return EXIF_HEADER.every((byte, index) => view.getUint8(start + index) === byte)
}

/** Parses the TIFF structure inside APP1: IFD0, then the Exif sub-IFD. */
function parseTiff(view: DataView, tiffStart: number): ExifCapture {
    if (tiffStart + 8 > view.byteLength) {
        return {}
    }
    const byteOrder = view.getUint16(tiffStart)
    const littleEndian = byteOrder === 0x4949 // "II"
    if (!littleEndian && byteOrder !== 0x4d4d) {
        return {}
    }
    const read16 = (at: number): number => view.getUint16(at, littleEndian)
    const read32 = (at: number): number => view.getUint32(at, littleEndian)

    const result: ExifCapture = {}
    let exifIfdOffset: number | undefined
    let dateTimeFallback: string | undefined

    const ifd0 = tiffStart + read32(tiffStart + 4)
    forEachTag(view, ifd0, read16, (tag, entryAt) => {
        if (tag === 0x0112) {
            result.orientation = read16(entryAt + 8)
        } else if (tag === 0x8769) {
            exifIfdOffset = tiffStart + read32(entryAt + 8)
        } else if (tag === 0x0132) {
            dateTimeFallback = readAscii(view, entryAt, tiffStart, read16, read32)
        }
    })

    let dateTimeOriginal: string | undefined
    if (exifIfdOffset !== undefined) {
        forEachTag(view, exifIfdOffset, read16, (tag, entryAt) => {
            if (tag === 0x9003) {
                dateTimeOriginal = readAscii(view, entryAt, tiffStart, read16, read32)
            }
        })
    }

    const capturedTime = exifDateToIso(dateTimeOriginal ?? dateTimeFallback)
    if (capturedTime !== undefined) {
        result.capturedTime = capturedTime
    }
    return result
}

function forEachTag(
    view: DataView,
    ifdOffset: number,
    read16: (at: number) => number,
    onTag: (tag: number, entryAt: number) => void,
): void {
    if (ifdOffset + 2 > view.byteLength) {
        return
    }
    const entryCount = read16(ifdOffset)
    for (let index = 0; index < entryCount; index++) {
        const entryAt = ifdOffset + 2 + index * 12
        if (entryAt + 12 > view.byteLength) {
            return
        }
        onTag(read16(entryAt), entryAt)
    }
}

/** Reads an ASCII tag value: inline when it fits 4 bytes, else by offset. */
function readAscii(
    view: DataView,
    entryAt: number,
    tiffStart: number,
    read16: (at: number) => number,
    read32: (at: number) => number,
): string | undefined {
    const type = read16(entryAt + 2)
    if (type !== 2) {
        return undefined
    }
    const count = read32(entryAt + 4)
    const valueAt = count <= 4 ? entryAt + 8 : tiffStart + read32(entryAt + 8)
    if (valueAt + count > view.byteLength) {
        return undefined
    }
    let text = ""
    for (let index = 0; index < count; index++) {
        const byte = view.getUint8(valueAt + index)
        if (byte === 0) {
            break
        }
        text += String.fromCharCode(byte)
    }
    return text
}

/** "2024:06:01 18:32:11" -> "2024-06-01T18:32:11" (camera-local time). */
function exifDateToIso(exifDate: string | undefined): string | undefined {
    if (exifDate === undefined) {
        return undefined
    }
    const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(exifDate)
    if (match === null) {
        return undefined
    }
    const [, year, month, day, hour, minute, second] = match
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`
    return Number.isNaN(Date.parse(iso)) ? undefined : iso
}
