import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _QuickBooksConnectionFields = gql`
    fragment QuickBooksConnectionFields on QuickBooksConnection {
        id
        realmId
        companyName
        mode
        provider
        connectedTime
    }
`

export const _QuickBooksStatus = gql`
    query QuickBooksStatus {
        quickBooksStatus {
            connected
            mode
            connection {
                ...QuickBooksConnectionFields
            }
        }
    }
`

export const _QuickBooksCompanySnapshot = gql`
    query QuickBooksCompanySnapshot {
        quickBooksCompanySnapshot {
            companyName
            currency
            revenueMinorUnits
            outstandingMinorUnits
            overdueMinorUnits
            paidInvoiceCount
            openInvoiceCount
            overdueInvoiceCount
            customerCount
        }
    }
`

export const _QuickBooksCustomers = gql`
    query QuickBooksCustomers {
        quickBooksCustomers {
            id
            displayName
            companyName
            email
            city
            state
            customerSince
            openBalanceMinorUnits
        }
    }
`

export const _QuickBooksInvoices = gql`
    query QuickBooksInvoices($input: QuickBooksInvoicesInput) {
        quickBooksInvoices(input: $input) {
            id
            docNumber
            customerId
            customerName
            status
            issueDate
            dueDate
            totalMinorUnits
            balanceMinorUnits
        }
    }
`

export const _ConnectQuickBooks = gql`
    mutation ConnectQuickBooks($input: ConnectQuickBooksInput!) {
        connectQuickBooks(input: $input) {
            ...QuickBooksConnectionFields
        }
    }
`

export const _DisconnectQuickBooks = gql`
    mutation DisconnectQuickBooks {
        disconnectQuickBooks
    }
`

export const _BeginQuickBooksAuthorization = gql`
    mutation BeginQuickBooksAuthorization($input: BeginQuickBooksAuthorizationInput!) {
        beginQuickBooksAuthorization(input: $input) {
            authorizationUrl
        }
    }
`

export const _CompleteQuickBooksAuthorization = gql`
    mutation CompleteQuickBooksAuthorization($input: CompleteQuickBooksAuthorizationInput!) {
        completeQuickBooksAuthorization(input: $input) {
            ...QuickBooksConnectionFields
        }
    }
`
