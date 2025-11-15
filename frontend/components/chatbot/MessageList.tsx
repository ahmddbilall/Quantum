"use client";

import { AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Chat } from "./types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import WelcomeScreen from "./WelcomeScreen";

interface MessageListProps {
  currentChat: Chat | null;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onQuestionClick: (question: string) => void;
}

export default function MessageList({
  currentChat,
  isTyping,
  messagesEndRef,
  onQuestionClick,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-hidden pb-32">
      <ScrollArea className="h-full">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {!currentChat || currentChat.messages.length === 0 ? (
            <WelcomeScreen onQuestionClick={onQuestionClick} />
          ) : (
            <div className="space-y-6 pb-8">
              <AnimatePresence>
                {currentChat.messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLatest={index === currentChat.messages.length - 1}
                    isTyping={isTyping}
                  />
                ))}
              </AnimatePresence>

              {isTyping && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
