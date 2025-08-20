import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
import { useTeacherLocations } from '@/hooks/useTeacherLocations';

interface BookingFormData {
  type: 'consultation' | 'training' | 'assessment';
  title: string;
  objective: string;
  notes: string;
  location_id: string;
}

interface BookingConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (formData: BookingFormData) => Promise<void>;
  selectedSlot: {
    slot_start: string;
    slot_end: string;
    slot_minutes: number;
    slot_teacher_id: string;
  } | null;
  loading?: boolean;
}

const sessionTypes = [
  { value: 'consultation', label: 'Consulta/Orientação' },
  { value: 'training', label: 'Sessão de Treino' },
  { value: 'assessment', label: 'Avaliação Física' },
];

export function BookingConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedSlot,
  loading = false,
}: BookingConfirmationDialogProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    type: 'consultation',
    title: '',
    objective: '',
    notes: '',
    location_id: '',
  });

  const { locations, loading: locationsLoading } = useTeacherLocations(selectedSlot?.slot_teacher_id);

  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onConfirm({
        type: formData.type,
        title: formData.title,
        objective: formData.objective,
        notes: formData.notes,
        location_id: formData.location_id,
      });
      
      // Reset form apenas se sucesso
      setFormData({
        type: 'consultation',
        title: '',
        objective: '',
        notes: '',
        location_id: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error during booking:', error);
      
      // Não precisa tratar erros aqui pois já foram tratados no componente pai
      // O dialog será fechado automaticamente pelo componente pai
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'consultation',
      title: '',
      objective: '',
      notes: '',
      location_id: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!selectedSlot) return null;

  const { date, time } = formatDateTime(selectedSlot.slot_start);
  const endTime = formatDateTime(selectedSlot.slot_end).time;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Confirmar Agendamento
          </DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para confirmar seu agendamento com o professor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data e Hora */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              {date}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {time} - {endTime}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              Duração: {selectedSlot.slot_minutes} minutos
            </div>
          </div>

          {/* Tipo de Sessão */}
          <div className="space-y-2">
            <Label htmlFor="session-type">Tipo de Sessão *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: BookingFormData['type']) =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de sessão" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Local do Treino */}
          <div className="space-y-2">
            <Label htmlFor="location">Local do Treino (opcional)</Label>
            <Select
              value={formData.location_id}
              onValueChange={(value: string) =>
                setFormData(prev => ({ ...prev, location_id: value }))
              }
              disabled={locationsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  locationsLoading 
                    ? "Carregando locais..." 
                    : locations.length === 0 
                      ? "Nenhum local cadastrado"
                      : "Selecione o local ou deixe em branco"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 opacity-50" />
                    <span>Não especificar local</span>
                  </div>
                </SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{location.name} - {location.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Sessão *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ex: Primeira consulta, Treino de pernas, etc."
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo da Sessão</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, objective: e.target.value }))
              }
              placeholder="Descreva o que você gostaria de alcançar nesta sessão..."
              rows={3}
              className={errors.objective ? 'border-destructive' : ''}
            />
            {errors.objective && (
              <p className="text-sm text-destructive">{errors.objective}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações para o Professor</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Informações adicionais que o professor deve saber..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}