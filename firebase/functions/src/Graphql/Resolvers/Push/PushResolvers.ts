import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { PushDevicePlatform } from "../../../Data/Push/PushDevice.js"
import { pushService } from "../../../Services/Push/PushService.js"
import { RpcError } from "../../../Utils/RpcError.js"
import { Principal } from "../../../Utils/Principal.js"

/**
 * Push kernel resolvers: the device-registration surface only (docs/push.md).
 * Both mutations are authenticated and additionally require an application
 * user — a registration must belong to someone pushes can be addressed to.
 * Sending never goes through GraphQL; domains call the push service.
 */
export const pushResolvers: GqlResolvers = {
    Mutation: {
        registerPushDevice: async (_parent, { input }, context) => {
            const device = await pushService.registerDevice({
                userId: requireAppUserId(context.principal),
                platform: input.platform as PushDevicePlatform,
                endpoint: input.endpoint,
                subscriptionJson: input.subscriptionJson,
            })
            return device
        },

        unregisterPushDevice: async (_parent, { input }, context) => {
            return await pushService.unregisterDevice({
                userId: requireAppUserId(context.principal),
                endpoint: input.endpoint,
            })
        },
    },

    PushDevice: {
        createdTime: (device) => device.rowCreatedAt,
        rotatedTime: (device) => device.rotatedAt,
    },
}

function requireAppUserId(principal: Principal | undefined): string {
    const userId = principal?.userId
    if (userId === undefined) {
        throw new RpcError(
            "UNAUTHENTICATED",
            "Registering a push device requires an authenticated application user.",
        )
    }
    return userId
}
