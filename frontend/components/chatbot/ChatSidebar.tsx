"use client";

import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Chat } from "./types";
import ChatListItem from "./ChatListItem";
// import ChatListItem from "./ChatListItem.tsx";

interface ChatSidebarProps {
  isOpen: boolean;
  chats: Chat[];
  currentChatId: string | null;
  editingChatId: string | null;
  editingTitle: string;
  onNewChat: () => void;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onStartEditing: (chatId: string, title: string, e: React.MouseEvent) => void;
  onSaveTitle: (chatId: string) => void;
  onCancelEditing: () => void;
  onEditingTitleChange: (title: string) => void;
}

export default function ChatSidebar({
  isOpen,
  chats,
  currentChatId,
  editingChatId,
  editingTitle,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onStartEditing,
  onSaveTitle,
  onCancelEditing,
  onEditingTitleChange,
}: ChatSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800 flex-shrink-0">
            <Button
              onClick={onNewChat}
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold h-11 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-3">
              <div className="space-y-2">
                {chats.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-gray-500 text-sm">
                      No conversations yet.
                      <br />
                      Start a new chat to begin.
                    </p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={currentChatId === chat.id}
                      isEditing={editingChatId === chat.id}
                      editingTitle={editingTitle}
                      onSelect={onSelectChat}
                      onDelete={onDeleteChat}
                      onStartEditing={onStartEditing}
                      onSaveTitle={onSaveTitle}
                      onCancelEditing={onCancelEditing}
                      onEditingTitleChange={onEditingTitleChange}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="h-3 w-3" />
              <span className="font-oxanium">Quantum</span> AI Assistant
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
