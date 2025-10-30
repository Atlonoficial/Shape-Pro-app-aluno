import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Calendar, User, Send, TrendingUp, Apple, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedbackDetailCardProps {
  feedback: {
    id: string;
    student_id: string;
    rating: number;
    message: string;
    created_at: string;
    type: string;
    metadata: any;
    student_name?: string;
    student_email?: string;
    teacher_response?: string;
    responded_at?: string;
  };
  response: string;
  onResponseChange: (value: string) => void;
  onSubmitResponse: () => void;
  isSubmitting: boolean;
}

export const FeedbackDetailCard = ({ 
  feedback, 
  response, 
  onResponseChange, 
  onSubmitResponse, 
  isSubmitting 
}: FeedbackDetailCardProps) => {
  const metadata = feedback.metadata || {};
  
  // Star display component
  const StarDisplay = ({ rating, maxRating = 5 }: { rating: number; maxRating?: number }) => (
    <div className="flex gap-1">
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {rating}/{maxRating}
      </span>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {feedback.student_name || 'Aluno'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {feedback.student_email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={feedback.teacher_response ? "default" : "secondary"}>
              {feedback.teacher_response ? 'Respondido' : 'Pendente'}
            </Badge>
            <Badge variant="outline">
              {metadata.version || 'v1'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Data e Período */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(feedback.created_at), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          {metadata.period && (
            <div className="text-xs">
              Período: {metadata.period}
            </div>
          )}
        </div>

        {/* Avaliações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avaliação Geral */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Geral</span>
            </div>
            <StarDisplay rating={feedback.rating} />
          </div>

          {/* Avaliação de Treino */}
          {metadata.training_rating && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Treino</span>
              </div>
              <StarDisplay rating={metadata.training_rating} />
            </div>
          )}

          {/* Avaliação de Dieta */}
          {metadata.diet_rating && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Apple className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Dieta</span>
              </div>
              <StarDisplay rating={metadata.diet_rating} />
            </div>
          )}
        </div>

        {/* Feedback Geral */}
        {feedback.message && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback Geral
            </h4>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Feedbacks Específicos */}
        {(metadata.training_feedback || metadata.diet_feedback) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metadata.training_feedback && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-green-500" />
                  Treino
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{metadata.training_feedback}</p>
                </div>
              </div>
            )}

            {metadata.diet_feedback && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Apple className="h-4 w-4 text-orange-500" />
                  Dieta
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{metadata.diet_feedback}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Perguntas Adicionais */}
        {metadata.questions && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Perguntas/Observações</h4>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{metadata.questions}</p>
            </div>
          </div>
        )}

        {/* Resposta do Professor */}
        {feedback.teacher_response ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sua Resposta</h4>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm">{feedback.teacher_response}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Enviado em {format(new Date(feedback.responded_at!), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Responder ao Aluno</h4>
            <Textarea
              placeholder="Digite sua resposta para este feedback..."
              value={response}
              onChange={(e) => onResponseChange(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={onSubmitResponse}
              disabled={!response.trim() || isSubmitting}
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};