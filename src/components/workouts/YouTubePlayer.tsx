import { useState, useEffect, useRef } from "react";
import { Play, Loader2 } from "lucide-react";

interface YouTubePlayerProps {
  videoUrl: string;
  exerciseName: string;
  className?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer = ({ videoUrl, exerciseName, className = "" }: YouTubePlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

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
    if (!videoId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        // Se já existe uma instância, destruir antes de criar nova
        if (playerInstanceRef.current) {
          playerInstanceRef.current.destroy();
        }

        playerInstanceRef.current = new window.YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'origin': window.location.origin
          },
          events: {
            'onReady': () => {
              if (isMounted) setIsLoading(false);
            },
            'onError': (event: any) => {
              console.warn("YouTube Player Error:", event.data);
              // Códigos de erro: 2 (inválido), 5 (HTML5), 100 (não encontrado), 101/150 (restrito)
              if (isMounted) {
                setHasError(true);
                setIsLoading(false);
              }
            },
            'onStateChange': (event: any) => {
              // Opcional: gerenciar estado de play/pause
            }
          }
        });
      } catch (e) {
        console.error("Error initializing YouTube player:", e);
        if (isMounted) setHasError(true);
      }
    };

    // Carregar API do YouTube se necessário
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      isMounted = false;
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          // Ignorar erro na destruição
        }
      }
    };
  }, [videoId]);

  if (hasError || !videoId) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="relative aspect-video bg-surface/30 rounded-xl flex items-center justify-center border border-border/20 overflow-hidden">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 mx-auto">
              <Play className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-sm mb-1">
              Não foi possível carregar o vídeo aqui.
            </p>
            <p className="text-muted-foreground text-xs mb-3">
              Você pode assistir diretamente no YouTube.
            </p>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${videoId || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border/40 rounded-xl text-sm font-medium text-foreground hover:bg-surface-highlight transition-colors active:scale-[0.98]"
        >
          <Play size={16} className="fill-current text-red-600" />
          Abrir no YouTube
        </a>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border/20">
        {/* Container para o IFrame API */}
        <div ref={playerRef} className="absolute inset-0 w-full h-full" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Overlay com informações (apenas visual, pointer-events-none para não bloquear cliques) */}
        {!isLoading && (
          <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
              <p className="text-white font-medium text-sm truncate">{exerciseName}</p>
            </div>
          </div>
        )}
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