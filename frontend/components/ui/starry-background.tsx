"use client";
import { useEffect, useState } from "react";

interface StarryBackgroundProps {
  starCount?: number;
  opacity?: number;
  className?: string;
  includeCSSStars?: boolean;
}

export default function StarryBackground({ 
  starCount = 100, 
  opacity = 0.3,
  className = "",
  includeCSSStars = true 
}: StarryBackgroundProps) {
  const [stars, setStars] = useState<{ 
    left: string; 
    top: string; 
    delay: string; 
    duration: string; 
  }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: starCount }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
    setStars(generated);
  }, [starCount]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* CSS-based stars background */}
      {includeCSSStars && <div className="stars absolute inset-0" />}
      
      {/* Animated individual stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
            animationDuration: star.duration,
            opacity,
          }}
        />
      ))}
      
      {/* CSS styles for the stars background */}
      {includeCSSStars && (
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
            opacity: 0.3;
          }

          @keyframes twinkle {
            0% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
            100% {
              opacity: 0.3;
            }
          }
        `}</style>
      )}
    </div>
  );
}
