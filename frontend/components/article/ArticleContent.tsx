import { Card, CardContent } from "@/components/ui/card";

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 border-gray-700">
      <CardContent className="p-6 md:p-8">
        <div
          className="prose prose-invert prose-lg max-w-none text-white"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
    </Card>
  );
}
