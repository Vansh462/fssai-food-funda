# Food Funda Adulteration Helpline

A professional web application that serves as a food adulteration helpline chatbot. The chatbot uses Retrieval Augmented Generation (RAG) to provide accurate information about food adulteration, testing methods, and safety measures.

## Features

- Beautiful, professional landing page with a focus on the chat interface
- RAG-powered chatbot that retrieves information from FSSAI documents
- Persistent vector storage using Supabase with pgvector
- Responsive design for all devices
- Elegant UI with smooth animations

## Technology Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **UI Components**: Custom components with shadcn/ui styling
- **RAG Implementation**: LangChain.js for document processing and retrieval
- **Vector Database**: Supabase with pgvector (falls back to in-memory if not configured)
- **LLM Integration**: Google AI (Gemini) for the chatbot functionality

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google AI API key
- Supabase account (for persistent vector storage)

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com/)
2. Enable the pgvector extension by running this SQL in the SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Create the documents table and search function:
   ```sql
   -- Create a table for your documents
   CREATE TABLE documents (
     id BIGSERIAL PRIMARY KEY,
     content TEXT,
     metadata JSONB,
     embedding VECTOR(768)
   );

   -- Create a function to search for similar documents
   CREATE OR REPLACE FUNCTION match_documents(
     query_embedding VECTOR(768),
     match_threshold FLOAT,
     match_count INT
   )
   RETURNS TABLE (
     id BIGINT,
     content TEXT,
     metadata JSONB,
     similarity FLOAT
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       documents.id,
       documents.content,
       documents.metadata,
       1 - (documents.embedding <=> query_embedding) AS similarity
     FROM documents
     WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
     ORDER BY similarity DESC
     LIMIT match_count;
   END;
   $$;
   ```
4. Get your Supabase URL and service role key from Project Settings > API

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and add your API keys:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` to add your:
   - Google AI API key
   - Supabase URL
   - Supabase service role key

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

This application is designed to be deployed on Vercel:

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Add your environment variables (GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
4. Deploy!

## PDF Sources

The chatbot uses information from the following PDF documents:
- DART Book.pdf - Contains information about food adulteration detection methods
- Manual Testing Method Food Safety On Wheels.pdf - Contains manual testing procedures for food safety

## License

This project is licensed under the MIT License - see the LICENSE file for details.
