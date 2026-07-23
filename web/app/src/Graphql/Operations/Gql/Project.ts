import { gql } from "@apollo/client"

//
// Codegen inputs only (exported to satisfy noUnusedLocals; never import). See Identity.ts.
//

export const _ProjectFields = gql`
    fragment ProjectFields on Project {
        id
        name
        description
        status
        createdTime
        archivedAt
        createdBy {
            id
            displayName
        }
    }
`

export const _Projects = gql`
    query Projects($input: ProjectConnectionInput!) {
        projects(input: $input) {
            nodes {
                ...ProjectFields
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
`

export const _CreateProject = gql`
    mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
            ...ProjectFields
        }
    }
`

export const _UpdateProject = gql`
    mutation UpdateProject($input: UpdateProjectInput!) {
        updateProject(input: $input) {
            ...ProjectFields
        }
    }
`
