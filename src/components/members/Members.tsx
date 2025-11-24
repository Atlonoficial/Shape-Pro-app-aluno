/**
 * SHAPE PRO - APP DO ALUNO - ÁREA DE MEMBROS
 * 
 * Este componente exibe APENAS os cursos publicados pelo professor.
 * Criação/edição de conteúdo é feita no Dashboard Professor (projeto separado).
 */
import { useState } from "react";
import { Play, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleDetail } from "./ModuleDetail";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/hooks/useCourses";


export const Members = () => {
  const { user } = useAuth();
  const { courses, loading } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  console.log('Members Debug:', { coursesCount: courses.length, loading, courses });

  const handleCourseClick = (course: any) => {
    setSelectedCourse(course);
  };

  if (selectedCourse) {
    return (
      <ModuleDetail
        module={selectedCourse}
        courseTitle={selectedCourse.title}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-safe flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-8 pb-safe">
      {/* Header */}
      <div className="mb-6 text-center">
        {/* Logo */}
        <div className="mb-4">
          <img
            src="/lovable-uploads/2133926f-121d-45ce-8cff-80c84a1a0856.png"
            alt="Shape Pro Logo"
            className="w-32 h-auto mx-auto"
          />
        </div>

        {/* Welcome Text */}
        <h1 className="text-2xl font-bold text-foreground mb-2">Bem-vindo,</h1>
        <h2 className="text-xl text-foreground mb-4">Área de membros!</h2>
      </div>

      {/* Courses Content */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {courses.length === 0
            ? 'Cursos Disponíveis'
            : courses.length === 1
              ? `Curso: ${courses[0].title}`
              : 'Cursos Disponíveis'}
        </h3>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum curso disponível ainda
            </h3>
            <p className="text-muted-foreground">
              Aguarde publicações do seu professor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => handleCourseClick(course)}
              >
                {/* Cover Image */}
                <div className="absolute inset-0 bg-muted">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-0 hover:bg-white/30">
                        Curso
                      </Badge>

                      {!course.is_published && (
                        <Badge variant="secondary" className="bg-yellow-500/80 text-white border-0 backdrop-blur-md">
                          Rascunho
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="icon"
                      className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border-0 w-10 h-10"
                    >
                      <Play className="w-5 h-5 text-white fill-white" />
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
                      {course.title}
                    </h4>

                    {course.description && (
                      <p className="text-sm text-white/80 line-clamp-1 mb-3 font-light">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Simplificação: Assumimos liberado se listado, pois useCourses já filtra */}
                      <span className="text-xs text-green-300 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Acesso liberado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
