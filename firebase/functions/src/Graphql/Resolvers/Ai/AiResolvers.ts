import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { aiVoiceService } from "../../../Services/Ai/AiVoiceService.js"

/**
 * Ai resolvers. createAiVoiceSession is public (the talk surface works
 * without sign-in); the execution-level gate allows it via
 * publicMutationRootFields in GraphqlServer.ts. Safety lives in the service:
 * the OpenAI key stays server-side and only a short-lived Realtime client
 * secret is returned.
 */
export const aiResolvers: GqlResolvers = {
    Mutation: {
        createAiVoiceSession: async () => {
            const session = await aiVoiceService.createVoiceSession()
            return {
                clientSecret: session.clientSecret,
                expiresAt:
                    session.expiresAtSeconds === undefined
                        ? undefined
                        : new Date(session.expiresAtSeconds * 1000),
                model: session.model,
                voice: session.voice,
            }
        },
    },
}
