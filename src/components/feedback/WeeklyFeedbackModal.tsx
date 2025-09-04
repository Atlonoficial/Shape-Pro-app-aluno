import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MessageSquare, Dumbbell, Apple, HelpCircle } from 'lucide-react';
import { WeeklyFeedbackData } from '@/hooks/useWeeklyFeedback';

interface WeeklyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WeeklyFeedbackData) => Promise<boolean>;
  loading?: boolean;
}

export const WeeklyFeedbackModal = ({ isOpen, onClose, onSubmit, loading }: WeeklyFeedbackModalProps) => {
  const [formData, setFormData] = useState<WeeklyFeedbackData>({
    training_rating: 0,
    diet_rating: 0,
    general_feedback: '',
    training_feedback: '',
    diet_feedback: '',
    questions: ''
  });

  const handleSubmit = async () => {
    if (formData.training_rating === 0 || formData.diet_rating === 0 || !formData.general_feedback.trim()) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        training_rating: 0,
        diet_rating: 0,
        general_feedback: '',
        training_feedback: '',
        diet_feedback: '',
        questions: ''
      });
      onClose();
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (rating: number) => void; label: string }) => (
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

  const isValid = formData.training_rating > 0 && formData.diet_rating > 0 && formData.general_feedback.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Feedback Semanal
          </DialogTitle>
          <DialogDescription>
            Como foi sua semana? Conte para seu professor sobre seus treinos e dieta.
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
                value={formData.training_rating}
                onChange={(rating) => setFormData(prev => ({ ...prev, training_rating: rating }))}
                label="Como foram seus treinos esta semana?"
              />
              <div className="mt-3">
                <Label className="text-sm">Comentários sobre treinos (opcional)</Label>
                <Textarea
                  placeholder="Como se sentiu nos treinos, dificuldades, melhorias..."
                  value={formData.training_feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, training_feedback: e.target.value }))}
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
                value={formData.diet_rating}
                onChange={(rating) => setFormData(prev => ({ ...prev, diet_rating: rating }))}
                label="Como foi sua alimentação esta semana?"
              />
              <div className="mt-3">
                <Label className="text-sm">Comentários sobre alimentação (opcional)</Label>
                <Textarea
                  placeholder="Dificuldades com a dieta, mudanças, preferências..."
                  value={formData.diet_feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, diet_feedback: e.target.value }))}
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
              placeholder="Como se sentiu durante a semana? Há algo que gostaria de comentar ou melhorar?"
              value={formData.general_feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, general_feedback: e.target.value }))}
              className="min-h-[80px]"
              required
            />
          </div>

          {/* Questions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Dúvidas ou Perguntas (opcional)
            </Label>
            <Textarea
              placeholder="Tem alguma dúvida sobre treinos, alimentação ou gostaria de fazer alguma pergunta?"
              value={formData.questions}
              onChange={(e) => setFormData(prev => ({ ...prev, questions: e.target.value }))}
              className="min-h-[60px]"
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