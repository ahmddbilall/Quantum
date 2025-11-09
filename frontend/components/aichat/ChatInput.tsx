import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  currentMessage: string;
  isTyping: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

export function ChatInput({
  currentMessage,
  isTyping,
  onMessageChange,
  onSendMessage,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-6 border-t border-gray-700">
      <div className="flex gap-2">
        <Input
          value={currentMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about this article..."
          className="flex-1 bg-zinc-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isTyping}
        />
        <Button
          onClick={onSendMessage}
          disabled={!currentMessage.trim() || isTyping}
          className="bg-white hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Send className="h-4 w-4 text-black" />
        </Button>
      </div>
    </div>
  );
}
