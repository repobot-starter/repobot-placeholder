import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

const _DriveEntryFields = gql`
    fragment DriveEntryFields on DriveEntry {
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
    }
`

export const _DriveEntries = gql`
    ${_DriveEntryFields}
    query DriveEntries($input: DriveEntryConnectionInput!) {
        driveEntries(input: $input) {
            nodes {
                ...DriveEntryFields
            }
            pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
            }
        }
    }
`

export const _DriveEntry = gql`
    ${_DriveEntryFields}
    query DriveEntry($id: Id!) {
        driveEntry(id: $id) {
            ...DriveEntryFields
        }
    }
`

export const _DriveAlbums = gql`
    query DriveAlbums {
        driveAlbums {
            id
            name
            entryCount
            createdTime
            updatedTime
        }
    }
`

export const _CreateDriveFolder = gql`
    ${_DriveEntryFields}
    mutation CreateDriveFolder($input: CreateDriveFolderInput!) {
        createDriveFolder(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _RegisterDriveFile = gql`
    ${_DriveEntryFields}
    mutation RegisterDriveFile($input: RegisterDriveFileInput!) {
        registerDriveFile(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _RenameDriveEntry = gql`
    ${_DriveEntryFields}
    mutation RenameDriveEntry($input: RenameDriveEntryInput!) {
        renameDriveEntry(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _MoveDriveEntry = gql`
    ${_DriveEntryFields}
    mutation MoveDriveEntry($input: MoveDriveEntryInput!) {
        moveDriveEntry(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _TrashDriveEntry = gql`
    ${_DriveEntryFields}
    mutation TrashDriveEntry($input: TrashDriveEntryInput!) {
        trashDriveEntry(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _RestoreDriveEntry = gql`
    ${_DriveEntryFields}
    mutation RestoreDriveEntry($input: RestoreDriveEntryInput!) {
        restoreDriveEntry(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _DeleteDriveEntry = gql`
    mutation DeleteDriveEntry($input: DeleteDriveEntryInput!) {
        deleteDriveEntry(input: $input)
    }
`

export const _SetDriveEntryStarred = gql`
    ${_DriveEntryFields}
    mutation SetDriveEntryStarred($input: SetDriveEntryStarredInput!) {
        setDriveEntryStarred(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _SetDriveEntryCaption = gql`
    ${_DriveEntryFields}
    mutation SetDriveEntryCaption($input: SetDriveEntryCaptionInput!) {
        setDriveEntryCaption(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _ReplaceDriveEntryMedia = gql`
    ${_DriveEntryFields}
    mutation ReplaceDriveEntryMedia($input: ReplaceDriveEntryMediaInput!) {
        replaceDriveEntryMedia(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _ShareDriveEntry = gql`
    ${_DriveEntryFields}
    mutation ShareDriveEntry($input: ShareDriveEntryInput!) {
        shareDriveEntry(input: $input) {
            ...DriveEntryFields
        }
    }
`

export const _CreateDriveAlbum = gql`
    mutation CreateDriveAlbum($input: CreateDriveAlbumInput!) {
        createDriveAlbum(input: $input) {
            id
            name
            entryCount
        }
    }
`

export const _RenameDriveAlbum = gql`
    mutation RenameDriveAlbum($input: RenameDriveAlbumInput!) {
        renameDriveAlbum(input: $input) {
            id
            name
            entryCount
        }
    }
`

export const _DeleteDriveAlbum = gql`
    mutation DeleteDriveAlbum($input: DeleteDriveAlbumInput!) {
        deleteDriveAlbum(input: $input)
    }
`

export const _AddDriveAlbumEntry = gql`
    mutation AddDriveAlbumEntry($input: AddDriveAlbumEntryInput!) {
        addDriveAlbumEntry(input: $input) {
            id
            name
            entryCount
        }
    }
`

export const _RemoveDriveAlbumEntry = gql`
    mutation RemoveDriveAlbumEntry($input: RemoveDriveAlbumEntryInput!) {
        removeDriveAlbumEntry(input: $input)
    }
`

export const _ClearDriveLibrary = gql`
    mutation ClearDriveLibrary {
        clearDriveLibrary
    }
`
