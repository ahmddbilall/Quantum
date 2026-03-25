export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: {
    title: string;
    url: string;
    article_id?: string | null;
  }[];
}

export interface ArticleChatProps {
  articleId: string;
  articleTitle: string;
}
