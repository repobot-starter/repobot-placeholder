/**
 * Demo-library seeding: on first sign-in each pack pushes a small curated
 * library through the NORMAL upload flow (createUpload -> PUT -> finalize ->
 * registerDriveFile), so the seed works identically in the sandbox
 * (STORAGE_MODE=local) and deployed against GCS — and "Clear demo library"
 * is just clearDriveLibrary plus a marker so the seed never returns.
 *
 * The manifests (which assets, folders, captions) live in each pack's view
 * dir — asset paths mentioned here would pin both packs' imagery into every
 * composed template (scripts/lib/public-assets.mjs reference scan).
 */
import type { ApolloClient } from "@apollo/client"
import {
    AddDriveAlbumEntryDocument,
    CreateDriveAlbumDocument,
    CreateDriveFolderDocument,
    DriveEntriesDocument,
    RegisterDriveFileDocument,
    SetDriveEntryStarredDocument,
    type AddDriveAlbumEntryMutation,
    type CreateDriveAlbumMutation,
    type CreateDriveFolderMutation,
    type DriveEntriesQuery,
    type RegisterDriveFileMutation,
    type SetDriveEntryStarredMutation,
} from "../generated/graphql/types"
import { uploadBlobThroughKernel } from "./driveUpload"

export interface DriveSeedFile {
    /** The baked asset under web/app/public, e.g. "/files/demo/brief.md". */
    assetPath: string
    name: string
    /** A folder name from the manifest's folders list; root when omitted. */
    folder?: string
    contentType: string
    capturedTime?: string
    caption?: string
    starred?: boolean
    /** An album name from the manifest's albums list. */
    album?: string
}

export interface DriveSeedManifest {
    /**
     * The localStorage key remembering "this browser cleared the demo":
     * distinguishes a first sign-in (seed) from an emptied library (don't).
     */
    clearedMarker: string
    folders: string[]
    albums?: string[]
    files: DriveSeedFile[]
}

type Client = ApolloClient<object>

/**
 * One seed per page load: React StrictMode double-mounts effects in dev, and
 * two concurrent seeds would both pass the emptiness probe and file every
 * asset twice. The second caller awaits (and shares) the first run.
 */
const seedsInFlight = new Map<string, Promise<boolean>>()

/**
 * Seeds the demo library when the caller's library is empty and this
 * browser never cleared it. Returns whether a seed ran (callers refetch).
 */
export function maybeSeedDriveLibrary(client: Client, manifest: DriveSeedManifest): Promise<boolean> {
    const inFlight = seedsInFlight.get(manifest.clearedMarker)
    if (inFlight !== undefined) {
        return inFlight
    }
    const run = seedDriveLibrary(client, manifest).finally(() => {
        seedsInFlight.delete(manifest.clearedMarker)
    })
    seedsInFlight.set(manifest.clearedMarker, run)
    return run
}

async function seedDriveLibrary(client: Client, manifest: DriveSeedManifest): Promise<boolean> {
    if (localStorage.getItem(manifest.clearedMarker) !== null) {
        return false
    }
    const existing = await client.query<DriveEntriesQuery>({
        query: DriveEntriesDocument,
        variables: {
            input: {
                connection: {
                    pagination: { first: 1 },
                    sort: [{ fieldName: "rowCreatedAt", direction: "desc" }],
                },
            },
        },
        fetchPolicy: "network-only",
    })
    if (existing.data.driveEntries.nodes.length > 0) {
        return false
    }

    const folderIds = new Map<string, string>()
    for (const name of manifest.folders) {
        const result = await client.mutate<CreateDriveFolderMutation>({
            mutation: CreateDriveFolderDocument,
            variables: { input: { idempotencyKey: crypto.randomUUID(), fields: { name } } },
        })
        const folder = result.data?.createDriveFolder
        if (folder !== undefined && folder !== null) {
            folderIds.set(name, folder.id)
        }
    }

    const albumIds = new Map<string, string>()
    for (const name of manifest.albums ?? []) {
        const result = await client.mutate<CreateDriveAlbumMutation>({
            mutation: CreateDriveAlbumDocument,
            variables: { input: { idempotencyKey: crypto.randomUUID(), fields: { name } } },
        })
        const album = result.data?.createDriveAlbum
        if (album !== undefined && album !== null) {
            albumIds.set(name, album.id)
        }
    }

    for (const seedFile of manifest.files) {
        // Best effort per file: one missing asset must not strand the seed.
        try {
            await seedOneFile(client, seedFile, folderIds, albumIds)
        } catch {
            continue
        }
    }
    return true
}

/** Remembers a cleared demo so the seed never comes back on this browser. */
export function markDriveLibraryCleared(manifest: Pick<DriveSeedManifest, "clearedMarker">): void {
    localStorage.setItem(manifest.clearedMarker, new Date().toISOString())
}

async function seedOneFile(
    client: Client,
    seedFile: DriveSeedFile,
    folderIds: Map<string, string>,
    albumIds: Map<string, string>,
): Promise<void> {
    const response = await fetch(seedFile.assetPath)
    if (!response.ok) {
        throw new Error(`The demo asset ${seedFile.assetPath} is missing (${response.status}).`)
    }
    const body = await response.blob()
    const uploadId = await uploadBlobThroughKernel(client, body, seedFile.contentType)

    const registered = await client.mutate<RegisterDriveFileMutation>({
        mutation: RegisterDriveFileDocument,
        variables: {
            input: {
                idempotencyKey: crypto.randomUUID(),
                fields: {
                    uploadId,
                    parentId: seedFile.folder !== undefined ? folderIds.get(seedFile.folder) : undefined,
                    name: seedFile.name,
                    capturedTime: seedFile.capturedTime,
                    caption: seedFile.caption,
                },
            },
        },
    })
    const entry = registered.data?.registerDriveFile
    if (entry === undefined || entry === null) {
        return
    }

    if (seedFile.starred === true) {
        await client.mutate<SetDriveEntryStarredMutation>({
            mutation: SetDriveEntryStarredDocument,
            variables: { input: { objectId: entry.id, starred: true } },
        })
    }
    const albumId = seedFile.album !== undefined ? albumIds.get(seedFile.album) : undefined
    if (albumId !== undefined) {
        await client.mutate<AddDriveAlbumEntryMutation>({
            mutation: AddDriveAlbumEntryDocument,
            variables: {
                input: { idempotencyKey: crypto.randomUUID(), albumId, entryId: entry.id },
            },
        })
    }
}
