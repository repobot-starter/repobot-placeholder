import { createHash } from "node:crypto"
import { and, eq, gte, notInArray, sql } from "drizzle-orm"
import { aiDb } from "../../Data/AiDatabase.js"
import { aiEmbeddingsTable } from "../../Data/Ai/AiEmbedding.js"
import {
    AI_EMBEDDINGS_DIMENSIONS,
    AI_EMBEDDINGS_MODEL,
    AI_EMBEDDINGS_VERSION,
    aiEmbeddingsService,
    cosineSimilarity,
} from "./AiEmbeddingsService.js"

/** A document a domain hands to the retrieval kernel for indexing. */
export interface RetrievalDocument {
    /** Stable identity within the source (a slug or id). */
    key: string
    /** Human-readable title, returned with every hit for citations. */
    title: string
    /** The full text; the kernel chunks and embeds it. */
    body: string
}

/** One retrieval hit: a chunk of an indexed document plus its similarity. */
export interface RetrievalResult {
    documentKey: string
    title: string
    content: string
    /** Cosine similarity to the query, in [-1, 1] (unit vectors). */
    score: number
}

/** Chunks are packed to roughly this many characters (paragraph-aligned). */
const CHUNK_TARGET_CHARS = 1000

/**
 * The retrieval half of the embeddings kernel — the ONLY way app code runs
 * similarity search (never hand-written vector SQL). Domains call
 * `indexDocuments` with their content and `searchTopK` with a query; the
 * kernel owns chunking, hashing, embedding (through the embeddings client),
 * storage, and the similarity query.
 *
 * Two query paths, one behavior: where pgvector is installed (deployed
 * Cloud SQL, the local docker databases) top-k runs in SQL by casting the
 * portable real[] column to vector and ordering by cosine distance; where
 * it is not (the embedded sandbox Postgres) the same rows are scored with
 * in-app cosine. Both paths order identically — score, then document key,
 * then chunk index — so tests and demos are deterministic everywhere.
 */
class AiRetrievalService {
    private pgvectorAvailable: boolean | undefined

    /**
     * Converges the stored index for one source onto the given documents:
     * chunks and hashes every body, embeds only new or changed chunks
     * (content hash covers the embedding model + version, so a model bump
     * re-embeds everything once), upserts them, and deletes chunks whose
     * documents shrank or disappeared. Idempotent — re-indexing unchanged
     * content costs no embedding calls.
     */
    async indexDocuments(request: { source: string; documents: RetrievalDocument[] }): Promise<void> {
        const desired: {
            documentKey: string
            title: string
            chunkIndex: number
            content: string
            contentHash: string
        }[] = []
        for (const document of request.documents) {
            for (const [chunkIndex, content] of chunkTextForEmbedding(document.body).entries()) {
                desired.push({
                    documentKey: document.key,
                    title: document.title,
                    chunkIndex,
                    content,
                    contentHash: embeddingContentHash(content),
                })
            }
        }

        const existing = await aiDb
            .select({
                documentKey: aiEmbeddingsTable.documentKey,
                chunkIndex: aiEmbeddingsTable.chunkIndex,
                contentHash: aiEmbeddingsTable.contentHash,
            })
            .from(aiEmbeddingsTable)
            .where(eq(aiEmbeddingsTable.source, request.source))
        const existingHashByChunk = new Map(
            existing.map((row) => [`${row.documentKey}\u0000${row.chunkIndex}`, row.contentHash]),
        )

        const changed = desired.filter(
            (chunk) =>
                existingHashByChunk.get(`${chunk.documentKey}\u0000${chunk.chunkIndex}`) !==
                chunk.contentHash,
        )
        const vectors = await aiEmbeddingsService.embedTexts(changed.map((chunk) => chunk.content))
        for (const [position, chunk] of changed.entries()) {
            await aiDb
                .insert(aiEmbeddingsTable)
                .values({
                    source: request.source,
                    documentKey: chunk.documentKey,
                    chunkIndex: chunk.chunkIndex,
                    title: chunk.title,
                    content: chunk.content,
                    contentHash: chunk.contentHash,
                    embedding: vectors[position],
                })
                .onConflictDoUpdate({
                    target: [
                        aiEmbeddingsTable.source,
                        aiEmbeddingsTable.documentKey,
                        aiEmbeddingsTable.chunkIndex,
                    ],
                    set: {
                        title: chunk.title,
                        content: chunk.content,
                        contentHash: chunk.contentHash,
                        embedding: vectors[position],
                        rowUpdatedAt: new Date(),
                    },
                })
        }

        // Stale rows: documents that disappeared, and tail chunks of
        // documents that shrank.
        const documentKeys = request.documents.map((document) => document.key)
        if (documentKeys.length === 0) {
            await aiDb.delete(aiEmbeddingsTable).where(eq(aiEmbeddingsTable.source, request.source))
            return
        }
        await aiDb
            .delete(aiEmbeddingsTable)
            .where(
                and(
                    eq(aiEmbeddingsTable.source, request.source),
                    notInArray(aiEmbeddingsTable.documentKey, documentKeys),
                ),
            )
        const chunkCountByKey = new Map<string, number>()
        for (const chunk of desired) {
            chunkCountByKey.set(chunk.documentKey, chunk.chunkIndex + 1)
        }
        for (const [documentKey, chunkCount] of chunkCountByKey) {
            await aiDb
                .delete(aiEmbeddingsTable)
                .where(
                    and(
                        eq(aiEmbeddingsTable.source, request.source),
                        eq(aiEmbeddingsTable.documentKey, documentKey),
                        gte(aiEmbeddingsTable.chunkIndex, chunkCount),
                    ),
                )
        }
    }

    /** The k most similar chunks of a source to the query, best first. */
    async searchTopK(request: { source: string; query: string; k: number }): Promise<RetrievalResult[]> {
        const [queryVector] = await aiEmbeddingsService.embedTexts([request.query])
        if (await this.hasPgvector()) {
            return this.searchWithPgvector(request.source, queryVector, request.k)
        }
        return this.searchInApp(request.source, queryVector, request.k)
    }

    /**
     * SQL top-k: the real[] column casts to vector (the cast pgvector
     * registers, and the pattern Cloud SQL's vector docs recommend) and
     * `<=>` is cosine distance, so similarity = 1 - distance.
     */
    private async searchWithPgvector(
        source: string,
        queryVector: number[],
        k: number,
    ): Promise<RetrievalResult[]> {
        const vectorLiteral = `[${queryVector.join(",")}]`
        const result = await aiDb.execute(sql`
            SELECT document_key, title, content,
                   1 - ((embedding::vector) <=> (${vectorLiteral}::vector)) AS score
            FROM ai_embeddings
            WHERE source = ${source}
            ORDER BY (embedding::vector) <=> (${vectorLiteral}::vector), document_key, chunk_index
            LIMIT ${k}
        `)
        return (
            result.rows as { document_key: string; title: string; content: string; score: unknown }[]
        ).map((row) => ({
            documentKey: row.document_key,
            title: row.title,
            content: row.content,
            score: Number(row.score),
        }))
    }

    /** In-app top-k for databases without pgvector (embedded sandbox). */
    private async searchInApp(source: string, queryVector: number[], k: number): Promise<RetrievalResult[]> {
        const rows = await aiDb.select().from(aiEmbeddingsTable).where(eq(aiEmbeddingsTable.source, source))
        return rows
            .map((row) => ({
                documentKey: row.documentKey,
                title: row.title,
                content: row.content,
                chunkIndex: row.chunkIndex,
                score: cosineSimilarity(queryVector, row.embedding),
            }))
            .sort(
                (a, b) =>
                    b.score - a.score ||
                    a.documentKey.localeCompare(b.documentKey) ||
                    a.chunkIndex - b.chunkIndex,
            )
            .slice(0, k)
            .map(({ chunkIndex: _chunkIndex, ...result }) => result)
    }

    /** Whether the connected database has the vector extension installed. */
    private async hasPgvector(): Promise<boolean> {
        if (this.pgvectorAvailable === undefined) {
            const result = await aiDb.execute(sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`)
            this.pgvectorAvailable = result.rows.length > 0
        }
        return this.pgvectorAvailable
    }
}

export const aiRetrievalService = new AiRetrievalService()

/**
 * Packs a document body into paragraph-aligned chunks of roughly
 * CHUNK_TARGET_CHARS characters. Paragraphs (blank-line separated) are
 * never split, so a chunk always reads as coherent prose for the model to
 * cite. Exported for tests.
 */
export function chunkTextForEmbedding(body: string): string[] {
    const paragraphs = body
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
    const chunks: string[] = []
    let current = ""
    for (const paragraph of paragraphs) {
        if (current.length > 0 && current.length + paragraph.length > CHUNK_TARGET_CHARS) {
            chunks.push(current)
            current = paragraph
        } else {
            current = current.length === 0 ? paragraph : `${current}\n\n${paragraph}`
        }
    }
    if (current.length > 0) {
        chunks.push(current)
    }
    return chunks
}

/** The skip-unchanged key: chunk text plus the embedding model + version. */
function embeddingContentHash(content: string): string {
    return createHash("sha256")
        .update(`${AI_EMBEDDINGS_VERSION}:${AI_EMBEDDINGS_MODEL}:${AI_EMBEDDINGS_DIMENSIONS}:${content}`)
        .digest("hex")
}
