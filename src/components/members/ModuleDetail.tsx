import { useState, useEffect } from "react";
import { ArrowLeft, Play, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/workouts/VideoPlayer";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/hooks/useCourses";

interface ModuleDetailProps {
  courseId?: string;
  moduleId: string;
  onBack: () => void;
}

export const ModuleDetail = ({ courseId, moduleId, onBack }: ModuleDetailProps) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const { courseProgress, updateProgress } = useCourseProgress(courseId || moduleId);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId && !moduleId) return;
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId || moduleId)
          .single();

        if (error) {
          console.error('Error fetching course:', error);
          return;
        }

        setCourse(data);

        // Auto-select first lesson if available
        const modules = Array.isArray(data?.modules) ? data.modules : [];
        if (modules.length > 0) {
          const firstModule = modules[0] as any;
          if (Array.isArray(firstModule?.lessons) && firstModule.lessons.length > 0) {
            setSelectedLesson(firstModule.lessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, moduleId]);

  const handleLessonComplete = async (moduleIdx: number, lessonIdx: number) => {
    if (!course) return;
    
    const modules = Array.isArray(course.modules) ? course.modules : [];
    const module = modules[moduleIdx] as any;
    const lesson = module?.lessons?.[lessonIdx];
    
    if (module && lesson) {
      await updateProgress(module.id, lesson.id, true);
    }
  };

  const getCompletedLessons = () => {
    if (!courseProgress || !course) return 0;
    
    let completed = 0;
    const modules = Array.isArray(course.modules) ? course.modules : [];
    const moduleProgress = Array.isArray(courseProgress.module_progress) ? courseProgress.module_progress : [];
    
    modules.forEach((module: any) => {
      const progress = moduleProgress.find((mp: any) => mp.module_id === module.id);
      if (progress?.lessons) {
        completed += progress.lessons.filter((l: any) => l.completed).length;
      }
    });
    
    return completed;
  };

  const getTotalLessons = () => {
    if (!course) return 0;
    const modules = Array.isArray(course.modules) ? course.modules : [];
    return modules.reduce((total: number, module: any) => {
      const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
      return total + lessons.length;
    }, 0);
  };

  const isLessonCompleted = (moduleId: string, lessonId: string) => {
    if (!courseProgress) return false;
    
    const moduleProgress = Array.isArray(courseProgress.module_progress) ? courseProgress.module_progress : [];
    const progress = moduleProgress.find((mp: any) => mp.module_id === moduleId);
    return progress?.lessons?.some((l: any) => l.lesson_id === lessonId && l.completed) || false;
  };

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 pt-8 pb-24">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Curso não encontrado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedLessons = getCompletedLessons();
  const totalLessons = getTotalLessons();

  return (
    <div className="p-4 pt-8 pb-24">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Course Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
        <p className="text-muted-foreground mb-3">{course.description}</p>
        
        {/* Progress */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{completedLessons}/{totalLessons} aulas completas</span>
          <div className="flex-1 bg-muted rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300" 
              style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Video Player */}
      {selectedLesson && (
        <div className="mb-6">
          <VideoPlayer 
            exerciseName={selectedLesson.title}
            className="w-full rounded-lg overflow-hidden"
          />
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Aulas do Curso</h3>
        
        {Array.isArray(course.modules) && course.modules.map((module: any, moduleIdx: number) => (
          <div key={module.id || moduleIdx} className="space-y-2">
            <h4 className="font-medium text-foreground">{module.name}</h4>
            
            {Array.isArray((module as any)?.lessons) && (module as any).lessons.map((lesson: any, lessonIdx: number) => (
              <Card 
                key={lesson.id || lessonIdx}
                className={`cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                  selectedLesson?.id === lesson.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedLesson(lesson)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        {isLessonCompleted(module.id, lesson.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Play className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-foreground">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.duration || '10 min'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lesson.downloadable && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {!isLessonCompleted(module.id, lesson.id) && (
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLessonComplete(moduleIdx, lessonIdx);
                          }}
                        >
                          Marcar como Concluída
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

        {(!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Este curso ainda não possui aulas disponíveis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};