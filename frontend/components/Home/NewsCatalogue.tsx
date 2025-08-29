'use client';

import { motion, MotionValue, useScroll, useTransform } from 'motion/react';
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

const NewsCatalogue = () => {

    const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });


  return (
    <section ref={container} className='relative h-[200vh] bg-black'>
        <Section1 scrollYProgress={scrollYProgress} />
        <Section2 scrollYProgress={scrollYProgress} />
      </section>
  )
}

export default NewsCatalogue

interface SectionProps {
  scrollYProgress: MotionValue<number>;
}

const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);
  return (
    <motion.section
      style={{ scale, rotate }}
      className='sticky font-semibold top-0 h-screen flex flex-col items-center justify-center'
    >
      <NewsSection bg='background'/>
    </motion.section>
  );
};

const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [5, 0]);

  return (
    <motion.section
      style={{ scale, rotate }}
      className='relative h-screen'
    >
      <NewsSection/>
    </motion.section>
  );
};

interface NewsSectionProps {
    bg?: string;
}

const NewsSection = ({bg}: NewsSectionProps) => {

    const latestNews = [
    {
      image: "/technology-innovation.png",
      headline: "Breakthrough in Quantum Computing Announced",
      snippet: "Scientists achieve new milestone in quantum processing capabilities...",
      category: "Technology",
    },
    {
      image: "/business-finance.png",
      headline: "Global Trade Agreements Reshape Economy",
      snippet: "New international partnerships drive economic growth across regions...",
      category: "Business",
    },
    {
      image: "/health-medical-research.png",
      headline: "Medical Research Yields Promising Results",
      snippet: "Clinical trials show significant progress in treatment development...",
      category: "Health",
    },
    {
      image: "/environment-climate.png",
      headline: "Renewable Energy Adoption Accelerates",
      snippet: "Clean energy initiatives gain momentum worldwide as costs decrease...",
      category: "Environment",
    },
  ]


    return (
        <section className={`py-10 px-4 sm:px-6 lg:px-8 max-h-screen bg-${bg || 'foreground'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`flex items-center justify-between mb-12 ${bg === "background" ? "text-black": "text-white"}`}>
            <h2 className="text-3xl md:text-4xl font-bold ">Latest News</h2>
            <Button variant="ghost" className="hover:text-gray-300 group">
              View More
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestNews.map((news, index) => (
              <Card
                key={index}
                className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-0">
                  <img
                    src={news.image || "/placeholder.svg"}
                    alt={news.headline}
                    className="w-full h-48 object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  <div className="p-6">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{news.category}</span>
                    <h3 className="text-lg font-semibold text-white mt-2 mb-3 line-clamp-2">{news.headline}</h3>
                    <p className="text-gray-400 text-sm line-clamp-3">{news.snippet}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
}