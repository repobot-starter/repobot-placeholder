import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _CreateSubscriptionCheckoutSession = gql`
    mutation CreateSubscriptionCheckoutSession($input: CreateSubscriptionCheckoutSessionInput!) {
        createSubscriptionCheckoutSession(input: $input) {
            ...CheckoutSessionFields
        }
    }
`
