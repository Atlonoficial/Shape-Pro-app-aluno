import { useState } from "react";
import { ArrowLeft, Play, Download, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  thumbnail: string;
  videoUrl: string;
}

interface ModuleDetailProps {
  moduleId: number;
  onBack: () => void;
}

const moduleContent = {
  1: {
    title: "Dieta Inteligente",
    description: "Aprenda a criar um plano alimentar inteligente e personalizado para seus objetivos",
    instructor: "Dra. Ana Carolina",
    totalLessons: 6,
    totalDuration: "2h 30min",
    currentVideo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800",
    lessons: [
      {
        id: 1,
        title: "Introdução",
        duration: "15:30",
        completed: true,
        thumbnail: "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png",
        videoUrl: "video1.mp4"
      },
      {
        id: 2,
        title: "Fundamentos da Nutrição",
        duration: "25:45",
        completed: true,
        thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video2.mp4"
      },
      {
        id: 3,
        title: "Macronutrientes Essenciais",
        duration: "18:20",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video3.mp4"
      },
      {
        id: 4,
        title: "Planejamento de Refeições",
        duration: "22:15",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video4.mp4"
      },
      {
        id: 5,
        title: "Suplementação Inteligente",
        duration: "20:30",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video5.mp4"
      },
      {
        id: 6,
        title: "Estratégias Avançadas",
        duration: "28:40",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video6.mp4"
      }
    ]
  },
  2: {
    title: "Metabolismo Feminino",
    description: "Entenda como funciona o metabolismo feminino e como otimizá-lo",
    instructor: "Dra. Ana Carolina",
    totalLessons: 5,
    totalDuration: "2h 15min",
    currentVideo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800",
    lessons: [
      {
        id: 1,
        title: "Introdução ao Metabolismo",
        duration: "18:45",
        completed: false,
        thumbnail: "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png",
        videoUrl: "video1.mp4"
      },
      {
        id: 2,
        title: "Hormônios e Metabolismo",
        duration: "24:30",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video2.mp4"
      },
      {
        id: 3,
        title: "Ciclos Femininos",
        duration: "19:15",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video3.mp4"
      },
      {
        id: 4,
        title: "Otimização Metabólica",
        duration: "26:20",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video4.mp4"
      },
      {
        id: 5,
        title: "Estratégias Práticas",
        duration: "21:10",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video5.mp4"
      }
    ]
  },
  3: {
    title: "Metabolismo Energético",
    description: "Potencialize seu metabolismo e queime gordura de forma eficiente",
    instructor: "Dra. Ana Carolina",
    totalLessons: 4,
    totalDuration: "1h 45min",
    currentVideo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=800",
    lessons: [
      {
        id: 1,
        title: "Como Acelerar o Metabolismo",
        duration: "20:15",
        completed: false,
        thumbnail: "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png",
        videoUrl: "video1.mp4"
      },
      {
        id: 2,
        title: "Exercícios Metabólicos",
        duration: "30:30",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video2.mp4"
      },
      {
        id: 3,
        title: "Termogênese e Queima de Gordura",
        duration: "25:45",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video3.mp4"
      },
      {
        id: 4,
        title: "Estratégias Avançadas",
        duration: "28:30",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video4.mp4"
      }
    ]
  },
  4: {
    title: "Dieta Detox",
    description: "Desintoxique seu corpo e potencialize os resultados",
    instructor: "Dra. Ana Carolina",
    totalLessons: 5,
    totalDuration: "2h 10min",
    currentVideo: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800",
    lessons: [
      {
        id: 1,
        title: "Princípios da Detoxificação",
        duration: "22:00",
        completed: false,
        thumbnail: "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png",
        videoUrl: "video1.mp4"
      },
      {
        id: 2,
        title: "Alimentos Detox",
        duration: "25:15",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video2.mp4"
      },
      {
        id: 3,
        title: "Planejamento Detox",
        duration: "28:45",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video3.mp4"
      },
      {
        id: 4,
        title: "Receitas Detox",
        duration: "26:30",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video4.mp4"
      },
      {
        id: 5,
        title: "Mantendo os Resultados",
        duration: "27:30",
        completed: false,
        thumbnail: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400",
        videoUrl: "video5.mp4"
      }
    ]
  }
};

export const ModuleDetail = ({ moduleId, onBack }: ModuleDetailProps) => {
  const [selectedLesson, setSelectedLesson] = useState(1);
  const module = moduleContent[moduleId as keyof typeof moduleContent];
  
  if (!module) {
    return (
      <div className="p-4 pt-8 pb-24">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p>Módulo não encontrado</p>
      </div>
    );
  }

  const currentLesson = module.lessons.find(lesson => lesson.id === selectedLesson);

  return (
    <div className="pb-24">
      {/* Header with back button */}
      <div className="p-4 pt-8">
        <Button onClick={onBack} variant="ghost" className="mb-4 text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Início
        </Button>
        
        <h1 className="text-xl font-bold text-foreground mb-2">{module.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">{module.description}</p>
      </div>

      {/* Video Player Area */}
      <div className="relative aspect-video bg-background mx-4 rounded-lg overflow-hidden mb-6">
        <img 
          src={currentLesson?.thumbnail || module.currentVideo}
          alt={currentLesson?.title || module.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <Button size="lg" className="btn-accent w-16 h-16 rounded-full p-0">
            <Play className="w-6 h-6 ml-1" />
          </Button>
        </div>
        
        {/* Video Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white font-semibold text-lg mb-1">
            {currentLesson?.title || "Introdução"}
          </h2>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentLesson?.duration || "15:30"}
            </span>
            <span>•</span>
            <span>{module.instructor}</span>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Aulas</h3>
          <span className="text-sm text-muted-foreground">
            {module.lessons.filter(l => l.completed).length}/{module.totalLessons} completas
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Conteúdo</span>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="px-4 space-y-3">
        {module.lessons.map((lesson, index) => (
          <div 
            key={lesson.id}
            onClick={() => setSelectedLesson(lesson.id)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedLesson === lesson.id 
                ? 'bg-primary/10 border border-primary/20' 
                : 'bg-card hover:bg-muted/50'
            }`}
          >
            {/* Lesson Thumbnail */}
            <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={lesson.thumbnail}
                alt={lesson.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                {lesson.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Play className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            {/* Lesson Info */}
            <div className="flex-1">
              <h4 className={`font-medium text-sm mb-1 ${
                selectedLesson === lesson.id ? 'text-primary' : 'text-foreground'
              }`}>
                {lesson.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{lesson.duration}</span>
                {lesson.completed && (
                  <>
                    <span>•</span>
                    <span className="text-green-500">Concluída</span>
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
        ))}
      </div>
    </div>
  );
};