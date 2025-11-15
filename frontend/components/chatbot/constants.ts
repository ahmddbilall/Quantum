import { TrendingUp, Newspaper, Globe } from "lucide-react";
import { DefaultQuestion } from "./types";

export const DEFAULT_QUESTIONS: DefaultQuestion[] = [
  {
    text: "What's the latest news about Bitcoin today?",
    icon: TrendingUp,
    category: "Crypto",
  },
  {
    text: "Give me a summary of today's top headlines",
    icon: Newspaper,
    category: "News",
  },
  {
    text: "What are the major developments in USA today?",
    icon: Globe,
    category: "Politics",
  },
];

export const createFakeChats = () => [
  {
    id: "1",
    title: "Bitcoin Price Analysis",
    messages: [
      {
        id: 1,
        text: "What's the current Bitcoin price trend?",
        isBot: false,
        timestamp: "2:30 PM",
      },
      {
        id: 2,
        text: "Based on the latest data, Bitcoin is showing strong support at $37,000 with resistance near $40,000. The market sentiment is cautiously optimistic, with several key indicators suggesting potential upward momentum in the coming weeks.",
        isBot: true,
        timestamp: "2:30 PM",
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastActive: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "2",
    title: "Tech Industry Updates",
    messages: [
      {
        id: 1,
        text: "Give me a summary of today's top headlines",
        isBot: false,
        timestamp: "10:15 AM",
      },
      {
        id: 2,
        text: "Today's major headlines include: AI breakthrough in medical diagnostics, major tech companies reporting Q4 earnings, and regulatory discussions around cryptocurrency adoption. The tech sector is experiencing significant volatility as investors react to these developments.",
        isBot: true,
        timestamp: "10:15 AM",
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastActive: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    title: "Global Market Overview",
    messages: [
      {
        id: 1,
        text: "What are the major developments in USA today?",
        isBot: false,
        timestamp: "3:45 PM",
      },
      {
        id: 2,
        text: "Key developments in the USA today include: Federal Reserve's latest policy announcement, significant movements in the stock market with tech stocks leading gains, and major policy discussions in Washington. Economic indicators suggest continued growth with moderate inflation concerns.",
        isBot: true,
        timestamp: "3:45 PM",
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastActive: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];
