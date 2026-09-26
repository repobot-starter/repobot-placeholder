import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { cfoService } from "../../../Services/Cfo/CfoService.js"
import { userService } from "../../../Services/Identity/index.js"
import { quickBooksService } from "../../../Services/QuickBooks/QuickBooksService.js"
import { RpcError } from "../../../Utils/RpcError.js"
import { GraphqlRequestContext } from "../../GraphqlServer.js"

/** The authenticated application user behind the request, or UNAUTHENTICATED. */
function requireUserId(context: GraphqlRequestContext, action: string): string {
    const userId = context.principal?.userId
    if (userId === undefined) {
        throw new RpcError("UNAUTHENTICATED", `${action} requires an authenticated user.`)
    }
    return userId
}

export const cfoResolvers: GqlResolvers = {
    Query: {
        cfoMyMembership: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Reading your practice membership")
            const user = await userService.getUserByIdOrThrow(userId)
            return await cfoService.ensureMembership({ userId, email: user.email })
        },

        cfoClients: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Listing clients")
            return await cfoService.listClientMemberships(userId)
        },

        cfoClient: async (_parent, { clientUserId }, context) => {
            const userId = requireUserId(context, "Reading a member's books")
            await cfoService.requireCanViewClient(userId, clientUserId)
            const membership = await cfoService.getMembershipForUser(clientUserId)
            if (membership === undefined) {
                throw new RpcError("NOT_FOUND", "This user is not a member of the practice.")
            }
            return membership
        },

        cfoInvites: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Listing invites")
            return await cfoService.listInvites(userId)
        },
    },

    Mutation: {
        cfoInviteClient: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Inviting a client")
            return await cfoService.inviteClient({
                idempotencyKey: input.idempotencyKey,
                actorUserId: userId,
                email: input.email,
                siteName: input.siteName,
                signInUrl: input.signInUrl,
            })
        },

        cfoRevokeInvite: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Revoking an invite")
            return await cfoService.revokeInvite({ actorUserId: userId, inviteId: input.inviteId })
        },

        cfoConnectMyBooks: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Connecting your books")
            // Connecting is also a first touch: resolve membership so a
            // self-served client exists in the advisor's roster immediately.
            const user = await userService.getUserByIdOrThrow(userId)
            await cfoService.ensureMembership({ userId, email: user.email })
            return await quickBooksService.connectForUser({
                idempotencyKey: input.idempotencyKey,
                userId,
                provider: input.provider,
            })
        },

        cfoDisconnectMyBooks: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Disconnecting your books")
            return await quickBooksService.disconnectForUser(userId)
        },

        cfoExportClientStatementsXlsx: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Exporting statements")
            await cfoService.requireCanViewClient(userId, input.clientUserId)
            const connection = await quickBooksService.getConnectionForUser(input.clientUserId)
            if (connection === undefined) {
                throw new RpcError("FAILED_PRECONDITION", "This member has not connected their books yet.")
            }
            return await quickBooksService.exportStatementsXlsxForConnection({
                idempotencyKey: input.idempotencyKey,
                userId,
                statement: input.statement ?? "ALL",
                connection,
            })
        },
    },

    CfoMembership: {
        user: async (membership, _args, context) => {
            return await context.userDataloader.load(membership.userId)
        },
        joinedTime: (membership) => membership.rowCreatedAt,
    },

    CfoInvite: {
        invitedTime: (invite) => invite.rowCreatedAt,
    },

    // A CfoClient's parent is the member's membership row; the books fields
    // resolve lazily so unselected statements cost nothing.
    CfoClient: {
        membership: (membership) => membership,
        connection: async (membership) => {
            return await quickBooksService.getConnectionForUser(membership.userId)
        },
        snapshot: async (membership) => {
            const connection = await quickBooksService.getConnectionForUser(membership.userId)
            if (connection === undefined) {
                return undefined
            }
            return await quickBooksService.snapshotForConnection(connection)
        },
        profitAndLoss: async (membership) => {
            const connection = await quickBooksService.getConnectionForUser(membership.userId)
            if (connection === undefined) {
                return []
            }
            return await quickBooksService.profitAndLossForConnection(connection)
        },
        balanceSheet: async (membership) => {
            const connection = await quickBooksService.getConnectionForUser(membership.userId)
            if (connection === undefined) {
                return []
            }
            return await quickBooksService.balanceSheetForConnection(connection)
        },
    },
}
