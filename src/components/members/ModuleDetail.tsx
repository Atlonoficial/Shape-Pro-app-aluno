import { useState, useEffect } from "react";
import { ArrowLeft, Play, Download, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/workouts/VideoPlayer";

interface ModuleDetailProps {
  module: any;
  courseTitle?: string;
  onBack: () => void;
}

export const ModuleDetail = ({ module, courseTitle, onBack }: ModuleDetailProps) => {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-select first lesson when module is loaded
    const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
    if (lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0]);
    }
  }, [module, selectedLesson]);

  const handleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;

  return (
    <div className="p-4 pt-8 pb-24">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar aos Módulos
      </Button>

      {/* Module Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {module?.name || module?.title}
        </h1>
        <p className="text-muted-foreground mb-3">{module?.description}</p>
        
        {courseTitle && (
          <p className="text-sm text-muted-foreground mb-3">
            Curso: {courseTitle}
          </p>
        )}
        
        {/* Progress */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{completedCount}/{totalLessons} aulas completas</span>
          <div className="flex-1 bg-muted rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300" 
              style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Video Player */}
      {selectedLesson && (
        <div className="mb-6">
          <VideoPlayer 
            exerciseName={selectedLesson.title}
            videoUrl={selectedLesson.video_url}
            className="w-full rounded-lg overflow-hidden"
          />
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Aulas do Módulo</h3>
        
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Este módulo ainda não possui aulas disponíveis.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: any, index: number) => {
              const lessonId = lesson.id || `lesson-${index}`;
              const isCompleted = completedLessons.has(lessonId);
              
              return (
                <Card 
                  key={lessonId}
                  className={`cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                    selectedLesson?.id === lesson.id || selectedLesson === lesson ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium text-foreground">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.duration || '10 min'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lesson.downloadable && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {!isCompleted && (
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLessonComplete(lessonId);
                            }}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};