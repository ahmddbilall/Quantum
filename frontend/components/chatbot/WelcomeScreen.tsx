"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { DEFAULT_QUESTIONS } from "./constants";
import DefaultQuestionCard from "./DefaultQuestionCard";

interface WelcomeScreenProps {
  onQuestionClick: (question: string) => void;
}

export default function WelcomeScreen({ onQuestionClick }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[500px] text-center"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-3xl opacity-20"></div>
        <div className="relative p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl border border-purple-500/20">
          <Bot className="h-16 w-16 text-white" />
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        Welcome to <span className="font-oxanium">Quantum</span> AI
      </h1>
      <p className="text-gray-400 text-lg mb-12 max-w-2xl">
        Your intelligent assistant for news analysis, market insights, and
        real-time information. Ask me anything or choose a topic below to get
        started.
      </p>

      {/* Default Questions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {DEFAULT_QUESTIONS.map((question, index) => (
          <DefaultQuestionCard
            key={index}
            question={question}
            index={index}
            onClick={onQuestionClick}
          />
        ))}
      </div>
    </motion.div>
  );
}
