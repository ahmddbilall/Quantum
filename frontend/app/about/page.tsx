"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StarryBackground from "@/components/ui/starry-background";
import { Sparkles, Brain, MessageSquare } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="relative">
        <StarryBackground starCount={150} opacity={0.4} />

        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <div className="inline-block mb-6">
                <div className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium">
                  About Us
                </div>
              </div>
              <h1 className="text-5xl sm:text-7xl font-bold mb-8 tracking-tight">
                About{" "}
                <span className="font-oxanium text-purple-500">Quantum</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                An AI-powered news platform that brings you curated, intelligent
                news insights from trusted sources around the world.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* What We Do */}
          <div className="py-24 sm:py-32 border-b border-zinc-800">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-12 tracking-tight">
                What We Do
              </h2>
              <div className="space-y-8 text-lg text-gray-300 leading-relaxed">
                <p className="text-xl leading-relaxed">
                  Quantum is a modern news aggregation platform that leverages
                  artificial intelligence to help you stay informed. We collect,
                  analyze, and present news from various credible sources,
                  making it easier for you to understand what's happening in the
                  world.
                </p>
                <p className="text-xl leading-relaxed">
                  Our platform combines cutting-edge technology with a clean,
                  user-friendly interface to deliver a seamless news reading
                  experience. Whether you're interested in global affairs,
                  technology, finance, or cryptocurrency, Quantum keeps you
                  updated.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="py-24 sm:py-32 border-b border-zinc-800">
            <h2 className="text-3xl sm:text-4xl font-bold mb-16 text-center tracking-tight">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              <div className="group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl group-hover:bg-purple-500/30 transition-all duration-300" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-700 group-hover:border-purple-500/50 transition-colors duration-300">
                    <Sparkles className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 tracking-tight">
                  Smart Curation
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  AI-powered news selection from trusted sources
                </p>
              </div>

              <div className="group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl group-hover:bg-purple-500/30 transition-all duration-300" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-700 group-hover:border-purple-500/50 transition-colors duration-300">
                    <Brain className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 tracking-tight">
                  Intelligent Analysis
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Get insights and context with our AI chatbot
                </p>
              </div>

              <div className="group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl group-hover:bg-purple-500/30 transition-all duration-300" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-700 group-hover:border-purple-500/50 transition-colors duration-300">
                    <MessageSquare className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 tracking-tight">
                  Clean Interface
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Simple, distraction-free reading experience
                </p>
              </div>
            </div>
          </div>

          {/* Our Approach */}
          <div className="py-24 sm:py-32 border-b border-zinc-800">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-zinc-900/40 to-transparent rounded-3xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-zinc-800 rounded-3xl p-12 sm:p-16 backdrop-blur-sm">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-8 tracking-tight">
                    Our Approach
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    We believe in providing quality over quantity. Instead of
                    overwhelming you with endless content, we focus on bringing
                    you the most relevant and important news. Our AI chatbot is
                    here to help you understand complex topics and get quick
                    answers to your questions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology */}
          <div className="py-24 sm:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight">
                Built With Modern Technology
              </h2>
              <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                Quantum is built using the latest web technologies and AI models
                to ensure a fast, reliable, and intelligent news experience.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  "Next.js",
                  "React",
                  "TypeScript",
                  "AI & ML",
                  "Python",
                  "Web Scraping",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-base text-gray-300 hover:border-purple-500/50 hover:bg-zinc-800 transition-all duration-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
