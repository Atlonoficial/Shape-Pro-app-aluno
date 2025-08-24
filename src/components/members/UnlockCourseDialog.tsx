import { useState } from 'react';
import { Lock, Crown, CheckCircle, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnlockRequests } from '@/hooks/useUnlockRequests';

interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  instructor: string;
  total_lessons?: number;
}

interface UnlockCourseDialogProps {
  course: Course | null;
  onClose: () => void;
  requestStatus: 'none' | 'pending' | 'approved' | 'rejected';
}

export const UnlockCourseDialog = ({ course, onClose, requestStatus }: UnlockCourseDialogProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { createUnlockRequest } = useUnlockRequests();

  if (!course) return null;

  const handleUnlockRequest = async () => {
    setIsRequesting(true);
    const success = await createUnlockRequest(course.id, course.instructor);
    setIsRequesting(false);
    
    if (success) {
      // Close dialog after successful request
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const getStatusContent = () => {
    switch (requestStatus) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          title: "Solicitação Pendente",
          description: "Sua solicitação foi enviada ao professor e está aguardando aprovação.",
          buttonText: "Aguardando...",
          buttonDisabled: true,
          badgeColor: "bg-yellow-500/10 text-yellow-600 border-yellow-200"
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          title: "Curso Liberado!",
          description: "O professor aprovou sua solicitação. Você já pode acessar o curso.",
          buttonText: "Acessar Curso",
          buttonDisabled: false,
          badgeColor: "bg-green-500/10 text-green-600 border-green-200"
        };
      case 'rejected':
        return {
          icon: <X className="w-5 h-5 text-red-500" />,
          title: "Solicitação Recusada",
          description: "O professor não aprovou sua solicitação no momento.",
          buttonText: "Solicitar Novamente",
          buttonDisabled: false,
          badgeColor: "bg-red-500/10 text-red-600 border-red-200"
        };
      default:
        return {
          icon: <Lock className="w-5 h-5 text-primary" />,
          title: "Curso Premium",
          description: "Este é um curso pago. Solicite ao professor para ter acesso ao conteúdo.",
          buttonText: "Solicitar Desbloqueio",
          buttonDisabled: false,
          badgeColor: "bg-primary/10 text-primary border-primary/20"
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <Dialog open={!!course} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Curso Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Cover */}
          <div 
            className="aspect-video rounded-lg bg-cover bg-center relative overflow-hidden"
            style={{ 
              backgroundImage: course.thumbnail 
                ? `url(${course.thumbnail})` 
                : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium">Conteúdo Bloqueado</p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground text-lg">{course.title}</h3>
              <Badge className={`${statusContent.badgeColor} text-xs`}>
                Premium
              </Badge>
            </div>
            
            {course.description && (
              <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {course.total_lessons && (
                <span>{course.total_lessons} aulas</span>
              )}
              {course.price && (
                <span className="font-medium text-primary">
                  R$ {course.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              {statusContent.icon}
              <h4 className="font-medium text-foreground">{statusContent.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{statusContent.description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              variant="outline" 
              className="flex-1"
            >
              Fechar
            </Button>
            <Button 
              onClick={requestStatus === 'approved' ? onClose : handleUnlockRequest}
              disabled={statusContent.buttonDisabled || isRequesting}
              className="flex-1"
            >
              {isRequesting ? "Enviando..." : statusContent.buttonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};