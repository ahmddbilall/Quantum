"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArticleChatProps, ChatMessage } from "./types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface ArticleChatComponentProps extends ArticleChatProps {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onClose: () => void;
}

export function ArticleChat({
  articleId,
  articleTitle,
  chatMessages,
  setChatMessages,
  onClose,
}: ArticleChatComponentProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsTyping(true);

    // TODO: Replace with actual RAG chatbot API call
    // This is where you'll integrate your RAG backend
    try {
      // Simulate API call - replace with actual RAG endpoint
      const response = await generateAIResponse(
        currentMessage,
        articleId,
        articleTitle
      );

      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: response,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error("Error generating AI response:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-gray-700 w-full max-w-md h-[600px] max-h-[600px] flex flex-col shadow-2xl overflow-hidden">
      <ChatHeader onClose={onClose} />
      <ChatMessages messages={chatMessages} isTyping={isTyping} />
      <ChatInput
        currentMessage={currentMessage}
        isTyping={isTyping}
        onMessageChange={setCurrentMessage}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

// Mock AI response generator - Replace with actual RAG API call
async function generateAIResponse(
  message: string,
  articleId: string,
  articleTitle: string
): Promise<string> {
  // TODO: Replace this with your actual RAG backend API
  // Example API call structure:
  // const response = await fetch('/api/chat', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message, articleId, articleTitle })
  // });
  // return await response.json();

  const responses = [
    `Based on "${articleTitle}", I can provide you with detailed insights. ${
      message.toLowerCase().includes("what")
        ? "This article discusses important developments and their implications."
        : "That's an interesting question about the article's content."
    }`,
    `Great question about the article! The key points relate to the main themes discussed. Would you like me to elaborate on any specific aspect?`,
    `Regarding your question about "${articleTitle}", the article provides several important perspectives. What specific aspect would you like to explore further?`,
    `That's a thoughtful question. The article touches on this topic in detail. Let me break it down for you based on the information provided.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
