import { useState, useEffect } from "react";
import { ArrowLeft, Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ModuleDetail } from "./ModuleDetail";

interface CourseModule {
  id: string;
  name: string;
  description: string;
  cover?: string;
  lessons: any[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  modules: any;
}

interface CourseModulesProps {
  courseId: string;
  onBack: () => void;
}

export const CourseModules = ({ courseId, onBack }: CourseModulesProps) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error('Error fetching course:', courseError);
          return;
        }

        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (selectedModule) {
    return (
      <ModuleDetail
        module={selectedModule}
        courseTitle={course?.title}
        onBack={() => setSelectedModule(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  const modules = Array.isArray(course?.modules) ? course.modules : [];

  return (
    <div className="p-4 pt-8 pb-24">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar aos Cursos
      </Button>

      {/* Course Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {course?.thumbnail && (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
            <p className="text-muted-foreground">{course?.description}</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Módulos do Curso
        </h3>

        {modules.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Este curso ainda não possui módulos disponíveis.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((module: any, index: number) => (
              <Card
                key={module.id || index}
                className="cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:scale-105"
                onClick={() => setSelectedModule(module)}
              >
                <CardContent className="p-0">
                  {/* Module Cover */}
                  <div
                    className="aspect-video bg-cover bg-center relative rounded-t-lg"
                    style={{
                      backgroundImage: module.cover 
                        ? `url(${module.cover})` 
                        : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-t-lg" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="text-xs text-white/80">
                          {Array.isArray(module.lessons) ? module.lessons.length : 0} aulas
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module Info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-foreground mb-1">
                      {module.name || module.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};