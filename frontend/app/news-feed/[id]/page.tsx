"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Share2,
  BookmarkPlus,
  Bookmark,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleChatButton } from "@/components/aichat";
import { ResponseStream } from "@/components/ui/response-stream";
import { GeneratingText } from "@/components/ui/generating-text";
import { useToast } from "@/hooks/use-toast";

// Mock news data - in real app, this would come from an API
const mockNewsData = {
  1: {
    id: 1,
    title: "Breaking: Major AI Breakthrough Announced",
    summary:
      "Researchers have developed a new AI model that shows unprecedented capabilities in understanding and reasoning.",
    fullContent: `
      <h2>Revolutionary AI Model Changes the Landscape</h2>
      <p>In a groundbreaking announcement that has sent shockwaves through the tech industry, researchers at leading AI laboratories have unveiled a new artificial intelligence model that demonstrates unprecedented capabilities in understanding, reasoning, and problem-solving.</p>
      
      <h3>Key Breakthrough Features</h3>
      <p>The new model, dubbed "ReasonAI," represents a significant leap forward in artificial intelligence technology. Unlike previous models that relied heavily on pattern matching and statistical correlations, ReasonAI demonstrates genuine reasoning capabilities that mirror human cognitive processes.</p>
      
      <p>Dr. Sarah Chen, lead researcher on the project, explained: "What we're seeing is not just improved performance on benchmarks, but actual reasoning. The model can break down complex problems, consider multiple approaches, and arrive at solutions through logical deduction."</p>
      
      <h3>Implications for Industry</h3>
      <p>The implications of this breakthrough extend far beyond academic research. Industries ranging from healthcare to finance are already exploring how ReasonAI could revolutionize their operations.</p>
      
      <p>In healthcare, the model's ability to reason through complex medical cases could assist doctors in diagnosis and treatment planning. Financial institutions see potential applications in risk assessment and fraud detection, where the model's reasoning capabilities could identify subtle patterns that traditional systems miss.</p>
      
      <h3>Ethical Considerations</h3>
      <p>With great power comes great responsibility, and the research team is acutely aware of the ethical implications of their work. They have implemented robust safety measures and are working closely with ethicists and policymakers to ensure responsible deployment.</p>
      
      <p>"We're not just building technology for technology's sake," noted Dr. Chen. "Our goal is to create AI that augments human capabilities while maintaining human values and ensuring beneficial outcomes for society."</p>
      
      <h3>Looking Forward</h3>
      <p>The research team plans to gradually release access to ReasonAI through controlled partnerships with selected institutions. This phased approach will allow for careful monitoring and refinement of the technology before broader deployment.</p>
      
      <p>As we stand on the brink of this new era in artificial intelligence, one thing is clear: the future of AI is not just about processing power or data volume, but about genuine understanding and reasoning. ReasonAI represents a significant step toward that future.</p>
    `,
    category: "Technology",
    source: "TechCrunch",
    author: "Alex Johnson",
    publishedAt: "2 hours ago",
    publishedDate: new Date(2025, 7, 30, 10, 0),
    views: 1234,
    image: "/technology-innovation.png",
    tags: ["AI", "Technology", "Research", "Innovation"],
    trending: true,
    readTime: "8 min read",
    aiSummary:
      "Researchers have developed 'ReasonAI', a breakthrough AI model that demonstrates genuine reasoning capabilities rather than just pattern matching. The technology shows potential applications across healthcare, finance, and other industries, with careful consideration of ethical implications and a phased deployment approach.",
    sentiment: {
      overall: "Positive",
      confidence: 92,
      emotions: ["Excitement", "Optimism", "Innovation"],
    },
  },
  2: {
    id: 2,
    title: "Global Climate Summit Reaches Historic Agreement",
    summary:
      "World leaders have committed to ambitious new targets for carbon emission reduction.",
    fullContent: `
      <h2>Historic Climate Agreement Reached</h2>
      <p>In a momentous development for global environmental policy, world leaders at the Global Climate Summit have reached a historic agreement on carbon emission reduction targets that experts are calling the most ambitious climate action plan ever conceived.</p>
      
      <h3>Key Commitments</h3>
      <p>The agreement includes commitments from 195 countries to reduce carbon emissions by 50% by 2030 and achieve net-zero emissions by 2045, five years ahead of previous targets. The deal also includes substantial financial commitments to support developing nations in their transition to clean energy.</p>
      
      <h3>Implementation Strategy</h3>
      <p>The summit outlined a comprehensive implementation strategy that includes regular monitoring, reporting, and verification mechanisms. Countries will be required to submit annual progress reports and face potential sanctions for failing to meet interim targets.</p>
      
      <h3>Economic Implications</h3>
      <p>While the agreement represents a significant step forward for environmental protection, it also has major economic implications. Industries will need to rapidly adapt to new regulations, creating both challenges and opportunities for innovation and job creation in the green economy.</p>
    `,
    category: "Environment",
    source: "BBC News",
    author: "Maria Santos",
    publishedAt: "4 hours ago",
    publishedDate: new Date(2025, 7, 30, 8, 0),
    views: 856,
    image: "/environment-climate.png",
    tags: ["Climate", "Environment", "Politics", "Global"],
    trending: false,
    readTime: "6 min read",
    aiSummary:
      "195 countries have agreed to reduce carbon emissions by 50% by 2030 and achieve net-zero by 2045. The agreement includes financial support for developing nations and comprehensive monitoring mechanisms.",
    sentiment: {
      overall: "Positive",
      confidence: 88,
      emotions: ["Hope", "Determination", "Unity"],
    },
  },
  3: {
    id: 3,
    title: "Space Exploration Makes New Discovery",
    summary:
      "NASA's latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies. latest mission has revealed surprising findings about distant galaxies.",
    fullContent: `
      <h2>Revolutionary Space Discovery</h2>
      <p>NASA's latest deep space mission has yielded extraordinary findings that are reshaping our understanding of the universe. The James Webb Space Telescope has captured unprecedented images of distant galaxies, revealing structures and phenomena that challenge current astronomical theories.</p>
      
      <h3>The Discovery</h3>
      <p>The telescope has identified galaxies that appear to be far more massive and complex than previously thought possible for their age. These ancient cosmic structures suggest that galaxy formation in the early universe occurred much more rapidly than current models predict.</p>
      
      <h3>Scientific Implications</h3>
      <p>Dr. Michael Rodriguez, lead astronomer on the project, explains: "These findings fundamentally challenge our understanding of cosmic evolution. We're seeing galaxies that shouldn't exist according to our current models, which means we need to revise our theories about how the universe formed and evolved."</p>
      
      <h3>Future Research</h3>
      <p>The discovery opens new avenues for research and may lead to breakthrough insights about dark matter, cosmic inflation, and the fundamental forces that shape our universe.</p>
    `,
    category: "Science",
    source: "Space.com",
    author: "Dr. Emily Parker",
    publishedAt: "6 hours ago",
    publishedDate: new Date(2025, 7, 30, 6, 0),
    views: 642,
    image: "/technology-innovation.png",
    tags: ["Space", "NASA", "Discovery", "Science"],
    trending: false,
    readTime: "5 min read",
    aiSummary:
      "NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation. NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation",
    sentiment: {
      overall: "Positive",
      confidence: 85,
      emotions: ["Wonder", "Curiosity", "Amazement"],
    },
  },
  // Add more articles as needed
};

export default function NewsDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const { toast } = useToast();
  const [article, setArticle] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // In a real app, fetch article from API
    const articleData =
      mockNewsData[parseInt(articleId) as keyof typeof mockNewsData];
    setArticle(articleData);

    // Simulate AI generation delay
    const generatingTimer = setTimeout(() => {
      setIsGenerating(false);
      setShowSummary(true);
    }, 2000); // Show "generating" for 2 seconds

    return () => clearTimeout(generatingTimer);
  }, [articleId]);

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-gray-400  hover:text-white hover:bg-zinc-800 p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News Feed
          </Button>
        </div>

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="border-gray-600 text-gray-300">
              {article.category}
            </Badge>
            {/* {article.trending && (
              <Badge className="bg-red-600 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )} */}
            {/* <Badge variant="outline" className="border-gray-600 text-gray-300">
              {article.readTime}
            </Badge> */}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {article.author} • {article.source}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(article.publishedDate, "MMMM dd, yyyy 'at' HH:mm")}
              </span>
              {/* <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {article.views.toLocaleString()} views
              </span> */}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleBookmark}>
                {isBookmarked ? (
                  <Bookmark className="h-4 w-4 fill-current" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* AI Features Section */}
        <div className="relative mb-8 p-[2px] rounded-xl bg-gradient-to-r from-purple-800 via-purple-800 to-white animate-gradient ">
          <Card className="bg-black border-0 rounded-xl overflow-hidden">
            <CardContent className="px-6 py-0 bg-gradient-to-br from-black via-zinc-950 to-purple-950/10">
              {/* Header with Sentiment */}
              <div className="flex items-center justify-between py-4 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  {/* <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div> */}
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      AI Summary
                    </h3>
                    <p className="text-xs text-gray-400">
                      Powered by <span className="font-oxanium">Quantum</span>{" "}
                      AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Sentiment:</span>
                  <span
                    className={`text-sm font-semibold ${
                      article.sentiment.overall === "Positive"
                        ? "text-green-400"
                        : article.sentiment.overall === "Negative"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {article.sentiment.overall} ({article.sentiment.confidence}
                    %)
                  </span>
                </div>
              </div>

              {/* Summary Content */}
              <div className="py-4">
                {isGenerating && (
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <GeneratingText text="Quantum is generating summary..." />
                  </div>
                )}

                {showSummary && (
                  <div className="relative">
                    <div
                      className={`text-gray-200 leading-relaxed text-[15px] ${
                        !isExpanded ? "line-clamp-4" : ""
                      }`}
                    >
                      <ResponseStream
                        textStream={article.aiSummary}
                        mode="typewriter"
                        speed={50}
                        className="inline"
                      />
                    </div>

                    {article.aiSummary.length > 180 && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200 group"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show Less</span>
                            <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                          </>
                        ) : (
                          <>
                            <span>Read More</span>
                            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Article Content */}
        <Card className="bg-zinc-900 border-gray-700 mb-8">
          <CardContent className="p-8">
            <div
              className="prose prose-invert prose-lg max-w-none text-white"
              dangerouslySetInnerHTML={{ __html: article.fullContent }}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-zinc-800 border-gray-600 text-gray-300 hover:bg-zinc-700 cursor-pointer"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat Component */}
      <ArticleChatButton articleId={articleId} articleTitle={article.title} />

      <Footer />
    </div>
  );
}
