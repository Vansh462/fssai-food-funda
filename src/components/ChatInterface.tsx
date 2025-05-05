"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FormattedResponse from "./FormattedResponse";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Food Funda, your food adulteration helpline assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRAG, setIsRAG] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the RAG system when the component mounts
  useEffect(() => {
    const initializeRAG = async () => {
      try {
        setIsInitializing(true);
        const response = await fetch("/api/init");

        if (!response.ok) {
          throw new Error("Failed to initialize RAG system");
        }

        const data = await response.json();
        console.log("RAG initialization:", data);

        setIsInitialized(data.success);
        setIsRAG(data.isRAG);

        if (!data.success) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "I'm having trouble connecting to my knowledge base. Some features may be limited.",
            },
          ]);
        } else if (!data.isRAG) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "I'm operating in limited mode without access to my full knowledge base. I'll do my best to help with general information about food adulteration.",
            },
          ]);
        }
      } catch (error) {
        console.error("Error initializing RAG:", error);
        setIsInitialized(false);
        setIsRAG(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting to my knowledge base. Some features may be limited.",
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeRAG();
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-4 text-white">
        <h2 className="text-xl font-bold flex items-center">
          <span className="text-amber-400 mr-2">Food Funda</span> | Adulteration Helpline
        </h2>
        <div className="flex justify-between items-center">
          <p className="text-sm text-blue-200">
            Ask questions about food adulteration, testing methods, and safety
          </p>
          {isInitializing ? (
            <div className="flex items-center text-xs text-blue-200">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Connecting to knowledge base...
            </div>
          ) : isInitialized && isRAG ? (
            <div className="flex items-center text-xs text-green-300">
              <span className="h-2 w-2 bg-green-400 rounded-full mr-1"></span>
              Full knowledge base connected
            </div>
          ) : isInitialized && !isRAG ? (
            <div className="flex items-center text-xs text-amber-300">
              <span className="h-2 w-2 bg-amber-400 rounded-full mr-1"></span>
              Limited knowledge mode
            </div>
          ) : (
            <div className="flex items-center text-xs text-red-300">
              <span className="h-2 w-2 bg-red-400 rounded-full mr-1"></span>
              Offline mode
            </div>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border border-gray-200 shadow-sm rounded-bl-none"
                }`}
              >
                {message.role === "assistant" ? (
                  <FormattedResponse content={message.content} />
                ) : (
                  message.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>
                      {line}
                    </p>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 bg-white"
      >
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about food adulteration..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isInitializing}
          />
          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={isLoading || !input.trim() || isInitializing}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Examples: "How to detect milk adulteration?", "What are common adulterants in spices?", "How to test for food coloring?"
        </div>
      </form>
    </div>
  );
}
