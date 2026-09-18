import { randomUUID } from "node:crypto"
import { expect } from "chai"
import { Principal } from "../../src/Utils/Principal.js"
import { newIdempotencyKey } from "../Utils/Factories/RandomValues.js"
import { buildCreateUserFields, buildCreateUserInput } from "../Utils/Factories/UserFactory.js"
import { asUser, executeGql, executeGqlAt, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { addDefaults, TestContext } from "../Utils/TestContext.js"
import { driveEntryGqlFields } from "./DriveTestHelper.js"

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47])

const byName = {
    pagination: { first: 50 },
    sort: [{ fieldName: "name", direction: "asc" as const }],
}

/** Files bytes through the kernel's server-side write path: READY in one call. */
async function fileReadyUpload(
    context: TestContext,
    principal: Principal,
    overrides: Partial<{ visibility: string; contentType: string }> = {},
): Promise<string> {
    const upload = await executeGqlAt<{ id: string }>(
        context.apolloServer,
        `mutation WriteFile($input: WriteFileInput!) {
            writeFile(input: $input) { id }
        }`,
        {
            input: {
                idempotencyKey: randomUUID(),
                fields: {
                    contentType: "image/png",
                    bytesBase64: PNG_BYTES.toString("base64"),
                    visibility: "PRIVATE",
                    ...overrides,
                },
            },
        },
        "writeFile",
        principal,
    )
    return upload.id
}

/** A browser-flow slot with no bytes behind it yet: PENDING forever. */
async function createPendingUpload(context: TestContext, principal: Principal): Promise<string> {
    const slot = await executeGqlAt<{ uploadId: string }>(
        context.apolloServer,
        `mutation CreateUpload($input: CreateUploadInput!) {
            createUpload(input: $input) { uploadId }
        }`,
        {
            input: {
                idempotencyKey: randomUUID(),
                fields: { contentType: "image/png", sizeBytes: 4, visibility: "PRIVATE" },
            },
        },
        "createUpload",
        principal,
    )
    return slot.uploadId
}

async function registerFile(
    context: TestContext,
    principal: Principal,
    fields: { uploadId: string; name: string; parentId?: string | null; caption?: string | null },
): Promise<{ id: string; uploadId: string }> {
    const entry = await context.driveHelper.registerFile(
        { idempotencyKey: newIdempotencyKey(), fields },
        principal,
    )
    return { id: entry.id, uploadId: fields.uploadId }
}

async function secondUserPrincipal(context: TestContext): Promise<Principal> {
    const other = await context.identityHelper.createAndGetUser(
        buildCreateUserInput({
            fields: buildCreateUserFields({ accountId: context.defaults.account!.id }),
        }),
    )
    return asUser(other)
}

describe("Drive", function () {
    let owner: Principal

    beforeEach(async function () {
        await addDefaults(this, ["account", "user"])
        owner = asUser(this.defaults.user!)
    })

    it("builds the tree: folders, registered files, root and folder listings", async function () {
        const folder = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Documents" } },
            owner,
        )
        expect(folder.kind).to.equal("FOLDER")
        expect(folder.parentId).to.equal(null)
        expect(folder.uploadId).to.equal(null)
        expect(folder.fileUrl).to.equal(null)

        const rootUpload = await fileReadyUpload(this, owner)
        await registerFile(this, owner, { uploadId: rootUpload, name: "notes.png" })
        const nestedUpload = await fileReadyUpload(this, owner)
        await registerFile(this, owner, {
            uploadId: nestedUpload,
            name: "contract.png",
            parentId: folder.id,
        })

        const root = await this.driveHelper.getEntries(
            { filters: { rootOnly: true }, connection: byName },
            owner,
        )
        expect(root.nodes.map((entry) => entry?.name)).to.deep.equal(["Documents", "notes.png"])

        const children = await this.driveHelper.getEntries(
            { filters: { folderId: folder.id }, connection: byName },
            owner,
        )
        expect(children.nodes).to.have.length(1)
        const child = children.nodes[0]!
        // The upload-derived fields hydrate through the kernel: verified
        // size, content type, and a private (token-carrying) URL.
        expect(child.kind).to.equal("FILE")
        expect(child.contentType).to.equal("image/png")
        expect(child.sizeBytes).to.equal(PNG_BYTES.length)
        expect(child.shared).to.equal(false)
        expect(child.fileUrl).to.match(new RegExp(`^/file/${nestedUpload}\\?token=`))
    })

    it("refuses binding uploads that are pending, foreign, or already registered", async function () {
        const pending = await createPendingUpload(this, owner)
        const pendingDenied = await executeGql(
            this.apolloServer,
            `mutation RegisterDriveFile($input: RegisterDriveFileInput!) {
                registerDriveFile(input: $input) { id }
            }`,
            {
                input: {
                    idempotencyKey: newIdempotencyKey(),
                    fields: { uploadId: pending, name: "pending.png" },
                },
            },
            owner,
        )
        expect(firstGqlError(pendingDenied).code).to.equal("FAILED_PRECONDITION")

        const stranger = await secondUserPrincipal(this)
        const foreign = await fileReadyUpload(this, stranger)
        const foreignDenied = await executeGql(
            this.apolloServer,
            `mutation RegisterDriveFile($input: RegisterDriveFileInput!) {
                registerDriveFile(input: $input) { id }
            }`,
            {
                input: {
                    idempotencyKey: newIdempotencyKey(),
                    fields: { uploadId: foreign, name: "theirs.png" },
                },
            },
            owner,
        )
        expect(firstGqlError(foreignDenied).code).to.equal("PERMISSION_DENIED")

        const uploadId = await fileReadyUpload(this, owner)
        await registerFile(this, owner, { uploadId, name: "first.png" })
        const doubled = await executeGql(
            this.apolloServer,
            `mutation RegisterDriveFile($input: RegisterDriveFileInput!) {
                registerDriveFile(input: $input) { id }
            }`,
            {
                input: {
                    idempotencyKey: newIdempotencyKey(),
                    fields: { uploadId, name: "second.png" },
                },
            },
            owner,
        )
        const doubledError = firstGqlError(doubled)
        expect(doubledError.code).to.equal("INVALID_ARGUMENT")
        expect(doubledError.message).to.contain("already registered")
    })

    it("renames, stars, captions, and filters by search, kind, and starred", async function () {
        const folder = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Receipts" } },
            owner,
        )
        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            {
                idempotencyKey: newIdempotencyKey(),
                fields: { uploadId, name: "IMG_0001.png", capturedTime: "2024-06-01T12:00:00Z" },
            },
            owner,
        )
        expect(file.capturedTime).to.not.equal(null)

        const renamed = await this.driveHelper.renameEntry(
            { objectId: file.id, idempotencyKey: newIdempotencyKey(), name: "sunset.png" },
            owner,
        )
        expect(renamed.name).to.equal("sunset.png")

        const starred = await this.driveHelper.setEntryStarred({ objectId: file.id, starred: true }, owner)
        expect(starred.starred).to.equal(true)

        const captioned = await this.driveHelper.setEntryCaption(
            { objectId: file.id, caption: "Golden hour at the pier" },
            owner,
        )
        expect(captioned.caption).to.equal("Golden hour at the pier")

        // Search is case-insensitive across name and caption.
        const byCaption = await this.driveHelper.getEntries(
            { filters: { search: "GOLDEN HOUR" }, connection: byName },
            owner,
        )
        expect(byCaption.nodes.map((entry) => entry?.id)).to.deep.equal([file.id])
        const byNameSearch = await this.driveHelper.getEntries(
            { filters: { search: "sunset" }, connection: byName },
            owner,
        )
        expect(byNameSearch.nodes.map((entry) => entry?.id)).to.deep.equal([file.id])

        const folders = await this.driveHelper.getEntries(
            { filters: { kind: "FOLDER" }, connection: byName },
            owner,
        )
        expect(folders.nodes.map((entry) => entry?.id)).to.deep.equal([folder.id])
        const starredOnly = await this.driveHelper.getEntries(
            { filters: { starred: true }, connection: byName },
            owner,
        )
        expect(starredOnly.nodes.map((entry) => entry?.id)).to.deep.equal([file.id])

        // Null clears the caption.
        const cleared = await this.driveHelper.setEntryCaption({ objectId: file.id, caption: null }, owner)
        expect(cleared.caption).to.equal(null)
    })

    it("moves entries between folders and refuses subtree cycles", async function () {
        const outer = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Outer" } },
            owner,
        )
        const inner = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Inner", parentId: outer.id } },
            owner,
        )
        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            { idempotencyKey: newIdempotencyKey(), fields: { uploadId, name: "report.png" } },
            owner,
        )

        const moved = await this.driveHelper.moveEntry(
            { objectId: file.id, idempotencyKey: newIdempotencyKey(), parentId: inner.id },
            owner,
        )
        expect(moved.parentId).to.equal(inner.id)

        // A folder can never move under its own subtree.
        const cycle = await executeGql(
            this.apolloServer,
            `mutation MoveDriveEntry($input: MoveDriveEntryInput!) {
                moveDriveEntry(input: $input) { id }
            }`,
            {
                input: {
                    objectId: outer.id,
                    idempotencyKey: newIdempotencyKey(),
                    parentId: inner.id,
                },
            },
            owner,
        )
        const cycleError = firstGqlError(cycle)
        expect(cycleError.code).to.equal("INVALID_ARGUMENT")
        expect(cycleError.message).to.contain("cannot be moved into itself")

        // Files are not destinations.
        const intoFile = await executeGql(
            this.apolloServer,
            `mutation MoveDriveEntry($input: MoveDriveEntryInput!) {
                moveDriveEntry(input: $input) { id }
            }`,
            {
                input: {
                    objectId: inner.id,
                    idempotencyKey: newIdempotencyKey(),
                    parentId: file.id,
                },
            },
            owner,
        )
        expect(firstGqlError(intoFile).code).to.equal("INVALID_ARGUMENT")

        // Null reparents to the root.
        const toRoot = await this.driveHelper.moveEntry(
            { objectId: file.id, idempotencyKey: newIdempotencyKey(), parentId: null },
            owner,
        )
        expect(toRoot.parentId).to.equal(null)
    })

    it("trashes a subtree as a view and restores it, surfacing orphans at the root", async function () {
        const folder = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Projects" } },
            owner,
        )
        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            {
                idempotencyKey: newIdempotencyKey(),
                fields: { uploadId, name: "plan.png", parentId: folder.id },
            },
            owner,
        )

        const trashed = await this.driveHelper.trashEntry(folder.id, owner)
        expect(trashed.trashedTime).to.not.equal(null)

        // The subtree left the normal listings and shows in the trash view.
        const normal = await this.driveHelper.getEntries({ connection: byName }, owner)
        expect(normal.nodes).to.have.length(0)
        const trash = await this.driveHelper.getEntries(
            { filters: { inTrash: true }, connection: byName },
            owner,
        )
        // Name order under an ICU locale differs from C collation ("plan.png"
        // vs "Projects" flip), so assert membership rather than DB collation.
        expect(trash.nodes.map((entry) => entry?.name)).to.have.members(["plan.png", "Projects"])

        // Restoring just the child while its parent stays trashed surfaces
        // it at the root — never inside an invisible folder.
        const restoredChild = await this.driveHelper.restoreEntry(file.id, owner)
        expect(restoredChild.trashedTime).to.equal(null)
        expect(restoredChild.parentId).to.equal(null)

        const restoredFolder = await this.driveHelper.restoreEntry(folder.id, owner)
        expect(restoredFolder.trashedTime).to.equal(null)
        const after = await this.driveHelper.getEntries({ connection: byName }, owner)
        expect(after.nodes).to.have.length(2)
    })

    it("shares a file by flipping the underlying upload's visibility", async function () {
        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            { idempotencyKey: newIdempotencyKey(), fields: { uploadId, name: "flyer.png" } },
            owner,
        )
        expect(file.shared).to.equal(false)
        expect(file.fileUrl).to.contain("token=")

        await this.driveHelper.shareEntry({ objectId: file.id, shared: true }, owner)
        const shared = await this.driveHelper.getEntry(file.id, owner)
        expect(shared.shared).to.equal(true)
        // PUBLIC resolves to the stable, token-free serving URL.
        expect(shared.fileUrl).to.equal(`/file/${uploadId}`)

        await this.driveHelper.shareEntry({ objectId: file.id, shared: false }, owner)
        const unshared = await this.driveHelper.getEntry(file.id, owner)
        expect(unshared.shared).to.equal(false)
        expect(unshared.fileUrl).to.contain("token=")

        // Folders have nothing to share.
        const folder = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "NotShareable" } },
            owner,
        )
        const denied = await executeGql(
            this.apolloServer,
            `mutation ShareDriveEntry($input: ShareDriveEntryInput!) {
                shareDriveEntry(input: $input) { id }
            }`,
            { input: { objectId: folder.id, shared: true } },
            owner,
        )
        expect(firstGqlError(denied).code).to.equal("INVALID_ARGUMENT")
    })

    it("deletes a subtree permanently, removing the stored objects", async function () {
        const folder = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Doomed" } },
            owner,
        )
        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            {
                idempotencyKey: newIdempotencyKey(),
                fields: { uploadId, name: "gone.png", parentId: folder.id },
            },
            owner,
        )

        const deleted = await this.driveHelper.deleteEntry(folder.id, owner)
        expect(deleted).to.equal(true)

        const entryGone = await executeGql(
            this.apolloServer,
            `query DriveEntry($id: Id!) { driveEntry(id: $id) { id } }`,
            { id: file.id },
            owner,
        )
        expect(firstGqlError(entryGone).code).to.equal("NOT_FOUND")

        // The underlying upload went with it.
        const uploadGone = await executeGql(
            this.apolloServer,
            `query FileUrl($uploadId: Id!) { fileUrl(uploadId: $uploadId) { url } }`,
            { uploadId },
            owner,
        )
        expect(firstGqlError(uploadGone).code).to.equal("NOT_FOUND")
    })

    it("keeps albums as lenses: membership, counts, and deletion leave entries alone", async function () {
        const album = await this.driveHelper.createAlbum(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Summer" } },
            owner,
        )
        expect(album.entryCount).to.equal(0)

        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            { idempotencyKey: newIdempotencyKey(), fields: { uploadId, name: "beach.png" } },
            owner,
        )
        await this.driveHelper.addAlbumEntry(
            { idempotencyKey: newIdempotencyKey(), albumId: album.id, entryId: file.id },
            owner,
        )
        // Adding the same pair again is a no-op, not an error.
        await this.driveHelper.addAlbumEntry(
            { idempotencyKey: newIdempotencyKey(), albumId: album.id, entryId: file.id },
            owner,
        )
        const albums = await this.driveHelper.getAlbums(owner)
        expect(albums).to.have.length(1)
        expect(albums[0].entryCount).to.equal(1)

        const inAlbum = await this.driveHelper.getEntries(
            { filters: { albumId: album.id }, connection: byName },
            owner,
        )
        expect(inAlbum.nodes.map((entry) => entry?.id)).to.deep.equal([file.id])

        // Folders cannot join albums.
        const folder = await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "NoAlbums" } },
            owner,
        )
        const denied = await executeGql(
            this.apolloServer,
            `mutation AddDriveAlbumEntry($input: AddDriveAlbumEntryInput!) {
                addDriveAlbumEntry(input: $input) { id }
            }`,
            {
                input: {
                    idempotencyKey: newIdempotencyKey(),
                    albumId: album.id,
                    entryId: folder.id,
                },
            },
            owner,
        )
        expect(firstGqlError(denied).code).to.equal("INVALID_ARGUMENT")

        await this.driveHelper.removeAlbumEntry({ albumId: album.id, entryId: file.id }, owner)
        const emptied = await this.driveHelper.getAlbums(owner)
        expect(emptied[0].entryCount).to.equal(0)

        await this.driveHelper.deleteAlbum(album.id, owner)
        expect(await this.driveHelper.getAlbums(owner)).to.have.length(0)
        // The entry survived its album.
        const survivor = await this.driveHelper.getEntry(file.id, owner)
        expect(survivor.name).to.equal("beach.png")
    })

    it("scopes entries and albums to their owner", async function () {
        const stranger = await secondUserPrincipal(this)
        const uploadId = await fileReadyUpload(this, owner)
        const file = await this.driveHelper.registerFile(
            { idempotencyKey: newIdempotencyKey(), fields: { uploadId, name: "mine.png" } },
            owner,
        )
        const album = await this.driveHelper.createAlbum(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Private" } },
            owner,
        )

        const readDenied = await executeGql(
            this.apolloServer,
            `query DriveEntry($id: Id!) { driveEntry(id: $id) { id } }`,
            { id: file.id },
            stranger,
        )
        expect(firstGqlError(readDenied).code).to.equal("PERMISSION_DENIED")

        const renameDenied = await executeGql(
            this.apolloServer,
            `mutation RenameDriveEntry($input: RenameDriveEntryInput!) {
                renameDriveEntry(input: $input) { id }
            }`,
            { input: { objectId: file.id, idempotencyKey: newIdempotencyKey(), name: "stolen" } },
            stranger,
        )
        expect(firstGqlError(renameDenied).code).to.equal("PERMISSION_DENIED")

        const albumDenied = await executeGql(
            this.apolloServer,
            `query DriveAlbum($albumId: Id!) { driveAlbum(albumId: $albumId) { id } }`,
            { albumId: album.id },
            stranger,
        )
        expect(firstGqlError(albumDenied).code).to.equal("PERMISSION_DENIED")

        // Listings are silently scoped, not errored.
        const theirView = await this.driveHelper.getEntries({ connection: byName }, stranger)
        expect(theirView.nodes).to.have.length(0)
        expect(await this.driveHelper.getAlbums(stranger)).to.have.length(0)
    })

    it("clears the caller's whole library and nothing else", async function () {
        const stranger = await secondUserPrincipal(this)

        await this.driveHelper.createFolder(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "Mine" } },
            owner,
        )
        const myUpload = await fileReadyUpload(this, owner)
        await registerFile(this, owner, { uploadId: myUpload, name: "mine.png" })
        await this.driveHelper.createAlbum(
            { idempotencyKey: newIdempotencyKey(), fields: { name: "MyAlbum" } },
            owner,
        )

        const theirUpload = await fileReadyUpload(this, stranger)
        const theirs = await registerFile(this, stranger, {
            uploadId: theirUpload,
            name: "theirs.png",
        })

        expect(await this.driveHelper.clearLibrary(owner)).to.equal(true)

        expect((await this.driveHelper.getEntries({ connection: byName }, owner)).nodes).to.have.length(0)
        expect(await this.driveHelper.getAlbums(owner)).to.have.length(0)
        const myUploadGone = await executeGql(
            this.apolloServer,
            `query FileUrl($uploadId: Id!) { fileUrl(uploadId: $uploadId) { url } }`,
            { uploadId: myUpload },
            owner,
        )
        expect(firstGqlError(myUploadGone).code).to.equal("NOT_FOUND")

        // The other user's library is untouched.
        const theirEntry = await this.driveHelper.getEntry(theirs.id, stranger)
        expect(theirEntry.name).to.equal("theirs.png")
    })

    it("requires an authenticated caller", async function () {
        await expect(
            executeGql(
                this.apolloServer,
                `query DriveEntries($input: DriveEntryConnectionInput!) {
                    driveEntries(input: $input) { nodes { ${driveEntryGqlFields} } }
                }`,
                { input: { connection: byName } },
                null,
            ),
        ).to.be.rejectedWith("This operation requires an authenticated caller.")
    })

    it("admits DRIVE-profile uploads beyond the DEFAULT rules, within the drive cap", async function () {
        const createUploadMutation = `
            mutation CreateUpload($input: CreateUploadInput!) {
                createUpload(input: $input) { uploadId upload { status } }
            }
        `
        const zipAt50Mb = {
            contentType: "application/zip",
            sizeBytes: 50 * 1024 * 1024,
            visibility: "PRIVATE",
        }

        // DEFAULT refuses both the type and the size...
        const refused = await executeGql(
            this.apolloServer,
            createUploadMutation,
            { input: { idempotencyKey: randomUUID(), fields: zipAt50Mb } },
            owner,
        )
        expect(firstGqlError(refused).code).to.equal("INVALID_ARGUMENT")

        // ...the DRIVE profile admits them.
        const slot = await executeGqlAt<{ uploadId: string; upload: { status: string } }>(
            this.apolloServer,
            createUploadMutation,
            { input: { idempotencyKey: randomUUID(), fields: { ...zipAt50Mb, profile: "DRIVE" } } },
            "createUpload",
            owner,
        )
        expect(slot.upload.status).to.equal("PENDING")

        // The drive cap still binds.
        const overCap = await executeGql(
            this.apolloServer,
            createUploadMutation,
            {
                input: {
                    idempotencyKey: randomUUID(),
                    fields: { ...zipAt50Mb, sizeBytes: 100 * 1024 * 1024 + 1, profile: "DRIVE" },
                },
            },
            owner,
        )
        expect(firstGqlError(overCap).code).to.equal("INVALID_ARGUMENT")
    })
})
