// This script builds the vector store from the PDFs
// Run this script before starting the application

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { SupabaseVectorStore } = require("@langchain/community/vectorstores/supabase");
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function loadDocuments() {
  try {
    const pdfDirectory = path.join(process.cwd(), "public", "pdfs");
    const pdfFiles = fs.readdirSync(pdfDirectory);

    console.log(`Found ${pdfFiles.length} files in ${pdfDirectory}`);

    let documents = [];

    for (const file of pdfFiles) {
      if (file.endsWith(".pdf")) {
        const filePath = path.join(pdfDirectory, file);
        console.log(`Processing PDF: ${filePath}`);

        // Use PDFLoader to extract text from PDF
        const loader = new PDFLoader(filePath, {
          splitPages: true,
        });

        const docs = await loader.load();
        console.log(`Loaded ${docs.length} pages from ${file}`);

        // Add source metadata to each document
        const processedDocs = docs.map((doc) => {
          return {
            pageContent: doc.pageContent,
            metadata: {
              ...doc.metadata,
              source: file,
              sourceType: "pdf",
            },
          };
        });

        documents = [...documents, ...processedDocs];
      }
    }

    console.log(`Total documents before splitting: ${documents.length}`);

    // Split documents into smaller chunks for better processing
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(documents);
    console.log(`Processed ${splitDocs.length} document chunks after splitting`);

    return splitDocs;
  } catch (error) {
    console.error("Error loading documents:", error);
    throw error;
  }
}

async function createVectorStore(documents) {
  try {
    console.log("Creating vector store with Google AI embeddings...");

    // Use Google AI embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001",
    });

    console.log("Connecting to Supabase...");
    console.log(`URL: ${supabaseUrl.substring(0, 10)}...`);
    console.log(`Key: ${supabaseKey.substring(0, 10)}...`);

    // Create a Supabase vector store
    const vectorStore = await SupabaseVectorStore.fromDocuments(
      documents,
      embeddings,
      {
        client: supabase,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    console.log("Vector store created successfully!");
    return vectorStore;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw error;
  }
}

async function setupSupabase() {
  try {
    console.log("Setting up Supabase database...");

    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(process.cwd(), "scripts", "setup-supabase.sql"), 'utf8');

    // Execute the SQL script
    console.log("Executing SQL script to create match_documents function...");
    const { error } = await supabase.rpc('pgexec', { source: sqlScript });

    if (error) {
      console.error("Error executing SQL script:", error);

      // Try an alternative approach - split the script into individual statements
      console.log("Trying alternative approach...");
      const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);

      for (const statement of statements) {
        console.log(`Executing statement: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('pgexec', { source: statement });
        if (error) {
          console.error("Error executing statement:", error);
        }
      }
    } else {
      console.log("SQL script executed successfully!");
    }
  } catch (error) {
    console.error("Error setting up Supabase:", error);
  }
}

async function main() {
  try {
    console.log("Starting vector store creation process...");

    // Setup Supabase database
    await setupSupabase();

    // Load and process documents
    const documents = await loadDocuments();
    console.log(`Loaded ${documents.length} document chunks`);

    // Create vector store
    await createVectorStore(documents);

    console.log("Vector store creation complete!");
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

// Run the main function
main();
