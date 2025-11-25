import { useState, useEffect } from "react";
import { Play, Pause, Volume2, Maximize2, Loader2 } from "lucide-react";

interface YouTubePlayerProps {
  videoUrl: string;
  exerciseName: string;
  className?: string;
}

export const YouTubePlayer = ({ videoUrl, exerciseName, className = "" }: YouTubePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extrair ID do vídeo do YouTube
  const getYouTubeVideoId = (url: string): string | null => {
    const regexPatterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /^([a-zA-Z0-9_-]{11})$/ // ID direto
    ];

    for (const pattern of regexPatterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  useEffect(() => {
    if (videoId) {
      setIsLoading(false);
      setHasError(false);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [videoId]);

  if (isLoading) {
    return (
      <div className={`relative aspect-video bg-surface/30 rounded-xl flex items-center justify-center border border-border/20 overflow-hidden ${className}`}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-2 text-sm text-foreground">Carregando vídeo...</span>
      </div>
    );
  }

  if (hasError || !videoId) {
    return (
      <div className={`relative aspect-video bg-surface/30 rounded-xl flex items-center justify-center border border-border/20 overflow-hidden ${className}`}>
        <div className="text-center p-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 mx-auto">
            <Play className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium text-sm mb-1">{exerciseName}</p>
          <p className="text-muted-foreground text-xs mb-3">Não foi possível carregar o player.</p>

          {videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Play size={12} className="fill-current" />
              Assistir no YouTube
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border/20">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&playsinline=1&enablejsapi=1&origin=${window.location.origin}`}
          title={exerciseName}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />

        {/* Overlay com informações */}
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
            <p className="text-white font-medium text-sm truncate">{exerciseName}</p>
          </div>
        </div>
      </div>

      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/40 rounded-xl text-sm font-medium text-foreground hover:bg-surface-highlight transition-colors active:scale-[0.98]"
      >
        <Play size={16} className="fill-current text-red-600" />
        Abrir no YouTube
      </a>
    </div>
  );
};