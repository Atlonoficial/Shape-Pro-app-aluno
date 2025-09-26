import { CheckCircle, Star, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeedbackSuccessProps {
  pointsAwarded: number;
  onClose: () => void;
}

export const FeedbackSuccess = ({ pointsAwarded, onClose }: FeedbackSuccessProps) => {
  return (
    <Card className="border-success/20 bg-success/5">
      <CardContent className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-success/20 p-3">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-success mb-2">
          Feedback Enviado!
        </h3>
        
        <p className="text-muted-foreground mb-4">
          Obrigado pelo seu feedback. Suas informações são muito importantes para acompanharmos sua evolução!
        </p>
        
        {pointsAwarded > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-warning/10 rounded-lg">
            <Trophy className="h-5 w-5 text-warning" />
            <span className="font-medium">
              Você ganhou {pointsAwarded} pontos!
            </span>
            <Star className="h-5 w-5 text-warning fill-current" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};