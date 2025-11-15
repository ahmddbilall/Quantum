import { Badge } from "@/components/ui/badge";

interface ArticleTagsProps {
  tags: string[];
}

export function ArticleTags({ tags }: ArticleTagsProps) {
  return (
    <div className="pt-6 border-t border-zinc-800">
      <h3 className="text-sm font-semibold mb-3 text-gray-400">
        Related Topics
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string) => (
          <Badge
            key={tag}
            variant="outline"
            className="bg-zinc-800 border-gray-600 text-gray-300 hover:bg-zinc-700 cursor-pointer text-xs px-3 py-1 rounded-full border-zinc-800 hover:border-white/30 transition-colors"
          >
            #{tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
