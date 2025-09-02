"use client";
import { useScroll, motion, useTransform } from "framer-motion";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import StarryBackground from "@/components/ui/starry-background";

const bgImageSrc =
  "/landing_page_res/newspaper.jpg";

const mediaContent = {
  src: "/landing_page_res/typewritter.jpg", 
  background:
    "/landing_page_res/newspaper.jpg",
  title: "Breaking News Today",
  date: "Latest Updates",
  scrollToExpand: "Scroll for Latest Stories",
  about: {
    overview:
      "Stay informed with the latest breaking news, in-depth analysis, and comprehensive coverage from around the world. Our AI-powered platform delivers personalized news content tailored to your interests.",
    conclusion:
      "Experience news like never before with our intelligent content curation and real-time updates that keep you ahead of the curve.",
  },
};

const LatestNewsSection = () => {
  const sectionRef = React.useRef<HTMLDivElement | null>(null);

  const { date, scrollToExpand, title } = mediaContent;
  const textBlend = true;

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"], // When section starts entering viewport to when it fully exits
  });

  // TODO: set appropriate background opacity based on scroll position later
  const bgOpacity = useTransform(
    scrollYProgress,
    [0, 0.33, 0.66, 1],
    [1, 1, 0, 0]
  );
  // TODO: modify for mobile later
  const textTranslateX = useTransform(scrollYProgress, [0.33, 0.66], [0, 150]); 
  const textTranslateXvw = useTransform(textTranslateX, (v) => `${v}vw`);
  const textTranslateXvwNeg = useTransform(textTranslateX, (v) => `-${v}vw`);

  const mediaWidth = useTransform(scrollYProgress, [0.33, 0.66], [300, 1550]);
  const mediaHeight = useTransform(scrollYProgress, [0.33, 0.66], [400, 800]);

  useEffect(() => {
    console.log("textTranslateX:", textTranslateX.get()); // Log the initial value
  }, [textTranslateX]);

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = scrollYProgress.on("change", (v) => {
      // console.log("Section progress:", v); // 0 to 1
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-black text-white h-[300vh]"
    >
      {/* Starry background - always visible as fallback */}
      <StarryBackground starCount={200} opacity={0.5} />

      <div className="sticky inset-0 z-0 flex items-center justify-center h-screen overflow-hidden">
        {/* background Image */}
        <motion.div
          className="absolute inset-0 z-0 h-full"
          initial={{ opacity: 0 }}
          style={{ opacity: bgOpacity }}
          // animate={{ opacity: bgOpacity }}
          transition={{ duration: 0.1 }}
        >
          <Image
            src={bgImageSrc}
            alt="Background"
            width={1920}
            height={1080}
            className="w-screen h-screen"
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>

        <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
          <motion.div
            className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl"
            style={{
              width: mediaWidth, // change
              height: mediaHeight, // change
              maxWidth: "95vw",
              maxHeight: "85vh",
              boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={
                  "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?q=80&w=1280&auto=format&fit=crop"
                } // Latest news/newspaper image
                alt={"Breaking News Today"} // News-related alt text
                width={1280}
                height={720}
                className="w-full h-full object-cover rounded-xl"
              />
              
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40 rounded-xl" />
            </div>

            <div className="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
              {date && (
                <motion.p
                  className="text-2xl text-white font-semibold drop-shadow-lg"
                  style={{ 
                    x: textTranslateXvwNeg,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {date}
                </motion.p>
              )}
              {scrollToExpand && (
                <motion.p
                  className="text-white font-medium text-center drop-shadow-lg"
                  style={{ 
                    x: textTranslateXvw,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
                  }}
                >
                  {scrollToExpand}
                </motion.p>
              )}
            </div>
          </motion.div>

          <div
            className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
              textBlend ? "mix-blend-difference" : "mix-blend-normal"
            }`}
          >
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white transition-none drop-shadow-2xl"
              style={{ 
                x: textTranslateXvwNeg,
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)'
              }}
            >
              {firstWord}
            </motion.h2>
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white transition-none drop-shadow-2xl"
              style={{ 
                x: textTranslateXvw,
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)'
              }}
            >
              {restOfTitle}
            </motion.h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNewsSection;
