import { Loader2 } from "lucide-react";
import { useExerciseVideo } from "@/hooks/useExerciseVideo";
import NativeVideoPlayer from "./NativeVideoPlayer";

interface VideoPlayerProps {
  exerciseName: string;
  videoUrl?: string;
  className?: string;
}

export const VideoPlayer = ({ exerciseName, videoUrl, className = "" }: VideoPlayerProps) => {
  const { exercise, loading, videoUrl: exerciseVideoUrl } = useExerciseVideo(exerciseName);

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

  return (
    <div className={className}>
      <NativeVideoPlayer
        videoUrl={finalVideoUrl || null}
        posterUrl={exercise?.image_url}
        autoPlay={false}
      />

      {/* Overlay com informações se for vídeo de exercício */}
      {!videoUrl && exercise && (
        <div className="mt-2 px-1">
          <p className="text-foreground font-medium text-sm truncate">
            {exercise.name}
          </p>
          {exercise.name !== exerciseName && (
            <p className="text-muted-foreground text-xs truncate">
              Treino: {exerciseName}
            </p>
          )}
        </div>
      )}
    </div>
  );
};