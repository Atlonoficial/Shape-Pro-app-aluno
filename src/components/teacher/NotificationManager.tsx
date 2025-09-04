import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationManager = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: title.trim(),
          message: message.trim(),
          target_users: targetType === 'all' ? undefined : [], // Para implementar seleção específica depois
          data: {
            type: 'teacher_announcement',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast.success(`Notificação enviada para ${data.recipients || 'todos os'} usuários!`);
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação. Verifique se o OneSignal está configurado.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickTemplates = [
    {
      title: 'Nova Aula Disponível',
      message: 'Uma nova aula foi adicionada ao seu curso. Confira agora!',
      icon: <Bell className="h-4 w-4" />,
      type: 'new_lesson'
    },
    {
      title: 'Lembrete de Treino',
      message: 'Não esqueça do seu treino de hoje. Vamos alcançar seus objetivos!',
      icon: <Calendar className="h-4 w-4" />,
      type: 'workout_reminder'
    },
    {
      title: 'Parabéns pelo Progresso!',
      message: 'Você está no caminho certo! Continue assim.',
      icon: <CheckCircle className="h-4 w-4" />,
      type: 'progress_congratulations'
    },
    {
      title: 'Lembrete de Nutrição',
      message: 'Lembre-se de registrar suas refeições de hoje.',
      icon: <Bell className="h-4 w-4" />,
      type: 'nutrition_reminder'
    },
    {
      title: 'Agendamento Confirmado',
      message: 'Sua consulta de amanhã foi confirmada. Te esperamos!',
      icon: <CheckCircle className="h-4 w-4" />,
      type: 'appointment_confirmed'
    }
  ];

  const useTemplate = (template: typeof quickTemplates[0]) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enviar Notificação Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nova aula disponível"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/200 caracteres
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva sua mensagem aqui..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/1000 caracteres
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Destinatários</label>
            <Select value={targetType} onValueChange={(value: 'all' | 'specific') => setTargetType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Todos os alunos
                  </div>
                </SelectItem>
                <SelectItem value="specific" disabled>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alunos específicos (em breve)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSendNotification} 
            disabled={isLoading || !title.trim() || !message.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Enviando...' : 'Enviar Notificação'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {quickTemplates.map((template, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => useTemplate(template)}
              >
                <div className="mt-0.5 text-primary">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{template.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{template.message}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Usar
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};