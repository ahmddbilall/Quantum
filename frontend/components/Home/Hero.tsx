"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfiniteSlider } from "../ui/infinite-slider";
import { ProgressiveBlur } from "../ui/progressive-blur";
import { ShootingStars } from "../ui/shooting-stars";
import { useEffect, useRef, useState } from "react";

const sliderItems = [
  {
    src: "/sources_logo/bbc.png",
    alt: "BBC News Logo",
  },
  {
    src: "/sources_logo/aljazeera.png",
    alt: "Al Jazeera Logo",
  },
  {
    src: "/sources_logo/guardian.png",
    alt: "The Guardian Logo",
  },
  {
    src: "/sources_logo/newsbtc.png",
    alt: "NewsBTC Logo",
  },
  {
    src: "/sources_logo/cryptoslate.png",
    alt: "CryptoSlate Logo",
  },
  {
    src: "/sources_logo/ambcrypto.png",
    alt: "AMBCrypto Logo",
  },
  {
    src: "/sources_logo/decrypt.svg",
    alt: "Decrypt Logo",
  },
];

const Hero = () => {

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInside, setIsMouseInside] = useState(false);
  const [starPositions, setStarPositions] = useState<Array<{
    left: number;
    top: number;
    animationDelay: number;
    animationDuration: number;
  }>>([]);
  const heroRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    // Generate star positions only on client side
    const positions = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 2,
    }));
    setStarPositions(positions);
  }, []);
  
  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = heroElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => {
      setIsMouseInside(true);
    };

    const handleMouseLeave = () => {
      setIsMouseInside(false);
    };

    heroElement.addEventListener('mousemove', handleMouseMove);
    heroElement.addEventListener('mouseenter', handleMouseEnter);
    heroElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      heroElement.removeEventListener('mousemove', handleMouseMove);
      heroElement.removeEventListener('mouseenter', handleMouseEnter);
      heroElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);


  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0)_80%)]" /> */}
        {
          !isMouseInside && <div className="stars absolute inset-0" />
        }
         {isMouseInside && (
            <>
              <div
                className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-300/10 blur-3xl transition-all duration-300 ease-out"
                style={{
                  transform: `translate(${mousePosition.x - 192}px, ${mousePosition.y - 192}px)`,
                }}
              />
              <div
                className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-purple-400/15 to-indigo-300/15 blur-2xl transition-all duration-500 ease-out"
                style={{
                  transform: `translate(${mousePosition.x * 0.7 - 128}px, ${mousePosition.y * 0.7 - 128}px)`,
                }}
              />
              <div
                className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-emerald-300/20 to-teal-200/20 blur-xl transition-all duration-700 ease-out"
                style={{
                  transform: `translate(${mousePosition.x * 0.5 - 64}px, ${mousePosition.y * 0.5 - 64}px)`,
                }}
              />
              <div
                className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-pink-300/5 to-rose-200/5 blur-xl transition-all duration-400 ease-out"
                style={{
                  transform: `translate(${mousePosition.x * 0.3 - 96}px, ${mousePosition.y * 0.3 - 96}px)`,
                }}
              />
              <div
                className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-yellow-200/30 to-amber-100/30 blur-lg transition-all duration-600 ease-out"
                style={{
                  transform: `translate(${mousePosition.x * 0.8 - 40}px, ${mousePosition.y * 0.8 - 40}px)`,
                }}
              />
            </>
          )}
      </div>



        <div className="absolute inset-0 pointer-events-none">
          {starPositions.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
              }}
            />
          ))}
        </div>


      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-screen">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your AI-Powered Gateway to News
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Stay informed, explore perspectives, and understand the context —
            instantly.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white bg-opacity-10 backdrop-blur-sm rounded-full p-2">
              <Input
                placeholder="Ask the AI anything about current events..."
                className="flex-1 bg-transparent text-black placeholder-gray-300 
                !border-0 !outline-none focus:!outline-none focus:!ring-0 
                focus:!border-0 focus:!shadow-none !shadow-none"
              />
              <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6">
                Ask AI
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="py-8">
        <div className="group relative m-auto max-w-6xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="md:max-w-44 md:border-r md:pr-6">
              <p className="text-end text-sm">Powered by credible outlets</p>
            </div>
            <div className="relative py-6 md:w-[calc(100%-11rem)]">
              <InfiniteSlider gap={112}>
                {sliderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-center h-8">
                    <img
                      className={`mx-auto brightness-0 invert ${
                        item.alt.includes('Al Jazeera') || 
                        item.alt.includes('NewsBTC') || 
                        item.alt.includes('CryptoSlate') 
                          ? 'h-20 min-w-[80px]' 
                          : 'h-8'
                      }`}
                      src={item.src}
                      alt={item.alt}
                      style={{
                        minHeight: '32px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ))}
              </InfiniteSlider>

              <div className="bg-linear-to-r from-[#121212] absolute inset-y-0 left-0 w-20"></div>
              <div className="bg-linear-to-l from-[#121212] absolute inset-y-0 right-0 w-20"></div>
              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Multiple shooting star layers with different colors and speeds */}
      <ShootingStars
        starColor="#9E00FF"
        trailColor="#2EB9DF"
        minSpeed={15}
        maxSpeed={35}
        minDelay={1000}
        maxDelay={3000}
      />
      <ShootingStars
        starColor="#FF0099"
        trailColor="#FFB800"
        minSpeed={10}
        maxSpeed={25}
        minDelay={2000}
        maxDelay={4000}
      />
      <ShootingStars
        starColor="#00FF9E"
        trailColor="#00B8FF"
        minSpeed={20}
        maxSpeed={40}
        minDelay={1500}
        maxDelay={3500}
      />

      <style jsx>{`
        .stars {
          background-image: radial-gradient(
              2px 2px at 20px 30px,
              #eee,
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(2px 2px at 40px 70px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 90px 40px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 130px 80px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0, 0, 0, 0));
          background-repeat: repeat;
          background-size: 200px 200px;
          animation: twinkle 5s ease-in-out infinite;
          opacity: 0.5;
        }

        @keyframes twinkle {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.5;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
