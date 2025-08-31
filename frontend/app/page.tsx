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
