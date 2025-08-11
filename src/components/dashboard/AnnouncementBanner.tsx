import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useBanners } from "@/hooks/useFirebaseStubs";

export const AnnouncementBanner = () => {
  const { user } = useAuthContext();
  const { banners, loading } = useBanners(user?.id);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotaciona automaticamente
  useEffect(() => {
    if (!banners.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const current = banners[currentIndex];

  const gradient = useMemo(() => {
    const type = (current as any)?.type || (current as any)?.category || 'campanha';
    if (type === 'produto') return 'from-primary/10 to-primary-variant/10';
    if (type === 'noticia') return 'from-accent/10 to-accent-variant/10';
    return 'from-warning/10 to-warning-variant/10';
  }, [current]);

  const imageSrc = (current as any)?.image_url || (current as any)?.image || (current as any)?.cover_url || 
    "/lovable-uploads/65cd0e38-8355-4d41-8be9-a292750e3daa.png";
  const actionLabel = (current as any)?.action_label || (current as any)?.action || 'Saiba Mais';
  const linkUrl = (current as any)?.link_url || (current as any)?.url || undefined;
  const tagType = (current as any)?.type || 'campanha';

  const handleClick = () => {
    if (linkUrl) window.open(linkUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border/50">
        <div className="bg-gradient-to-r from-muted/10 to-muted/20 p-4">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-lg bg-muted" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3 mb-3" />
              <div className="h-7 bg-muted rounded w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!banners.length) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-border/50">
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img
              src={imageSrc}
              alt={current?.title || 'Campanha'}
              className="w-16 h-16 rounded-lg object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                tagType === 'produto' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
              }`}>
                {tagType === 'produto' ? '🛍️ Produto' : '📢 Campanha'}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
              {current?.title}
            </h3>
            {current?.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {current.description}
              </p>
            )}
            <button onClick={handleClick} className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-full transition-colors flex items-center gap-1">
              <span>{actionLabel}</span>
              <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="absolute top-1/2 left-2 -translate-y-1/2">
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          className="w-6 h-6 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={12} />
        </button>
      </div>

      <div className="absolute top-1/2 right-2 -translate-y-1/2">
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
          className="w-6 h-6 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
