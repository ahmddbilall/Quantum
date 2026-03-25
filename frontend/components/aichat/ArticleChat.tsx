"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArticleChatProps, ChatMessage } from "./types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ragService } from "@/services/ragService";
import { parseApiError } from "@/lib/error-parser";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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

    try {
      const response = await ragService.query({
        content: currentMessage,
        articleId,
      });

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          response.content ||
          `I could not find enough context in ${articleTitle}.`,
        timestamp: new Date(),
        sources: response.sources,
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const parsed = parseApiError(error, "Failed to get AI response.");
      toast({
        title: "AI chat failed",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
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
