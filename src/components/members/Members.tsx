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
import { useAllModules } from "@/hooks/useAllModules";


export const Members = () => {
  const { user } = useAuth();
  const { courses, loading } = useAllModules();
  const [selectedModule, setSelectedModule] = useState<any>(null);

  const handleModuleClick = (module: any) => {
    setSelectedModule(module);
  };

  if (selectedModule) {
    return (
      <ModuleDetail 
        module={selectedModule} 
        courseTitle={selectedModule.course_title}
        onBack={() => setSelectedModule(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-safe flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando módulos...</p>
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
                className="relative bg-gradient-to-br from-purple-900/80 to-purple-700/80 rounded-xl p-5 border border-purple-500/30 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden"
                onClick={() => handleModuleClick(course)}
              >
                {/* Badge no canto superior esquerdo */}
                <Badge className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white border-0">
                  Curso
                </Badge>
                
                {/* Botão Play no canto superior direito */}
                <Button 
                  size="icon" 
                  className="absolute top-4 right-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModuleClick(course);
                  }}
                >
                  <Play className="w-5 h-5 text-white" />
                </Button>
                
                <div className="pt-12">
                  <h4 className="text-xl font-bold text-white mb-1">{course.title}</h4>
                  
                  {course.modules && course.modules.length > 0 && (
                    <p className="text-sm text-white/80 mb-2">{course.modules.length} módulos</p>
                  )}
                  
                  {course.description && (
                    <p className="text-sm text-white/70 line-clamp-2 mb-4">{course.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {course.hasAccess ? (
                      <span className="text-xs text-green-300 font-medium">✓ Acesso liberado</span>
                    ) : (
                      <span className="text-xs text-yellow-300 font-medium">🔒 Alguns conteúdos bloqueados</span>
                    )}
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
