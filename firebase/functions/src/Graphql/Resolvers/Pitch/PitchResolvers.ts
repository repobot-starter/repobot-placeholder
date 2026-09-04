import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { pitchService } from "../../../Services/Pitch/PitchService.js"
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

export const pitchResolvers: GqlResolvers = {
    Query: {
        pitchDecks: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Listing decks")
            return await pitchService.listDecks(userId)
        },

        pitchDeck: async (_parent, { deckId }, context) => {
            const userId = requireUserId(context, "Reading a deck")
            return await pitchService.getDeck({ userId, deckId })
        },

        pitchDeckData: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Reading deck data")
            return await pitchService.deckData(userId)
        },
    },

    Mutation: {
        pitchCreateDeck: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Creating a deck")
            return await pitchService.createDeck({
                idempotencyKey: input.idempotencyKey,
                userId,
                name: input.name,
                companyName: input.companyName,
                tagline: input.tagline,
            })
        },

        pitchUpdateDeck: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Updating a deck")
            return await pitchService.updateDeck({
                userId,
                deckId: input.deckId,
                name: input.name,
                companyName: input.companyName,
                tagline: input.tagline,
                logoUploadId: input.logoUploadId,
                accentColor: input.accentColor,
            })
        },

        pitchDeleteDeck: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Deleting a deck")
            await pitchService.deleteDeck({ userId, deckId: input.deckId })
            return true
        },

        pitchUpdateSlide: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Updating a slide")
            return await pitchService.updateSlide({
                userId,
                slideId: input.slideId,
                title: input.title,
                body: input.body,
                included: input.included,
            })
        },

        pitchExportDeckPdf: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Exporting a deck")
            return await pitchService.exportDeckPdf({
                idempotencyKey: input.idempotencyKey,
                userId,
                deckId: input.deckId,
            })
        },
    },

    PitchDeck: {
        createdTime: (deck) => deck.rowCreatedAt,
        // The outline resolves lazily — the deck roster never selects slides.
        slides: async (deck) => await pitchService.listSlides(deck.id),
    },
}
