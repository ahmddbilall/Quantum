"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { ragService } from "@/services/ragService";
import { parseApiError } from "@/lib/error-parser";
import { useToast } from "@/hooks/use-toast";
import { buildAuthUrl, getCurrentPathWithSearch } from "@/lib/auth-redirect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChatSidebar,
  MessageList,
  ChatInput,
  SidebarToggle,
  Chat,
  Message,
} from "@/components/chatbot";

const GUEST_LIMIT_PER_DAY = 5;
const GUEST_USAGE_KEY = "quantum-guest-chat-usage";

interface GuestUsage {
  date: string;
  count: number;
}

const getToday = () => new Date().toISOString().slice(0, 10);

const formatTimestamp = (dateLike: string | Date) =>
  new Date(dateLike).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const getGuestUsage = (): GuestUsage => {
  if (typeof window === "undefined") {
    return { date: getToday(), count: 0 };
  }
  try {
    const raw = window.localStorage.getItem(GUEST_USAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<GuestUsage>) : null;
    const today = getToday();
    if (!parsed || parsed.date !== today || typeof parsed.count !== "number") {
      return { date: today, count: 0 };
    }
    return { date: parsed.date, count: parsed.count };
  } catch {
    return { date: getToday(), count: 0 };
  }
};

const incrementGuestUsage = () => {
  if (typeof window === "undefined") {
    return 0;
  }
  const usage = getGuestUsage();
  const next = { date: getToday(), count: usage.count + 1 };
  window.localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(next));
  return next.count;
};

export default function ChatbotPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
  const [isDraftNewChat, setIsDraftNewChat] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeChatIdRef = useRef<string | null>(searchParams.get("chatId"));

  const updateChatUrl = (chatId?: string | null) => {
    activeChatIdRef.current = chatId || null;
    const params = new URLSearchParams(
      typeof window !== "undefined"
        ? window.location.search
        : searchParams.toString(),
    );
    if (chatId) {
      params.set("chatId", chatId);
    } else {
      params.delete("chatId");
    }
    const query = params.toString();
    if (typeof window !== "undefined") {
      const nextUrl = query ? `/chatbot?${query}` : "/chatbot";
      window.history.replaceState(null, "", nextUrl);
    } else {
      router.replace(query ? `/chatbot?${query}` : "/chatbot", {
        scroll: false,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isTyping]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const load = async () => {
      if (!isAuthenticated) {
        setSidebarOpen(false);
        setChats([]);
        setCurrentChat(null);
        updateChatUrl(null);
        return;
      }

      setSidebarOpen(true);
      setIsLoadingChats(true);
      try {
        const backendChats = await ragService.listChats();
        const mapped: Chat[] = backendChats.map((chat) => ({
          id: chat.id,
          title: chat.title || "New Chat",
          messages: [],
          createdAt: chat.created_at,
          lastActive: chat.updated_at,
        }));
        setChats(mapped);

        if (mapped.length > 0) {
          if (!activeChatIdRef.current && isDraftNewChat) {
            setCurrentChat(null);
            return;
          }

          const selected =
            (activeChatIdRef.current
              ? mapped.find((chat) => chat.id === activeChatIdRef.current)
              : null) || mapped[0];
          const history = await ragService.getChatMessages(selected.id);
          const mappedMessages: Message[] = history.messages.map((message) => ({
            id: message.id,
            text: message.content,
            isBot: message.role !== "user",
            sources: message.sources || [],
            timestamp: formatTimestamp(message.created_at),
          }));
          setCurrentChat({ ...selected, messages: mappedMessages });
          setIsDraftNewChat(false);
          updateChatUrl(selected.id);
        } else {
          setCurrentChat(null);
          updateChatUrl(null);
        }
      } catch (error) {
        const parsed = parseApiError(error, "Failed to load chat history.");
        toast({
          title: "Chat unavailable",
          description: parsed.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingChats(false);
      }
    };

    void load();
  }, [isAuthenticated, isAuthLoading, toast]);

  const createGuestChat = () => ({
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  });

  const onSendMessage = async (messageText?: string) => {
    const textToSend = (messageText || inputMessage).trim();
    if (!textToSend || isTyping) {
      return;
    }

    if (!isAuthenticated) {
      const usage = getGuestUsage();
      if (usage.count >= GUEST_LIMIT_PER_DAY) {
        setIsLimitDialogOpen(true);
        return;
      }
    }

    setInputMessage("");

    let chat = currentChat;
    let pendingTempChatId: string | null = null;

    try {
      setIsTyping(true);
      const userMessage: Message = {
        id: crypto.randomUUID(),
        text: textToSend,
        isBot: false,
        timestamp: formatTimestamp(new Date()),
      };

      if (!chat) {
        if (isAuthenticated) {
          pendingTempChatId = `draft-${crypto.randomUUID()}`;
          chat = {
            id: pendingTempChatId,
            title: "New Chat",
            messages: [],
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          };
          setChats((prev) => [chat!, ...prev.filter((c) => c.id !== chat!.id)]);
        } else {
          chat = createGuestChat();
          setChats([chat]);
          updateChatUrl(chat.id);
        }
      }

      setIsDraftNewChat(false);

      const chatWithUser: Chat = {
        ...chat,
        title:
          chat.messages.length === 0
            ? textToSend.slice(0, 40) + (textToSend.length > 40 ? "..." : "")
            : chat.title,
        messages: [...chat.messages, userMessage],
        lastActive: new Date().toISOString(),
      };

      setCurrentChat(chatWithUser);
      setChats((prev) => {
        const exists = prev.some((c) => c.id === chatWithUser.id);
        if (!exists) {
          return [chatWithUser, ...prev];
        }
        return prev.map((c) => (c.id === chatWithUser.id ? chatWithUser : c));
      });

      let chatIdForSend = chatWithUser.id;

      if (isAuthenticated && pendingTempChatId) {
        const created = await ragService.createChat();
        chatIdForSend = created.id;

        const promotedChat: Chat = {
          ...chatWithUser,
          id: created.id,
          createdAt: created.created_at,
          lastActive: created.updated_at,
        };

        setCurrentChat((prev) =>
          prev && prev.id === pendingTempChatId ? promotedChat : prev,
        );
        setChats((prev) => {
          const withoutTemp = prev.filter((c) => c.id !== pendingTempChatId);
          return [
            promotedChat,
            ...withoutTemp.filter((c) => c.id !== promotedChat.id),
          ];
        });
        updateChatUrl(created.id);
      }

      let assistantId = crypto.randomUUID();
      let assistantTimestamp = formatTimestamp(new Date());
      let assistantText = "";
      let assistantSources: Message["sources"] = [];

      if (isAuthenticated) {
        const response = await ragService.sendChatMessage(chatIdForSend, {
          content: textToSend,
        });
        assistantId = response.message_id;
        assistantTimestamp = formatTimestamp(response.created_at);
        assistantText = response.content;
        assistantSources = response.sources || [];
      } else {
        const response = await ragService.query({ content: textToSend });
        assistantText = response.content;
        assistantSources = response.sources || [];
      }

      const assistantMessage: Message = {
        id: assistantId,
        text: assistantText,
        isBot: true,
        sources: assistantSources,
        timestamp: assistantTimestamp,
      };

      const finalChat: Chat = {
        ...chatWithUser,
        id: chatIdForSend,
        messages: [...chatWithUser.messages, assistantMessage],
        lastActive: new Date().toISOString(),
      };

      setCurrentChat(finalChat);
      setChats((prev) =>
        prev.map((c) => (c.id === finalChat.id ? finalChat : c)),
      );

      if (!isAuthenticated) {
        incrementGuestUsage();
      }
    } catch (error) {
      const parsed = parseApiError(error, "Failed to send message.");
      toast({
        title: "Message failed",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const createNewChat = () => {
    setIsDraftNewChat(true);
    setCurrentChat(null);
    if (!isAuthenticated) {
      setChats([]);
    }
    updateChatUrl(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const selectChat = (chat: Chat) => {
    setIsDraftNewChat(false);

    if (!isAuthenticated) {
      setCurrentChat(chat);
      updateChatUrl(chat.id);
      return;
    }

    const load = async () => {
      try {
        const history = await ragService.getChatMessages(chat.id);
        const mappedMessages: Message[] = history.messages.map((message) => ({
          id: message.id,
          text: message.content,
          isBot: message.role !== "user",
          sources: message.sources || [],
          timestamp: formatTimestamp(message.created_at),
        }));
        setCurrentChat({ ...chat, messages: mappedMessages });
        updateChatUrl(chat.id);
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      } catch (error) {
        const parsed = parseApiError(error, "Unable to load chat messages.");
        toast({
          title: "Load messages failed",
          description: parsed.message,
          variant: "destructive",
        });
      }
    };

    void load();
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }

    const remove = async () => {
      try {
        await ragService.deleteChat(chatId);
        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);

        if (currentChat?.id === chatId) {
          if (updatedChats.length > 0) {
            selectChat(updatedChats[0]);
          } else {
            setCurrentChat(null);
            updateChatUrl(null);
          }
        }
      } catch (error) {
        const parsed = parseApiError(error, "Unable to delete chat.");
        toast({
          title: "Delete failed",
          description: parsed.message,
          variant: "destructive",
        });
      }
    };

    void remove();
  };

  const startEditingTitle = (
    chatId: string,
    currentTitle: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const saveTitle = (chatId: string) => {
    if (!isAuthenticated || !editingTitle.trim()) {
      setEditingChatId(null);
      setEditingTitle("");
      return;
    }

    const persist = async () => {
      try {
        const updated = await ragService.renameChat(
          chatId,
          editingTitle.trim(),
        );
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, title: updated.title } : chat,
          ),
        );
        if (currentChat?.id === chatId) {
          setCurrentChat((prev) =>
            prev ? { ...prev, title: updated.title } : prev,
          );
        }
      } catch (error) {
        const parsed = parseApiError(error, "Unable to rename chat.");
        toast({
          title: "Rename failed",
          description: parsed.message,
          variant: "destructive",
        });
      } finally {
        setEditingChatId(null);
        setEditingTitle("");
      }
    };

    void persist();
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
        {isAuthenticated && (
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
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-black relative min-h-0">
          {isAuthenticated && (
            <SidebarToggle
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
          )}

          <MessageList
            currentChat={currentChat}
            isTyping={isTyping || isLoadingChats}
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

      <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
        <DialogContent className="bg-black border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Daily guest limit reached</DialogTitle>
            <DialogDescription className="text-gray-300">
              You have used {GUEST_LIMIT_PER_DAY} guest messages today. Log in
              to continue chatting now, or come back tomorrow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 text-gray-200 bg-transparent cursor-pointer"
              onClick={() => setIsLimitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button asChild className="bg-white text-black hover:bg-gray-200">
              <Link href={buildAuthUrl(getCurrentPathWithSearch())}>Login</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
