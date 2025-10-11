"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Zap,
  Brain,
  Globe,
  TrendingUp,
  Sparkles,
  Clock,
  ThumbsUp,
  Copy,
  RotateCcw,
  Settings,
  Mic,
  MicOff,
  Plus,
  History,
  Trash2,
} from "lucide-react";

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: string;
  typing?: boolean;
  suggestions?: string[];
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastActive: string;
}

export default function ChatbotPage() {
  const [currentChat, setCurrentChat] = useState<Chat>({
    id: "1",
    title: "New Chat",
    messages: [
      {
        id: 1,
        text: "Hello! I'm Quantum AI, your intelligent news assistant. I can help you understand news articles, analyze trends, and answer questions about current events. What would you like to know?",
        isBot: true,
        timestamp: new Date().toLocaleTimeString(),
        suggestions: [
          "What's trending today?",
          "Latest AI developments",
          "Market analysis",
          "Climate news update",
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  });

  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    },
  ]);

  const [showChatHistory, setShowChatHistory] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQuestions = [
    "Summarize today's top news",
    "What are the latest developments in AI?",
    "Explain the current market trends",
    "What's happening in global politics?",
    "Tell me about recent climate news",
    "What are the trending topics today?",
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Get intelligent insights and analysis of complex news topics",
      color: "from-blue-500 to-purple-600",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Access news from trusted sources worldwide",
      color: "from-green-500 to-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Understand emerging patterns and market movements",
      color: "from-orange-500 to-red-600",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Get instant insights on breaking news and developments",
      color: "from-yellow-500 to-orange-600",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize with a default chat
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const simulateBotResponse = async (userMessage: string) => {
    if (!currentChat) return;

    setIsTyping(true);

    // Simulate thinking time
    await new Promise((resolve) =>
      setTimeout(resolve, 1500 + Math.random() * 1000)
    );

    const responses = [
      {
        text: `Based on the latest news data, here's what I found about "${userMessage}". The current trends show interesting developments that could impact various sectors. Would you like me to analyze specific aspects in more detail?`,
        suggestions: [
          "Tell me more",
          "Show related articles",
          "Market impact",
          "Global perspective",
        ],
      },
      {
        text: "I've analyzed the latest news articles and market data. The information suggests several key trends that are worth monitoring. Let me break this down for you with the most relevant insights.",
        suggestions: [
          "Key insights",
          "Related topics",
          "Expert opinions",
          "Historical context",
        ],
      },
      {
        text: "Interesting question! Based on my analysis of current news patterns and expert commentary, I can provide you with a comprehensive overview of this topic. Here are the main points to consider.",
        suggestions: ["Deep dive", "Sources", "Timeline", "Impact analysis"],
      },
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    const botMessage: Message = {
      id: Date.now(),
      text: randomResponse.text,
      isBot: true,
      timestamp: new Date().toLocaleTimeString(),
      suggestions: randomResponse.suggestions,
    };

    // Update current chat with bot response
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, botMessage],
      lastActive: new Date().toISOString(),
    };

    setCurrentChat(updatedChat);
    setChats((prev) =>
      prev.map((chat) => (chat.id === currentChat.id ? updatedChat : chat))
    );

    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentChat) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Update current chat with new message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      lastActive: new Date().toISOString(),
      title:
        currentChat.messages.length === 0
          ? inputMessage.slice(0, 30) + "..."
          : currentChat.title,
    };

    setCurrentChat(updatedChat);
    setChats((prev) =>
      prev.map((chat) => (chat.id === currentChat.id ? updatedChat : chat))
    );
    setInputMessage("");

    await simulateBotResponse(inputMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChat);
    setShowChatHistory(false);
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
    setShowChatHistory(false);
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      if (chats.length > 1) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        setCurrentChat(remainingChats[0]);
      } else {
        createNewChat();
      }
    }
  };

  const updateChatTitle = (chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat))
    );
    if (currentChat?.id === chatId) {
      setCurrentChat((prev) => (prev ? { ...prev, title } : prev));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Chat History Sidebar */}
        {showChatHistory && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 bg-zinc-900 border-r border-gray-700 flex flex-col"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Chat History
                </h2>
                <Button
                  onClick={() => setShowChatHistory(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              <Button
                onClick={createNewChat}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentChat?.id === chat.id
                        ? "bg-zinc-800 border-white/20"
                        : "bg-zinc-800/50 border-gray-700 hover:bg-zinc-800"
                    }`}
                    onClick={() => selectChat(chat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {chat.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {new Date(chat.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-400 ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {chats.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No chat history yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col relative">
          {/* Top Bar */}
          <div className="p-4 border-b border-gray-700 bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  onClick={createNewChat}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <div className="text-white font-semibold">
                  <span className="font-oxanium">Quantum</span> AI Assistant
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[660px] p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence>
                  {currentChat?.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${
                        message.isBot ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`flex items-start space-x-3 max-w-[80%] ${
                          message.isBot
                            ? ""
                            : "flex-row-reverse space-x-reverse"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex-shrink-0 p-2 rounded-full ${
                            message.isBot
                              ? "bg-gradient-to-r from-blue-600 to-purple-600"
                              : "bg-gradient-to-r from-slate-600 to-slate-700"
                          }`}
                        >
                          {message.isBot ? (
                            <Bot className="h-5 w-5 text-white" />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div
                          className={`space-y-2 ${
                            message.isBot ? "" : "text-right"
                          }`}
                        >
                          <div
                            className={`p-4 rounded-2xl ${
                              message.isBot
                                ? "bg-zinc-800 text-white"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">
                              {message.text}
                            </p>
                          </div>

                          <div
                            className={`flex items-center space-x-2 text-xs text-gray-400 ${
                              message.isBot ? "" : "justify-end"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{message.timestamp}</span>
                            {message.isBot && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyMessage(message.text)}
                                  className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Suggestions */}
                          {/* {message.suggestions && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSuggestionClick(suggestion)
                                  }
                                  className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )} */}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      <div className="flex-shrink-0 p-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-800">
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Welcome Message if no messages */}
                {(!currentChat?.messages ||
                  currentChat.messages.length === 0) &&
                  !isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Bot className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-4">
                        Welcome to <span className="font-oxanium">Quantum</span>{" "}
                        AI
                      </h2>
                      <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Your intelligent companion for news analysis, trend
                        insights, and real-time information discovery. Ask me
                        anything about current events, market trends, or get
                        detailed analysis on any topic.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                        {suggestedQuestions
                          .slice(0, 4)
                          .map((question, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              onClick={() => handleSuggestionClick(question)}
                              className="text-sm text-white bg-black border-white hover:bg-white hover:text-black h-auto min-h-[3rem] p-4 text-left whitespace-normal break-words leading-relaxed transition-all duration-200"
                            >
                              {question}
                            </Button>
                          ))}
                      </div>
                    </motion.div>
                  )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </div>

          {/* Floating Input */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="max-w-4xl mx-auto">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about news, trends, or current events..."
                className="w-full py-4 px-6 text-sm bg-zinc-900 border-gray-700 text-white placeholder-gray-400 rounded-xl shadow-lg"
                disabled={isTyping}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
