import { format } from "date-fns";
import { getArticleDetailPathBySource } from "@/lib/article-routing";
import { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const normalizeAiText = (raw: string) => {
    const withoutMarkdownLinks = raw.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      "$1",
    );
    const withoutParenUrls = withoutMarkdownLinks.replace(
      /\s*\(https?:\/\/[^\s)]+\)/g,
      "",
    );
    const withoutBareUrls = withoutParenUrls.replace(/https?:\/\/\S+/g, "");
    return withoutBareUrls.replace(/\s+/g, " ").trim();
  };

  const displayContent =
    message.type === "ai" ? normalizeAiText(message.content) : message.content;

  return (
    <div
      className={`flex ${
        message.type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          message.type === "user"
            ? "bg-white text-black"
            : "bg-zinc-800 text-gray-200"
        }`}
      >
        <p className="text-sm leading-relaxed">{displayContent}</p>
        {message.type === "ai" &&
          message.sources &&
          message.sources.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.sources.slice(0, 3).map((source, index) => {
                const internalPath = getArticleDetailPathBySource(
                  source.article_id,
                  source.source,
                );
                const href = internalPath || source.url;
                const isExternal = !internalPath;

                return (
                  <a
                    key={`${source.url}-${index}`}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="block text-xs text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
                  >
                    {source.title}
                  </a>
                );
              })}
            </div>
          )}
        <p className="text-xs opacity-70 mt-1">
          {format(message.timestamp, "HH:mm")}
        </p>
      </div>
    </div>
  );
}
