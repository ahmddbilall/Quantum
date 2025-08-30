"use client";

import { motion, MotionValue, useScroll, useTransform } from "motion/react";
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  TrendingUp,
  Clock,
  Globe,
  Star,
  DollarSign,
} from "lucide-react";
import StarryBackground from "@/components/ui/starry-background";

const NewsCatalogue = () => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={container} className="relative h-[200vh] bg-black">
      <Section1 scrollYProgress={scrollYProgress} />
      <Section2 scrollYProgress={scrollYProgress} />
    </section>
  );
};

export default NewsCatalogue;

interface SectionProps {
  scrollYProgress: MotionValue<number>;
}

const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6],
    [0, -0.3, -0.6, -0.8]
  );

  return (
    <motion.section
      style={{ scale, rotate }}
      className="sticky top-0 h-screen flex flex-col items-center justify-center bg-black"
    >
      <LatestNewsSection />
    </motion.section>
  );
};

const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const rotate = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6],
    [0.8, 0.6, 0.3, 0]
  );

  return (
    <motion.section
      style={{ scale, rotate }}
      className="relative h-screen bg-black"
    >
      <FinanceNewsSection />
    </motion.section>
  );
};

const LatestNewsSection = () => {
  const latestNews = [
    {
      image: "/technology-innovation.png",
      headline: "AI Revolution: How Machine Learning is Reshaping Industries",
      snippet:
        "From healthcare to finance, artificial intelligence is transforming...",
      category: "Technology",
      trending: true,
    },
    {
      image: "/business-finance.png",
      headline: "Global Markets React to Economic Policy Changes",
      snippet:
        "Major indices show significant movement following central bank announcements...",
      category: "Finance",
      trending: true,
    },
    {
      image: "/health-medical-research.png",
      headline: "Breakthrough in Cancer Research Offers New Hope",
      snippet:
        "Revolutionary treatment shows promising results in clinical trials...",
      category: "Health",
      trending: true,
    },
  ];

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 w-full overflow-hidden bg-black">
      {/* Starry background - consistent with testimonial section */}
      <StarryBackground starCount={80} opacity={0.3} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              📰 Latest News
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Stay updated with the most recent stories shaping our world today
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {latestNews.map((news, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="flex"
            >
              <Card
                className="flex flex-col h-full bg-zinc-900 border border-white/10 border-gray-700 pt-0 py-0 pb-4 hover:bg-gray-700/50 
              transition-all duration-500 cursor-pointer hover:border-white/50 group backdrop-blur-sm overflow-hidden rounded-2xl"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <img
                      src={news.image || "/placeholder.svg"}
                      alt={news.headline}
                      className="w-full h-64 object-cover group-hover:scale-110 
                      transition-transform duration-700 "
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs  flex items-center gap-1">
                        {/* <Star className="h-3 w-3" /> */}
                        LATEST
                      </span>
                      <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                        {news.category}
                      </span>
                    </div>
                    {/* <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {news.readTime}
                    </div> */}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300">
                      {news.headline}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {news.snippet}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            className="border-white text-white cursor-pointer hover:bg-white hover:text-black transition-all duration-300 bg-transparent group"
          >
            Explore All Latest Stories
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </div>
    </section>
  );
};

const FinanceNewsSection = () => {
  const financeNews = [
    {
      image: "/business-finance.png",
      headline: "Federal Reserve Announces Key Interest Rate Decision",
      snippet:
        "Central bank maintains current rates amid inflation concerns and economic uncertainty...",
      category: "Monetary Policy",
      author: "Michael Thompson",
      publishTime: "1 hour ago",
      featured: true,
    },
    {
      image: "/business-finance.png",
      headline: "Stock Market Reaches Record Highs on Tech Surge",
      snippet:
        "Major indices climb as technology sector leads broad-based rally across markets...",
      category: "Stock Market",
      author: "Sarah Davis",
      publishTime: "3 hours ago",
      featured: true,
    },
    {
      image: "/business-finance.png",
      headline: "Cryptocurrency Regulation Framework Finalized",
      snippet:
        "New guidelines provide clarity for digital asset exchanges and institutional investors...",
      category: "Cryptocurrency",
      author: "James Wilson",
      publishTime: "5 hours ago",
      featured: true,
    },
    {
      image: "/business-finance.png",
      headline: "Global Banking Sector Reports Strong Q4 Earnings",
      snippet:
        "Major financial institutions exceed expectations driven by increased lending activity...",
      category: "Banking",
      author: "Lisa Martinez",
      publishTime: "7 hours ago",
      featured: true,
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 w-full h-full flex items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <StarryBackground starCount={80} opacity={0.3} />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-8 w-8 text-white" />
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Finance News
              </h2>
            </div>
            <p className="text-xl text-gray-400">
              Stay informed with the latest financial market developments
            </p>
          </div>
          <Button
            variant="ghost"
            className="hidden md:flex text-white hover:text-black group cursor-pointer"
          >
            View All Finance News
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {financeNews.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="group flex relative z-20"
            >
              <Card
                className="bg-zinc-900 py-0 to-gray-800 border-gray-700 
              hover:border-white/50 transition-all duration-500 
              cursor-pointer overflow-hidden hover:bg-gray-700/50 flex-1"
              >
                <CardContent className="p-0 h-full">
                  <div className="md:flex h-full">
                    <div className="md:w-1/2 relative overflow-hidden flex">
                      <img
                        src={story.image || "/placeholder.svg"}
                        alt={story.headline}
                        className="w-full h-48 md:h-auto md:flex-1 object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
                          FINANCE
                        </span>
                      </div>
                    </div>
                    <div className="md:w-1/2 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-500 text-sm">
                            {story.publishTime}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300 line-clamp-2">
                          {story.headline}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                          {story.snippet}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">
                          By {story.author}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white hover:bg-gray-600 p-2 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
