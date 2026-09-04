import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _FlowLineFields = gql`
    fragment FlowLineFields on FlowLine {
        id
        position
        label
        section
        linkedCategory
        budgetsMinorUnits
        actualsMinorUnits
        variancesMinorUnits
    }
`

export const _FlowTemplateFields = gql`
    fragment FlowTemplateFields on FlowTemplate {
        id
        name
        startMonth
        monthCount
        months
        currency
        createdTime
    }
`

export const _FlowTemplates = gql`
    query FlowTemplates {
        flowTemplates {
            ...FlowTemplateFields
        }
    }
`

export const _FlowTemplateGrid = gql`
    query FlowTemplateGrid($templateId: Id!) {
        flowTemplate(templateId: $templateId) {
            ...FlowTemplateFields
            lines {
                ...FlowLineFields
            }
        }
    }
`

export const _FlowLinkableCategories = gql`
    query FlowLinkableCategories {
        flowLinkableCategories {
            incomeCategories
            expenseCategories
        }
    }
`

export const _MyBooksConnection = gql`
    query MyBooksConnection {
        myBooksConnection {
            ...QuickBooksConnectionFields
        }
    }
`

export const _ConnectMyBooks = gql`
    mutation ConnectMyBooks($input: ConnectQuickBooksInput!) {
        connectMyBooks(input: $input) {
            ...QuickBooksConnectionFields
        }
    }
`

export const _DisconnectMyBooks = gql`
    mutation DisconnectMyBooks {
        disconnectMyBooks
    }
`

export const _FlowCreateTemplate = gql`
    mutation FlowCreateTemplate($input: FlowCreateTemplateInput!) {
        flowCreateTemplate(input: $input) {
            ...FlowTemplateFields
        }
    }
`

export const _FlowRenameTemplate = gql`
    mutation FlowRenameTemplate($input: FlowRenameTemplateInput!) {
        flowRenameTemplate(input: $input) {
            ...FlowTemplateFields
        }
    }
`

export const _FlowDeleteTemplate = gql`
    mutation FlowDeleteTemplate($input: FlowDeleteTemplateInput!) {
        flowDeleteTemplate(input: $input)
    }
`

export const _FlowAddLine = gql`
    mutation FlowAddLine($input: FlowAddLineInput!) {
        flowAddLine(input: $input) {
            ...FlowLineFields
        }
    }
`

export const _FlowUpdateLine = gql`
    mutation FlowUpdateLine($input: FlowUpdateLineInput!) {
        flowUpdateLine(input: $input) {
            ...FlowLineFields
        }
    }
`

export const _FlowRemoveLine = gql`
    mutation FlowRemoveLine($input: FlowRemoveLineInput!) {
        flowRemoveLine(input: $input)
    }
`

export const _FlowExportTemplateXlsx = gql`
    mutation FlowExportTemplateXlsx($input: FlowExportTemplateXlsxInput!) {
        flowExportTemplateXlsx(input: $input) {
            id
            fileName
        }
    }
`

export const _FlowImportTemplateXlsx = gql`
    mutation FlowImportTemplateXlsx($input: FlowImportTemplateXlsxInput!) {
        flowImportTemplateXlsx(input: $input) {
            ...FlowTemplateFields
        }
    }
`
