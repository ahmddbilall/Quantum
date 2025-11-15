"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { GeneratingText } from "@/components/ui/generating-text";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 w-full"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl px-5 py-3 bg-zinc-900 text-white inline-block">
        <GeneratingText text="Quantum is thinking..." />
      </div>
    </motion.div>
  );
}
