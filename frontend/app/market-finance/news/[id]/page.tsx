"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
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

// Mock data - will be replaced with actual data fetching later
const mockFinanceNews = {
  1: {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary:
      "The Fed has decided to maintain current interest rates amid economic uncertainty.",
    category: "Economics",
    source: "Financial Times",
    author: "Janet Smith",
    publishedAt: "1 hour ago",
    publishedDate: new Date(2025, 10, 11, 10, 0),
    fullDate: "November 11, 2025",
    views: 2134,
    tags: ["Fed", "Interest Rates", "Economics"],
    sentiment: "neutral",
    fullContent: `
      <h2>Federal Reserve Maintains Current Interest Rates</h2>
      <p>In a widely anticipated decision, the Federal Reserve has announced it will maintain current interest rates at their existing levels, citing ongoing economic uncertainty and mixed signals from various sectors of the economy.</p>
      
      <h3>Key Decision Points</h3>
      <p>Fed Chairman Jerome Powell explained that the decision reflects a careful balance between controlling inflation and supporting economic growth. "We're seeing encouraging signs in some areas, but we need to remain cautious and data-dependent," Powell stated during the press conference.</p>
      
      <p>The decision comes after months of debate among economists about the appropriate path forward for monetary policy. Recent inflation data has shown some moderation, but labor market strength continues to present challenges.</p>
      
      <h3>Market Implications</h3>
      <p>Financial markets had largely priced in this decision, with futures contracts showing minimal surprise. However, the Fed's forward guidance suggests a more cautious approach to future rate adjustments, which has implications for both equity and bond markets.</p>
      
      <p>Analysts note that this stance could support continued economic growth while keeping inflation expectations anchored. The Fed emphasized its commitment to achieving its dual mandate of maximum employment and price stability.</p>
      
      <h3>Looking Ahead</h3>
      <p>The Fed indicated it will continue to monitor economic data closely and remains prepared to adjust policy as needed. The next policy meeting is scheduled for early 2026, where officials will have access to additional data to inform their decisions.</p>
    `,
    aiSummary:
      "The Federal Reserve has decided to maintain current interest rates amid economic uncertainty. Fed Chairman Powell emphasized a data-dependent approach, balancing inflation control with economic growth support. Markets had largely anticipated this decision, with forward guidance suggesting continued cautious monetary policy.",
    sentiment_analysis: {
      overall: "Neutral",
      confidence: 87,
      emotions: ["Caution", "Stability", "Vigilance"],
    },
    // Default chart - Total Crypto Market Cap
    chartSymbol: "TOTAL", // Total Crypto Market Cap
    chartExchange: "CRYPTOCAP",
  },
  2: {
    id: 2,
    title: "Bitcoin Surges Past $68,000 on Institutional Adoption",
    summary:
      "Major corporations continue to add Bitcoin to their treasury reserves.",
    category: "Cryptocurrency",
    source: "CoinDesk",
    author: "Michael Chen",
    publishedAt: "3 hours ago",
    publishedDate: new Date(2025, 10, 11, 8, 0),
    fullDate: "November 11, 2025",
    views: 1856,
    tags: ["Bitcoin", "Cryptocurrency", "Institutional"],
    sentiment: "positive",
    fullContent: `
      <h2>Bitcoin Reaches New Milestone as Institutions Double Down</h2>
      <p>Bitcoin has surged past the $68,000 mark, marking a significant milestone in its ongoing bull run. The rally is largely attributed to increased institutional adoption, with several Fortune 500 companies announcing additions to their Bitcoin treasury holdings.</p>
      
      <h3>Institutional Momentum</h3>
      <p>Major corporations including MicroStrategy and Tesla have recently expanded their Bitcoin positions, signaling growing confidence in the cryptocurrency as a store of value. This institutional interest has provided strong support for Bitcoin's price action.</p>
      
      <p>Investment analysts note that the current rally differs from previous bull runs, with more sophisticated institutional participation and improved market infrastructure supporting sustained growth.</p>
      
      <h3>Market Dynamics</h3>
      <p>Trading volumes have increased significantly across major exchanges, with both retail and institutional investors showing strong buying interest. On-chain metrics indicate that long-term holders continue to accumulate, suggesting confidence in Bitcoin's future prospects.</p>
      
      <h3>Regulatory Clarity</h3>
      <p>Recent regulatory developments have also contributed to the positive sentiment, with clearer guidelines emerging from major financial jurisdictions. This regulatory clarity has made it easier for institutions to incorporate Bitcoin into their investment strategies.</p>
    `,
    aiSummary:
      "Bitcoin has surged past $68,000 driven by increased institutional adoption. Major corporations like MicroStrategy and Tesla are expanding their Bitcoin holdings, with improved market infrastructure and regulatory clarity supporting the rally. Trading volumes and long-term holder accumulation indicate strong confidence.",
    sentiment_analysis: {
      overall: "Positive",
      confidence: 92,
      emotions: ["Optimism", "Confidence", "Growth"],
    },
    chartSymbol: "TOTAL", // Total Crypto Market Cap
    chartExchange: "CRYPTOCAP",
  },
  3: {
    id: 3,
    title: "Tech Stocks Rally on Strong Earnings Reports",
    summary: "Major technology companies exceed earnings expectations for Q4.",
    category: "Stocks",
    source: "MarketWatch",
    author: "Sarah Johnson",
    publishedAt: "5 hours ago",
    publishedDate: new Date(2025, 10, 11, 6, 0),
    fullDate: "November 11, 2025",
    views: 1342,
    tags: ["Tech Stocks", "Earnings", "Q4"],
    sentiment: "positive",
    fullContent: `
      <h2>Tech Sector Leads Market Rally with Stellar Earnings</h2>
      <p>The technology sector is experiencing a significant rally as major companies report earnings that exceed analyst expectations. This performance has lifted broader market indices and renewed investor confidence in tech valuations.</p>
      
      <h3>Standout Performers</h3>
      <p>Leading tech giants have reported strong revenue growth and improved profit margins. Cloud computing services, artificial intelligence initiatives, and digital advertising revenues have been key drivers of the impressive results.</p>
      
      <p>Companies that have invested heavily in AI infrastructure are seeing particular strength, with these investments beginning to translate into tangible revenue growth and operational efficiencies.</p>
      
      <h3>Market Response</h3>
      <p>The NASDAQ Composite has gained over 3% in response to the earnings reports, with tech stocks leading the advance. Investor sentiment has improved significantly, with many analysts raising their price targets for major technology companies.</p>
      
      <h3>Forward Outlook</h3>
      <p>Management teams have provided optimistic forward guidance, citing strong demand for their products and services. However, some caution remains around potential economic headwinds and the sustainability of current growth rates.</p>
    `,
    aiSummary:
      "Major technology companies have exceeded Q4 earnings expectations, driving a sector rally. Strong performance in cloud computing, AI initiatives, and digital advertising has boosted the NASDAQ by over 3%. Management teams provide optimistic guidance despite some economic concerns.",
    sentiment_analysis: {
      overall: "Positive",
      confidence: 90,
      emotions: ["Enthusiasm", "Confidence", "Optimism"],
    },
    chartSymbol: "TOTAL", // Total Crypto Market Cap
    chartExchange: "CRYPTOCAP",
  },
};

export default function FinanceNewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const newsId = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // In a real app, fetch article from API
    const articleData =
      mockFinanceNews[parseInt(newsId) as keyof typeof mockFinanceNews];
    setArticle(articleData);

    // Simulate AI generation delay
    const generatingTimer = setTimeout(() => {
      setIsGenerating(false);
      setShowSummary(true);
    }, 2000);

    return () => clearTimeout(generatingTimer);
  }, [newsId]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Bookmarked!",
      description: isBookmarked
        ? "Article removed from bookmarks"
        : "Article saved to bookmarks",
      duration: 2000,
    });
  };

  const getSentimentStyle = (sentiment: string | undefined) => {
    switch (sentiment) {
      case "positive":
        return {
          bgColor: "bg-white/5",
          borderColor: "border-white/20",
          textColor: "text-white",
          icon: "↑",
        };
      case "negative":
        return {
          bgColor: "bg-white/5",
          borderColor: "border-white/20",
          textColor: "text-white",
          icon: "↓",
        };
      case "neutral":
      default:
        return {
          bgColor: "bg-white/5",
          borderColor: "border-white/20",
          textColor: "text-white",
          icon: "→",
        };
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <BackButton
          onClick={() => router.back()}
          label="Back to Market Finance"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Article Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Article Header */}
            <ArticleHeader
              title={article.title}
              author={article.author}
              source={article.source}
              publishedDate={article.publishedDate}
              category={article.category}
              isBookmarked={isBookmarked}
              onShare={handleShare}
              onBookmark={handleBookmark}
              additionalBadges={
                <>
                  <Badge
                    variant="outline"
                    className="border-zinc-700 text-zinc-400"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {article.publishedAt}
                  </Badge>
                  <div
                    className={`px-3 py-1 rounded-full ${
                      getSentimentStyle(article.sentiment).bgColor
                    } border ${
                      getSentimentStyle(article.sentiment).borderColor
                    } ${
                      getSentimentStyle(article.sentiment).textColor
                    } text-xs font-medium flex items-center gap-1`}
                  >
                    <span className="text-sm">
                      {getSentimentStyle(article.sentiment).icon}
                    </span>
                    <span className="capitalize">{article.sentiment}</span>
                  </div>
                </>
              }
            />

            <div className="text-lg text-gray-400 mb-6">{article.summary}</div>

            {/* Beautiful Chart Card with Gradient Border */}
            <div className="relative p-[2px] pb-1 rounded-xl bg-gradient-to-r from-purple-500 via-gray-400 to-white animate-gradient">
              <Card className="bg-black border-0 rounded-xl overflow-hidden">
                <CardContent className="p-0 bg-gradient-to-br from-zinc-950 via-black to-purple-950/10">
                  {/* Chart Header */}
                  <div className="p-6 pt-2 pb-2 border-b border-zinc-800/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Market Chart
                          </h3>
                          <p className="text-xs text-gray-400">
                            Real-time chart for quick analysis
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TradingView Chart */}
                  <div className="">
                    <TradingViewWidget
                      symbol={article.chartSymbol}
                      exchange={article.chartExchange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Article Content */}
            <ArticleContent content={article.fullContent} />

            {/* Tags */}
            <ArticleTags tags={article.tags} />
          </div>

          {/* Right Side - AI Summary (1/3 width) - Fixed Position */}
          <div className="lg:col-span-1">
            <AIAnalysisCard
              aiSummary={article.aiSummary}
              sentimentAnalysis={article.sentiment_analysis}
              isGenerating={isGenerating}
              showSummary={showSummary}
            />
          </div>
        </div>
      </div>

      {/* AI Chat Button */}
      <ArticleChatButton articleId={newsId} articleTitle={article.title} />

      <Footer />
    </div>
  );
}

// TradingView Widget Component
function TradingViewWidget({
  symbol,
  exchange,
}: {
  symbol: string;
  exchange: string;
}) {
  useEffect(() => {
    // Clear any existing widget
    const container = document.getElementById("tradingview-chart");
    if (container) {
      container.innerHTML = "";
    }

    // Determine the correct symbol format for TradingView
    const tvSymbol = `${exchange}:${symbol}`;

    // Create TradingView widget
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
