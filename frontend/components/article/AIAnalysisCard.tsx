import { useState } from "react";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponseStream } from "@/components/ui/response-stream";
import { GeneratingText } from "@/components/ui/generating-text";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysisCardProps {
  aiSummary: string;
  sentimentAnalysis: {
    overall: string;
    confidence: number;
  };
  isGenerating: boolean;
  showSummary: boolean;
}

export function AIAnalysisCard({
  aiSummary,
  sentimentAnalysis,
  isGenerating,
  showSummary,
}: AIAnalysisCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  const handleRating = (type: "up" | "down") => {
    if (rating === type) {
      setRating(null);
      toast({
        title: "Rating removed",
        description: "Your feedback has been removed",
        duration: 2000,
      });
    } else {
      setRating(type);
      toast({
        title: "Thank you for your feedback!",
        description:
          type === "up"
            ? "Glad the summary was helpful"
            : "We'll work on improving our summaries",
        duration: 2000,
      });
    }
  };

  return (
    <div className="sticky top-8">
      <div className="relative p-[2px] rounded-xl bg-gradient-to-r from-purple-500 via-gray-400 to-white animate-gradient">
        <Card className="bg-black border-0 rounded-xl overflow-hidden">
          <CardContent className="px-6 py-0 bg-gradient-to-br from-black via-zinc-950 to-purple-950/10">
            {/* Header */}
            <div className="flex items-center justify-between py-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    AI Analysis
                  </h3>
                  <p className="text-xs text-gray-400">
                    Powered by <span className="font-oxanium">Quantum</span> AI
                  </p>
                </div>
              </div>
            </div>

            {/* Sentiment Display */}
            <div className="py-3 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sentiment:</span>
                <span
                  className={`text-sm font-semibold ${
                    sentimentAnalysis.overall === "Positive"
                      ? "text-green-400"
                      : sentimentAnalysis.overall === "Negative"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {sentimentAnalysis.overall} ({sentimentAnalysis.confidence}%)
                </span>
              </div>
            </div>

            {/* Summary Content */}
            <div className="py-4">
              {isGenerating && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <GeneratingText text="Quantum is analyzing..." />
                </div>
              )}

              {showSummary && (
                <div className="relative">
                  <div
                    className={`text-gray-200 leading-relaxed text-[15px] ${
                      !isExpanded ? "line-clamp-6" : ""
                    }`}
                  >
                    <ResponseStream
                      textStream={aiSummary}
                      mode="typewriter"
                      speed={50}
                      className="inline"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {aiSummary.length > 180 && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200 group"
                      >
                        {isExpanded ? (
                          <>
                            <span>Show Less</span>
                            <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                          </>
                        ) : (
                          <>
                            <span>Read More</span>
                            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                          </>
                        )}
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRating("up")}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          rating === "up"
                            ? "bg-green-500/20 text-green-400"
                            : "text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRating("down")}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          rating === "down"
                            ? "bg-red-500/20 text-red-400"
                            : "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
