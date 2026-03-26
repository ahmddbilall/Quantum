"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { ArticleChatButton } from "@/components/aichat";
import {
  ArticleHeader,
  AIAnalysisCard,
  ArticleContent,
  ArticleTags,
  BackButton,
} from "@/components/article";
import { newsService } from "@/services/newsService";
import { parseApiError } from "@/lib/error-parser";
import { buildAuthUrl, getCurrentPathWithSearch } from "@/lib/auth-redirect";
import { NewsArticleDetail } from "@/types";
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
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

function getChartTarget(article: NewsArticleDetail): {
  symbol: string;
  exchange: string;
} {
  const category = (article.category || "").toLowerCase();
  const source = (article.source || "").toLowerCase();

  if (
    category.includes("crypto") ||
    source.includes("crypto") ||
    source.includes("btc")
  ) {
    return { symbol: "BTCUSDT", exchange: "BINANCE" };
  }

  if (
    category.includes("stock") ||
    category.includes("equity") ||
    category.includes("market")
  ) {
    return { symbol: "AAPL", exchange: "NASDAQ" };
  }

  return { symbol: "TOTAL", exchange: "CRYPTOCAP" };
}

export default function FinanceNewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const newsId = params.id as string;

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const sentiment = useMemo(
    () => toSentiment(article?.sentiment_label, article?.sentiment_score),
    [article?.sentiment_label, article?.sentiment_score],
  );

  const chart = useMemo(() => {
    if (!article) {
      return { symbol: "TOTAL", exchange: "CRYPTOCAP" };
    }
    return getChartTarget(article);
  }, [article]);

  useEffect(() => {
    let generatingTimer: ReturnType<typeof setTimeout> | null = null;

    const loadArticle = async () => {
      setIsLoading(true);
      setIsGenerating(true);
      setShowSummary(false);

      try {
        const result = await newsService.getArticle(newsId);
        setArticle(result);

        const token = localStorage.getItem("access_token");
        if (token) {
          try {
            const bookmarks = await newsService.getBookmarks();
            setIsBookmarked(
              bookmarks.some((bookmark) => bookmark.id === newsId),
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
  }, [newsId, toast]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
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
  const publishedAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : "Unknown";
  const summary =
    article.summary || "No AI summary available for this article yet.";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton
          onClick={() => router.back()}
          label="Back "
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ArticleHeader
              title={article.title}
              author={article.author || "Unknown Author"}
              source={article.source}
              publishedDate={publishedDate}
              category={article.category || "Market"}
              isBookmarked={isBookmarked}
              onShare={handleShare}
              onOpenOriginalArticle={handleOpenOriginalArticle}
              onBookmark={handleBookmark}
              additionalBadges={
                <>
                  <Badge
                    variant="outline"
                    className="border-zinc-700 text-zinc-400"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {publishedAgo}
                  </Badge>
                  <div
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/20 text-white text-xs font-medium flex items-center gap-1"
                    title={`Sentiment: ${sentiment.overall}`}
                  >
                    <span>
                      {sentiment.overall === "Positive"
                        ? "↑"
                        : sentiment.overall === "Negative"
                          ? "↓"
                          : "→"}
                    </span>
                    <span>{sentiment.overall}</span>
                  </div>
                </>
              }
            />

            <div className="text-lg text-gray-400 mb-6">{summary}</div>

            <div className="relative p-[2px] pb-1 rounded-xl bg-gradient-to-r from-purple-500 via-gray-400 to-white animate-gradient">
              <Card className="bg-black border-0 rounded-xl overflow-hidden">
                <CardContent className="p-0 bg-gradient-to-br from-zinc-950 via-black to-purple-950/10">
                  <div className="p-6 pt-2 pb-2 border-b border-zinc-800/50">
                    <h3 className="text-xl font-bold text-white">
                      Market Chart
                    </h3>
                    <p className="text-xs text-gray-400">
                      Real-time chart for quick analysis
                    </p>
                  </div>

                  <TradingViewWidget
                    symbol={chart.symbol}
                    exchange={chart.exchange}
                  />
                </CardContent>
              </Card>
            </div>

            <ArticleContent
              content={toHtml(article.content || article.summary)}
            />
            <ArticleTags tags={article.tags || []} />
          </div>

          <div className="lg:col-span-1">
            <AIAnalysisCard
              aiSummary={summary}
              sentimentAnalysis={{
                overall: sentiment.overall,
                confidence: sentiment.confidence,
              }}
              isGenerating={isGenerating}
              showSummary={showSummary}
            />
          </div>
        </div>
      </div>

      <ArticleChatButton articleId={newsId} articleTitle={article.title} />

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

function TradingViewWidget({
  symbol,
  exchange,
}: {
  symbol: string;
  exchange: string;
}) {
  useEffect(() => {
    const container = document.getElementById("tradingview-chart");
    if (container) {
      container.innerHTML = "";
    }

    const tvSymbol = `${exchange}:${symbol}`;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== "undefined") {
        new (window as any).TradingView.widget({
          container_id: "tradingview-chart",
          autosize: true,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#09090b",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: "#09090b",
          gridColor: "rgba(255, 255, 255, 0.06)",
          height: 450,
          width: "100%",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, exchange]);

  return (
    <div
      id="tradingview-chart"
      style={{ height: "450px", width: "100%" }}
      className="rounded-lg overflow-hidden bg-zinc-950"
    ></div>
  );
}
