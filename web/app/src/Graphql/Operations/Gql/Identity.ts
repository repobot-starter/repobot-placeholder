import { gql } from "@apollo/client"

//
// gql documents live ONLY under src/Graphql/Operations/Gql/. These constants
// are codegen inputs (see graphql-codegen.yaml) which produce typed hooks in
// src/generated/graphql/types.ts. They are exported only to satisfy
// noUnusedLocals; never import them — use the generated hooks instead.
//

export const _PageInfoFields = gql`
    fragment PageInfoFields on PageInfo {
        hasNextPage
        endCursor
    }
`

export const _UserFields = gql`
    fragment UserFields on User {
        id
        email
        displayName
        status
        createdTime
        account {
            id
            name
        }
    }
`

export const _CurrentUser = gql`
    query CurrentUser {
        currentUser {
            ...UserFields
        }
    }
`

export const _Users = gql`
    query Users($input: UserConnectionInput!) {
        users(input: $input) {
            nodes {
                ...UserFields
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
`

export const _CreateUser = gql`
    mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
            ...UserFields
        }
    }
`

export const _UpdateUser = gql`
    mutation UpdateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
            ...UserFields
        }
    }
`
