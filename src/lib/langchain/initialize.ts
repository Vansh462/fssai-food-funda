import { loadDocuments } from "./document-loader";
import { createVectorStore } from "./vector-store";
import { createChatModel, createFallbackChatModel } from "./chat-model";

// Singleton instance of the RAG system
let ragSystem: { vectorStore: any; chatModel: any; isRAG: boolean } | null = null;

// Initialize the RAG system
export async function initializeRAG() {
  try {
    // If RAG system already exists, return it
    if (ragSystem) {
      console.log("Using existing RAG system");
      return ragSystem;
    }

    console.log("Initializing RAG system...");

    try {
      // Try to connect to the existing vector store first
      console.log("Connecting to existing vector store...");
      const vectorStore = await createVectorStore();

      try {
        // Create chat model with RAG and higher temperature for more creative responses
        const chatModel = createChatModel(vectorStore, 0.9);
        console.log("RAG chat model created successfully");

        // Store the RAG system
        ragSystem = { vectorStore, chatModel, isRAG: true };

        return ragSystem;
      } catch (chatModelError) {
        console.error("Error creating RAG chat model:", chatModelError);
        console.log("Falling back to non-RAG chat model");

        // Create fallback chat model without RAG but with higher temperature
        const fallbackModel = createFallbackChatModel(0.9);
        console.log("Fallback chat model created successfully");

        // Store the system with fallback model
        ragSystem = { vectorStore, chatModel: fallbackModel, isRAG: false };

        return ragSystem;
      }
    } catch (vectorStoreError) {
      console.error("Error connecting to existing vector store:", vectorStoreError);

      try {
        console.log("Falling back to loading documents and creating a new vector store");

        // Load and process documents as fallback
        const documents = await loadDocuments();
        console.log(`Loaded ${documents.length} document chunks`);

        // Create vector store with the loaded documents
        const vectorStore = await createVectorStore(documents);

        try {
          // Create chat model with RAG and higher temperature
          const chatModel = createChatModel(vectorStore, 0.9);
          console.log("RAG chat model created successfully");

          // Store the RAG system
          ragSystem = { vectorStore, chatModel, isRAG: true };

          return ragSystem;
        } catch (chatModelError) {
          console.error("Error creating RAG chat model:", chatModelError);
          console.log("Falling back to non-RAG chat model");

          // Create fallback chat model without RAG but with higher temperature
          const fallbackModel = createFallbackChatModel(0.9);
          console.log("Fallback chat model created successfully");

          // Store the system with fallback model
          ragSystem = { vectorStore, chatModel: fallbackModel, isRAG: false };

          return ragSystem;
        }
      } catch (documentsError) {
        console.error("Error loading documents:", documentsError);
        console.log("Falling back to non-RAG chat model only");

        // Create fallback chat model without RAG but with higher temperature
        const fallbackModel = createFallbackChatModel(0.9);
        console.log("Fallback chat model created successfully");

        // Store the system with fallback model only
        ragSystem = { vectorStore: null, chatModel: fallbackModel, isRAG: false };

        return ragSystem;
      }
    }
  } catch (error) {
    console.error("Error initializing RAG system:", error);

    try {
      // Last resort: create a fallback chat model without RAG but with higher temperature
      console.log("Creating fallback chat model as last resort");
      const fallbackModel = createFallbackChatModel(0.9);

      // Store the system with fallback model only
      ragSystem = { vectorStore: null, chatModel: fallbackModel, isRAG: false };

      return ragSystem;
    } catch (fallbackError) {
      console.error("Error creating fallback chat model:", fallbackError);
      throw error; // Throw the original error if fallback also fails
    }
  }
}

// Get the RAG system
export async function getRAGSystem() {
  // Initialize if not already initialized
  return await initializeRAG();
}
