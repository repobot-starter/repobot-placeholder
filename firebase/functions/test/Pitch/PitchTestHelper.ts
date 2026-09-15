import {
    GqlPitchCreateDeckInput,
    GqlPitchDeck,
    GqlPitchDeckData,
    GqlPitchSlide,
    GqlPitchUpdateDeckInput,
    GqlPitchUpdateSlideInput,
    GqlUpload,
    GqlUser,
} from "../../generated/GraphqlResolverTypes.js"
import { asUser, executeGqlAt, executeGqlSuccess } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const pitchSlideGqlFields = `
    id
    kind
    position
    title
    body
    included
`

export const pitchDeckGqlFields = `
    id
    name
    companyName
    tagline
    logoUploadId
    accentColor
    createdTime
    slides { ${pitchSlideGqlFields} }
`

const seriesGqlFields = `month minorUnits`

export const pitchDeckDataGqlFields = `
    companyName
    currency
    revenueSeries { ${seriesGqlFields} }
    expenseSeries { ${seriesGqlFields} }
    netIncomeSeries { ${seriesGqlFields} }
    cashSeries { ${seriesGqlFields} }
    revenueGrowthPercent
    netMarginPercent
    averageNetIncomeMinorUnits
    latestCashMinorUnits
    runwayMonths
    trailingTwelveMonthRevenueMinorUnits
    customerCount
    paidInvoiceCount
`

export class PitchTestHelper extends BaseTestHelper {
    async createDeck(user: GqlUser, input: GqlPitchCreateDeckInput): Promise<GqlPitchDeck> {
        return await executeGqlAt(
            this.server,
            `mutation PitchCreateDeck($input: PitchCreateDeckInput!) {
                pitchCreateDeck(input: $input) { ${pitchDeckGqlFields} }
            }`,
            { input },
            "pitchCreateDeck",
            asUser(user),
        )
    }

    async listDecks(user: GqlUser): Promise<GqlPitchDeck[]> {
        return await executeGqlAt(
            this.server,
            `query PitchDecks {
                pitchDecks { ${pitchDeckGqlFields} }
            }`,
            {},
            "pitchDecks",
            asUser(user),
        )
    }

    async getDeck(user: GqlUser, deckId: string): Promise<GqlPitchDeck> {
        return await executeGqlAt(
            this.server,
            `query PitchDeck($deckId: Id!) {
                pitchDeck(deckId: $deckId) { ${pitchDeckGqlFields} }
            }`,
            { deckId },
            "pitchDeck",
            asUser(user),
        )
    }

    /** Null before the books connect — executeGqlAt would assert, so read the raw response. */
    async getDeckData(user: GqlUser): Promise<GqlPitchDeckData | null> {
        const result = await executeGqlSuccess(
            this.server,
            `query PitchDeckData {
                pitchDeckData { ${pitchDeckDataGqlFields} }
            }`,
            {},
            asUser(user),
        )
        return (result.data as { pitchDeckData: GqlPitchDeckData | null }).pitchDeckData
    }

    async updateDeck(user: GqlUser, input: GqlPitchUpdateDeckInput): Promise<GqlPitchDeck> {
        return await executeGqlAt(
            this.server,
            `mutation PitchUpdateDeck($input: PitchUpdateDeckInput!) {
                pitchUpdateDeck(input: $input) { ${pitchDeckGqlFields} }
            }`,
            { input },
            "pitchUpdateDeck",
            asUser(user),
        )
    }

    async deleteDeck(user: GqlUser, deckId: string): Promise<boolean> {
        return await executeGqlAt(
            this.server,
            `mutation PitchDeleteDeck($input: PitchDeleteDeckInput!) {
                pitchDeleteDeck(input: $input)
            }`,
            { input: { deckId } },
            "pitchDeleteDeck",
            asUser(user),
        )
    }

    async updateSlide(user: GqlUser, input: GqlPitchUpdateSlideInput): Promise<GqlPitchSlide> {
        return await executeGqlAt(
            this.server,
            `mutation PitchUpdateSlide($input: PitchUpdateSlideInput!) {
                pitchUpdateSlide(input: $input) { ${pitchSlideGqlFields} }
            }`,
            { input },
            "pitchUpdateSlide",
            asUser(user),
        )
    }

    async exportDeckPdf(user: GqlUser, deckId: string, idempotencyKey: string): Promise<GqlUpload> {
        return await executeGqlAt(
            this.server,
            `mutation PitchExportDeckPdf($input: PitchExportDeckPdfInput!) {
                pitchExportDeckPdf(input: $input) {
                    id
                    contentType
                    fileName
                    visibility
                    status
                    sizeBytes
                }
            }`,
            { input: { idempotencyKey, deckId } },
            "pitchExportDeckPdf",
            asUser(user),
        )
    }
}
