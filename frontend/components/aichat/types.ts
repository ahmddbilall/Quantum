export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export interface ArticleChatProps {
  articleId: string;
  articleTitle: string;
}
