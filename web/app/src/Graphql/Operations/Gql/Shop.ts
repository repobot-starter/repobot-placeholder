import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _CheckoutSessionFields = gql`
    fragment CheckoutSessionFields on CheckoutSession {
        id
        provider
        status
        checkoutUrl
        productName
        amountTotal
        currency
        createdTime
    }
`

export const _ShopProduct = gql`
    query ShopProduct {
        shopProduct {
            key
            name
            tagline
            priceMinorUnits
            currency
        }
    }
`

export const _CheckoutSession = gql`
    query CheckoutSession($id: Id!) {
        checkoutSession(id: $id) {
            ...CheckoutSessionFields
        }
    }
`

export const _CreateCheckoutSession = gql`
    mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
        createCheckoutSession(input: $input) {
            ...CheckoutSessionFields
        }
    }
`

export const _CompleteTestCheckoutSession = gql`
    mutation CompleteTestCheckoutSession($input: CompleteTestCheckoutSessionInput!) {
        completeTestCheckoutSession(input: $input) {
            ...CheckoutSessionFields
        }
    }
`
