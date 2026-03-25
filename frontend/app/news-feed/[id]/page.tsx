"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ArticleChatButton } from "@/components/aichat";
import { useToast } from "@/hooks/use-toast";
import { parseApiError } from "@/lib/error-parser";
import { buildAuthUrl, getCurrentPathWithSearch } from "@/lib/auth-redirect";
import {
  ArticleHeader,
  AISummaryCard,
  ArticleContent,
  ArticleTags,
  BackButton,
} from "@/components/article";
import { newsService } from "@/services/newsService";
import { NewsArticleDetail, NewsArticleSummary } from "@/types";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const router = useRouter();
  const articleId = params.id as string;
  const { toast } = useToast();

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [summaryRating, setSummaryRating] = useState<
    "helpful" | "not_helpful" | null
  >(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticleSummary[]>(
    [],
  );
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

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

    // Fetch related articles independently
    const loadRelated = async () => {
      setIsLoadingRelated(true);
      try {
        const related = await newsService.getRelatedArticles(articleId, 4);
        setRelatedArticles(related);
      } catch (err) {
        console.error("Failed to load related articles", err);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    void loadRelated();

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

  const handleOpenOriginalArticle = () => {
    if (!article) {
      return;
    }

    const targetUrl = (article.original_url || article.url || "").trim();
    if (!targetUrl) {
      toast({
        title: "Original link unavailable",
        description: "No source URL is available for this article.",
        variant: "destructive",
      });
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleBookmark = async () => {
    if (!article) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setShowLoginDialog(true);
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
      if (parsed.status === 401) {
        setShowLoginDialog(true);
        return;
      }
      toast({
        title: "Bookmark failed",
        description: parsed.message,
        variant: "destructive",
      });
    }
  };

  const handleSummaryFeedback = async (rating: "helpful" | "not_helpful") => {
    if (!article) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setShowLoginDialog(true);
      return;
    }

    try {
      await newsService.submitSummaryFeedback(article.id, {
        rating,
      });
      setSummaryRating(rating);
    } catch (error) {
      const parsed = parseApiError(error, "Could not save summary feedback.");
      if (parsed.status === 401) {
        setShowLoginDialog(true);
        return;
      }
      throw error;
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
            onOpenOriginalArticle={handleOpenOriginalArticle}
            onBookmark={handleBookmark}
          />
        </div>

        <div className="mb-8">
          <AISummaryCard
            aiSummary={summary}
            sentiment={sentiment}
            isGenerating={isGenerating}
            showSummary={showSummary}
            initialRating={summaryRating}
            onFeedback={handleSummaryFeedback}
          />
        </div>

        <div className="mb-8">
          <ArticleContent content={toHtml(article.content)} />
        </div>

        <ArticleTags tags={article.tags || []} />

        {/* Related News Section */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Related News</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/news-feed/${relatedArticle.id}`}
                  className="group block h-full"
                >
                  <Card className="flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-white/15 bg-zinc-950 py-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-zinc-900/90 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                    <CardContent className="flex h-full flex-col p-0">
                      {relatedArticle.image_url && (
                        <div className="relative overflow-hidden shrink-0">
                          <img
                            src={relatedArticle.image_url}
                            alt={relatedArticle.title}
                            className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="rounded-full border border-white/20 bg-black/75 px-2 py-1 text-xs text-white">
                              {relatedArticle.category || "Related"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex flex-1 flex-col justify-between p-4 ${
                          relatedArticle.image_url
                            ? "border-t border-white/10"
                            : ""
                        }`}
                      >
                        <div>
                          <h3 className="mb-2 line-clamp-2 text-md font-bold text-white transition-colors duration-300 group-hover:text-gray-100">
                            {relatedArticle.title}
                          </h3>
                          <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
                            {relatedArticle.summary}
                          </p>
                        </div>
                        <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-300">
                            {relatedArticle.source}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(
                              relatedArticle.published_at!,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <ArticleChatButton articleId={articleId} articleTitle={article.title} />

      <Footer />

      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent className="bg-black border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Login first to bookmark
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-200">
              You need to login before saving articles to your bookmarks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-white text-black hover:bg-gray-200"
              onClick={() => {
                router.push(buildAuthUrl(getCurrentPathWithSearch()));
              }}
            >
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
