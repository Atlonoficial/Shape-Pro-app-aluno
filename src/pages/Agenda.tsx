import { useMemo, useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useStudentAppointments } from "@/hooks/useStudentAppointments";
import { useStudentTeacherAvailability } from "@/hooks/useStudentTeacherAvailability";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";

export const Agenda = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Use the custom hooks
  const { 
    upcomingAppointments, 
    pastAppointments, 
    loading: appointmentsLoading, 
    cancelAppointment 
  } = useStudentAppointments();
  
  const { 
    teacherId, 
    loading: teacherLoading 
  } = useStudentTeacherAvailability();
  
  const { 
    getAvailableSlots, 
    quickBookAppointment, 
    loading: slotsLoading 
  } = useAvailableSlots();

  const {
    hasActiveSubscription,
    statusMessage,
    loading: subscriptionLoading
  } = useActiveSubscription();

  const loading = appointmentsLoading || teacherLoading || subscriptionLoading;
  const nextAppointment = useMemo(() => upcomingAppointments[0] ?? null, [upcomingAppointments]);

  // Load available slots when date or teacher changes
  const loadAvailableSlots = async () => {
    if (!teacherId) {
      setAvailableSlots([]);
      return;
    }

    const slots = await getAvailableSlots(teacherId, selectedDate, 60);
    setAvailableSlots(slots);
  };

  // Load slots when dependencies change
  useEffect(() => {
    loadAvailableSlots();
  }, [teacherId, selectedDate]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const handleBook = async (slot: any) => {
    if (!teacherId) return;
    
    const result = await quickBookAppointment(teacherId, slot.slot_start);
    if (result.success) {
      // Reload available slots after successful booking
      loadAvailableSlots();
    }
  };

  const handleCancel = async (appointmentId: string) => {
    await cancelAppointment(appointmentId, "Cancelado pelo aluno");
    // Slots will be automatically refreshed due to real-time updates
    loadAvailableSlots();
  };

  const bumpDay = (days: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  };

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header com botão de volta */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus treinos e consultas</p>
        </div>
      </div>

      {/* Próximo Agendamento */}
      <Card className="card-gradient p-6 mb-6 border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
            <Calendar size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Próximo Agendamento</h3>
            {nextAppointment ? (
              <p className="text-sm text-muted-foreground">
                {formatDate(nextAppointment.scheduled_time)} às {formatTime(nextAppointment.scheduled_time)} - {nextAppointment.title ?? nextAppointment.type ?? 'Sessão'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Sem agendamentos futuros</p>
            )}
          </div>
          <Button size="sm" className="btn-primary" disabled={!nextAppointment}>
            Ver Detalhes
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="disponiveis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disponiveis">Disponíveis</TabsTrigger>
          <TabsTrigger value="agendados">Agendados</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Horários Disponíveis */}
        <TabsContent value="disponiveis" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Horários para {selectedDate.toLocaleDateString()}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => bumpDay(-1)}>
                <Calendar size={16} className="mr-1" />
                Dia anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => bumpDay(1)}>
                <Calendar size={16} className="mr-1" />
                Próximo dia
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !hasActiveSubscription ? (
            <Card className="p-6 text-center border border-warning/20 bg-warning/5">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                  <Calendar size={32} className="text-warning" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Consultoria Necessária</h4>
                  <p className="text-sm text-muted-foreground mb-4">{statusMessage}</p>
                  <Button 
                    className="btn-primary"
                    onClick={() => navigate("/assinaturas-planos")}
                  >
                    Ver Planos Disponíveis
                  </Button>
                </div>
              </div>
            </Card>
          ) : !teacherId ? (
            <p className="text-sm text-muted-foreground">Aguardando designação de professor...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {slotsLoading ? (
                <p className="col-span-2 text-sm text-muted-foreground">Carregando horários...</p>
              ) : (
                <>
                  {availableSlots.map((slot, index) => (
                    <Card
                      key={index}
                      className={`p-4 border transition-all cursor-pointer card-gradient border-border/50 hover:border-primary/50`}
                      onClick={() => handleBook(slot)}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock size={16} className="text-primary" />
                          <span className={`font-medium text-foreground`}>
                            {formatTime(slot.slot_start)}
                          </span>
                        </div>
                        <span className={`text-xs text-success`}>Disponível</span>
                      </div>
                    </Card>
                  ))}
                  {availableSlots.length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground">Sem horários disponíveis para esta data.</p>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* Agendamentos Ativos */}
        <TabsContent value="agendados" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Seus Agendamentos</h3>

          {upcomingAppointments.map((agendamento) => (
            <Card key={agendamento.id} className="card-gradient p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{agendamento.title ?? agendamento.type ?? 'Sessão'}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agendamento.status === 'confirmed' || agendamento.status === 'confirmado'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {agendamento.status === 'confirmed' || agendamento.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(agendamento.scheduled_time)} às {formatTime(agendamento.scheduled_time)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleCancel(agendamento.id)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {upcomingAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem agendamentos futuros.</p>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Histórico</h3>

          {pastAppointments.map((item) => (
            <Card key={item.id} className="card-gradient p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{item.title ?? item.type ?? 'Sessão'}</h4>
                    {item.status === 'cancelled' ? (
                      <XCircle size={16} className="text-destructive" />
                    ) : (
                      <CheckCircle size={16} className="text-success" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(item.scheduled_time)} às {formatTime(item.scheduled_time)}</span>
                  </div>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.status === 'cancelled'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-success/10 text-success'
                }`}>
                  {item.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                </span>
              </div>
            </Card>
          ))}

          {pastAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
