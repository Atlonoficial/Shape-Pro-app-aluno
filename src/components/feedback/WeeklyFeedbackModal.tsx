import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MessageSquare, Dumbbell, Apple, HelpCircle } from 'lucide-react';

export interface WeeklyFeedbackData {
  training_rating: number;
  diet_rating: number;
  general_feedback: string;
  training_feedback?: string;
  diet_feedback?: string;
  questions?: string;
  custom_responses?: { [key: string]: any };
}

interface WeeklyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WeeklyFeedbackData) => Promise<boolean>;
  loading?: boolean;
  customQuestions?: Array<{
    id: string;
    text: string;
    type: 'text' | 'rating' | 'multiple_choice';
    options?: string[];
    required: boolean;
  }>;
  feedbackFrequency?: string;
}

export const WeeklyFeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false, 
  customQuestions = [], 
  feedbackFrequency = 'semanal' 
}: WeeklyFeedbackModalProps) => {
  const [feedbackData, setFeedbackData] = useState<WeeklyFeedbackData>({
    training_rating: 0,
    diet_rating: 0,
    general_feedback: "",
    training_feedback: "",
    diet_feedback: "",
    questions: "",
    custom_responses: {}
  });

  const handleSubmit = async () => {
    if (!isValid) return;
    
    const success = await onSubmit(feedbackData);
    if (success) {
      setFeedbackData({
        training_rating: 0,
        diet_rating: 0,
        general_feedback: "",
        training_feedback: "",
        diet_feedback: "",
        questions: "",
        custom_responses: {}
      });
      onClose();
    }
  };

  const handleCustomResponse = (questionId: string, value: any) => {
    setFeedbackData(prev => ({
      ...prev,
      custom_responses: {
        ...prev.custom_responses,
        [questionId]: value
      }
    }));
  };

  const checkCustomQuestionValidity = () => {
    for (const question of customQuestions) {
      if (question.required) {
        const response = feedbackData.custom_responses?.[question.id];
        if (!response || (typeof response === 'string' && response.trim().length === 0)) {
          return false;
        }
      }
    }
    return true;
  };

  const isValid = feedbackData.training_rating > 0 && 
                  feedbackData.diet_rating > 0 && 
                  feedbackData.general_feedback.trim().length > 0 &&
                  checkCustomQuestionValidity();

  const StarRating = ({ label, value, onChange, questionId }: {
    questionId?: string;
    label: string;
    value: number;
    onChange: (rating: number) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors hover:scale-110"
          >
            <Star
              size={24}
              className={star <= value ? 'fill-warning text-warning' : 'text-muted-foreground'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback {feedbackFrequency}</DialogTitle>
          <DialogDescription>
            Como foi seu período? Compartilhe seu feedback sobre treinos e dieta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Training Rating */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Treinos</h4>
              </div>
              <StarRating
                value={feedbackData.training_rating}
                onChange={(rating) => setFeedbackData(prev => ({ ...prev, training_rating: rating }))}
                label="Como foram seus treinos neste período?"
              />
              <div className="mt-3">
                <Label className="text-sm">Comentários sobre treinos (opcional)</Label>
                <Textarea
                  placeholder="Como se sentiu nos treinos, dificuldades, melhorias..."
                  value={feedbackData.training_feedback}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, training_feedback: e.target.value }))}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Diet Rating */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Apple className="h-4 w-4 text-secondary" />
                <h4 className="font-medium">Alimentação</h4>
              </div>
              <StarRating
                value={feedbackData.diet_rating}
                onChange={(rating) => setFeedbackData(prev => ({ ...prev, diet_rating: rating }))}
                label="Como foi sua alimentação neste período?"
              />
              <div className="mt-3">
                <Label className="text-sm">Comentários sobre alimentação (opcional)</Label>
                <Textarea
                  placeholder="Dificuldades com a dieta, mudanças, preferências..."
                  value={feedbackData.diet_feedback}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, diet_feedback: e.target.value }))}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* General Feedback */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback Geral *
            </Label>
            <Textarea
              placeholder="Como se sentiu durante este período? Há algo que gostaria de comentar ou melhorar?"
              value={feedbackData.general_feedback}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, general_feedback: e.target.value }))}
              className="min-h-[80px]"
              required
            />
          </div>

          {/* Perguntas personalizadas */}
          {customQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Perguntas Adicionais</h3>
              {customQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id}>
                    {question.text} {question.required && <span className="text-red-500">*</span>}
                  </Label>
                  
                  {question.type === 'text' && (
                    <Textarea
                      id={question.id}
                      placeholder="Digite sua resposta..."
                      value={feedbackData.custom_responses?.[question.id] || ''}
                      onChange={(e) => handleCustomResponse(question.id, e.target.value)}
                      className="min-h-[80px]"
                    />
                  )}
                  
                  {question.type === 'rating' && (
                    <StarRating
                      questionId={question.id}
                      label=""
                      value={feedbackData.custom_responses?.[question.id] || 0}
                      onChange={(value) => handleCustomResponse(question.id, value)}
                    />
                  )}
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`${question.id}_${index}`}
                            name={question.id}
                            value={option}
                            checked={feedbackData.custom_responses?.[question.id] === option}
                            onChange={(e) => handleCustomResponse(question.id, e.target.value)}
                          />
                          <Label htmlFor={`${question.id}_${index}`}>{option}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Perguntas adicionais */}
          <div className="space-y-3">
            <Label htmlFor="questions">Dúvidas ou sugestões? (Opcional)</Label>
            <Textarea
              id="questions"
              placeholder="Tem alguma dúvida ou sugestão para seu professor?"
              value={feedbackData.questions}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, questions: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1"
            disabled={!isValid || loading}
          >
            {loading ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};