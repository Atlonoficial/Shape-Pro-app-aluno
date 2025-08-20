import { useState } from "react";
import { Play, Package, Loader2, Users, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleDetail } from "./ModuleDetail";
import { StudentsList } from "./StudentsList";
import { StudentAssessments } from "./StudentAssessments";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { useAuth } from "@/hooks/useAuth";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useCourses } from "@/hooks/useCourses";
import { Student } from "@/lib/supabase";


export const Members = () => {
  const { user, userProfile } = useAuth();
  const { student } = useStudentProfile();
  const { courses, loading } = useCourses();
  const [activeTab, setActiveTab] = useState<'courses' | 'students'>('courses');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const isTeacher = userProfile?.user_type === 'teacher';

  if (selectedModule) {
    return (
      <ModuleDetail 
        moduleId={selectedModule} 
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
          <p className="text-muted-foreground">Carregando cursos...</p>
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
          onClick={() => setActiveTab('courses')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'courses' 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Cursos
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
      {activeTab === 'courses' && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Cursos Disponíveis</h3>
          
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum curso disponível no momento</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => setSelectedModule(course.id)}
                    className="relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer bg-card border border-border/50"
                  >
                    <div 
                      className="aspect-square bg-cover bg-center relative"
                      style={{ 
                        backgroundImage: course.thumbnail ? `url(${course.thumbnail})` : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="text-xs font-semibold text-white mb-0.5 leading-tight">{course.title}</h4>
                        <p className="text-[10px] text-white/80 leading-tight">{course.category || 'Curso'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Banner System */}
              <AnnouncementBanner />
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && isTeacher && (
        <StudentsList onSelectStudent={setSelectedStudent} />
      )}

    </div>
  );
};