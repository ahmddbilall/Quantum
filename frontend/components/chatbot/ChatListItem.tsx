"use client";

import { Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chat } from "./types";

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  onSelect: (chat: Chat) => void;
  onDelete: (chatId: string, e: React.MouseEvent) => void;
  onStartEditing: (chatId: string, title: string, e: React.MouseEvent) => void;
  onSaveTitle: (chatId: string) => void;
  onCancelEditing: () => void;
  onEditingTitleChange: (title: string) => void;
}

export default function ChatListItem({
  chat,
  isActive,
  isEditing,
  editingTitle,
  onSelect,
  onDelete,
  onStartEditing,
  onSaveTitle,
  onCancelEditing,
  onEditingTitleChange,
}: ChatListItemProps) {
  return (
    <div
      onClick={() => onSelect(chat)}
      className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
        isActive
          ? "bg-zinc-800 border border-purple-500/50"
          : "hover:bg-zinc-900 border border-transparent"
      }`}
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") onSaveTitle(chat.id);
              if (e.key === "Escape") onCancelEditing();
            }}
            className="h-8 bg-zinc-900 border-zinc-700 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSaveTitle(chat.id)}
            className="h-8 w-8 p-0"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelEditing}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white mb-1">
                {chat.title.length > 20
                  ? chat.title.slice(0, 20) + "..."
                  : chat.title}
              </h3>
              <p className="text-xs text-gray-500">
                {new Date(chat.lastActive).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => onStartEditing(chat.id, chat.title, e)}
                className="h-7 w-7 p-0 "
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => onDelete(chat.id, e)}
                className="h-7 w-7 p-0  hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
