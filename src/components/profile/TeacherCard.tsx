import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { MessageCircle, Instagram, Facebook, Phone, Youtube } from "lucide-react";
import { useTeacherProfile } from "@/hooks/useTeacherProfile";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useNavigate } from "react-router-dom";

export const TeacherCard = () => {
  const { teacher, loading } = useTeacherProfile();
  const unreadCount = useUnreadMessages();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded mb-3 w-32"></div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return null;
  }

  const handleChatClick = () => {
    // Navigate to chat or open chat dialog
    navigate('/chat');
  };

  const handleInstagramClick = () => {
    if (teacher.instagram_url) {
      window.open(teacher.instagram_url, '_blank');
    }
  };

  const handleFacebookClick = () => {
    if (teacher.facebook_url) {
      window.open(teacher.facebook_url, '_blank');
    }
  };

  const handleYouTubeClick = () => {
    if (teacher.youtube_url) {
      window.open(teacher.youtube_url, '_blank');
    }
  };

  const handleWhatsAppClick = () => {
    // Prioriza whatsapp_url sobre whatsapp_number
    if (teacher.whatsapp_url) {
      window.open(teacher.whatsapp_url, '_blank');
    } else if (teacher.whatsapp_number) {
      const message = encodeURIComponent('Olá! Vim através do app Shape Pro.');
      window.open(`https://wa.me/${teacher.whatsapp_number.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-foreground">Meu Treinador</h3>
      <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src={teacher.avatar_url} alt={teacher.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {teacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{teacher.name}</h4>
              {teacher.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{teacher.bio}</p>
              )}
              
              {teacher.specialties && teacher.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {teacher.specialties.slice(0, 3).map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {teacher.specialties.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{teacher.specialties.length - 3} mais</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex gap-2">
              {teacher.instagram_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInstagramClick}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              )}
              
              {teacher.facebook_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFacebookClick}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
              )}
              
              {teacher.youtube_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleYouTubeClick}
                  className="h-8 w-8 p-0 hover:bg-red-600/10 hover:text-red-600"
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              )}
              
              {(teacher.whatsapp_url || teacher.whatsapp_number) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWhatsAppClick}
                  className="h-8 w-8 p-0 hover:bg-green-600/10 hover:text-green-600"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              onClick={handleChatClick}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground relative"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
              <NotificationBadge count={unreadCount} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};