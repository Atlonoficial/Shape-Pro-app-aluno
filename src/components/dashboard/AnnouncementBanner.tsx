import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const announcements = [
  {
    id: 1,
    type: "produto",
    title: "Novo Suplemento Proteico",
    description: "Descubra nossa nova linha de whey protein premium",
    image: "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png",
    action: "Ver Produto",
    gradient: "from-primary/10 to-primary-variant/10"
  },
  {
    id: 2,
    type: "noticia",
    title: "Nova Funcionalidade: IA Coach",
    description: "Agora com análise personalizada de treinos",
    image: "/lovable-uploads/2133926f-121d-45ce-8cff-80c84a1a0856.png",
    action: "Saiba Mais",
    gradient: "from-accent/10 to-accent-variant/10"
  },
  {
    id: 3,
    type: "produto",
    title: "Plano Premium em Oferta",
    description: "30% de desconto nos primeiros 3 meses",
    image: "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png",
    action: "Assinar Agora",
    gradient: "from-warning/10 to-warning-variant/10"
  }
];

export const AnnouncementBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-border/50">
      <div className={`bg-gradient-to-r ${currentAnnouncement.gradient} p-4`}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img 
              src={currentAnnouncement.image} 
              alt={currentAnnouncement.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                currentAnnouncement.type === 'produto' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-accent/20 text-accent'
              }`}>
                {currentAnnouncement.type === 'produto' ? '🛍️ Produto' : '📢 Notícia'}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
              {currentAnnouncement.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
              {currentAnnouncement.description}
            </p>
            <button className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-full transition-colors flex items-center gap-1">
              <span>{currentAnnouncement.action}</span>
              <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Controles de navegação */}
      <div className="absolute top-1/2 left-2 -translate-y-1/2">
        <button 
          onClick={prevBanner}
          className="w-6 h-6 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={12} />
        </button>
      </div>
      
      <div className="absolute top-1/2 right-2 -translate-y-1/2">
        <button 
          onClick={nextBanner}
          className="w-6 h-6 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {announcements.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-primary' 
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};