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
      {/* Header Simplificado */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h1 className="text-2xl font-bold text-foreground text-center flex-1">
          {course?.title || 'Aulas'}
        </h1>
        
        <div className="w-9" /> {/* Spacer para centralizar o título */}
      </div>

      {/* Grid de Módulos */}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {modules.map((module: any, index: number) => (
            <Card
              key={module.id || index}
              className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg group overflow-hidden"
              onClick={() => setSelectedModule(module)}
            >
              <CardContent className="p-0">
                {/* Module Cover - Aspect ratio mais quadrado */}
                <div
                  className="aspect-[4/3] bg-cover bg-center relative"
                  style={{
                    backgroundImage: module.cover 
                      ? `url(${module.cover})` 
                      : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 50%, hsl(var(--secondary)) 100%)'
                  }}
                >
                  {/* Gradiente overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Play button centralizado */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                  
                  {/* Informações no bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                      {module.name || module.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/80">
                        {Array.isArray(module.lessons) ? module.lessons.length : 0} aulas
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};