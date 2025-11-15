import { Chat, Message } from "./types";

export const BOT_RESPONSES = [
  `Based on the latest data about "{query}", here's what I found: The current trends indicate significant developments across multiple sectors. Market sentiment appears cautiously optimistic with several key indicators showing positive momentum. Would you like me to dive deeper into any specific aspect?`,
  `I've analyzed recent information regarding your query about "{query}". The data suggests several interesting patterns emerging. Key stakeholders are positioning themselves strategically, and early indicators point to potential shifts in the near term. Let me know if you'd like more detailed analysis.`,
  `Great question! Regarding "{query}", the latest reports show a mix of developments. Technical analysis indicates strong support levels, while fundamental factors remain robust. The broader context suggests we're at an interesting inflection point. Would you like me to explore specific metrics?`,
  `Interesting query about "{query}"! From what I'm seeing in the latest news and data, there are several noteworthy trends. Market participants are closely monitoring these developments, and expert opinions vary on the short-term outlook. I can provide more granular details if needed.`,
];

export const simulateBotResponse = async (
  userMessage: string,
  currentChat: Chat | null,
  setCurrentChat: React.Dispatch<React.SetStateAction<Chat | null>>,
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const chatToUpdate = currentChat;
  if (!chatToUpdate) return;

  setIsTyping(true);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const randomResponse = BOT_RESPONSES[
    Math.floor(Math.random() * BOT_RESPONSES.length)
  ].replace("{query}", userMessage);

  const botMessage: Message = {
    id: Date.now(),
    text: randomResponse,
    isBot: true,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  setCurrentChat((prev) => {
    if (!prev) return prev;
    const updated = {
      ...prev,
      messages: [...prev.messages, botMessage],
      lastActive: new Date().toISOString(),
    };
    setChats((prevChats) =>
      prevChats.map((chat) => (chat.id === prev.id ? updated : chat))
    );
    return updated;
  });

  setIsTyping(false);
};

export const handleSendMessage = async (
  messageText: string | undefined,
  inputMessage: string,
  currentChat: Chat | null,
  setCurrentChat: React.Dispatch<React.SetStateAction<Chat | null>>,
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>,
  setInputMessage: React.Dispatch<React.SetStateAction<string>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const textToSend = messageText || inputMessage.trim();
  if (!textToSend) return;

  // Create new chat if none exists
  let chatToUpdate = currentChat;
  if (!chatToUpdate) {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    setChats((prev) => [newChat, ...prev]);
    chatToUpdate = newChat;
    setCurrentChat(newChat);
  }

  const userMessage: Message = {
    id: Date.now(),
    text: textToSend,
    isBot: false,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const updatedChat = {
    ...chatToUpdate,
    messages: [...chatToUpdate.messages, userMessage],
    lastActive: new Date().toISOString(),
    title:
      chatToUpdate.messages.length === 0
        ? textToSend.slice(0, 40) + (textToSend.length > 40 ? "..." : "")
        : chatToUpdate.title,
  };

  setCurrentChat(updatedChat);
  setChats((prev) =>
    prev.map((chat) => (chat.id === chatToUpdate!.id ? updatedChat : chat))
  );
  setInputMessage("");

  await simulateBotResponse(
    textToSend,
    updatedChat,
    setCurrentChat,
    setChats,
    setIsTyping
  );
};
