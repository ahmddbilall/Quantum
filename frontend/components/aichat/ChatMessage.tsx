import { format } from "date-fns";
import { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
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
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {format(message.timestamp, "HH:mm")}
        </p>
      </div>
    </div>
  );
}
