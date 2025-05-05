-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(768)
);

-- Create the match_documents function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE
    CASE
      WHEN filter::TEXT = '{}'::TEXT THEN TRUE
      ELSE
        documents.metadata @> filter
    END
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create an index for faster similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
