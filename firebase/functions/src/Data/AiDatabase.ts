import { createDomainDatabase } from "./BaseDatabase.js"
import { aiEmbeddingsTable } from "./Ai/AiEmbedding.js"

// The AI retrieval kernel's database handle. Shares the common pool today;
// can be pointed at a dedicated database later without touching services.
export const aiDb = createDomainDatabase({
    aiEmbeddingsTable,
})

export type AiDatabase = typeof aiDb
