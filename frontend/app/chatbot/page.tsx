"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import {
  ChatSidebar,
  MessageList,
  ChatInput,
  SidebarToggle,
  Chat,
  createFakeChats,
  handleSendMessage,
} from "@/components/chatbot";

export default function ChatbotPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isTyping]);

  useEffect(() => {
    // Load chats from localStorage or create fake chats
    const savedChats = localStorage.getItem("quantum-chats");
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
    } else {
      const fakeChats = createFakeChats();
      setChats(fakeChats);
    }
  }, []);

  useEffect(() => {
    // Save chats to localStorage
    if (chats.length > 0) {
      localStorage.setItem("quantum-chats", JSON.stringify(chats));
    }
  }, [chats]);

  const onSendMessage = async (messageText?: string) => {
    await handleSendMessage(
      messageText,
      inputMessage,
      currentChat,
      setCurrentChat,
      setChats,
      setInputMessage,
      setIsTyping
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChat);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    setChats(updatedChats);

    if (currentChat?.id === chatId) {
      if (updatedChats.length > 0) {
        setCurrentChat(updatedChats[0]);
      } else {
        setCurrentChat(null);
      }
    }
  };

  const startEditingTitle = (
    chatId: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const saveTitle = (chatId: string) => {
    if (editingTitle.trim()) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat
        )
      );
      if (currentChat?.id === chatId) {
        setCurrentChat((prev) =>
          prev ? { ...prev, title: editingTitle.trim() } : prev
        );
      }
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleQuestionClick = (question: string) => {
    onSendMessage(question);
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <Navbar showSearch={false} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <ChatSidebar
          isOpen={sidebarOpen}
          chats={chats}
          currentChatId={currentChat?.id || null}
          editingChatId={editingChatId}
          editingTitle={editingTitle}
          onNewChat={createNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onStartEditing={startEditingTitle}
          onSaveTitle={saveTitle}
          onCancelEditing={cancelEditing}
          onEditingTitleChange={setEditingTitle}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-black relative min-h-0">
          <SidebarToggle
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <MessageList
            currentChat={currentChat}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            onQuestionClick={handleQuestionClick}
          />

          <ChatInput
            inputMessage={inputMessage}
            isTyping={isTyping}
            inputRef={inputRef}
            onInputChange={setInputMessage}
            onKeyPress={handleKeyPress}
            onSend={() => onSendMessage()}
          />
        </div>
      </div>
    </div>
  );
}
