import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import path from "path";
import fs from "fs";

// Function to load and process PDF documents
export async function loadDocuments(): Promise<Document[]> {
  try {
    const pdfDirectory = path.join(process.cwd(), "public", "pdfs");
    const pdfFiles = fs.readdirSync(pdfDirectory);

    let documents: Document[] = [];

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
