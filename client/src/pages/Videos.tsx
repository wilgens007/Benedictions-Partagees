import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useLanguage } from "@/lib/LanguageContext";
import type { Video } from "@shared/schema";

const categories = [
  { key: "all", labelKey: "allVideos" },
  { key: "sermons", labelKey: "sermons" },
  { key: "testimonies", labelKey: "testimonies" },
  { key: "worship", labelKey: "worship" },
  { key: "teachings", labelKey: "teachings" },
];

export default function Videos() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const filteredVideos = videos?.filter(
    (video) => selectedCategory === "all" || video.category === selectedCategory
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
          {t("videoTeachings")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("sermons")} & {t("teachings")}
        </p>
      </div>

      <div className="px-5 mb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className="flex-shrink-0"
                data-testid={`category-${cat.key}`}
              >
                {t(cat.labelKey)}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="flex-1 px-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-video rounded-lg mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredVideos && filteredVideos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredVideos.map((video) => (
              <Card 
                key={video.id}
                className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer shadow-sm"
                onClick={() => setSelectedVideo(video)}
                data-testid={`video-${video.id}`}
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-foreground ml-1" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {video.category}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("noResults")}</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>{selectedVideo?.title || "Video"}</DialogTitle>
          </VisuallyHidden>
          {selectedVideo && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white no-default-hover-elevate no-default-active-elevate"
                onClick={() => setSelectedVideo(null)}
                data-testid="button-close-video"
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <h2 className="font-serif font-semibold text-lg text-foreground mb-2">
                  {selectedVideo.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {selectedVideo.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
