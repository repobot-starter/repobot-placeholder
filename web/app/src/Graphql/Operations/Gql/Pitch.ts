import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _PitchSlideFields = gql`
    fragment PitchSlideFields on PitchSlide {
        id
        kind
        position
        title
        body
        included
    }
`

export const _PitchDeckFields = gql`
    fragment PitchDeckFields on PitchDeck {
        id
        name
        companyName
        tagline
        logoUploadId
        accentColor
        createdTime
    }
`

export const _PitchSeriesPointFields = gql`
    fragment PitchSeriesPointFields on PitchSeriesPoint {
        month
        minorUnits
    }
`

export const _PitchDecks = gql`
    query PitchDecks {
        pitchDecks {
            ...PitchDeckFields
        }
    }
`

export const _PitchDeckOutline = gql`
    query PitchDeckOutline($deckId: Id!) {
        pitchDeck(deckId: $deckId) {
            ...PitchDeckFields
            slides {
                ...PitchSlideFields
            }
        }
    }
`

export const _PitchDeckData = gql`
    query PitchDeckData {
        pitchDeckData {
            companyName
            currency
            revenueSeries {
                ...PitchSeriesPointFields
            }
            expenseSeries {
                ...PitchSeriesPointFields
            }
            netIncomeSeries {
                ...PitchSeriesPointFields
            }
            cashSeries {
                ...PitchSeriesPointFields
            }
            revenueGrowthPercent
            netMarginPercent
            averageNetIncomeMinorUnits
            latestCashMinorUnits
            runwayMonths
            trailingTwelveMonthRevenueMinorUnits
            customerCount
            paidInvoiceCount
        }
    }
`

export const _PitchCreateDeck = gql`
    mutation PitchCreateDeck($input: PitchCreateDeckInput!) {
        pitchCreateDeck(input: $input) {
            ...PitchDeckFields
        }
    }
`

export const _PitchUpdateDeck = gql`
    mutation PitchUpdateDeck($input: PitchUpdateDeckInput!) {
        pitchUpdateDeck(input: $input) {
            ...PitchDeckFields
        }
    }
`

export const _PitchDeleteDeck = gql`
    mutation PitchDeleteDeck($input: PitchDeleteDeckInput!) {
        pitchDeleteDeck(input: $input)
    }
`

export const _PitchUpdateSlide = gql`
    mutation PitchUpdateSlide($input: PitchUpdateSlideInput!) {
        pitchUpdateSlide(input: $input) {
            ...PitchSlideFields
        }
    }
`

export const _PitchExportDeckPdf = gql`
    mutation PitchExportDeckPdf($input: PitchExportDeckPdfInput!) {
        pitchExportDeckPdf(input: $input) {
            id
            fileName
        }
    }
`
