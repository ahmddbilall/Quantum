"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ArticleChatButton } from "@/components/aichat";
import { useToast } from "@/hooks/use-toast";
import { parseApiError } from "@/lib/error-parser";
import {
  ArticleHeader,
  AISummaryCard,
  ArticleContent,
  ArticleTags,
  BackButton,
} from "@/components/article";
import { newsService } from "@/services/newsService";
import { NewsArticleDetail } from "@/types";

interface SentimentView {
  overall: "Positive" | "Negative" | "Neutral";
  confidence: number;
}

function toSentiment(
  label?: string | null,
  score?: number | null,
): SentimentView {
  const normalized = (label || "").toLowerCase();
  if (normalized === "positive") {
    return {
      overall: "Positive",
      confidence: Math.max(55, Math.round(Math.abs((score || 0.35) * 100))),
    };
  }
  if (normalized === "negative") {
    return {
      overall: "Negative",
      confidence: Math.max(55, Math.round(Math.abs((score || -0.35) * 100))),
    };
  }
  return {
    overall: "Neutral",
    confidence: Math.max(50, Math.round((1 - Math.abs(score || 0)) * 100)),
  };
}

function toHtml(content?: string | null): string {
  if (!content || !content.trim()) {
    return "<p>No full content available for this article.</p>";
  }

  const escaped = content
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

export default function NewsDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const { toast } = useToast();

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const sentiment = useMemo(
    () => toSentiment(article?.sentiment_label, article?.sentiment_score),
    [article?.sentiment_label, article?.sentiment_score],
  );

  useEffect(() => {
    let generatingTimer: ReturnType<typeof setTimeout> | null = null;

    const loadArticle = async () => {
      setIsLoading(true);
      setIsGenerating(true);
      setShowSummary(false);
      try {
        const result = await newsService.getArticle(articleId);
        setArticle(result);

        const token = localStorage.getItem("access_token");
        if (token) {
          try {
            const bookmarks = await newsService.getBookmarks();
            setIsBookmarked(
              bookmarks.some((bookmark) => bookmark.id === articleId),
            );
          } catch {
            setIsBookmarked(false);
          }
        }

        generatingTimer = setTimeout(() => {
          setIsGenerating(false);
          setShowSummary(true);
        }, 1200);
      } catch (error) {
        const parsed = parseApiError(error, "Failed to load article.");
        toast({
          title: "Failed to load article",
          description: parsed.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadArticle();

    return () => {
      if (generatingTimer) {
        clearTimeout(generatingTimer);
      }
    };
  }, [articleId, toast]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Article link has been copied to clipboard",
        duration: 2000,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleBookmark = async () => {
    if (!article) {
      return;
    }

    try {
      if (isBookmarked) {
        await newsService.removeBookmark(article.id);
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Article removed from bookmarks",
        });
      } else {
        await newsService.addBookmark(article.id);
        setIsBookmarked(true);
        toast({
          title: "Bookmarked",
          description: "Article saved to bookmarks",
        });
      }
    } catch (error) {
      const parsed = parseApiError(error, "Could not update bookmark.");
      toast({
        title: parsed.status === 401 ? "Login required" : "Bookmark failed",
        description:
          parsed.status === 401
            ? "Please sign in to manage bookmarks."
            : parsed.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-300">Article not found.</p>
      </div>
    );
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at)
    : new Date();
  const summary =
    article.summary || "No AI summary available for this article yet.";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={() => window.history.back()} label="Back" />

        <div className="mb-8">
          <ArticleHeader
            title={article.title}
            author={article.author || "Unknown Author"}
            source={article.source}
            publishedDate={publishedDate}
            category={article.category || "General"}
            isBookmarked={isBookmarked}
            onShare={handleShare}
            onBookmark={handleBookmark}
          />
        </div>

        <div className="mb-8">
          <AISummaryCard
            aiSummary={summary}
            sentiment={sentiment}
            isGenerating={isGenerating}
            showSummary={showSummary}
          />
        </div>

        <div className="mb-8">
          <ArticleContent content={toHtml(article.content)} />
        </div>

        <ArticleTags tags={article.tags || []} />
      </div>

      <ArticleChatButton articleId={articleId} articleTitle={article.title} />

      <Footer />
    </div>
  );
}
