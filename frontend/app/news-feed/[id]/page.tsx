"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Share2,
  BookmarkPlus,
  MessageCircle,
  Send,
  X,
  Bot,
  TrendingUp,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      "NASA's latest mission has revealed surprising findings about distant galaxies.",
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
      "NASA's James Webb Space Telescope has discovered unexpectedly massive and complex ancient galaxies that challenge current theories about cosmic evolution and early universe formation.",
    sentiment: {
      overall: "Positive",
      confidence: 85,
      emotions: ["Wonder", "Curiosity", "Amazement"],
    },
  },
  // Add more articles as needed
};

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function NewsDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const [article, setArticle] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "Hello! I'm your AI assistant. I can help you understand this news article better, answer questions about it, or discuss its implications. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // In a real app, fetch article from API
    const articleData =
      mockNewsData[parseInt(articleId) as keyof typeof mockNewsData];
    setArticle(articleData);
  }, [articleId]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: generateAIResponse(currentMessage, article),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (message: string, article: any): string => {
    // Mock AI responses - in real app, this would call an AI API
    const responses = [
      `Based on the article about ${article?.title}, I can tell you that this breakthrough represents a significant advancement in AI reasoning capabilities. The key innovation is moving beyond pattern matching to genuine logical deduction.`,
      `This news about ReasonAI has several important implications. For healthcare, it could revolutionize diagnostic processes. For finance, it offers new approaches to risk assessment. What specific aspect interests you most?`,
      `The ethical considerations mentioned in the article are crucial. The researchers are taking a responsible approach by implementing safety measures and working with ethicists. This shows the importance of developing AI with human values in mind.`,
      `The sentiment of this article is quite positive, reflecting excitement about technological progress while maintaining awareness of responsible development. Would you like me to explain any specific technical aspects?`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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
      <Navbar showSearch={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white hover:bg-zinc-800 p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News Feed
          </Button>
        </div>

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-indigo-600 text-white">
              {article.category}
            </Badge>
            {article.trending && (
              <Badge className="bg-red-600 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {article.readTime}
            </Badge>
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
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {article.views.toLocaleString()} views
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <BookmarkPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Article Image */}
          <div className="aspect-video rounded-2xl overflow-hidden mb-8">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* AI Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI Summary */}
          <Card className="bg-zinc-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm leading-relaxed">
                {article.aiSummary}
              </p>
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card className="bg-zinc-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" />
                Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Overall:</span>
                <Badge
                  className={`${
                    article.sentiment.overall === "Positive"
                      ? "bg-green-600"
                      : article.sentiment.overall === "Negative"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  } text-white`}
                >
                  {article.sentiment.overall}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Confidence:</span>
                <span className="text-white font-medium">
                  {article.sentiment.confidence}%
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-300 text-sm">Emotions:</span>
                <div className="flex flex-wrap gap-1">
                  {article.sentiment.emotions.map((emotion: string) => (
                    <Badge
                      key={emotion}
                      variant="outline"
                      className="text-xs border-gray-600 text-gray-300"
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-zinc-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Reading Time:</span>
                <span className="text-white font-medium">
                  {article.readTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Published:</span>
                <span className="text-white font-medium">
                  {article.publishedAt}
                </span>
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

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-white hover:bg-indigo-700 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl border border-gray-700 w-full max-w-2xl h-[600px] flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      AI Assistant
                    </h3>
                    <p className="text-sm text-gray-400">
                      Discuss this article
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.type === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-800 text-gray-200"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(message.timestamp, "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-6 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask about this article..."
                    className="flex-1 bg-zinc-800 border-gray-600 text-white placeholder-gray-400"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
