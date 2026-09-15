import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { interpretService } from "../../../Services/Interpret/InterpretService.js"
import { RpcError } from "../../../Utils/RpcError.js"

export const interpretResolvers: GqlResolvers = {
    Mutation: {
        interpretDocument: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError(
                    "UNAUTHENTICATED",
                    "Interpreting a document requires an authenticated user.",
                )
            }
            return await interpretService.interpretDocument({ userId, uploadId: input.uploadId })
        },
    },
}
