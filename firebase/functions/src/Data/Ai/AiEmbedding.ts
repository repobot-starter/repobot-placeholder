import { index, integer, real, text, unique } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

/**
 * The retrieval kernel's embedding store (docs/ai.md, Retrieval): one row
 * per embedded chunk of a source document. `source` names the owning
 * corpus (for example "blog_posts"), `document_key` the document within it
 * (a slug), and `chunk_index` the chunk's position — together the upsert
 * identity. `content_hash` covers the chunk text plus the embedding
 * model/version, so re-indexing unchanged content never re-embeds.
 *
 * The vector itself is `real[]`, not pgvector's `vector` type, on purpose:
 * the array type exists everywhere (the embedded sandbox Postgres has no
 * pgvector) and casts to `vector` at query time where the extension is
 * installed — the retrieval helper picks the path (AiRetrievalService).
 */
export const aiEmbeddingsTable = baseTable(
    "ai_embeddings",
    {
        /** The owning corpus, for example "blog_posts". */
        source: text("source").notNull(),
        /** The document within the corpus (a slug or id). */
        documentKey: text("document_key").notNull(),
        /** The chunk's position within the document, from 0. */
        chunkIndex: integer("chunk_index").notNull(),
        /** The document's human-readable title, denormalized for citations. */
        title: text("title").notNull(),
        /** The chunk's text — what retrieval returns for the model to cite. */
        content: text("content").notNull(),
        /** Hash of (embedding version, model, chunk text); the skip-unchanged key. */
        contentHash: text("content_hash").notNull(),
        /** Unit-normalized embedding vector (AI_EMBEDDINGS_DIMENSIONS entries). */
        embedding: real("embedding").array().notNull(),
    },
    (table) => [
        unique("ai_embeddings_source_document_chunk_unique").on(
            table.source,
            table.documentKey,
            table.chunkIndex,
        ),
        index("ai_embeddings_source_idx").on(table.source),
    ],
)

export type AiEmbedding = typeof aiEmbeddingsTable.$inferSelect
export type NewAiEmbedding = typeof aiEmbeddingsTable.$inferInsert
