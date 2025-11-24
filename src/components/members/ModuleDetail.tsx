import { useState, useEffect } from "react";
import { ArrowLeft, Play, Download, CheckCircle2, Clock, Loader2, MessageCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/workouts/VideoPlayer";
import { useCourseModules, CourseModule } from "@/hooks/useCourseModules";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ModuleDetailProps {
  module: any; // This is actually the COURSE object
  courseTitle?: string;
  onBack: () => void;
}

export const ModuleDetail = ({ module: course, courseTitle, onBack }: ModuleDetailProps) => {
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const { modules, loading: modulesLoading } = useCourseModules(course?.id);

  // Se um módulo estiver selecionado, mostramos as aulas dele
  if (selectedModule) {
    return (
      <LessonList
        module={selectedModule}
        onBack={() => setSelectedModule(null)}
      />
    );
  }

  return (
    <div className="p-4 pt-8 pb-safe">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar aos Cursos
      </Button>

      {/* Course Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2 uppercase tracking-wide">
          {course?.title || courseTitle}
        </h1>
        {course?.description && (
          <p className="text-muted-foreground text-sm max-w-md mx-auto line-clamp-2">
            {course.description}
          </p>
        )}
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        {modulesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed border-muted">
            <p className="text-muted-foreground">Nenhum módulo disponível.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {modules.map((module) => {
              // Lógica de bloqueio (exemplo: se release_mode for dias após matricula)
              // Por enquanto, assumimos desbloqueado se publicado, ou bloqueado se tiver release_date futuro
              const isLocked = false; // TODO: Implementar lógica real de bloqueio baseada na matrícula

              return (
                <div
                  key={module.id}
                  onClick={() => !isLocked && setSelectedModule(module)}
                  className={`
                    group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                    ${isLocked ? 'opacity-80 grayscale' : 'hover:scale-[1.02] shadow-lg'}
                  `}
                >
                  {/* Cover Image */}
                  <div className="absolute inset-0 bg-muted">
                    {module.cover_image_url ? (
                      <img
                        src={module.cover_image_url}
                        alt={module.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Play className="w-12 h-12 text-primary/40" />
                      </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    {isLocked && (
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full">
                        <Lock className="w-4 h-4 text-white/70" />
                      </div>
                    )}

                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">
                      {module.title}
                    </h3>
                    <p className="text-white/60 text-[10px] uppercase tracking-wider font-medium">
                      Módulo {module.order_index}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-componente para listar aulas (antigo conteúdo do ModuleDetail)
const LessonList = ({ module, onBack }: { module: CourseModule, onBack: () => void }) => {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Use lessons directly from the module object (fetched eagerly)
  const lessons = module.lessons || [];
  const loading = false; // Data is already loaded
  const error = null;

  useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0]);
    }
  }, [lessons, selectedLesson]);

  const handleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;

  return (
    <div className="p-4 pt-8 pb-safe">
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
          {module.title}
        </h1>
        <p className="text-muted-foreground mb-3">{module.description}</p>

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
            className="w-full rounded-lg overflow-hidden shadow-lg border border-border/50"
          />

          {selectedLesson.is_free && (
            <Card className="mt-4 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      🎓 Aula Gratuita
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Fale com seu professor para liberar o curso completo.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/teacher-chat')} size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contato
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Aulas do Módulo</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive text-center py-4">Erro ao carregar aulas</p>
        ) : lessons.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma aula disponível.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: any, index: number) => {
              const lessonId = lesson.id || `lesson-${index}`;
              const isCompleted = completedLessons.has(lessonId);
              const isActive = selectedLesson?.id === lesson.id;

              return (
                <Card
                  key={lessonId}
                  className={`cursor-pointer transition-all duration-200 hover:bg-accent/50 ${isActive ? 'ring-2 ring-primary bg-accent/30' : ''
                    }`}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                          }`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3 h-3 ml-0.5" />}
                        </div>

                        <div>
                          <p className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.video_duration_minutes || 10} min</span>
                          </div>
                        </div>
                      </div>

                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLessonComplete(lessonId);
                          }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
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