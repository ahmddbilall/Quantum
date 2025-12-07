"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StarryBackground from "@/components/ui/starry-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Settings,
  Bell,
  Heart,
  Bookmark,
  TrendingUp,
  Globe,
  Newspaper,
  DollarSign,
  Bitcoin,
  Edit2,
  Save,
  X,
  Plus,
  Search,
  Star,
  Clock,
  Filter,
  BarChart3,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ExternalLink,
  BookmarkX,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  joinDate: string;
  avatar: string;
}

interface ContentPreferences {
  categories: string[];
  sources: string[];
  updateFrequency: string;
  notifications: {
    breaking: boolean;
    daily: boolean;
    weekly: boolean;
    personalized: boolean;
  };
  language: string;
  timezone: string;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
  price: string;
  change: string;
  changePercent: string;
}

interface BookmarkedArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: string;
  readTime: string;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("preferences");
  const [searchWatchlist, setSearchWatchlist] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user.name,
    email: user.email,
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Passionate news reader and financial market enthusiast. Love staying updated with the latest global events and market trends.",
    joinDate: "January 2024",
    avatar: "/placeholder-user.jpg",
  });

  const [contentPreferences, setContentPreferences] =
    useState<ContentPreferences>({
      categories: ["Technology", "Business", "Politics", "Health"],
      sources: ["BBC", "Reuters", "CNN", "The Guardian"],
      updateFrequency: "real-time",
      notifications: {
        breaking: true,
        daily: true,
        weekly: false,
        personalized: true,
      },
      language: "English",
      timezone: "EST",
    });

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "stock",
      price: "$175.43",
      change: "+2.15",
      changePercent: "+1.24%",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      type: "stock",
      price: "$2,845.32",
      change: "-12.45",
      changePercent: "-0.43%",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      type: "crypto",
      price: "$42,350.00",
      change: "+1,250.00",
      changePercent: "+3.04%",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      type: "crypto",
      price: "$2,450.75",
      change: "+85.25",
      changePercent: "+3.60%",
    },
  ]);

  const [bookmarkedArticles, setBookmarkedArticles] = useState<
    BookmarkedArticle[]
  >([
    {
      id: "1",
      title:
        "Breakthrough in Quantum Computing: New Algorithm Achieves 1000x Speed Improvement",
      summary:
        "Researchers at MIT have developed a revolutionary quantum algorithm that significantly outperforms classical computing methods for optimization problems.",
      source: "TechCrunch",
      publishedAt: "2025-10-10T14:30:00Z",
      url: "/news/quantum-computing-breakthrough",
      category: "Technology",
      readTime: "5 min read",
    },
    {
      id: "2",
      title:
        "Global Climate Summit Reaches Historic Agreement on Carbon Emission Reduction",
      summary:
        "World leaders commit to ambitious new targets for carbon neutrality, with major economic implications for renewable energy markets.",
      source: "BBC",
      publishedAt: "2025-10-09T09:15:00Z",
      url: "/news/climate-summit-agreement",
      category: "Climate",
      readTime: "8 min read",
    },
    {
      id: "3",
      title:
        "Cryptocurrency Market Sees Major Rally as Institutional Adoption Increases",
      summary:
        "Bitcoin and Ethereum surge as major banks announce cryptocurrency trading services for institutional clients.",
      source: "Coindesk",
      publishedAt: "2025-10-08T16:45:00Z",
      url: "/news/crypto-institutional-adoption",
      category: "Cryptocurrency",
      readTime: "6 min read",
    },
    {
      id: "4",
      title:
        "AI Revolution in Healthcare: New Diagnostic Tool Shows 95% Accuracy Rate",
      summary:
        "Machine learning algorithm developed by researchers can detect early-stage diseases with unprecedented accuracy.",
      source: "Reuters",
      publishedAt: "2025-10-07T11:20:00Z",
      url: "/news/ai-healthcare-diagnostics",
      category: "Health",
      readTime: "7 min read",
    },
  ]);

  const availableCategories = [
    "Technology",
    "Business",
    "Politics",
    "Health",
    "Sports",
    "Science",
    "Entertainment",
    "World News",
    "Climate",
    "Cryptocurrency",
    "AI & ML",
  ];

  const availableSources = [
    "BBC",
    "Reuters",
    "CNN",
    "The Guardian",
    "Al Jazeera",
    "Associated Press",
    "NPR",
    "Financial Times",
    "Bloomberg",
    "TechCrunch",
    "Coindesk",
  ];

  const handleProfileUpdate = () => {
    setIsEditingProfile(false);
    // Here you would typically save to backend
  };

  const handleCategoryToggle = (category: string) => {
    setContentPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSourceToggle = (source: string) => {
    setContentPreferences((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  };

  const handleNotificationToggle = (
    type: keyof ContentPreferences["notifications"]
  ) => {
    setContentPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const addToWatchlist = () => {
    // This would typically open a search dialog
    // For demo, adding a sample item
    const newItem: WatchlistItem = {
      symbol: "TSLA",
      name: "Tesla Inc.",
      type: "stock",
      price: "$245.67",
      change: "+5.43",
      changePercent: "+2.26%",
    };
    setWatchlist((prev) => [...prev, newItem]);
  };

  const removeBookmark = (articleId: string) => {
    setBookmarkedArticles((prev) =>
      prev.filter((article) => article.id !== articleId)
    );
  };

  const openArticle = (url: string) => {
    // In a real app, this would navigate to the article
    window.open(url, "_blank");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Profile & Preferences
            </h1>
            <p className="text-gray-300 text-xl">
              Customize your news experience and manage your personal
              information
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Profile Card Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="bg-zinc-900 border border-gray-700">
                <CardHeader className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {userProfile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-black border-gray-600 text-gray-300 hover:bg-zinc-800 cursor-pointer"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardTitle className="mt-4 text-white">
                    {userProfile.name}
                  </CardTitle>
                  <p className="text-sm text-gray-400">{userProfile.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-300">{userProfile.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-300">
                        {userProfile.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-300">
                        Joined {userProfile.joinDate}
                      </span>
                    </div>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {userProfile.bio}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {/* <Card className="bg-zinc-900 border border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Activity Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Articles Read</span>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-gray-300"
                    >
                      1,247
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Bookmarks</span>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-gray-300"
                    >
                      89
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Watchlist Items
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-gray-300"
                    >
                      {watchlist.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Days Active</span>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-gray-300"
                    >
                      127
                    </Badge>
                  </div>
                </CardContent>
              </Card> */}
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-3"
            >
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-zinc-900 p-1 rounded-xl border border-gray-700">
                {[
                  {
                    id: "preferences",
                    label: "Content Preferences",
                    icon: Settings,
                  },
                  {
                    id: "bookmarks",
                    label: "Bookmarked Articles",
                    icon: Bookmark,
                  },
                  { id: "watchlist", label: "Watchlist", icon: Star },
                  { id: "notifications", label: "Notifications", icon: Bell },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    variants={tabVariants}
                    animate={activeTab === tab.id ? "active" : "inactive"}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-zinc-800 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "preferences" && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* News Categories */}
                    <Card className="bg-zinc-900 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Newspaper className="h-5 w-5 text-blue-400" />
                          <span className="text-white">Content Categories</span>
                        </CardTitle>
                        <p className="text-sm text-gray-400">
                          Select the news categories you're interested in
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availableCategories.map((category) => (
                            <Button
                              key={category}
                              variant={
                                contentPreferences.categories.includes(category)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handleCategoryToggle(category)}
                              className={`justify-start cursor-pointer ${
                                contentPreferences.categories.includes(category)
                                  ? "bg-white text-black hover:bg-white/80"
                                  : "bg-transparent border-white text-white hover:bg-white hover:text-black"
                              }`}
                            >
                              {category}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* News Sources */}
                    <Card className="bg-zinc-900 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Globe className="h-5 w-5 text-green-400" />
                          <span className="text-white">Preferred Sources</span>
                        </CardTitle>
                        <p className="text-sm text-gray-400">
                          Choose your trusted news sources
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availableSources.map((source) => (
                            <Button
                              key={source}
                              variant={
                                contentPreferences.sources.includes(source)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handleSourceToggle(source)}
                              className={`justify-start cursor-pointer ${
                                contentPreferences.sources.includes(source)
                                  ? "bg-white text-black hover:bg-white/80"
                                  : "bg-transparent border-white text-white hover:bg-white hover:text-black"
                              }`}
                            >
                              {source}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* General Settings */}
                    {/* <Card className="bg-zinc-900 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Settings className="h-5 w-5 text-purple-400" />
                          <span className="text-white">General Settings</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="update-frequency"
                              className="text-gray-300"
                            >
                              Update Frequency
                            </Label>
                            <Select
                              value={contentPreferences.updateFrequency}
                              onValueChange={(value) =>
                                setContentPreferences((prev) => ({
                                  ...prev,
                                  updateFrequency: value,
                                }))
                              }
                            >
                              <SelectTrigger className="bg-transparent border-gray-700 text-white hover:bg-zinc-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-gray-600">
                                <SelectItem value="real-time">
                                  Real-time
                                </SelectItem>
                                <SelectItem value="hourly">
                                  Every Hour
                                </SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="language" className="text-gray-300">
                              Language
                            </Label>
                            <Select
                              value={contentPreferences.language}
                              onValueChange={(value) =>
                                setContentPreferences((prev) => ({
                                  ...prev,
                                  language: value,
                                }))
                              }
                            >
                              <SelectTrigger className="bg-transparent border-gray-700 text-white hover:bg-zinc-800">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Spanish">Spanish</SelectItem>
                                <SelectItem value="French">French</SelectItem>
                                <SelectItem value="German">German</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card> */}
                  </motion.div>
                )}

                {activeTab === "bookmarks" && (
                  <motion.div
                    key="bookmarks"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <Card className="bg-zinc-900 border border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <Bookmark className="h-5 w-5 text-purple-400" />
                              <span className="text-white">
                                Bookmarked Articles
                              </span>
                            </CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                              Articles you've saved for later reading
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-zinc-800 text-gray-300"
                          >
                            {bookmarkedArticles.length} articles
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {bookmarkedArticles.length === 0 ? (
                            <div className="text-center py-8">
                              <Bookmark className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                              <p className="text-gray-400">
                                No bookmarked articles yet
                              </p>
                              <p className="text-sm text-gray-500">
                                Articles you bookmark will appear here
                              </p>
                            </div>
                          ) : (
                            bookmarkedArticles.map((article) => (
                              <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-4 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors"
                              >
                                <div className="flex items-start justify-between space-x-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-gray-600 text-gray-300"
                                      >
                                        {article.category}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {article.source}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        •
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(article.publishedAt)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        •
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {article.readTime}
                                      </span>
                                    </div>
                                    <h3
                                      className="font-semibold text-white hover:text-blue-400 cursor-pointer transition-colors"
                                      onClick={() => openArticle(article.url)}
                                    >
                                      {article.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                      {article.summary}
                                    </p>
                                    <div className="flex items-center space-x-4 pt-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openArticle(article.url)}
                                        className="text-white hover:text-blue-300 hover:bg-blue-900/20 p-0"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Read Article
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeBookmark(article.id)
                                        }
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-0"
                                      >
                                        <BookmarkX className="h-4 w-4 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "watchlist" && (
                  <motion.div
                    key="watchlist"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <Card className="bg-zinc-900 border border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <TrendingUp className="h-5 w-5 text-green-400" />
                              <span className="text-white">
                                Financial Watchlist
                              </span>
                            </CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                              Track your favorite stocks and cryptocurrencies
                            </p>
                          </div>
                          <Button
                            onClick={addToWatchlist}
                            size="sm"
                            className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {watchlist.map((item) => (
                            <motion.div
                              key={item.symbol}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`p-2 rounded-lg ${
                                    item.type === "stock"
                                      ? "bg-blue-900/20"
                                      : "bg-orange-900/20"
                                  }`}
                                >
                                  {item.type === "stock" ? (
                                    <DollarSign className="h-4 w-4 text-blue-400" />
                                  ) : (
                                    <Bitcoin className="h-4 w-4 text-orange-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">
                                    {item.symbol}
                                  </h4>
                                  <p className="text-sm text-gray-400">
                                    {item.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="font-semibold text-white">
                                    {item.price}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      item.change.startsWith("+")
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {item.change} ({item.changePercent})
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFromWatchlist(item.symbol)
                                  }
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <Card className="bg-zinc-900 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Bell className="h-5 w-5 text-yellow-400" />
                          <span className="text-white">
                            Notification Preferences
                          </span>
                        </CardTitle>
                        <p className="text-sm text-gray-400">
                          Control how and when you receive notifications
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {[
                          {
                            key: "breaking",
                            label: "Breaking News Alerts",
                            description:
                              "Get notified immediately for urgent news",
                          },
                          {
                            key: "daily",
                            label: "Daily Summary",
                            description:
                              "Receive a daily digest of top stories",
                          },
                          {
                            key: "weekly",
                            label: "Weekly Newsletter",
                            description: "Weekly roundup of important news",
                          },
                          {
                            key: "personalized",
                            label: "Personalized Recommendations",
                            description:
                              "Get news suggestions based on your interests",
                          },
                        ].map((notification) => (
                          <div
                            key={notification.key}
                            className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                          >
                            <div className="space-y-1">
                              <h4 className="font-medium text-white">
                                {notification.label}
                              </h4>
                              <p className="text-sm text-gray-400">
                                {notification.description}
                              </p>
                            </div>
                            <Switch
                              checked={
                                contentPreferences.notifications[
                                  notification.key as keyof ContentPreferences["notifications"]
                                ]
                              }
                              onCheckedChange={() =>
                                handleNotificationToggle(
                                  notification.key as keyof ContentPreferences["notifications"]
                                )
                              }
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex justify-end mt-8"
              >
                <Button
                  size="lg"
                  className="border-1 text-white hover:bg-white hover:text-black bg-transparent px-8 border-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to your profile information here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-gray-300">
                Name
              </Label>
              <Input
                id="name"
                value={userProfile.name}
                onChange={(e) =>
                  setUserProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="col-span-3 bg-transparent border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                value={userProfile.email}
                onChange={(e) =>
                  setUserProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                className="col-span-3 bg-transparent border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right text-gray-300">
                Phone
              </Label>
              <Input
                id="phone"
                value={userProfile.phone}
                onChange={(e) =>
                  setUserProfile((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="col-span-3 bg-transparent border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right text-gray-300">
                Location
              </Label>
              <Input
                id="location"
                value={userProfile.location}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="col-span-3 bg-transparent border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right text-gray-300">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={userProfile.bio}
                onChange={(e) =>
                  setUserProfile((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="col-span-3 bg-transparent border-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(false)}
              className="border-gray-600 text-gray-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileUpdate}
              className="border-white text-white hover:bg-white hover:text-black bg-transparent"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
