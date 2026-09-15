import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _PaymentSubscriptionFields = gql`
    fragment PaymentSubscriptionFields on PaymentSubscription {
        id
        status
        provider
        productKey
        productName
        amountTotal
        currency
        recurringInterval
        currentPeriodEnd
        createdTime
    }
`

export const _MySubscription = gql`
    query MySubscription($productKey: String) {
        mySubscription(productKey: $productKey) {
            ...PaymentSubscriptionFields
        }
    }
`

export const _CreateBillingPortalSession = gql`
    mutation CreateBillingPortalSession($input: CreateBillingPortalSessionInput!) {
        createBillingPortalSession(input: $input) {
            url
        }
    }
`

export const _CancelTestSubscription = gql`
    mutation CancelTestSubscription {
        cancelTestSubscription {
            ...PaymentSubscriptionFields
        }
    }
`
