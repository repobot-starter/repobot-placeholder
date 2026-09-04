import { ilike } from "drizzle-orm"
import { Account, accountInsertSchema, accountsTable } from "../../Data/Identity/Account.js"
import { identityDb } from "../../Data/IdentityDatabase.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    orderedBatchLoadRowsByIds,
} from "../../Data/Utils/index.js"
import { ValueOrError } from "../../Utils/DataLoaderUtils.js"

class AccountService {
    async createAccount(request: CreateAccountRequest): Promise<Account> {
        const newAccount = accountInsertSchema.parse(request.fields)
        return await idempotentInsertAndGet(identityDb, accountsTable, newAccount, request.idempotencyKey)
    }

    async getAccountByIdOrThrow(accountId: string): Promise<Account> {
        return await getRowByIdOrThrow(identityDb, accountsTable, accountId)
    }

    async listAccounts(request: ListAccountsRequest): Promise<ListRowsResult<Account>> {
        return await listRows(identityDb, accountsTable, request.connection, {
            filters: [
                request.filters?.name ? ilike(accountsTable.name, `%${request.filters.name}%`) : undefined,
            ],
            sortColumnKeys: ["name", "rowCreatedAt"],
        })
    }

    /**
     * Batch-loads accounts by id preserving order, for dataloaders.
     */
    async orderedBatchLoadAccountsByIds(ids: readonly string[]): Promise<ValueOrError<Account>[]> {
        return await orderedBatchLoadRowsByIds(identityDb, accountsTable, ids)
    }
}

export const accountService = new AccountService()

export interface CreateAccountRequest {
    idempotencyKey: string
    fields: {
        name: string
    }
}

export interface ListAccountsRequest {
    connection: ConnectionParameters
    filters?: {
        name?: string | null
    } | null
}
