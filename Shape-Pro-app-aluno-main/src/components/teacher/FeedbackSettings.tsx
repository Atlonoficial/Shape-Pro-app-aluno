import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { useFeedbackSettings, TeacherFeedbackSettings, CustomQuestion } from '@/hooks/useFeedbackSettings';

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const defaultQuestions = [
  { id: 'training_satisfaction', text: 'Como você avalia seus treinos esta semana?', type: 'rating' as const, required: true },
  { id: 'diet_satisfaction', text: 'Como você avalia sua alimentação esta semana?', type: 'rating' as const, required: true },
  { id: 'general_feedback', text: 'Feedback geral sobre seu progresso:', type: 'text' as const, required: true },
];

export const FeedbackSettings = () => {
  const { settings, loading, saveSettings } = useFeedbackSettings();
  const [localSettings, setLocalSettings] = useState<TeacherFeedbackSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    setSaving(true);
    const success = await saveSettings(localSettings);
    setSaving(false);
  };

  const addCustomQuestion = () => {
    if (!localSettings) return;

    const newQuestion: CustomQuestion = {
      id: `custom_${Date.now()}`,
      text: '',
      type: 'text',
      required: false,
    };

    setLocalSettings({
      ...localSettings,
      custom_questions: [...localSettings.custom_questions, newQuestion],
    });
  };

  const updateCustomQuestion = (index: number, field: keyof CustomQuestion, value: any) => {
    if (!localSettings) return;

    const updatedQuestions = [...localSettings.custom_questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };

    setLocalSettings({
      ...localSettings,
      custom_questions: updatedQuestions,
    });
  };

  const removeCustomQuestion = (index: number) => {
    if (!localSettings) return;

    setLocalSettings({
      ...localSettings,
      custom_questions: localSettings.custom_questions.filter((_, i) => i !== index),
    });
  };

  const toggleDay = (day: number) => {
    if (!localSettings) return;

    const currentDays = localSettings.feedback_days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();

    setLocalSettings({
      ...localSettings,
      feedback_days: newDays,
    });
  };

  if (loading || !localSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Feedback</CardTitle>
          <CardDescription>
            Configure quando e como seus alunos devem enviar feedback sobre seus treinos e dieta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active">Sistema de Feedback Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar ou desabilitar o sistema de feedback para todos os alunos
              </p>
            </div>
            <Switch
              id="active"
              checked={localSettings.is_active}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, is_active: checked })
              }
            />
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label>Frequência do Feedback</Label>
            <Select
              value={localSettings.feedback_frequency}
              onValueChange={(value: any) =>
                setLocalSettings({ ...localSettings, feedback_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dias da Semana */}
          <div className="space-y-3">
            <Label>Dias para Solicitação de Feedback</Label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={localSettings.feedback_days.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perguntas Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Padrão</CardTitle>
          <CardDescription>
            Estas perguntas aparecem automaticamente em todos os feedbacks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultQuestions.map((question) => (
            <div key={question.id} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-medium">{question.text}</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {question.type === 'rating' ? 'Avaliação (1-5)' : 'Texto'}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Perguntas Personalizadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Perguntas Personalizadas</CardTitle>
              <CardDescription>
                Adicione perguntas específicas para seus alunos.
              </CardDescription>
            </div>
            <Button onClick={addCustomQuestion} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {localSettings.custom_questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma pergunta personalizada adicionada ainda.
            </p>
          ) : (
            localSettings.custom_questions.map((question, index) => (
              <div key={question.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Pergunta {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  placeholder="Digite sua pergunta..."
                  value={question.text}
                  onChange={(e) => updateCustomQuestion(index, 'text', e.target.value)}
                />

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value: any) => updateCustomQuestion(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="rating">Avaliação (1-5)</SelectItem>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${index}`}
                      checked={question.required}
                      onCheckedChange={(checked) => updateCustomQuestion(index, 'required', checked)}
                    />
                    <Label htmlFor={`required-${index}`} className="text-xs">
                      Obrigatória
                    </Label>
                  </div>
                </div>

                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Opções (uma por linha)</Label>
                    <Textarea
                      placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      value={question.options?.join('\n') || ''}
                      onChange={(e) => updateCustomQuestion(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};