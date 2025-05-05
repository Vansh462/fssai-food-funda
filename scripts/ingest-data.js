// This script is used to ingest PDF data and create a vector store
// Run this script before starting the application

import { loadDocuments } from '../src/lib/langchain/document-loader.js';
import { createVectorStore } from '../src/lib/langchain/vector-store.js';

async function ingestData() {
  try {
    console.log('Starting data ingestion process...');
    
    // Load and process documents
    const documents = await loadDocuments();
    console.log(`Loaded ${documents.length} document chunks`);
    
    // Create vector store
    await createVectorStore(documents);
    console.log('Vector store created successfully');
    
    console.log('Data ingestion complete!');
  } catch (error) {
    console.error('Error ingesting data:', error);
  }
}

ingestData();
