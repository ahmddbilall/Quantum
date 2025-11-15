"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  inputMessage: string;
  isTyping: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
}

export default function ChatInput({
  inputMessage,
  isTyping,
  inputRef,
  onInputChange,
  onKeyPress,
  onSend,
}: ChatInputProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-8 pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto px-4 pointer-events-auto">
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="Message Quantum AI..."
            className="w-full min-h-[56px] max-h-[200px] p-4 pr-14 bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
            rows={1}
            disabled={isTyping}
          />
          <Button
            onClick={onSend}
            disabled={!inputMessage.trim() || isTyping}
            className="absolute right-2 bottom-2 h-10 w-10 p-0 bg-white hover:bg-gray-200 text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
