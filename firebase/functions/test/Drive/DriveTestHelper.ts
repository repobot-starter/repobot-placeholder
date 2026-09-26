import {
    GqlAddDriveAlbumEntryInput,
    GqlCreateDriveAlbumInput,
    GqlCreateDriveFolderInput,
    GqlDriveAlbum,
    GqlDriveEntry,
    GqlDriveEntryConnection,
    GqlDriveEntryConnectionInput,
    GqlMoveDriveEntryInput,
    GqlRegisterDriveFileInput,
    GqlRemoveDriveAlbumEntryInput,
    GqlRenameDriveEntryInput,
    GqlSetDriveEntryCaptionInput,
    GqlSetDriveEntryStarredInput,
    GqlShareDriveEntryInput,
} from "../../generated/GraphqlResolverTypes.js"
import { Principal } from "../../src/Utils/Principal.js"
import { executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const driveEntryGqlFields = `
    id
    name
    kind
    parentId
    starred
    trashedTime
    capturedTime
    caption
    uploadId
    thumbUploadId
    contentType
    sizeBytes
    fileUrl
    thumbUrl
    shared
    createdTime
    updatedTime
`

const driveAlbumGqlFields = `
    id
    name
    entryCount
    createdTime
    updatedTime
`

const pageInfoGqlFields = `
    hasPreviousPage
    hasNextPage
    startCursor
    endCursor
`

/**
 * Drive operations execute as an explicit principal: the domain is
 * owner-scoped, so unlike the singleton domains every call carries who is
 * acting (the tests exercise cross-user denial as much as the happy path).
 */
export class DriveTestHelper extends BaseTestHelper {
    async getEntries(
        input: GqlDriveEntryConnectionInput,
        principal: Principal,
    ): Promise<GqlDriveEntryConnection> {
        return await executeGqlAt(
            this.server,
            `query DriveEntries($input: DriveEntryConnectionInput!) {
                driveEntries(input: $input) {
                    nodes { ${driveEntryGqlFields} }
                    pageInfo { ${pageInfoGqlFields} }
                }
            }`,
            { input },
            "driveEntries",
            principal,
        )
    }

    async getEntry(id: string, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `query DriveEntry($id: Id!) {
                driveEntry(id: $id) { ${driveEntryGqlFields} }
            }`,
            { id },
            "driveEntry",
            principal,
        )
    }

    async createFolder(input: GqlCreateDriveFolderInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation CreateDriveFolder($input: CreateDriveFolderInput!) {
                createDriveFolder(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "createDriveFolder",
            principal,
        )
    }

    async registerFile(input: GqlRegisterDriveFileInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation RegisterDriveFile($input: RegisterDriveFileInput!) {
                registerDriveFile(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "registerDriveFile",
            principal,
        )
    }

    async renameEntry(input: GqlRenameDriveEntryInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation RenameDriveEntry($input: RenameDriveEntryInput!) {
                renameDriveEntry(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "renameDriveEntry",
            principal,
        )
    }

    async moveEntry(input: GqlMoveDriveEntryInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation MoveDriveEntry($input: MoveDriveEntryInput!) {
                moveDriveEntry(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "moveDriveEntry",
            principal,
        )
    }

    async trashEntry(objectId: string, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation TrashDriveEntry($input: TrashDriveEntryInput!) {
                trashDriveEntry(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input: { objectId } },
            "trashDriveEntry",
            principal,
        )
    }

    async restoreEntry(objectId: string, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation RestoreDriveEntry($input: RestoreDriveEntryInput!) {
                restoreDriveEntry(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input: { objectId } },
            "restoreDriveEntry",
            principal,
        )
    }

    async deleteEntry(objectId: string, principal: Principal): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DeleteDriveEntry($input: DeleteDriveEntryInput!) {
                deleteDriveEntry(input: $input)
            }`,
            { input: { objectId } },
            "deleteDriveEntry",
            principal,
        )
    }

    async setEntryStarred(input: GqlSetDriveEntryStarredInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation SetDriveEntryStarred($input: SetDriveEntryStarredInput!) {
                setDriveEntryStarred(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "setDriveEntryStarred",
            principal,
        )
    }

    async setEntryCaption(input: GqlSetDriveEntryCaptionInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation SetDriveEntryCaption($input: SetDriveEntryCaptionInput!) {
                setDriveEntryCaption(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "setDriveEntryCaption",
            principal,
        )
    }

    async shareEntry(input: GqlShareDriveEntryInput, principal: Principal): Promise<GqlDriveEntry> {
        return await executeGqlAt(
            this.server,
            `mutation ShareDriveEntry($input: ShareDriveEntryInput!) {
                shareDriveEntry(input: $input) { ${driveEntryGqlFields} }
            }`,
            { input },
            "shareDriveEntry",
            principal,
        )
    }

    async getAlbums(principal: Principal): Promise<GqlDriveAlbum[]> {
        return await executeGqlAt(
            this.server,
            `query DriveAlbums {
                driveAlbums { ${driveAlbumGqlFields} }
            }`,
            {},
            "driveAlbums",
            principal,
        )
    }

    async createAlbum(input: GqlCreateDriveAlbumInput, principal: Principal): Promise<GqlDriveAlbum> {
        return await executeGqlAt(
            this.server,
            `mutation CreateDriveAlbum($input: CreateDriveAlbumInput!) {
                createDriveAlbum(input: $input) { ${driveAlbumGqlFields} }
            }`,
            { input },
            "createDriveAlbum",
            principal,
        )
    }

    async addAlbumEntry(input: GqlAddDriveAlbumEntryInput, principal: Principal): Promise<GqlDriveAlbum> {
        return await executeGqlAt(
            this.server,
            `mutation AddDriveAlbumEntry($input: AddDriveAlbumEntryInput!) {
                addDriveAlbumEntry(input: $input) { ${driveAlbumGqlFields} }
            }`,
            { input },
            "addDriveAlbumEntry",
            principal,
        )
    }

    async removeAlbumEntry(input: GqlRemoveDriveAlbumEntryInput, principal: Principal): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation RemoveDriveAlbumEntry($input: RemoveDriveAlbumEntryInput!) {
                removeDriveAlbumEntry(input: $input)
            }`,
            { input },
            "removeDriveAlbumEntry",
            principal,
        )
    }

    async deleteAlbum(objectId: string, principal: Principal): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DeleteDriveAlbum($input: DeleteDriveAlbumInput!) {
                deleteDriveAlbum(input: $input)
            }`,
            { input: { objectId } },
            "deleteDriveAlbum",
            principal,
        )
    }

    async clearLibrary(principal: Principal): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation ClearDriveLibrary {
                clearDriveLibrary
            }`,
            {},
            "clearDriveLibrary",
            principal,
        )
    }
}
