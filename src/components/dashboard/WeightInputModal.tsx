import { useState } from 'react';
import { Scale, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface WeightInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number) => Promise<boolean>;
  error?: string | null;
}

export const WeightInputModal = ({ isOpen, onClose, onSave, error }: WeightInputModalProps) => {
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const weightValue = parseFloat(weight);
    
    if (!weightValue || weightValue <= 0 || weightValue > 300) {
      toast({
        title: "Peso inválido",
        description: "Por favor, insira um peso válido entre 1 e 300 kg.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const success = await onSave(weightValue);
    
    if (success) {
      toast({
        title: "Peso registrado!",
        description: `Seu peso de ${weightValue}kg foi salvo com sucesso.`,
      });
      setWeight('');
      onClose();
    } else {
      // Show the specific error from the hook if available
      const errorMessage = error || "Não foi possível salvar seu peso. Tente novamente.";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleSkip = () => {
    setWeight('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 sm:mx-0 sm:max-w-md w-full max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary text-base sm:text-lg">
            <Scale className="w-5 h-5" />
            <span className="text-sm sm:text-base">
              Registrar Peso - {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long',
                day: '2-digit',
                month: 'short'
              })}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2 sm:py-4">
          <div className="text-center px-2">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Registre seu peso semanal para acompanhar sua evolução!
            </p>
          </div>
          
          <div className="space-y-2 px-2">
            <Label htmlFor="weight" className="text-sm">Peso atual (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Ex: 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="1"
              max="300"
              className="text-center text-base sm:text-lg h-12"
            />
          </div>
          
          <div className="flex gap-2 pt-2 px-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 h-10"
            >
              Pular
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !weight}
              className="flex-1 h-10"
            >
              {loading ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};