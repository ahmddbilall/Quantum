"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StarryBackground from "@/components/ui/starry-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { buildAuthUrl, getCurrentPathWithSearch } from "@/lib/auth-redirect";
import { authService } from "@/services/authService";
import { newsService, apiCache } from "@/services/newsService";
import { parseApiError } from "@/lib/error-parser";
import { BackendUserProfile, NewsArticleSummary } from "@/types";
import { useCryptoSearch, useStockSearch } from "@/components/market-finance";
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

const DEFAULT_CONTENT_PREFERENCES: ContentPreferences = {
  categories: [],
  sources: [],
  updateFrequency: "real-time",
  notifications: {
    breaking: true,
    daily: true,
    weekly: false,
    personalized: true,
  },
  language: "English",
  timezone: "UTC",
};

interface WatchlistItem {
  symbol: string;
  name: string;
  type: "stock" | "crypto";
}

interface WatchlistSuggestion {
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

const MARKET_NEWS_SOURCES = new Set([
  "newsbtc",
  "cryptoslate",
  "ambcrypto",
  "blockonomi",
  "decrypt",
  "cnbc_crypto",
]);

export default function ProfilePage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("preferences");
  const [isSaving, setIsSaving] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "User",
    email: "",
    phone: "",
    location: "",
    bio: "",
    joinDate: "-",
    avatar: "/placeholder-user.jpg",
  });

  const [contentPreferences, setContentPreferences] =
    useState<ContentPreferences>(DEFAULT_CONTENT_PREFERENCES);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistQuery, setWatchlistQuery] = useState("");
  const [savedPreferencesSnapshot, setSavedPreferencesSnapshot] =
    useState<ContentPreferences | null>(null);
  const [savedWatchlistSnapshot, setSavedWatchlistSnapshot] = useState<
    WatchlistItem[]
  >([]);

  const {
    searchResults: stockSearchResults,
    setSearchQuery: setStockSearchQuery,
    isSearching: isSearchingStocks,
  } = useStockSearch();

  const {
    searchResults: cryptoSearchResults,
    setSearchQuery: setCryptoSearchQuery,
    isSearching: isSearchingCrypto,
  } = useCryptoSearch();

  const [bookmarkedArticles, setBookmarkedArticles] = useState<
    BookmarkedArticle[]
  >([]);
  const [pendingBookmarkRemovals, setPendingBookmarkRemovals] = useState<
    Set<string>
  >(new Set());

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  const mapBookmarkedArticle = (
    article: NewsArticleSummary,
  ): BookmarkedArticle => ({
    id: article.id,
    title: article.title,
    summary: article.summary || "No summary available.",
    source: article.source,
    publishedAt: article.published_at || new Date().toISOString(),
    url: article.url,
    category: article.category || "General",
    readTime: "5 min read",
  });

  const toCurrency = (value: number): string => {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    })}`;
  };

  const toSigned = (value: number): string => {
    const fixed = value.toFixed(2);
    return value >= 0 ? `+${fixed}` : fixed;
  };

  const toSignedPercent = (value: number): string => {
    const fixed = value.toFixed(2);
    return value >= 0 ? `+${fixed}%` : `${fixed}%`;
  };

  const mapStockSuggestion = (item: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }): WatchlistSuggestion => ({
    symbol: item.symbol,
    name: item.name,
    type: "stock",
    price: toCurrency(item.price),
    change: toSigned(item.change),
    changePercent: toSignedPercent(item.changePercent),
  });

  const mapCryptoSuggestion = (item: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }): WatchlistSuggestion => ({
    symbol: item.symbol,
    name: item.name,
    type: "crypto",
    price: toCurrency(item.price),
    change: toSigned(item.change),
    changePercent: toSignedPercent(item.changePercent),
  });

  const hasWatchlistItem = (
    symbol: string,
    type: "stock" | "crypto",
    items: WatchlistItem[] = watchlist,
  ) => {
    return items.some(
      (item) =>
        item.symbol.toUpperCase() === symbol.toUpperCase() &&
        item.type === type,
    );
  };

  const stockSuggestions = stockSearchResults
    .map(mapStockSuggestion)
    .filter((item) => !hasWatchlistItem(item.symbol, item.type));

  const cryptoSuggestions = cryptoSearchResults
    .map(mapCryptoSuggestion)
    .filter((item) => !hasWatchlistItem(item.symbol, item.type));

  const isSearchingWatchlist = isSearchingStocks || isSearchingCrypto;
  const hasWatchlistQuery = watchlistQuery.trim().length > 0;
  const hasAnyWatchlistSuggestions =
    stockSuggestions.length > 0 || cryptoSuggestions.length > 0;

  const hasUnsavedPreferenceChanges = useMemo(() => {
    if (!savedPreferencesSnapshot) {
      return false;
    }
    return (
      JSON.stringify(contentPreferences) !==
      JSON.stringify(savedPreferencesSnapshot)
    );
  }, [contentPreferences, savedPreferencesSnapshot]);

  const hasUnsavedWatchlistChanges = useMemo(
    () => JSON.stringify(watchlist) !== JSON.stringify(savedWatchlistSnapshot),
    [watchlist, savedWatchlistSnapshot],
  );

  const hasUnsavedChanges =
    hasUnsavedPreferenceChanges || hasUnsavedWatchlistChanges;

  const stockWatchlistItems = watchlist.filter((item) => item.type === "stock");
  const cryptoWatchlistItems = watchlist.filter(
    (item) => item.type === "crypto",
  );

  const normalizeWatchlist = (value: unknown): WatchlistItem[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const raw = item as Record<string, unknown>;
        const symbol = String(raw.symbol || "")
          .trim()
          .toUpperCase();
        const type = raw.type === "crypto" ? "crypto" : "stock";

        if (!symbol) {
          return null;
        }

        return {
          symbol,
          name: String(raw.name || symbol).trim() || symbol,
          type,
        } as WatchlistItem;
      })
      .filter((item): item is WatchlistItem => item !== null);
  };

  const buildPreferencesPayload = (watchlistOverride?: WatchlistItem[]) => ({
    categories: contentPreferences.categories,
    sources: contentPreferences.sources,
    watchlist: watchlistOverride ?? watchlist,
    updateFrequency: contentPreferences.updateFrequency,
    notifications: contentPreferences.notifications,
    language: contentPreferences.language,
    timezone: contentPreferences.timezone,
  });

  const hydrateProfile = (profile: BackendUserProfile) => {
    const rawProfile = (profile.profile || {}) as Record<string, unknown>;
    const rawPreferences = (profile.preferences || {}) as Record<
      string,
      unknown
    >;
    const notifications = (rawPreferences.notifications || {}) as Record<
      string,
      unknown
    >;
    const normalizedWatchlist = normalizeWatchlist(rawPreferences.watchlist);
    const nextContentPreferences: ContentPreferences = {
      categories: Array.isArray(rawPreferences.categories)
        ? (rawPreferences.categories as string[])
        : DEFAULT_CONTENT_PREFERENCES.categories,
      sources: Array.isArray(rawPreferences.sources)
        ? (rawPreferences.sources as string[])
        : DEFAULT_CONTENT_PREFERENCES.sources,
      updateFrequency: String(
        rawPreferences.updateFrequency ||
          DEFAULT_CONTENT_PREFERENCES.updateFrequency,
      ),
      language: String(
        rawPreferences.language || DEFAULT_CONTENT_PREFERENCES.language,
      ),
      timezone: String(
        rawPreferences.timezone || DEFAULT_CONTENT_PREFERENCES.timezone,
      ),
      notifications: {
        breaking: Boolean(
          notifications.breaking ??
          DEFAULT_CONTENT_PREFERENCES.notifications.breaking,
        ),
        daily: Boolean(
          notifications.daily ??
          DEFAULT_CONTENT_PREFERENCES.notifications.daily,
        ),
        weekly: Boolean(
          notifications.weekly ??
          DEFAULT_CONTENT_PREFERENCES.notifications.weekly,
        ),
        personalized: Boolean(
          notifications.personalized ??
          DEFAULT_CONTENT_PREFERENCES.notifications.personalized,
        ),
      },
    };

    setWatchlist(normalizedWatchlist);
    setSavedWatchlistSnapshot(normalizedWatchlist);

    setUserProfile((prev) => ({
      ...prev,
      name: profile.full_name || user?.name || "User",
      email: profile.email,
      phone: String(rawProfile.phone || ""),
      location: String(rawProfile.location || ""),
      bio: String(rawProfile.bio || ""),
      joinDate: profile.created_at ? formatDate(profile.created_at) : "-",
    }));

    setContentPreferences(nextContentPreferences);
    setSavedPreferencesSnapshot(nextContentPreferences);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(buildAuthUrl(getCurrentPathWithSearch()));
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        return;
      }

      try {
        const [profile, bookmarks, categories, sources] = await Promise.all([
          authService.getProfile(),
          newsService.getBookmarks(),
          newsService.getCategories(),
          newsService.getSources(),
        ]);
        hydrateProfile(profile);
        setBookmarkedArticles(bookmarks.map(mapBookmarkedArticle));
        setAvailableCategories(categories);
        setAvailableSources(sources);
      } catch (error) {
        const parsed = parseApiError(
          error,
          "Some profile data could not be loaded.",
        );
        toast({
          title: "Profile sync warning",
          description: parsed.message,
          variant: "destructive",
        });
      }
    };

    void loadData();
  }, [user]);

  useEffect(() => {
    const query = watchlistQuery.trim();
    setStockSearchQuery(query);
    setCryptoSearchQuery(query);
  }, [watchlistQuery, setStockSearchQuery, setCryptoSearchQuery]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const warningMessage =
      "You have some unsaved changes. Do you want to leave this page?";

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = warningMessage;
    };

    const handleDocumentNavigation = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSamePage =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;

      if (isSamePage) {
        return;
      }

      const shouldLeave = window.confirm(warningMessage);
      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentNavigation, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentNavigation, true);
    };
  }, [hasUnsavedChanges]);

  const handleProfileUpdate = async () => {
    try {
      setIsSaving(true);
      await authService.updateProfile({
        full_name: userProfile.name,
        email: userProfile.email,
        profile: {
          phone: userProfile.phone,
          location: userProfile.location,
          bio: userProfile.bio,
        },
      });
      await refreshProfile();
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved.",
      });
    } catch (error) {
      const parsed = parseApiError(error, "Failed to save profile.");
      toast({
        title: "Failed to save profile",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    try {
      setIsSaving(true);
      const updated = await authService.updateProfile({
        preferences: buildPreferencesPayload(),
      });
      hydrateProfile(updated);
      await refreshProfile();

      apiCache.invalidateAll(); // Flush cached news feeds

      toast({
        title: "Preferences saved",
        description: "Your content preferences were updated.",
      });
    } catch (error) {
      const parsed = parseApiError(error, "Failed to save preferences.");
      toast({
        title: "Failed to save preferences",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
    setContentPreferences((prev) => {
      const lowerSource = source.toLowerCase();
      const exists = prev.sources.some((s) => s.toLowerCase() === lowerSource);
      return {
        ...prev,
        sources: exists
          ? prev.sources.filter((s) => s.toLowerCase() !== lowerSource)
          : [...prev.sources, source],
      };
    });
  };

  const handleNotificationToggle = (
    type: keyof ContentPreferences["notifications"],
  ) => {
    setContentPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const removeFromWatchlist = (symbol: string, type: "stock" | "crypto") => {
    setWatchlist((prev) =>
      prev.filter((item) => !(item.symbol === symbol && item.type === type)),
    );
  };

  const addToWatchlist = (suggestion: WatchlistSuggestion) => {
    if (hasWatchlistItem(suggestion.symbol, suggestion.type)) {
      toast({
        title: "Already added",
        description: `${suggestion.symbol} is already in your watchlist.`,
        variant: "destructive",
      });
      return;
    }

    setWatchlist((prev) => [
      ...prev,
      {
        symbol: suggestion.symbol,
        name: suggestion.name,
        type: suggestion.type,
      },
    ]);
    setWatchlistQuery("");
  };

  const removeBookmark = async (articleId: string) => {
    if (pendingBookmarkRemovals.has(articleId)) {
      return;
    }

    try {
      setPendingBookmarkRemovals((prev) => new Set(prev).add(articleId));
      await newsService.removeBookmark(articleId);
      setBookmarkedArticles((prev) =>
        prev.filter((article) => article.id !== articleId),
      );
      toast({
        title: "Bookmark removed",
        description: "Article removed from bookmarks.",
      });
    } catch (error) {
      const parsed = parseApiError(error, "Failed to remove bookmark.");
      toast({
        title: "Failed to remove bookmark",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setPendingBookmarkRemovals((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    }
  };

  const openArticle = (article: BookmarkedArticle) => {
    if (hasUnsavedChanges) {
      const shouldLeave = window.confirm(
        "You have some unsaved changes. Do you want to leave this page?",
      );

      if (!shouldLeave) {
        return;
      }
    }

    const normalizedSource = (article.source || "").trim().toLowerCase();
    const detailRoute = MARKET_NEWS_SOURCES.has(normalizedSource)
      ? `/market-finance/news/${article.id}`
      : `/news-feed/${article.id}`;

    router.push(detailRoute);
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

  if (!user) {
    return null;
  }

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
                      <span
                        className={
                          userProfile.phone ? "text-gray-300" : "text-gray-500"
                        }
                      >
                        {userProfile.phone || "Add phone number"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span
                        className={
                          userProfile.location
                            ? "text-gray-300"
                            : "text-gray-500"
                        }
                      >
                        {userProfile.location || "Add location"}
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
                    <p
                      className={`text-sm leading-relaxed ${
                        userProfile.bio ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {userProfile.bio || "Add a short bio"}
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
                                contentPreferences.sources.some(
                                  (s) =>
                                    s.toLowerCase() === source.toLowerCase(),
                                )
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handleSourceToggle(source)}
                              className={`justify-start cursor-pointer ${
                                contentPreferences.sources.some(
                                  (s) =>
                                    s.toLowerCase() === source.toLowerCase(),
                                )
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
                        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2 dark-thin-scrollbar">
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
                                      onClick={() => openArticle(article)}
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
                                        onClick={() => openArticle(article)}
                                        className="text-white hover:text-blue-300 hover:bg-blue-900/20 p-0"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Read Article
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={pendingBookmarkRemovals.has(
                                          article.id,
                                        )}
                                        onClick={() =>
                                          removeBookmark(article.id)
                                        }
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-0"
                                      >
                                        <BookmarkX className="h-4 w-4 mr-1" />
                                        {pendingBookmarkRemovals.has(article.id)
                                          ? "Removing..."
                                          : "Remove"}
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
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          <span className="text-white">
                            Financial Watchlist
                          </span>
                        </CardTitle>
                        <p className="text-sm text-gray-400 mt-1">
                          Search and select verified stock/crypto symbols from
                          API results.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6 space-y-3 rounded-xl border border-gray-700 bg-zinc-800/50 p-4">
                          <Label className="text-sm text-gray-300">
                            Add to watchlist
                          </Label>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                              placeholder="Search symbol or name (e.g., AAPL, BTC, Ethereum)"
                              value={watchlistQuery}
                              onChange={(e) =>
                                setWatchlistQuery(e.target.value)
                              }
                              className="pl-10 bg-transparent border-gray-700 text-white"
                            />
                          </div>

                          {hasWatchlistQuery && (
                            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-700 bg-zinc-900/80 pr-1 dark-thin-scrollbar">
                              {isSearchingWatchlist ? (
                                <div className="px-4 py-3 text-sm text-gray-400">
                                  Searching symbols...
                                </div>
                              ) : (
                                <>
                                  {!hasAnyWatchlistSuggestions ? (
                                    <div className="px-4 py-3 text-sm text-gray-400">
                                      No results. Select from the API list only.
                                    </div>
                                  ) : (
                                    <>
                                      {stockSuggestions.length > 0 && (
                                        <div>
                                          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                                            Stocks
                                          </div>
                                          <div className="space-y-1 px-2 pb-2">
                                            {stockSuggestions.map((item) => (
                                              <button
                                                key={`stock-${item.symbol}`}
                                                type="button"
                                                onClick={() =>
                                                  addToWatchlist(item)
                                                }
                                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                                              >
                                                <div>
                                                  <p className="text-sm font-semibold text-white">
                                                    {item.symbol}
                                                  </p>
                                                  <p className="text-xs text-gray-400">
                                                    {item.name}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-sm text-white">
                                                    {item.price}
                                                  </p>
                                                  <p
                                                    className={`text-xs ${
                                                      item.change.startsWith(
                                                        "+",
                                                      )
                                                        ? "text-green-400"
                                                        : item.change.startsWith(
                                                              "-",
                                                            )
                                                          ? "text-red-400"
                                                          : "text-gray-400"
                                                    }`}
                                                  >
                                                    {item.changePercent}
                                                  </p>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {stockSuggestions.length > 0 &&
                                        cryptoSuggestions.length > 0 && (
                                          <Separator className="bg-gray-700" />
                                        )}

                                      {cryptoSuggestions.length > 0 && (
                                        <div>
                                          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-orange-300">
                                            Crypto
                                          </div>
                                          <div className="space-y-1 px-2 pb-2">
                                            {cryptoSuggestions.map((item) => (
                                              <button
                                                key={`crypto-${item.symbol}`}
                                                type="button"
                                                onClick={() =>
                                                  addToWatchlist(item)
                                                }
                                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                                              >
                                                <div>
                                                  <p className="text-sm font-semibold text-white">
                                                    {item.symbol}
                                                  </p>
                                                  <p className="text-xs text-gray-400">
                                                    {item.name}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-sm text-white">
                                                    {item.price}
                                                  </p>
                                                  <p
                                                    className={`text-xs ${
                                                      item.change.startsWith(
                                                        "+",
                                                      )
                                                        ? "text-green-400"
                                                        : item.change.startsWith(
                                                              "-",
                                                            )
                                                          ? "text-red-400"
                                                          : "text-gray-400"
                                                    }`}
                                                  >
                                                    {item.changePercent}
                                                  </p>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {watchlist.length === 0 ? (
                          <div className="text-center py-8">
                            <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">
                              No watchlist items yet
                            </p>
                            <p className="text-sm text-gray-500">
                              Add a stock or crypto symbol to start tracking it.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-gray-700 bg-zinc-800/40 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-blue-400" />
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                                  Stocks
                                </h3>
                                <Badge className="ml-auto bg-zinc-700 text-gray-200">
                                  {stockWatchlistItems.length}
                                </Badge>
                              </div>
                              <div className="max-h-80 space-y-2 overflow-y-auto pr-1 dark-thin-scrollbar">
                                {stockWatchlistItems.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    No stock symbols selected.
                                  </p>
                                ) : (
                                  stockWatchlistItems.map((item) => (
                                    <motion.div
                                      key={`${item.type}:${item.symbol}`}
                                      layout
                                      initial={{ opacity: 0, y: 12 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -12 }}
                                      className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-sm font-semibold text-white">
                                          {item.symbol}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {item.name}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeFromWatchlist(
                                            item.symbol,
                                            item.type,
                                          )
                                        }
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </motion.div>
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-700 bg-zinc-800/40 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <Bitcoin className="h-4 w-4 text-orange-400" />
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-300">
                                  Crypto
                                </h3>
                                <Badge className="ml-auto bg-zinc-700 text-gray-200">
                                  {cryptoWatchlistItems.length}
                                </Badge>
                              </div>
                              <div className="max-h-80 space-y-2 overflow-y-auto pr-1 dark-thin-scrollbar">
                                {cryptoWatchlistItems.length === 0 ? (
                                  <p className="text-sm text-gray-500">
                                    No crypto symbols selected.
                                  </p>
                                ) : (
                                  cryptoWatchlistItems.map((item) => (
                                    <motion.div
                                      key={`${item.type}:${item.symbol}`}
                                      layout
                                      initial={{ opacity: 0, y: 12 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -12 }}
                                      className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-sm font-semibold text-white">
                                          {item.symbol}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {item.name}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeFromWatchlist(
                                            item.symbol,
                                            item.type,
                                          )
                                        }
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </motion.div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
                                  notification.key as keyof ContentPreferences["notifications"],
                                )
                              }
                              className="data-[state=unchecked]:bg-zinc-700 data-[state=unchecked]:border-zinc-500 data-[state=checked]:bg-black "
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
                  onClick={handlePreferencesSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`border-1 px-8 border-white ${
                    hasUnsavedChanges
                      ? "bg-white text-black hover:bg-white/90"
                      : "text-white hover:bg-white hover:text-black bg-transparent"
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving
                    ? "Saving..."
                    : hasUnsavedChanges
                      ? "Save Changes"
                      : "Save Preferences"}
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
              className="border-gray-600 text-gray-900 hover:bg-zinc-800 hover:text-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileUpdate}
              disabled={isSaving}
              className="border-white text-white hover:bg-white hover:text-black bg-transparent"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
