import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex flex-col border-b border-gray-700 bg-zinc-900">
      <div className="flex items-center justify-between p-6 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            <span className="font-oxanium">Quantum</span> Assistant
          </h3>

          <p className="text-xs text-yellow-500/80 italic">
            Temporary chat - History will be cleared when you leave this page
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
