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
}

export const WeightInputModal = ({ isOpen, onClose, onSave }: WeightInputModalProps) => {
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
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seu peso. Tente novamente.",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Scale className="w-5 h-5" />
            Registrar Peso Semanal
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              É sexta-feira! Que tal registrar seu peso para acompanhar sua evolução?
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight">Peso atual (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Ex: 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="1"
              max="300"
              className="text-center text-lg"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1"
            >
              Pular
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !weight}
              className="flex-1 btn-primary"
            >
              {loading ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};