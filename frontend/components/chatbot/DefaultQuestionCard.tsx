"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { DefaultQuestion } from "./types";

interface DefaultQuestionCardProps {
  question: DefaultQuestion;
  index: number;
  onClick: (text: string) => void;
}

export default function DefaultQuestionCard({
  question,
  index,
  onClick,
}: DefaultQuestionCardProps) {
  const Icon = question.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onClick(question.text)}
      className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 text-left overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
            <Icon className="h-5 w-5 text-purple-400" />
          </div>
          <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
        </div>
        <p className="text-sm font-medium text-white mb-2 leading-relaxed">
          {question.text}
        </p>
        <span className="text-xs text-gray-500">{question.category}</span>
      </div>
    </motion.button>
  );
}
