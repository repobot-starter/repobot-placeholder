/**
 * The drive upload pipeline both utility packs share: browser bytes ride the
 * storage kernel exactly like the Settings avatar (createUpload -> PUT ->
 * finalizeUpload), under the DRIVE admission profile, and the finalized
 * upload binds into the library with registerDriveFile. Folders dropped from
 * the desktop are walked (webkitGetAsEntry) and recreated as drive folders.
 */
import { useApolloClient, type ApolloClient } from "@apollo/client"
import { deriveStorageEndpoint, putUploadBytes } from "@base/core"
import { useCallback, useRef, useState } from "react"
import {
    CreateUploadDocument,
    FinalizeUploadDocument,
    useCreateDriveFolderMutation,
    useRegisterDriveFileMutation,
    type CreateUploadMutation,
    type DriveEntryFieldsFragment,
    type FinalizeUploadMutation,
} from "../generated/graphql/types"

export const driveStorageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

/**
 * Files one blob through the storage kernel under the DRIVE profile
 * (createUpload -> PUT -> finalizeUpload) and returns the READY upload id.
 * The shared bottom half of every drive write: batch uploads, the demo
 * seed, and the photo pack's rotate re-encode all ride this.
 */
export async function uploadBlobThroughKernel(
    client: ApolloClient<object>,
    body: Blob,
    contentType: string,
): Promise<string> {
    const slotResult = await client.mutate<CreateUploadMutation>({
        mutation: CreateUploadDocument,
        variables: {
            input: {
                idempotencyKey: crypto.randomUUID(),
                fields: {
                    contentType,
                    sizeBytes: body.size,
                    visibility: "PRIVATE",
                    profile: "DRIVE",
                },
            },
        },
    })
    const slot = slotResult.data?.createUpload
    if (slot === undefined || slot === null) {
        throw new Error("The upload could not be created.")
    }
    await putUploadBytes({
        endpoint: driveStorageEndpoint(),
        uploadUrl: slot.uploadUrl,
        headersJson: slot.headersJson,
        body,
    })
    await client.mutate<FinalizeUploadMutation>({
        mutation: FinalizeUploadDocument,
        variables: { input: { uploadId: slot.uploadId } },
    })
    return slot.uploadId
}

/** A file on its way into the library, with the folder path it dropped in. */
export interface DriveIncomingFile {
    file: File
    /** Folder names between the drop target and the file (dropped dirs). */
    pathSegments: string[]
}

export type DriveUploadStatus = "queued" | "uploading" | "done" | "error"

export interface DriveUploadJob {
    key: string
    fileName: string
    sizeBytes: number
    status: DriveUploadStatus
    error?: string
}

/** Per-file metadata the images pack derives before upload (EXIF, thumbs). */
export interface DriveUploadExtras {
    capturedTime?: string
    caption?: string
    /** A pre-rendered WebP thumbnail, filed as a sibling upload. */
    thumbBlob?: Blob
}

export interface DriveUploadRequest {
    files: DriveIncomingFile[]
    /** The folder receiving the drop; null/undefined lands at the root. */
    parentId?: string | null
    /** Images pack seam: derive capture time / caption / thumbnail per file. */
    prepare?: (file: File) => Promise<DriveUploadExtras>
}

/** How many files upload at once; small enough to keep progress readable. */
const UPLOAD_CONCURRENCY = 3

interface UseDriveUploaderResult {
    /** Per-file progress for the tray, most recent batch only. */
    jobs: DriveUploadJob[]
    uploading: boolean
    /** Uploads a batch; resolves with the registered entries (per success). */
    uploadFiles: (request: DriveUploadRequest) => Promise<DriveEntryFieldsFragment[]>
    clearJobs: () => void
}

export function useDriveUploader(onLibraryChanged: () => void): UseDriveUploaderResult {
    const client = useApolloClient()
    const [jobs, setJobs] = useState<DriveUploadJob[]>([])
    const [uploading, setUploading] = useState(false)
    const [registerDriveFile] = useRegisterDriveFileMutation()
    const [createDriveFolder] = useCreateDriveFolderMutation()

    // Folder identity per batch: "Design/Logos" resolves to one created
    // folder id no matter how many files land inside it.
    const folderCacheRef = useRef(new Map<string, string>())

    const updateJob = useCallback((key: string, patch: Partial<DriveUploadJob>): void => {
        setJobs((current) => current.map((job) => (job.key === key ? { ...job, ...patch } : job)))
    }, [])

    const fileReadyUpload = useCallback(
        (body: Blob, contentType: string): Promise<string> =>
            uploadBlobThroughKernel(client, body, contentType),
        [client],
    )

    const resolveFolder = useCallback(
        async (parentId: string | null, pathSegments: string[]): Promise<string | null> => {
            let currentParent = parentId
            let cachePath = parentId ?? "root"
            for (const segment of pathSegments) {
                cachePath = `${cachePath}/${segment}`
                const cached = folderCacheRef.current.get(cachePath)
                if (cached !== undefined) {
                    currentParent = cached
                    continue
                }
                const created = await createDriveFolder({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            fields: { name: segment, parentId: currentParent },
                        },
                    },
                })
                const folder = created.data?.createDriveFolder
                if (folder === undefined) {
                    throw new Error(`The folder "${segment}" could not be created.`)
                }
                folderCacheRef.current.set(cachePath, folder.id)
                currentParent = folder.id
            }
            return currentParent
        },
        [createDriveFolder],
    )

    const uploadFiles = useCallback(
        async (request: DriveUploadRequest): Promise<DriveEntryFieldsFragment[]> => {
            const batch = request.files.map((incoming, index) => ({
                incoming,
                key: `${Date.now()}-${index}-${incoming.file.name}`,
            }))
            folderCacheRef.current = new Map()
            setJobs(
                batch.map(({ incoming, key }) => ({
                    key,
                    fileName: incoming.file.name,
                    sizeBytes: incoming.file.size,
                    status: "queued" as const,
                })),
            )
            setUploading(true)

            const registered: DriveEntryFieldsFragment[] = []
            const queue = [...batch]
            const worker = async (): Promise<void> => {
                for (;;) {
                    const next = queue.shift()
                    if (next === undefined) {
                        return
                    }
                    const { incoming, key } = next
                    updateJob(key, { status: "uploading" })
                    try {
                        const parentId = await resolveFolder(request.parentId ?? null, incoming.pathSegments)
                        const extras = (await request.prepare?.(incoming.file)) ?? {}
                        const contentType =
                            incoming.file.type !== "" ? incoming.file.type : "application/octet-stream"
                        const uploadId = await fileReadyUpload(incoming.file, contentType)
                        const thumbUploadId =
                            extras.thumbBlob !== undefined
                                ? await fileReadyUpload(extras.thumbBlob, "image/webp")
                                : undefined
                        const result = await registerDriveFile({
                            variables: {
                                input: {
                                    idempotencyKey: crypto.randomUUID(),
                                    fields: {
                                        uploadId,
                                        parentId,
                                        name: incoming.file.name,
                                        capturedTime: extras.capturedTime,
                                        caption: extras.caption,
                                        thumbUploadId,
                                    },
                                },
                            },
                        })
                        const entry = result.data?.registerDriveFile
                        if (entry === undefined) {
                            throw new Error("The file could not be registered.")
                        }
                        registered.push(entry)
                        updateJob(key, { status: "done" })
                    } catch (caught) {
                        updateJob(key, {
                            status: "error",
                            error: caught instanceof Error ? caught.message : "Uploading failed.",
                        })
                    }
                }
            }
            try {
                await Promise.all(
                    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, batch.length) }, () => worker()),
                )
            } finally {
                setUploading(false)
                if (registered.length > 0 || folderCacheRef.current.size > 0) {
                    onLibraryChanged()
                }
            }
            return registered
        },
        [fileReadyUpload, onLibraryChanged, registerDriveFile, resolveFolder, updateJob],
    )

    const clearJobs = useCallback((): void => setJobs([]), [])

    return { jobs, uploading, uploadFiles, clearJobs }
}

/**
 * Collects the files behind a desktop drop, walking dropped directories
 * (webkitGetAsEntry) so a folder drop reproduces its tree in the library.
 * Falls back to the flat file list where the entry API is unavailable.
 */
export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<DriveIncomingFile[]> {
    const items = Array.from(dataTransfer.items ?? [])
    const entries = items
        .filter((item) => item.kind === "file")
        .map((item) => item.webkitGetAsEntry?.())
        .filter((entry): entry is FileSystemEntry => entry != null)

    if (entries.length === 0) {
        return Array.from(dataTransfer.files).map((file) => ({ file, pathSegments: [] }))
    }

    const collected: DriveIncomingFile[] = []
    for (const entry of entries) {
        await walkEntry(entry, [], collected)
    }
    return collected
}

async function walkEntry(
    entry: FileSystemEntry,
    pathSegments: string[],
    collected: DriveIncomingFile[],
): Promise<void> {
    if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) =>
            (entry as FileSystemFileEntry).file(resolve, reject),
        )
        collected.push({ file, pathSegments })
        return
    }
    if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader()
        const childSegments = [...pathSegments, entry.name]
        // readEntries returns results in chunks; drain until empty.
        for (;;) {
            const chunk = await new Promise<FileSystemEntry[]>((resolve, reject) =>
                reader.readEntries(resolve, reject),
            )
            if (chunk.length === 0) {
                return
            }
            for (const child of chunk) {
                await walkEntry(child, childSegments, collected)
            }
        }
    }
}
