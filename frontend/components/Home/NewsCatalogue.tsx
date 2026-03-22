"use client";

import { motion } from "motion/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, TrendingUp } from "lucide-react";
import StarryBackground from "@/components/ui/starry-background";
import { newsService } from "@/services/newsService";
import { NewsArticleSummary } from "@/types";
import Link from "next/link";

const NewsCatalogue = () => {
  return (
    <>
      {/* Desktop Version */}
      <section className="bg-black hidden lg:block">
        <LatestNewsSection />
      </section>

      {/* Mobile/Tablet Version - Simple latest news only */}
      <section className="lg:hidden bg-black py-16">
        <MobileLatestNewsSection />
      </section>
    </>
  );
};

export default NewsCatalogue;

const LatestNewsSection = () => {
  const [newsList, setNewsList] = React.useState<NewsArticleSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchNews() {
      try {
        const data = await newsService.getFeaturedNews(3);
        setNewsList(data);
      } catch (err) {
        console.error("Failed to fetch featured news", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 w-full overflow-hidden bg-black">
      {/* Starry background - consistent with testimonial section */}
      <StarryBackground starCount={80} opacity={0.3} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Latest News
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Stay updated with the most recent stories shaping our world today
          </p>
        </div>

        {/* Responsive Grid Layout */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsList.map((news, index) => (
              <div key={news.id} className="flex">
                {/* Mobile: No animation */}
                <div className="md:hidden w-full">
                  <Link href={`/news-feed/${news.id}`}>
                    <Card
                      className="flex flex-col h-full bg-zinc-900 border border-gray-700 pt-0 py-0 pb-4 hover:bg-gray-700/50 
                    transition-all duration-500 cursor-pointer hover:border-white/50 group backdrop-blur-sm overflow-hidden rounded-2xl"
                    >
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <img
                            src={news.image_url || "/placeholder.svg"}
                            alt={news.title}
                            className="w-full h-48 md:h-56 lg:h-64 object-cover group-hover:scale-110 
                            transition-transform duration-700 "
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-black/80 text-orange-400 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-orange-500/30">
                              <TrendingUp className="w-3 h-3" /> FEATURED
                            </span>
                            <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                              {news.category || "General"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 md:p-5 lg:p-6">
                          <h3 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300 line-clamp-2">
                            {news.title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                            {news.summary}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Tablet and Desktop: With animation */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  viewport={{ once: true }}
                  className="hidden md:flex w-full"
                >
                  <Link href={`/news-feed/${news.id}`} className="w-full">
                    <Card
                      className="flex flex-col h-full bg-zinc-900 border border-gray-700 pt-0 py-0 pb-4 hover:bg-gray-700/50 
                    transition-all duration-500 cursor-pointer hover:border-white/50 group backdrop-blur-sm overflow-hidden rounded-2xl"
                    >
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative overflow-hidden shrink-0">
                          <img
                            src={news.image_url || "/placeholder.svg"}
                            alt={news.title}
                            className="w-full h-48 md:h-56 lg:h-64 object-cover group-hover:scale-110 
                            transition-transform duration-700 "
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-black/80 text-orange-400 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-orange-500/30">
                              <TrendingUp className="w-3 h-3" /> FEATURED
                            </span>
                            <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                              {news.category || "General"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 md:p-5 lg:p-6 flex-1 flex flex-col">
                          <h3 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300 line-clamp-2">
                            {news.title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1">
                            {news.summary}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            Stay tuned for the latest news updates.
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/news-feed">
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white cursor-pointer hover:bg-white hover:text-black transition-all duration-300 bg-transparent group"
            >
              Explore All Latest Stories
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const MobileLatestNewsSection = () => {
  const [newsList, setNewsList] = React.useState<NewsArticleSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchNews() {
      try {
        const data = await newsService.getFeaturedNews(4);
        setNewsList(data);
      } catch (err) {
        console.error("Failed to fetch featured news", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <section className="px-4 sm:px-6 w-full ">
      <StarryBackground starCount={80} opacity={0.3} />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Latest News
            </h2>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Stay updated with the most recent stories shaping our world today
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {newsList.map((news) => (
              <div key={news.id} className="flex">
                <Link href={`/news-feed/${news.id}`} className="w-full">
                  <Card className="flex flex-col h-full bg-zinc-900 border border-white/10 cursor-pointer overflow-hidden rounded-xl">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative overflow-hidden shrink-0">
                        <img
                          src={news.image_url || "/placeholder.svg"}
                          alt={news.title}
                          className="w-full h-48 sm:h-52 object-cover"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-black/80 text-orange-400 px-2 py-1 flex items-center gap-1 border border-orange-500/30 rounded-full text-xs">
                            <TrendingUp className="w-3 h-3" /> FEATURED
                          </span>
                          <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                            {news.category || "General"}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">
                          {news.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-2 flex-1">
                          {news.summary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            Stay tuned for the latest news updates.
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/news-feed">
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-black transition-all duration-300 bg-transparent"
            >
              Explore All Latest Stories
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
