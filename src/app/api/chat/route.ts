import { NextRequest, NextResponse } from "next/server";
import { getRAGSystem } from "@/lib/langchain/initialize";
import { createFallbackChatModel } from "@/lib/langchain/chat-model";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Get the last user message
    const lastUserMessage = messages
      .filter((msg: { role: string; content: string }) => msg.role === "user")
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    try {
      // Try to initialize RAG system
      console.log("Getting RAG system for chat");
      const ragSystem = await getRAGSystem();

      if (!ragSystem) {
        throw new Error("RAG system initialization failed");
      }

      // Generate response using the RAG model
      console.log("Generating response with chat model");
      const response = await ragSystem.chatModel.invoke({
        question: lastUserMessage.content,
      });

      // Return the response
      return NextResponse.json({ response });
    } catch (error) {
      console.error("Error with RAG system, falling back to basic model:", error);

      // Create a fallback chat model
      const fallbackModel = createFallbackChatModel();

      // Generate response using the fallback model
      const response = await fallbackModel.invoke({
        question: lastUserMessage.content,
      });

      // Return the response
      return NextResponse.json({
        response,
        fallback: true,
        message: "Using fallback model due to RAG system error"
      });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
