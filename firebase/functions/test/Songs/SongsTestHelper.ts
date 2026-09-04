import {
    GqlCreateSongInput,
    GqlDeleteSongInput,
    GqlSchemaForm,
    GqlSong,
    GqlSongConnection,
    GqlSongConnectionInput,
    GqlUpdateSongInput,
} from "../../generated/GraphqlResolverTypes.js"
import { executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const songGqlFields = `
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
`

const pageInfoGqlFields = `
    hasPreviousPage
    hasNextPage
    startCursor
    endCursor
`

const schemaFormGqlFields = `
    jsonSchema
    uiSchema
    defaultData
`

export class SongsTestHelper extends BaseTestHelper {
    async getSongs(input: GqlSongConnectionInput): Promise<GqlSongConnection> {
        return await executeGqlAt(
            this.server,
            `query Songs($input: SongConnectionInput!) {
                songs(input: $input) {
                    nodes { ${songGqlFields} }
                    pageInfo { ${pageInfoGqlFields} }
                }
            }`,
            { input },
            "songs",
        )
    }

    async getSong(id: string): Promise<GqlSong> {
        return await executeGqlAt(
            this.server,
            `query Song($id: Id!) {
                song(id: $id) { ${songGqlFields} }
            }`,
            { id },
            "song",
        )
    }

    async createSong(input: GqlCreateSongInput): Promise<GqlSong> {
        return await executeGqlAt(
            this.server,
            `mutation CreateSong($input: CreateSongInput!) {
                createSong(input: $input) { ${songGqlFields} }
            }`,
            { input },
            "createSong",
        )
    }

    async updateSong(input: GqlUpdateSongInput): Promise<GqlSong> {
        return await executeGqlAt(
            this.server,
            `mutation UpdateSong($input: UpdateSongInput!) {
                updateSong(input: $input) { ${songGqlFields} }
            }`,
            { input },
            "updateSong",
        )
    }

    async deleteSong(input: GqlDeleteSongInput): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation DeleteSong($input: DeleteSongInput!) {
                deleteSong(input: $input)
            }`,
            { input },
            "deleteSong",
        )
    }

    async getSongCreateFormSchema(): Promise<GqlSchemaForm> {
        return await executeGqlAt(
            this.server,
            `query SongCreateFormSchema {
                songCreateFormSchema { ${schemaFormGqlFields} }
            }`,
            {},
            "songCreateFormSchema",
        )
    }

    async getSongUpdateFormSchema(objectId: string): Promise<GqlSchemaForm> {
        return await executeGqlAt(
            this.server,
            `query SongUpdateFormSchema($input: SchemaFormUpdateInput!) {
                songUpdateFormSchema(input: $input) { ${schemaFormGqlFields} }
            }`,
            { input: { objectId } },
            "songUpdateFormSchema",
        )
    }
}
