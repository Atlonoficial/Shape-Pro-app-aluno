import { useState } from "react";
import { Play, Package, Loader2, Users, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleDetail } from "./ModuleDetail";
import { StudentsList } from "./StudentsList";
import { StudentAssessments } from "./StudentAssessments";
import { ProductsShop } from "./ProductsShop";
import { useAuth } from "@/hooks/useAuth";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAllModules } from "@/hooks/useAllModules";
import { Student } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";


export const Members = () => {
  const { user, userProfile } = useAuth();
  const { student } = useStudentProfile();
  const { modules, loading } = useAllModules();
  const [activeTab, setActiveTab] = useState<'modules' | 'shop' | 'students'>('modules');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const navigate = useNavigate();

  const isTeacher = userProfile?.user_type === 'teacher';

  if (selectedModule) {
    return (
      <ModuleDetail 
        module={selectedModule} 
        courseTitle={selectedModule.course_title}
        onBack={() => setSelectedModule(null)} 
      />
    );
  }

  if (selectedStudent) {
    return (
      <StudentAssessments
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-8 pb-24">
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
        
        <Button className="btn-primary w-32 h-12 mb-6">
          <Play className="w-4 h-4 mr-2" />
          Assistir
        </Button>
      </div>

        {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setActiveTab('modules')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'modules' 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Módulos
        </Button>
        
        <Button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'shop' 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {isTeacher ? 'Produtos' : 'Loja'}
        </Button>
        
        {isTeacher && (
          <Button
            onClick={() => setActiveTab('students')}
            className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'students' 
                ? 'btn-primary' 
                : 'btn-secondary'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Alunos
          </Button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'modules' && (
        <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isTeacher ? 'Módulos Publicados' : 'Módulos Disponíveis'}
        </h3>
          
          {modules.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isTeacher 
                  ? 'Você ainda não publicou nenhum módulo. Acesse o Dashboard Professor para criar.' 
                  : 'Nenhum módulo disponível no momento'
                }
              </p>
              {isTeacher && (
                <Button 
                  onClick={() => navigate('/dashboard-professor')} 
                  className="mt-4"
                  variant="outline"
                >
                  Ir para Dashboard
                </Button>
              )}
            </div>
          ) : (
            <div className="px-1">
              <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {modules.map((module) => (
                  <div 
                    key={module.id}
                    onClick={() => setSelectedModule(module)}
                    className="relative w-40 flex-shrink-0 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer bg-card border border-border/50"
                  >
                    <div 
                      className="aspect-[2/3] bg-cover bg-center relative"
                      style={{ 
                        backgroundImage: module.cover_image_url ? `url(${module.cover_image_url})` : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-sm font-semibold text-white mb-1 leading-tight">{module.title}</h4>
                        <p className="text-xs text-white/80 leading-tight">{module.lessons_count} aulas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <ProductsShop />
      )}

      {activeTab === 'students' && isTeacher && (
        <StudentsList onSelectStudent={setSelectedStudent} />
      )}

    </div>
  );
};