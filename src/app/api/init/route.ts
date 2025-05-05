import { NextRequest, NextResponse } from "next/server";
import { initializeRAG } from "@/lib/langchain/initialize";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log("Initializing RAG system from API endpoint...");

    // Initialize RAG system
    const ragSystem = await initializeRAG();

    return NextResponse.json({
      success: true,
      message: ragSystem.isRAG
        ? "RAG system initialized successfully with full knowledge base"
        : "System initialized in limited mode without full knowledge base",
      isRAG: ragSystem.isRAG,
      vectorStore: ragSystem.vectorStore ? "Connected" : "Not connected",
      chatModel: ragSystem.chatModel ? "Created" : "Not created"
    });
  } catch (error) {
    console.error("Error initializing RAG system:", error);
    return NextResponse.json(
      {
        success: false,
        isRAG: false,
        error: "An error occurred while initializing the RAG system",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
