import api from "@/lib/api";
import { toApiClientError } from "@/lib/error-parser";
import {
  RAGChatHistoryResponse,
  RAGChatMessageResponse,
  RAGChatSummary,
  RAGQueryResponse,
} from "@/types";

export const ragService = {
  async listChats(limit = 50): Promise<RAGChatSummary[]> {
    try {
      const response = await api.get<RAGChatSummary[]>("/rag/chats", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load chat history.");
    }
  },

  async createChat(title?: string): Promise<RAGChatSummary> {
    try {
      const response = await api.post<RAGChatSummary>("/rag/chats", { title });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to create chat.");
    }
  },

  async renameChat(chatId: string, title: string): Promise<RAGChatSummary> {
    try {
      const response = await api.patch<RAGChatSummary>(`/rag/chats/${chatId}`, {
        title,
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to rename chat.");
    }
  },

  async deleteChat(chatId: string): Promise<void> {
    try {
      await api.delete(`/rag/chats/${chatId}`);
    } catch (error) {
      throw toApiClientError(error, "Unable to delete chat.");
    }
  },

  async getChatMessages(chatId: string): Promise<RAGChatHistoryResponse> {
    try {
      const response = await api.get<RAGChatHistoryResponse>(
        `/rag/chats/${chatId}/messages`,
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load messages.");
    }
  },

  async sendChatMessage(
    chatId: string,
    payload: { content: string; articleId?: string },
  ): Promise<RAGChatMessageResponse> {
    try {
      const response = await api.post<RAGChatMessageResponse>(
        `/rag/chat/${chatId}/message`,
        {
          content: payload.content,
          article_id: payload.articleId,
        },
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to send message.");
    }
  },

  async query(payload: {
    content: string;
    articleId?: string;
  }): Promise<RAGQueryResponse> {
    try {
      const response = await api.post<RAGQueryResponse>("/rag/query", {
        content: payload.content,
        article_id: payload.articleId,
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to process AI query.");
    }
  },
};
