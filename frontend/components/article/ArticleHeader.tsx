import { Calendar, User, Share2, BookmarkPlus, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArticleHeaderProps {
  title: string;
  author: string;
  source: string;
  publishedDate: Date;
  category: string;
  isBookmarked: boolean;
  onShare: () => void;
  onBookmark: () => void;
  additionalBadges?: React.ReactNode;
}

export function ArticleHeader({
  title,
  author,
  source,
  publishedDate,
  category,
  isBookmarked,
  onShare,
  onBookmark,
  additionalBadges,
}: ArticleHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Badge className="border-gray-600 text-gray-300">{category}</Badge>
        {additionalBadges}
      </div>

      <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
        {title}
      </h1>

      <div className="flex items-center justify-between text-sm text-gray-400 mb-6 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {author} • {source}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(publishedDate, "MMMM dd, yyyy 'at' HH:mm")}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onBookmark}>
            {isBookmarked ? (
              <Bookmark className="h-4 w-4 fill-current" />
            ) : (
              <BookmarkPlus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
