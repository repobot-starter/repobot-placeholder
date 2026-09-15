import assert from "node:assert/strict"
import {
    GqlAccount,
    GqlAccountConnection,
    GqlAccountConnectionInput,
    GqlCreateAccountInput,
    GqlCreateUserInput,
    GqlUpdateUserInput,
    GqlUser,
    GqlUserConnection,
    GqlUserConnectionInput,
} from "../../generated/GraphqlResolverTypes.js"
import { buildCreateAccountInput } from "../Utils/Factories/AccountFactory.js"
import { executeGqlAt } from "../Utils/Gql/GqlUtils.js"
import { BaseTestHelper } from "../Utils/Helpers/BaseTestHelper.js"

export const accountGqlFields = `
    id
    name
    createdTime
`

export const userGqlFields = `
    id
    email
    displayName
    status
    createdTime
    account {
        id
        name
    }
`

const pageInfoGqlFields = `
    hasPreviousPage
    hasNextPage
    startCursor
    endCursor
`

export class IdentityTestHelper extends BaseTestHelper {
    //
    // Accounts
    //

    async createAccount(input: GqlCreateAccountInput): Promise<GqlAccount> {
        return await executeGqlAt(
            this.server,
            `mutation CreateAccount($input: CreateAccountInput!) {
                createAccount(input: $input) { ${accountGqlFields} }
            }`,
            { input },
            "createAccount",
        )
    }

    /**
     * Creates an account via the mutation, then reads it back through the
     * accounts query (blackbox round trip).
     */
    async createAndGetAccount(input?: GqlCreateAccountInput): Promise<GqlAccount> {
        const createInput = input ?? buildCreateAccountInput()
        const created = await this.createAccount(createInput)

        const connection = await this.getAccounts({
            filters: { name: createInput.fields.name },
            connection: {
                pagination: { first: 50 },
                sort: [{ fieldName: "name", direction: "asc" }],
            },
        })
        const account = connection.nodes.find((node) => node?.id === created.id)
        assert(account != null, `Created account ${created.id} was not returned by the accounts query.`)
        return account
    }

    async getAccounts(input: GqlAccountConnectionInput): Promise<GqlAccountConnection> {
        return await executeGqlAt(
            this.server,
            `query Accounts($input: AccountConnectionInput!) {
                accounts(input: $input) {
                    nodes { ${accountGqlFields} }
                    pageInfo { ${pageInfoGqlFields} }
                }
            }`,
            { input },
            "accounts",
        )
    }

    //
    // Users
    //

    async createUser(input: GqlCreateUserInput): Promise<GqlUser> {
        return await executeGqlAt(
            this.server,
            `mutation CreateUser($input: CreateUserInput!) {
                createUser(input: $input) { ${userGqlFields} }
            }`,
            { input },
            "createUser",
        )
    }

    /**
     * Creates a user via the mutation, then reads it back through the users
     * query filtered by email (blackbox round trip).
     */
    async createAndGetUser(input: GqlCreateUserInput): Promise<GqlUser> {
        const created = await this.createUser(input)

        const connection = await this.getUsers({
            filters: { email: created.email },
            connection: {
                pagination: { first: 50 },
                sort: [{ fieldName: "email", direction: "asc" }],
            },
        })
        const user = connection.nodes.find((node) => node?.id === created.id)
        assert(user != null, `Created user ${created.id} was not returned by the users query.`)
        return user
    }

    async updateUser(input: GqlUpdateUserInput): Promise<GqlUser> {
        return await executeGqlAt(
            this.server,
            `mutation UpdateUser($input: UpdateUserInput!) {
                updateUser(input: $input) { ${userGqlFields} }
            }`,
            { input },
            "updateUser",
        )
    }

    async getUsers(input: GqlUserConnectionInput): Promise<GqlUserConnection> {
        return await executeGqlAt(
            this.server,
            `query Users($input: UserConnectionInput!) {
                users(input: $input) {
                    nodes { ${userGqlFields} }
                    pageInfo { ${pageInfoGqlFields} }
                }
            }`,
            { input },
            "users",
        )
    }
}
