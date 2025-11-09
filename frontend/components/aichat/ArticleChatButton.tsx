"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArticleChat } from "./ArticleChat";
import { ChatMessage } from "./types";

interface ArticleChatButtonProps {
  articleId: string;
  articleTitle: string;
}

export function ArticleChatButton({
  articleId,
  articleTitle,
}: ArticleChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Maintain chat history at this level so it persists when closing/opening
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content: `Hello! I'm your AI assistant. I can help you understand "${articleTitle}" better. Feel free to ask me questions about the article's content, implications, or any related topics!`,
      timestamp: new Date(),
    },
  ]);

  return (
    <>
      {/* Floating Chat Button - Hidden when chat is open */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Button
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-white hover:cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
              size="lg"
            >
              <MessageCircle className="h-7 w-7 text-black group-hover:text-white group-hover:scale-110 transition-transform duration-200" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Box */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: 30 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 30, x: 30 }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="fixed bottom-6 right-6 z-50"
          >
            <ArticleChat
              articleId={articleId}
              articleTitle={articleTitle}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              onClose={() => setIsChatOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
