import { Play, Pause, Loader2 } from "lucide-react";
import { useState } from "react";
import { YouTubePlayer } from "./YouTubePlayer";
import { useExerciseVideo } from "@/hooks/useExerciseVideo";

interface VideoPlayerProps {
  exerciseName: string;
  videoUrl?: string;
  className?: string;
}

export const VideoPlayer = ({ exerciseName, videoUrl, className = "" }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { exercise, loading, error, videoUrl: exerciseVideoUrl } = useExerciseVideo(exerciseName);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Se há carregamento, mostrar loader
  if (loading) {
    return (
      <div className={`relative aspect-video bg-surface/30 rounded-xl flex items-center justify-center border border-border/20 overflow-hidden ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-sm text-foreground">Carregando vídeo...</span>
        </div>
      </div>
    );
  }

  // Priorizar videoUrl fornecido, senão usar o do exercício encontrado
  const finalVideoUrl = videoUrl || exerciseVideoUrl;

  // Se temos uma URL de vídeo, usar o YouTubePlayer para YouTube ou reproduzir GIF/vídeo direto
  if (finalVideoUrl) {
    // Verificar se é YouTube
    if (finalVideoUrl.includes('youtube.com') || finalVideoUrl.includes('youtu.be')) {
      return (
        <YouTubePlayer 
          videoUrl={finalVideoUrl} 
          exerciseName={exerciseName} 
          className={className} 
        />
      );
    }
    
    // Para outros tipos de vídeo (GIF, MP4, etc.)
    return (
      <div className={`relative aspect-video bg-black rounded-xl overflow-hidden border border-border/20 ${className}`}>
        {finalVideoUrl.endsWith('.gif') ? (
          <img
            src={finalVideoUrl}
            alt={exerciseName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <video
            src={finalVideoUrl}
            controls
            autoPlay={false}
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Overlay com informações */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-white font-medium text-sm truncate">{exerciseName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video bg-surface/30 rounded-xl flex items-center justify-center border border-border/20 overflow-hidden ${className}`}>
      {/* Video placeholder - em uma implementação real, seria um componente de vídeo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <button 
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-3 mx-auto hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-background" />
              ) : (
                <Play className="w-6 h-6 text-background ml-1" />
              )}
            </button>
            <p className="text-foreground font-medium text-sm">{exerciseName}</p>
            <p className="text-muted-foreground text-xs">Preview do exercício</p>
          </div>
        </div>
      </div>
      
      {/* Video controls overlay */}
      {isPlaying && (
        <div className="absolute bottom-2 left-2 right-2 bg-background/20 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full w-1/3 transition-all duration-300"></div>
            </div>
            <span className="text-white text-xs">0:15 / 0:45</span>
          </div>
        </div>
      )}
    </div>
  );
};