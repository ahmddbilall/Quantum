"use client";

import Hero from "@/components/Home/Hero";
import LatestNewsSection from "@/components/Home/LatestNewsSection";
import NewsCatalogue from "@/components/Home/NewsCatalogue";
import WhyChooseUs from "@/components/Home/WhyChooseUs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
 
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Navigation to All Pages - Remove this section when not needed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Explore All Pages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/news-feed"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              News Feed
            </a>
            <a
              href="/market-finance"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Market & Finance
            </a>
            <a
              href="/chatbot"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Chatbot
            </a>
            <a
              href="/about"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              About
            </a>
            <a
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Login
            </a>
            <a
              href="/contact"
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Contact
            </a>
            <a
              href="/careers"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Careers
            </a>
            <a
              href="/privacy-policy"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-of-service"
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/cookie-policy"
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-center transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>

      {/* Latest News Scroll - New */}
      <LatestNewsSection />

      {/* Second News Section */}
      <NewsCatalogue />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Footer */}
      <Footer />
    </div>
  );
}
