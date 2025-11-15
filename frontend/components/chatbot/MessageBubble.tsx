"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { ResponseStream } from "@/components/ui/response-stream";
import { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
  isLatest: boolean;
  isTyping: boolean;
}

export default function MessageBubble({
  message,
  isLatest,
  isTyping,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 w-full ${message.isBot ? "" : "justify-end"}`}
    >
      {message.isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`rounded-2xl px-5 py-3 ${
          message.isBot
            ? "bg-zinc-900 text-white flex-1"
            : "bg-white text-black max-w-[85%]"
        }`}
      >
        {message.isBot ? (
          isLatest && !isTyping ? (
            <ResponseStream
              textStream={message.text}
              mode="typewriter"
              speed={50}
              className="text-sm leading-relaxed"
            />
          ) : (
            <p className="text-sm leading-relaxed">{message.text}</p>
          )
        ) : (
          <p className="text-sm leading-relaxed">{message.text}</p>
        )}
      </div>

      {!message.isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <User className="h-4 w-4 text-black" />
        </div>
      )}
    </motion.div>
  );
}
