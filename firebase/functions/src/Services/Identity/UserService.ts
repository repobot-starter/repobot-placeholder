import { eq, ilike, inArray } from "drizzle-orm"
import { identityDb } from "../../Data/IdentityDatabase.js"
import { User, userInsertSchema, usersTable, UserStatus, userUpdateSchema } from "../../Data/Identity/User.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    orderedBatchLoadRowsByIds,
    updateRowReturning,
} from "../../Data/Utils/index.js"
import { ValueOrError } from "../../Utils/DataLoaderUtils.js"
import { RpcError } from "../../Utils/RpcError.js"
import { accountService } from "./AccountService.js"

class UserService {
    async createUser(request: CreateUserRequest): Promise<User> {
        const newUser = userInsertSchema.parse({ ...request.fields, status: "ACTIVE" })

        // account_id has no foreign key (domains may split into separate
        // databases), so the service layer enforces referential integrity.
        await accountService.getAccountByIdOrThrow(newUser.accountId)

        return await idempotentInsertAndGet(identityDb, usersTable, newUser, request.idempotencyKey)
    }

    async updateUser(request: UpdateUserRequest): Promise<User> {
        const updateValue = userUpdateSchema.parse(withoutNullProperties(request.fields))
        return await updateRowReturning(identityDb, usersTable, request.objectId, updateValue)
    }

    async getUserByIdOrThrow(userId: string): Promise<User> {
        return await getRowByIdOrThrow(identityDb, usersTable, userId)
    }

    async getUserByAuthSubject(authSubject: string): Promise<User | undefined> {
        const [user] = await identityDb
            .select()
            .from(usersTable)
            .where(eq(usersTable.authSubject, authSubject))
        return user
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await identityDb
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email.trim().toLowerCase()))
        return user
    }

    /**
     * Links an identity-provider subject to its application user, creating the
     * user (and a personal account) on first sign-in. Used by both the local
     * dev auto-provisioning path and the built-in auth token mint path.
     */
    async linkOrCreateUserForAuthSubject(request: LinkOrCreateUserRequest): Promise<User> {
        const existingBySubject = await this.getUserByAuthSubject(request.authSubject)
        if (existingBySubject !== undefined) {
            return existingBySubject
        }

        const existingByEmail = await this.getUserByEmail(request.email)
        if (existingByEmail !== undefined) {
            if (existingByEmail.authSubject !== null) {
                throw new RpcError(
                    "FAILED_PRECONDITION",
                    `User ${existingByEmail.id} is already linked to a different auth subject.`,
                )
            }
            return await updateRowReturning(identityDb, usersTable, existingByEmail.id, {
                authSubject: request.authSubject,
            })
        }

        const displayName = request.displayName ?? request.email
        const account = await accountService.createAccount({
            idempotencyKey: `${request.idempotencyKey}:account`,
            fields: { name: request.accountName ?? displayName },
        })
        const newUser = userInsertSchema.parse({
            accountId: account.id,
            email: request.email,
            displayName,
            status: "ACTIVE",
            authSubject: request.authSubject,
        })
        return await idempotentInsertAndGet(identityDb, usersTable, newUser, `${request.idempotencyKey}:user`)
    }

    async listUsers(request: ListUsersRequest): Promise<ListRowsResult<User>> {
        const filters = request.filters
        return await listRows(identityDb, usersTable, request.connection, {
            filters: [
                filters?.email ? ilike(usersTable.email, `%${filters.email}%`) : undefined,
                filters?.displayName ? ilike(usersTable.displayName, `%${filters.displayName}%`) : undefined,
                filters?.statuses && filters.statuses.length > 0
                    ? inArray(usersTable.status, filters.statuses)
                    : undefined,
            ],
            sortColumnKeys: ["email", "displayName", "status", "rowCreatedAt"],
        })
    }

    /**
     * Batch-loads users by id preserving order, for dataloaders.
     */
    async orderedBatchLoadUsersByIds(ids: readonly string[]): Promise<ValueOrError<User>[]> {
        return await orderedBatchLoadRowsByIds(identityDb, usersTable, ids)
    }
}

/**
 * GraphQL optional input fields arrive as null; drop them so partial updates
 * only touch the fields the caller actually provided.
 */
function withoutNullProperties<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, entryValue]) => entryValue !== null && entryValue !== undefined),
    ) as Partial<T>
}

export const userService = new UserService()

export interface CreateUserRequest {
    idempotencyKey: string
    fields: {
        accountId: string
        email: string
        displayName: string
    }
}

export interface UpdateUserRequest {
    objectId: string
    idempotencyKey: string
    fields: {
        displayName?: string | null
        status?: UserStatus | null
    }
}

export interface LinkOrCreateUserRequest {
    authSubject: string
    email: string
    displayName?: string
    accountName?: string
    idempotencyKey: string
}

export interface ListUsersRequest {
    connection: ConnectionParameters
    filters?: {
        email?: string | null
        displayName?: string | null
        statuses?: UserStatus[] | null
    } | null
}
