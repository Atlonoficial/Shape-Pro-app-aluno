import { useState, useEffect } from "react";
import { Play, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleDetail } from "./ModuleDetail";
import { useAuth } from "@/hooks/useAuth";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { getCoursesByUser, Course } from "@/lib/firestore";


export const Members = () => {
  const { user } = useAuth();
  const { student } = useStudentProfile();
  const [activeTab, setActiveTab] = useState<'courses' | 'products'>('courses');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      if (!student?.teacherId) {
        setLoading(false);
        return;
      }

      try {
        const unsubscribe = getCoursesByUser(student.teacherId, (coursesData) => {
          setCourses(coursesData);
          setLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error loading courses:', error);
        setLoading(false);
      }
    };

    loadCourses();
  }, [student?.teacherId]);

  if (selectedModule) {
    return (
      <ModuleDetail 
        moduleId={selectedModule} 
        onBack={() => setSelectedModule(null)} 
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
        
        <Button
          onClick={() => setActiveTab('products')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'products' 
              ? 'bg-gradient-to-r from-warning to-warning/80 text-warning-foreground font-semibold shadow-[0_4px_14px_hsl(var(--warning)/0.4)] hover:shadow-[0_6px_20px_hsl(var(--warning)/0.6)] hover:scale-105 active:scale-95' 
              : 'btn-secondary'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Produtos
        </Button>
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
            <div className="grid grid-cols-2 gap-4">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  onClick={() => setSelectedModule(course.id)}
                  className="relative card-gradient overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div 
                    className="aspect-square bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: course.thumbnail ? `url(${course.thumbnail})` : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-sm font-semibold text-white mb-1">{course.title}</h4>
                      <p className="text-xs text-white/70">{course.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Produtos Físicos</h3>
          
          <div className="space-y-4">
            {products.map((product) => (
              <div 
                key={product.id}
                className="card-gradient p-4 hover:scale-105 transition-all duration-300"
              >
                <div className="flex gap-4">
                  <div 
                    className="w-16 h-16 bg-cover bg-center rounded-lg"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-1">{product.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">{product.description}</p>
                    <p className="text-sm sm:text-base font-bold text-warning">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <Button 
                    size="sm"
                    className="self-end bg-gradient-to-r from-warning to-warning/80 text-warning-foreground font-semibold shadow-[0_4px_14px_hsl(var(--warning)/0.4)] hover:shadow-[0_6px_20px_hsl(var(--warning)/0.6)] hover:scale-105 active:scale-95 h-9 px-4"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Comprar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};