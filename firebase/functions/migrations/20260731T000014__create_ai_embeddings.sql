-- Retrieval store for the AI kernel's embeddings (docs/ai.md, Retrieval).
-- Matches src/Data/Ai/AiEmbedding.ts exactly.
--
-- pgvector: deployed environments run on Cloud SQL for Postgres, where the
-- vector extension installs with a plain CREATE EXTENSION run by the
-- environment's own role (created via the Cloud SQL Admin API, so it is a
-- cloudsqlsuperuser member — the platform guarantees this). The local
-- docker databases use the pgvector/pgvector image (scripts/dev-db.sh); the
-- embedded sandbox Postgres ships no pgvector, so the CREATE EXTENSION is
-- guarded and the retrieval helper falls back to in-app cosine over the
-- same rows. The embedding column is real[] — castable to vector at query
-- time, the pattern Cloud SQL's own vector docs recommend — so ONE schema
-- works with and without the extension.
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector unavailable (%); retrieval falls back to in-app cosine', SQLERRM;
END $$;

CREATE TABLE ai_embeddings (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    source text NOT NULL,
    document_key text NOT NULL,
    chunk_index integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    content_hash text NOT NULL,
    embedding real[] NOT NULL,
    CONSTRAINT ai_embeddings_source_document_chunk_unique UNIQUE (source, document_key, chunk_index)
);

CREATE INDEX ai_embeddings_source_idx ON ai_embeddings (source);
