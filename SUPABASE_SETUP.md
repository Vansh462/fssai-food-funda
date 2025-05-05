# Setting up Supabase for RAG

To fully enable the RAG functionality, you need to set up the Supabase database with the necessary functions and extensions. Follow these steps:

## 1. Enable the pgvector extension

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. Create the documents table

```sql
-- Create the documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding VECTOR(768)
);
```

## 3. Create the match_documents function

```sql
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
```

## 4. Create an index for faster similarity search

```sql
-- Create an index for faster similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## 5. Rebuild the vector store

After setting up the database, run the following command to build the vector store:

```bash
node scripts/build-vector-store.js
```

This will load the PDF documents, split them into chunks, and store them in the Supabase vector store.

## Troubleshooting

If you encounter issues with the vector store, check the following:

1. Make sure the pgvector extension is enabled
2. Make sure the match_documents function is created correctly
3. Make sure the documents table has the correct schema
4. Check the Supabase logs for any errors

You can also try rebuilding the vector store from scratch by dropping the documents table and recreating it:

```sql
DROP TABLE IF EXISTS documents;
```

Then follow the steps above to recreate the table and function, and rebuild the vector store.
