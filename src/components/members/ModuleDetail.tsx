import { useState, useEffect } from "react";
import { ArrowLeft, Play, Download, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course } from "@/lib/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ModuleDetailProps {
  moduleId: string;
  onBack: () => void;
}

export const ModuleDetail = ({ moduleId, onBack }: ModuleDetailProps) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(0);

  useEffect(() => {
    const loadCourse = () => {
      try {
        const courseRef = doc(db, 'courses', moduleId);
        const unsubscribe = onSnapshot(courseRef, (doc) => {
          if (doc.exists()) {
            setCourse({ id: doc.id, ...doc.data() } as Course);
          } else {
            setCourse(null);
          }
          setLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error loading course:', error);
        setLoading(false);
      }
    };

    loadCourse();
  }, [moduleId]);

  if (loading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 pt-8 pb-24">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p>Curso não encontrado</p>
      </div>
    );
  }

  const currentModule = course.modules?.[selectedLesson];

  return (
    <div className="pb-24">
      {/* Header with back button */}
      <div className="p-4 pt-8">
        <Button onClick={onBack} variant="ghost" className="mb-4 text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Início
        </Button>
        
        <h1 className="text-xl font-bold text-foreground mb-2">{course.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
      </div>

      {/* Video Player Area */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 mx-4 rounded-lg overflow-hidden mb-6 border border-border/30">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Button size="lg" className="btn-accent w-16 h-16 rounded-full p-0 mb-4 shadow-lg">
              <Play className="w-6 h-6 ml-1" />
            </Button>
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-white/90 text-sm font-medium">Clique para assistir</p>
            </div>
          </div>
        </div>
        
        {/* Video Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white font-semibold text-lg mb-1">
            {currentModule?.title || course.title}
          </h2>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentModule?.duration ? `${currentModule.duration}min` : "0:00"}
            </span>
            <span>•</span>
            <span>{course.instructor || "Instrutor"}</span>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Módulos</h3>
          <span className="text-sm text-muted-foreground">
            {course.modules?.length || 0} módulos
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Conteúdo</span>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="px-4 space-y-3">
        {course.modules && course.modules.length > 0 ? (
          course.modules.map((module, index) => (
            <div 
              key={module.id}
              onClick={() => setSelectedLesson(index)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedLesson === index 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-card hover:bg-muted/50'
              }`}
            >
              {/* Lesson Thumbnail */}
              <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  {module.isPreview ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Play className="w-3 h-3 text-primary" />
                  )}
                </div>
              </div>

              {/* Lesson Info */}
              <div className="flex-1">
                <h4 className={`font-medium text-sm mb-1 ${
                  selectedLesson === index ? 'text-primary' : 'text-foreground'
                }`}>
                  {module.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{module.duration ? `${module.duration}min` : "0:00"}</span>
                  {module.isPreview && (
                    <>
                      <span>•</span>
                      <span className="text-green-500">Preview</span>
                    </>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <Button 
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum módulo disponível</p>
          </div>
        )}
      </div>
    </div>
  );
};