import { getOpenAiWrapper } from "../../DependencyWrappers/OpenAiWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"

/**
 * The embeddings model and dimensionality; tune together. 256 dimensions is
 * the -3 models' native truncation — plenty for in-app retrieval and cheap
 * to store. Changing either invalidates stored vectors: bump
 * AI_EMBEDDINGS_VERSION so indexed content re-embeds on next use.
 */
export const AI_EMBEDDINGS_MODEL = "text-embedding-3-small"
export const AI_EMBEDDINGS_DIMENSIONS = 256
export const AI_EMBEDDINGS_VERSION = 1

/** Embeddings API batch cap per upstream call. */
const EMBEDDINGS_BATCH_SIZE = 100

/**
 * The kernel's embeddings client — the ONLY way app code turns text into
 * vectors (never raw API calls). The same AI_MODE split as chat:
 *
 * - AI_MODE=local — a deterministic local embedding (hashed bag-of-words,
 *   unit-normalized), so sandbox and test retrieval work free and offline.
 *   Texts sharing words land near each other, so top-k retrieval is
 *   meaningful, not random.
 * - AI_MODE=openai / AI_MODE=gateway — the real model through
 *   OpenAiApiWrapper: the account's own key against api.openai.com, or the
 *   platform AI gateway's /embeddings route (keyless, billed to platform
 *   credits). The protocol is byte-identical; only the endpoint differs.
 *
 * Every vector is unit-normalized in every mode, so cosine similarity is a
 * plain dot product downstream.
 */
class AiEmbeddingsService {
    /** Embeds texts in order; one unit-normalized vector per input. */
    async embedTexts(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) {
            return []
        }
        if (validatedEnv().AI_MODE === "local") {
            return texts.map((text) => localDeterministicEmbedding(text))
        }
        const embeddings: number[][] = []
        for (let start = 0; start < texts.length; start += EMBEDDINGS_BATCH_SIZE) {
            const result = await getOpenAiWrapper().createEmbeddings({
                model: AI_EMBEDDINGS_MODEL,
                input: texts.slice(start, start + EMBEDDINGS_BATCH_SIZE),
                dimensions: AI_EMBEDDINGS_DIMENSIONS,
            })
            embeddings.push(...result.embeddings.map(normalizeVector))
        }
        return embeddings
    }
}

export const aiEmbeddingsService = new AiEmbeddingsService()

/**
 * The local-mode embedding: each word FNV-1a-hashes to one of the
 * AI_EMBEDDINGS_DIMENSIONS buckets, occurrences accumulate, and the vector
 * is L2-normalized. Deterministic across processes and platforms (no
 * randomness, no state), so tests can assert exact ordering — and shared
 * vocabulary genuinely raises cosine similarity, which makes sandbox
 * retrieval demos behave sensibly. Exported for tests.
 */
export function localDeterministicEmbedding(text: string): number[] {
    const vector = new Array<number>(AI_EMBEDDINGS_DIMENSIONS).fill(0)
    const words = text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 0)
    for (const word of words) {
        vector[fnv1aHash(word) % AI_EMBEDDINGS_DIMENSIONS] += 1
    }
    return normalizeVector(vector)
}

/** Cosine similarity of two unit vectors is their dot product. */
export function cosineSimilarity(a: number[], b: number[]): number {
    const length = Math.min(a.length, b.length)
    let dot = 0
    for (let index = 0; index < length; index += 1) {
        dot += a[index] * b[index]
    }
    return dot
}

function normalizeVector(vector: number[]): number[] {
    let sumOfSquares = 0
    for (const value of vector) {
        sumOfSquares += value * value
    }
    const norm = Math.sqrt(sumOfSquares)
    if (norm === 0) {
        return vector
    }
    return vector.map((value) => value / norm)
}

/** 32-bit FNV-1a over the UTF-16 code units; stable and dependency-free. */
function fnv1aHash(value: string): number {
    let hash = 0x811c9dc5
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 0x01000193)
    }
    return hash >>> 0
}
