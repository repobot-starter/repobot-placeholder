import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _SongFields = gql`
    fragment SongFields on Song {
        id
        chartRank
        title
        artist
        year
        genre
        streamsBillions
        notes
        createdTime
        updatedTime
    }
`

export const _Songs = gql`
    query Songs($input: SongConnectionInput!) {
        songs(input: $input) {
            nodes {
                ...SongFields
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

export const _CreateSong = gql`
    mutation CreateSong($input: CreateSongInput!) {
        createSong(input: $input) {
            ...SongFields
        }
    }
`

export const _UpdateSong = gql`
    mutation UpdateSong($input: UpdateSongInput!) {
        updateSong(input: $input) {
            ...SongFields
        }
    }
`

export const _DeleteSong = gql`
    mutation DeleteSong($input: DeleteSongInput!) {
        deleteSong(input: $input)
    }
`
