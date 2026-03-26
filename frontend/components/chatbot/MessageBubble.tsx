"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import Link from "next/link";
import { getArticleDetailPathBySource } from "@/lib/article-routing";
import { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
  isLatest: boolean;
  isTyping: boolean;
}

export default function MessageBubble({
  message,
  isLatest: _isLatest,
  isTyping: _isTyping,
}: MessageBubbleProps) {
  const formatBotParagraphs = (raw: string) => {
    const withoutMarkdownLinks = raw.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      "$1",
    );
    const withoutParenUrls = withoutMarkdownLinks.replace(
      /\s*\(https?:\/\/[^\s)]+\)/g,
      "",
    );
    const withoutBareUrls = withoutParenUrls.replace(/https?:\/\/\S+/g, "");
    const cleaned = withoutBareUrls.replace(/\s+/g, " ").trim();
    return cleaned
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((p) => p.trim())
      .filter(Boolean);
  };

  const highlightRefCard = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-2", "ring-indigo-400");
    window.setTimeout(() => {
      element.classList.remove("ring-2", "ring-indigo-400");
    }, 1200);
  };

  const renderTextWithCitations = (text: string, maxRef: number) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (!match) {
        return <span key={`txt-${message.id}-${index}`}>{part}</span>;
      }

      const refNumber = Number(match[1]);
      if (Number.isNaN(refNumber) || refNumber < 1 || refNumber > maxRef) {
        return <span key={`txt-${message.id}-${index}`}>{part}</span>;
      }

      return (
        <button
          key={`ref-${message.id}-${index}`}
          type="button"
          className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
          onClick={() => highlightRefCard(`${message.id}-ref-${refNumber}`)}
        >
          [{refNumber}]
        </button>
      );
    });
  };

  const botParagraphs = message.isBot ? formatBotParagraphs(message.text) : [];
  const sourceCount = message.sources?.length || 0;

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

      <div
        className={`rounded-2xl px-5 py-3 ${
          message.isBot
            ? "bg-zinc-900 text-white flex-1"
            : "bg-white text-black max-w-[85%]"
        }`}
      >
        {message.isBot ? (
          <div className="space-y-3">
            {(botParagraphs.length > 0 ? botParagraphs : [message.text]).map(
              (paragraph, index) => (
                <p
                  key={`${message.id}-p-${index}`}
                  className="text-sm leading-relaxed"
                >
                  {renderTextWithCitations(paragraph, sourceCount)}
                </p>
              ),
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-400 mb-2">References</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.sources.slice(0, 6).map((source, index) => {
                    const to =
                      getArticleDetailPathBySource(
                        source.article_id,
                        source.source,
                      ) || source.url;
                    const isInternal = Boolean(source.article_id);

                    if (isInternal) {
                      return (
                        <Link
                          key={`${message.id}-src-${index}`}
                          id={`${message.id}-ref-${index + 1}`}
                          href={to}
                          className="block rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 hover:border-zinc-500 transition-colors"
                        >
                          <p className="text-xs text-zinc-200 line-clamp-2 font-medium">
                            [{index + 1}] {source.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            {source.source}
                          </p>
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={`${message.id}-src-${index}`}
                        id={`${message.id}-ref-${index + 1}`}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                      >
                        <p className="text-xs text-zinc-300 line-clamp-2 font-medium">
                          [{index + 1}] {source.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Reference unavailable
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
