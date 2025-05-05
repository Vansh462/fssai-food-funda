import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { supabase } from "../supabase";

// Singleton instance of the vector store
let vectorStoreInstance: SupabaseVectorStore | MemoryVectorStore | null = null;

// Get or create a vector store
export async function createVectorStore(documents?: Document[]) {
  try {
    // If vector store already exists, return it
    if (vectorStoreInstance) {
      console.log("Using existing vector store instance");
      return vectorStoreInstance;
    }

    console.log("Initializing vector store instance");

    // Use Google AI embeddings for high-quality vector representations
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001", // Google's embedding model
    });

    // Check if Supabase credentials are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.log("Connecting to existing Supabase vector store");

        // Connect to the existing Supabase vector store
        vectorStoreInstance = new SupabaseVectorStore(embeddings, {
          client: supabase,
          tableName: "documents",
          queryName: "match_documents",
          filter: {},
        });

        console.log("Connected to Supabase vector store successfully");
      } catch (error) {
        console.error("Error connecting to Supabase vector store:", error);

        if (documents) {
          console.log("Falling back to in-memory vector store");
          // Fallback to in-memory vector store
          vectorStoreInstance = await MemoryVectorStore.fromDocuments(
            documents,
            embeddings
          );
          console.log("In-memory vector store created successfully");
        } else {
          throw new Error("No documents provided for fallback in-memory vector store");
        }
      }
    } else if (documents) {
      // Use in-memory vector store if Supabase credentials are not available
      console.log("Supabase credentials not found, using in-memory vector store");
      vectorStoreInstance = await MemoryVectorStore.fromDocuments(
        documents,
        embeddings
      );
      console.log("In-memory vector store created successfully");
    } else {
      throw new Error("No documents provided for in-memory vector store");
    }

    return vectorStoreInstance;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw error;
  }
}

// Get the vector store instance
export function getVectorStore() {
  if (!vectorStoreInstance) {
    throw new Error("Vector store not initialized. Call createVectorStore first.");
  }
  return vectorStoreInstance;
}
