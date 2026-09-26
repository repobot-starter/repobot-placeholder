import { UploadProfile } from "../../Data/Storage/Upload.js"

/**
 * One admission profile: the content types and size cap a surface accepts.
 * The profile a slot was admitted under is recorded on the upload row, so
 * finalize and the local-mode ingest verify arriving bytes against the same
 * cap that admitted the declaration.
 */
export interface UploadProfileConfig {
    /**
     * Content types this profile accepts. Extend deliberately: every entry
     * is a type the app will happily serve back to browsers. Active content
     * (text/html, application/xhtml+xml, executables, scripts) is never
     * listed on any profile — that is the safety story for publicly shared
     * files: a shared /file/<id> URL can carry documents and media, never a
     * page the browser would execute in the app's origin.
     */
    allowedContentTypes: readonly string[]
    /** Hard cap on a single upload; declared and actual sizes are checked. */
    maxSizeBytes: number
}

const defaultProfile: UploadProfileConfig = {
    allowedContentTypes: [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
    ],
    maxSizeBytes: 20 * 1024 * 1024,
}

// The drive profile (Files/Photos utility packs): a much broader library of
// document, media, and archive types at a 100MB cap. The bytes PUT straight
// to the storage backend (signed GCS URL when deployed), so functions never
// proxy them. Deliberately absent: text/html, application/xhtml+xml, and
// every executable/script type — see UploadProfileConfig.allowedContentTypes.
const driveProfile: UploadProfileConfig = {
    allowedContentTypes: [
        // Images
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "image/heic",
        "image/heif",
        "image/tiff",
        "image/bmp",
        "image/avif",
        // Documents
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/json",
        "application/rtf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
        // Audio
        "audio/mpeg",
        "audio/mp4",
        "audio/aac",
        "audio/wav",
        "audio/x-wav",
        "audio/ogg",
        "audio/flac",
        "audio/webm",
        // Video
        "video/mp4",
        "video/webm",
        "video/quicktime",
        // Archives
        "application/zip",
        "application/gzip",
        "application/x-tar",
        "application/x-7z-compressed",
        // The catch-all browsers report for unknown extensions. Served with
        // its declared type, which no browser renders as active content.
        "application/octet-stream",
    ],
    maxSizeBytes: 100 * 1024 * 1024,
}

/**
 * The storage kernel's config surface — the one place a project tunes what
 * uploads it accepts. Everything else (URLs, verification, serving) is
 * kernel machinery that consuming domains never reimplement.
 *
 * The top-level allowedContentTypes/maxSizeBytes are the DEFAULT profile
 * (the original avatar-era rules); the GraphQL function's JSON body limit
 * derives from that cap, so writeFile inline bytes always ride DEFAULT.
 * Browser uploads may declare a profile on createUpload.
 */
export const storageConfig = {
    /** The DEFAULT profile's allowlist (see profiles.DEFAULT). */
    allowedContentTypes: defaultProfile.allowedContentTypes,

    /**
     * The DEFAULT profile's cap. The GraphQL JSON limit derives from this,
     * so it must stay small enough to ride a function request body.
     */
    maxSizeBytes: defaultProfile.maxSizeBytes,

    /** Admission profiles by the UploadProfile recorded on the row. */
    profiles: {
        DEFAULT: defaultProfile,
        DRIVE: driveProfile,
    } satisfies Record<UploadProfile, UploadProfileConfig>,

    /** How long a minted upload URL stays valid. */
    uploadUrlTtlSeconds: 15 * 60,

    /** How long a PRIVATE download URL stays valid. */
    downloadUrlTtlSeconds: 10 * 60,
}

/** The profile's admission rules for a given (or recorded) profile value. */
export function uploadProfileConfig(profile: UploadProfile): UploadProfileConfig {
    return storageConfig.profiles[profile]
}

/**
 * The largest profile cap — the local-mode storage function's raw body
 * limit, so a PUT admitted under any profile can actually arrive.
 */
export function maxUploadSizeBytesAcrossProfiles(): number {
    return Math.max(...Object.values(storageConfig.profiles).map((profile) => profile.maxSizeBytes))
}
