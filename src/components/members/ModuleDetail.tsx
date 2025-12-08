import { useState, useEffect } from "react";
import { ArrowLeft, Play, Download, CheckCircle2, Clock, Loader2, MessageCircle, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NativeVideoPlayer from "@/components/workouts/NativeVideoPlayer";
import { useCourseModules, CourseModule } from "@/hooks/useCourseModules";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
export const LessonList = ({ module, onBack }: { module: CourseModule, onBack: () => void }) => {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [teacherPhone, setTeacherPhone] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use lessons directly from the module object (fetched eagerly)
  const lessons = module.lessons || [];
  const loading = false; // Data is already loaded
  const error = null;

  useEffect(() => {
    if (lessons.length > 0) {
      if (!selectedLesson) {
        setSelectedLesson(lessons[0]);
      } else {
        // Refresh currently selected lesson data if it exists in the new list (e.g. Realtime update)
        const updatedLesson = lessons.find((l: any) => l.id === selectedLesson.id);
        if (updatedLesson && JSON.stringify(updatedLesson) !== JSON.stringify(selectedLesson)) {
          console.log('🔄 Updating selected lesson with fresh data');
          setSelectedLesson(updatedLesson);
        }
      }
    }
  }, [lessons, selectedLesson]);

  // Fetch signed URL when selected lesson changes
  useEffect(() => {
    const fetchVideoUrl = async () => {
      if (selectedLesson?.storage_path) {
        try {
          const { data, error } = await supabase.storage
            .from('course-videos')
            .createSignedUrl(selectedLesson.storage_path, 21600); // 6 hours

          if (error) throw error;
          setVideoUrl(data?.signedUrl || null);
        } catch (err) {
          console.error('Error fetching signed URL:', err);
          setVideoUrl(null);
        }
      } else {
        setVideoUrl(null);
      }
    };

    fetchVideoUrl();
  }, [selectedLesson]);

  // Fetch Teacher Profile for WhatsApp
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      // Use course_id directly from the module object
      if (!module.course_id) return;

      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('instructor')
          .eq('id', module.course_id)
          .single();

        if (courseError || !courseData) {
          console.error("Error fetching course:", courseError);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('phone, whatsapp_url')
          .eq('id', courseData.instructor)
          .single();

        if (profileError || !profileData) return;

        // Prioritize whatsapp_url, then phone
        let phone = profileData.whatsapp_url || profileData.phone;
        if (phone) {
          // Clean phone number if it's just a number
          phone = phone.replace(/\D/g, '');
          setTeacherPhone(phone);
        }
      } catch (err) {
        console.error("Error fetching teacher contact:", err);
      }
    };

    fetchTeacherProfile();
  }, [module.course_id]);

  // 🔍 DEBUG: WhatsApp Button Logic
  useEffect(() => {
    if (selectedLesson) {
      console.log('🔍 [LessonList] Debugging Support Button:', {
        lessonTitle: selectedLesson.title,
        enable_support_button: selectedLesson.enable_support_button,
        teacherPhone: teacherPhone,
        willRender: !!(selectedLesson.enable_support_button && teacherPhone)
      });
    }
  }, [selectedLesson, teacherPhone]);

  // ✅ Apple 3.1.1 Compliance: iOS users MUST use internal chat
  // WhatsApp could be interpreted as payment steering
  const handleSupportClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (window as any).Ionic?.platforms?.includes('ios');

    if (isIOS) {
      navigate('/teacher-chat');
      return;
    }

    // Android/Web: Can use WhatsApp
    if (!teacherPhone) {
      navigate('/teacher-chat');
      return;
    }
    const message = encodeURIComponent(`Olá! Estou com dúvida na aula "${selectedLesson?.title}" do módulo "${module.title}".`);
    window.open(`https://wa.me/${teacherPhone}?text=${message}`, '_blank');
  };

  const handleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
  };

  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;

  return (
    <div className="h-full overflow-y-auto bg-background animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-4 pt-8 pb-32">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 hover:bg-transparent"
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
          <div className="mb-6 space-y-4">
            <div className="rounded-xl overflow-hidden shadow-lg bg-black aspect-video">
              <NativeVideoPlayer
                videoUrl={videoUrl}
                autoPlay={false}
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{selectedLesson.title}</h2>
              {selectedLesson.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLesson.description}</p>
              )}
            </div>

            {selectedLesson.is_free && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">
                        🎓 Aula Gratuita
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Fale com seu professor para mais informações sobre o curso.
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

        {/* Support Button - Separated Section */}
        {selectedLesson && selectedLesson.enable_support_button && teacherPhone && (
          <div className="mb-8 mt-6 px-1">
            <Button
              onClick={handleSupportClick}
              className="w-full h-14 text-lg font-bold shadow-lg bg-[#25D366] hover:bg-[#128C7E] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-xl flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              Tirar Dúvidas no WhatsApp
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Fale diretamente com o professor sobre esta aula
            </p>
          </div>
        )}

        {/* Lessons List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Aulas do Módulo
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-destructive text-center py-4">Erro ao carregar aulas</p>
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma aula disponível, logo em breve as aulas estarão liberadas.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson: any, index: number) => {
                const lessonId = lesson.id || `lesson-${index}`;
                const isCompleted = completedLessons.has(lessonId);
                const isActive = selectedLesson?.id === lesson.id;

                return (
                  <Card
                    key={lessonId}
                    className={`cursor-pointer transition-all duration-200 border-l-4 ${isActive
                      ? 'border-l-primary ring-1 ring-primary/20 bg-accent/50'
                      : 'border-l-transparent hover:bg-accent/30'
                      }`}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </div>

                          <div>
                            <p className={`font-medium line-clamp-1 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{lesson.video_duration_minutes || 10} min</span>
                              </div>
                              {lesson.enable_support_button && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Suporte</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isCompleted && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLessonComplete(lessonId);
                            }}
                          >
                            <CheckCircle2 className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
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
    </div>
  );
};