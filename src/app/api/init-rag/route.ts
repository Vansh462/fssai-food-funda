import { NextResponse } from "next/server";
import { initializeRAG } from "@/lib/langchain/initialize";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Initialize RAG system
    await initializeRAG();

    return NextResponse.json({ success: true, message: "RAG system initialized successfully" });
  } catch (error) {
    console.error("Error initializing RAG system:", error);
    return NextResponse.json(
      { error: "An error occurred while initializing the RAG system" },
      { status: 500 }
    );
  }
}
