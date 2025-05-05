// This script processes the PDFs and creates a vector store
// Run this script once before starting the application

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/community/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { writeFileSync } from "fs";
import path from "path";
import fs from "fs";

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function loadDocuments() {
  try {
    const pdfDirectory = path.join(process.cwd(), "public", "pdfs");
    const pdfFiles = fs.readdirSync(pdfDirectory);
    
    let documents = [];
    
    for (const file of pdfFiles) {
      if (file.endsWith(".pdf")) {
        const filePath = path.join(pdfDirectory, file);
        console.log(`Processing PDF: ${filePath}`);
        
        // Use PDFLoader to extract text from PDF
        const loader = new PDFLoader(filePath, {
          splitPages: true,
          // Add metadata about the source
          pdfjs: () => import("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js"),
        });
        
        const docs = await loader.load();
        
        // Add source metadata to each document
        const processedDocs = docs.map((doc) => {
          return new Document({
            pageContent: doc.pageContent,
            metadata: {
              ...doc.metadata,
              source: file,
              sourceType: "pdf",
            },
          });
        });
        
        documents = [...documents, ...processedDocs];
      }
    }
    
    // Split documents into smaller chunks for better processing
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const splitDocs = await textSplitter.splitDocuments(documents);
    console.log(`Processed ${splitDocs.length} document chunks`);
    
    return splitDocs;
  } catch (error) {
    console.error("Error loading documents:", error);
    throw error;
  }
}

async function createVectorStore(documents) {
  try {
    // Use Google AI embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001", // Google's embedding model
    });
    
    // Create a memory vector store
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );
    
    // Serialize the vector store to a JSON file
    const serialized = await vectorStore.serialize();
    writeFileSync(
      path.join(process.cwd(), "public", "vector-store.json"),
      JSON.stringify(serialized)
    );
    
    console.log("Vector store created and saved successfully");
    return vectorStore;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw error;
  }
}

async function main() {
  console.log("Starting document ingestion process...");
  
  // Load and process documents
  const documents = await loadDocuments();
  console.log(`Loaded ${documents.length} document chunks`);
  
  // Create vector store
  await createVectorStore(documents);
  
  console.log("Document ingestion complete!");
}

// Run the main function
main().catch(console.error);
