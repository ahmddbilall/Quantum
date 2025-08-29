"use client";

import Hero from "@/components/Home/Hero";
import LatestNewsSection from "@/components/Home/LatestNewsSection";
import NewsCatalogue from "@/components/Home/NewsCatalogue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CircularTestimonials from "@/components/ui/circular-testionials";
import { Slider } from "@/components/ui/slider";
import {
  ChevronRight,
  Menu,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero slider data
  const heroSlides = [
    {
      image: "/breaking-news-ai.png",
      headline: "AI Revolution Transforms Global Markets",
      snippet:
        "Latest developments in artificial intelligence reshape industries worldwide",
    },
    {
      image: "/placeholder-zonqx.png",
      headline: "World Leaders Gather for Climate Summit",
      snippet:
        "International cooperation reaches new heights in environmental policy",
    },
    {
      image: "/placeholder-oa4ip.png",
      headline: "Markets Surge on Economic Recovery",
      snippet: "Global financial indicators show strong growth across sectors",
    },
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Sample news data
  const latestNews = [
    {
      image: "/technology-innovation.png",
      headline: "Breakthrough in Quantum Computing Announced",
      snippet:
        "Scientists achieve new milestone in quantum processing capabilities...",
      category: "Technology",
    },
    {
      image: "/business-finance.png",
      headline: "Global Trade Agreements Reshape Economy",
      snippet:
        "New international partnerships drive economic growth across regions...",
      category: "Business",
    },
    {
      image: "/health-medical-research.png",
      headline: "Medical Research Yields Promising Results",
      snippet:
        "Clinical trials show significant progress in treatment development...",
      category: "Health",
    },
    {
      image: "/environment-climate.png",
      headline: "Renewable Energy Adoption Accelerates",
      snippet:
        "Clean energy initiatives gain momentum worldwide as costs decrease...",
      category: "Environment",
    },
  ];

  const marketHighlights = [
    { symbol: "TECH", change: "+2.4%", trend: "up", price: "$1,234.56" },
    { symbol: "ENERGY", change: "+1.8%", trend: "up", price: "$987.65" },
    { symbol: "FINANCE", change: "-0.5%", trend: "down", price: "$2,345.67" },
    { symbol: "HEALTH", change: "+0.0%", trend: "neutral", price: "$1,876.54" },
  ];

  const perspectives = [
    {
      topic: "AI Regulation Debate",
      sources: ["Tech Weekly", "Policy Today", "Innovation News"],
      viewCount: 3,
    },
    {
      topic: "Climate Policy Changes",
      sources: ["Green Report", "Environmental Times", "Sustainability Now"],
      viewCount: 4,
    },
    {
      topic: "Economic Recovery Trends",
      sources: ["Market Watch", "Financial Times", "Economic Review"],
      viewCount: 3,
    },
  ];

  const whyChooseUsData = [
    {
      quote:
        "Get instant answers and context about any news story with our advanced AI chatbot. Ask questions, explore topics, and understand complex events with ease.",
      name: "AI Chatbot",
      designation: "Intelligent News Assistant",
      src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "Receive personalized news recommendations based on your interests and reading patterns. Our smart algorithm learns what matters to you most.",
      name: "Smart Recommendations",
      designation: "Personalized Content Delivery",
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "Explore different viewpoints on the same story from multiple trusted sources. Understand the full picture with comprehensive perspective analysis.",
      name: "Multiple Perspectives",
      designation: "Comprehensive News Analysis",
      src: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "Save time with AI-generated summaries that capture the key points of any article. Get informed quickly without reading full stories.",
      name: "Quick Summaries",
      designation: "Efficient Information Processing",
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Fixed Navbar */}
      <nav className=" bg-[#121212] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">NewsAI</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#"
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  News Feed
                </a>
                <a
                  href="#"
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  Market & Finance
                </a>
                <a
                  href="#"
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  Chatbot
                </a>
                <a
                  href="#"
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  About
                </a>
              </div>
            </div>

            {/* Search and Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Search className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200" />
              <Button
                variant="ghost"
                className="text-white hover:text-gray-300 hover:bg-gray-800"
              >
                Login
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black transition-all duration-200 bg-transparent"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-gray-300"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#121212] border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#"
                className="block px-3 py-2 text-white hover:text-gray-300"
              >
                News Feed
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-white hover:text-gray-300"
              >
                Market & Finance
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-white hover:text-gray-300"
              >
                Chatbot
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-white hover:text-gray-300"
              >
                About
              </a>
              <div className="flex space-x-2 px-3 py-2">
                <Button variant="ghost" size="sm" className="text-white">
                  Login
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white text-white bg-transparent"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Latest News Scroll - New */}

      <LatestNewsSection />

      {/* Second News Section */}
      <NewsCatalogue />

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            Why Choose NewsAI?
          </h2>
          <div className="flex items-center justify-center">
            <CircularTestimonials
              testimonials={whyChooseUsData}
              autoplay={true}
              colors={{
                name: "#ffffff",
                designation: "#e1e1e1",
                testimony: "#f1f1f7",
                arrowBackground: "#374151",
                arrowForeground: "#ffffff",
                arrowHoverBackground: "#ffffff",
              }}
              fontSizes={{
                name: "28px",
                designation: "18px",
                quote: "18px",
              }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#121212] border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">NewsAI</h3>
              <p className="text-gray-400 mb-6">
                Your AI-powered gateway to understanding the world through news.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer">
                  <span className="text-xs font-bold">f</span>
                </div>
                <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer">
                  <span className="text-xs font-bold">t</span>
                </div>
                <div className="w-8 h-8 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer">
                  <span className="text-xs font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 NewsAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
