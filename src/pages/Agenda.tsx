import { useMemo, useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useStudentAppointments } from "@/hooks/useStudentAppointments";
import { useStudentTeacherAvailability } from "@/hooks/useStudentTeacherAvailability";
import { useAvailableSlots, AvailableSlot } from "@/hooks/useAvailableSlots";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { useTeacherBookingSettings } from "@/hooks/useTeacherBookingSettings";
import { formatMinutesToHoursAndMinutes } from "@/lib/utils";
import { BookingConfirmationDialog } from "@/components/booking/BookingConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";

export default function Agenda() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  // Use the custom hooks
  const { 
    upcomingAppointments, 
    pastAppointments, 
    loading: appointmentsLoading, 
    cancelAppointment,
    refreshAppointments,
    isOptimistic 
  } = useStudentAppointments();
  
  const { 
    teacherId, 
    loading: teacherLoading,
    availability,
    getWeekdayName 
  } = useStudentTeacherAvailability();
  
  const { 
    getAvailableSlots, 
    bookAppointment, 
    loading: slotsLoading 
  } = useAvailableSlots();

  const {
    hasActiveSubscription,
    statusMessage,
    loading: subscriptionLoading
  } = useActiveSubscription();

  const {
    minimumAdvanceMinutes,
    loading: bookingSettingsLoading
  } = useTeacherBookingSettings(teacherId);

  const loading = appointmentsLoading || teacherLoading || subscriptionLoading || bookingSettingsLoading;
  
  // Filtrar agendamentos por status e data
  const currentDateTime = new Date().toISOString();
  
  const confirmedAppointments = useMemo(() => {
    return upcomingAppointments.filter(apt => 
      (apt.status === 'scheduled' || apt.status === 'confirmed') && 
      apt.scheduled_time > currentDateTime
    );
  }, [upcomingAppointments, currentDateTime]);
  
  const historicalAppointments = useMemo(() => {
    return [...upcomingAppointments, ...pastAppointments].filter(apt => 
      apt.scheduled_time < currentDateTime || apt.status === 'cancelled'
    );
  }, [upcomingAppointments, pastAppointments, currentDateTime]);
  
  const nextAppointment = useMemo(() => confirmedAppointments[0] ?? null, [confirmedAppointments]);

  // Load available slots when date or teacher changes
  // Load available slots for selected date
  const loadAvailableSlots = async () => {
    if (!teacherId || !selectedDate) {
      console.log('❌ Missing data for loading slots:', { teacherId, selectedDate });
      return;
    }
    
    const selectedWeekday = selectedDate.getDay();
    
    // Get the correct slot duration from teacher availability for this weekday
    const availabilityForDay = availability.find(av => av.weekday === selectedWeekday);
    const slotMinutes = availabilityForDay?.slot_minutes || 60;
    
    console.log('🔄 [REAL-TIME SYNC] Loading slots:', { 
      teacherId, 
      selectedDate: selectedDate.toDateString(),
      weekday: selectedWeekday,
      configuredSlotMinutes: slotMinutes,
      availabilityCount: availability.length,
      availabilityForDay: availabilityForDay ? {
        id: availabilityForDay.id,
        slot_minutes: availabilityForDay.slot_minutes,
        start_time: availabilityForDay.start_time,
        end_time: availabilityForDay.end_time
      } : null
    });
    
    const slots = await getAvailableSlots(teacherId, selectedDate, slotMinutes);
    console.log('✅ [REAL-TIME SYNC] Slots carregados:', {
      count: slots.length,
      duration: slotMinutes,
      slots: slots.map(s => ({ 
        start: s.slot_start, 
        end: s.slot_end, 
        minutes: s.slot_minutes 
      }))
    });
    setAvailableSlots(slots);
  };

  // Real-time synchronization - reload slots when any configuration changes
  useEffect(() => {
    console.log('🔄 [REAL-TIME SYNC] Configuration change detected:', {
      teacherId,
      selectedDate: selectedDate.toDateString(),
      hasAvailability: availability.length > 0,
      availabilityDetails: availability.map(av => ({
        weekday: av.weekday,
        slot_minutes: av.slot_minutes,
        times: `${av.start_time}-${av.end_time}`
      })),
      loading: teacherLoading
    });
    
    if (!teacherLoading && availability.length > 0) {
      console.log('🚀 [REAL-TIME SYNC] Reloading slots automatically...');
      loadAvailableSlots();
    }
  }, [teacherId, selectedDate, availability, teacherLoading]);

  // Additional real-time listener for immediate updates
  useEffect(() => {
    if (!teacherId || !hasActiveSubscription) return;

    console.log('👂 [REAL-TIME] Setting up additional availability listener for teacherId:', teacherId);
    
    const channel = supabase
      .channel(`agenda-availability-${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher_availability',
          filter: `teacher_id=eq.${teacherId}`,
        },
        (payload) => {
          console.log('🔔 [REAL-TIME] Teacher availability changed:', payload);
          console.log('🔄 [REAL-TIME] Forcing slots reload...');
          // Force reload after a small delay to ensure data is updated
          setTimeout(() => {
            loadAvailableSlots();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [REAL-TIME] Cleaning up availability listener');
      supabase.removeChannel(channel);
    };
  }, [teacherId, hasActiveSubscription]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  // Booking handlers
  const handleOpenBookingDialog = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setShowBookingDialog(true);
  };

  const handleConfirmBooking = async (formData: {
    type: string;
    title: string;
    objective: string;
    notes: string;
  }) => {
    if (!teacherId || !selectedSlot) return;
    
    const result = await bookAppointment(
      teacherId,
      selectedSlot.slot_start,
      formData.type,
      selectedSlot.slot_minutes, // Use dynamic duration from slot
      formData.title,
      '', // description (pode ficar vazio agora)
      formData.title, // studentTitle
      formData.objective, // studentObjectives  
      formData.notes // studentNotes
    );
    
    if (result.success) {
      setShowBookingDialog(false);
      setSelectedSlot(null);
      await refreshAppointments();
      loadAvailableSlots();
    }
  };

  const handleCancel = async (appointmentId: string) => {
    await cancelAppointment(appointmentId, "Cancelado pelo aluno");
    // Refresh available slots after cancellation
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
    <div className="px-3 sm:px-4 pt-6 sm:pt-8 pb-20 sm:pb-24 max-w-7xl mx-auto">
      {/* Header com botão de volta */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie seus treinos e consultas</p>
        </div>
      </div>

      {/* Próximo Agendamento */}
      <Card className="card-gradient p-4 sm:p-6 mb-4 sm:mb-6 border border-primary/20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
            <Calendar size={20} className="sm:size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Próximo Agendamento</h3>
            {nextAppointment ? (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {formatDate(nextAppointment.scheduled_time)} às {formatTime(nextAppointment.scheduled_time)} - {nextAppointment.title ?? nextAppointment.type ?? 'Sessão'}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">Sem agendamentos futuros</p>
            )}
          </div>
          <Button size="sm" className="btn-primary text-xs sm:text-sm px-2 sm:px-3" disabled={!nextAppointment}>
            <span className="hidden sm:inline">Ver Detalhes</span>
            <span className="sm:hidden">Ver</span>
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="disponiveis" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
          <TabsTrigger value="disponiveis" className="text-xs sm:text-sm px-1 sm:px-3">
            <span className="hidden sm:inline">Disponíveis</span>
            <span className="sm:hidden">Livres</span>
          </TabsTrigger>
          <TabsTrigger value="agendados" className="text-xs sm:text-sm px-1 sm:px-3">
            <span className="hidden sm:inline">Agendados</span>
            <span className="sm:hidden">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs sm:text-sm px-1 sm:px-3">Histórico</TabsTrigger>
        </TabsList>

        {/* Horários Disponíveis */}
        <TabsContent value="disponiveis" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Horários para {selectedDate.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short',
                ...(window.innerWidth >= 640 && { year: 'numeric' })
              })}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => bumpDay(-1)} className="flex-1 sm:flex-none">
                <Calendar size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dia anterior</span>
                <span className="sm:hidden">Anterior</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => bumpDay(1)} className="flex-1 sm:flex-none">
                <Calendar size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Próximo dia</span>
                <span className="sm:hidden">Próximo</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slotsLoading ? (
                <p className="col-span-full text-sm text-muted-foreground text-center py-4">Carregando horários...</p>
              ) : (
                <>
                  {availableSlots.map((slot, index) => (
                    <Card
                      key={index}
                      className={`p-3 sm:p-4 border transition-all card-gradient border-border/50 hover:border-primary/50`}
                    >
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-1 mb-1">
                           <Clock size={14} className="sm:size-4 text-primary" />
                           <span className={`font-medium text-foreground text-sm sm:text-base`}>
                             {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
                           </span>
                         </div>
                         <div className="text-xs text-muted-foreground mb-1">
                           {slot.slot_minutes} minutos
                         </div>
                         <span className={`text-xs text-success`}>Disponível</span>
                        <Button
                          size="sm"
                          onClick={() => handleOpenBookingDialog(slot)}
                          disabled={slotsLoading}
                          className="w-full text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <span className="hidden sm:inline">Agendar Horário</span>
                          <span className="sm:hidden">Agendar</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {availableSlots.length === 0 && !loading && (
                    <div className="col-span-full text-center py-6 sm:py-8">
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Nenhum horário disponível para {formatDate(selectedDate)}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                        {availability.some(av => av.weekday === selectedDate.getDay()) ? 
                          `Os horários podem não estar disponíveis devido ao tempo mínimo de antecedência (${formatMinutesToHoursAndMinutes(minimumAdvanceMinutes)}) ou já estarem ocupados.` :
                          'O professor não tem disponibilidade configurada para este dia.'
                        }
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Dias disponíveis:</p>
                        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                          {availability.length > 0 ? (
                            availability.map((av) => (
                              <span key={av.id} className="px-2 py-1 bg-muted rounded text-xs">
                                <span className="hidden sm:inline">{getWeekdayName(av.weekday)} ({av.start_time} - {av.end_time})</span>
                                <span className="sm:hidden">{getWeekdayName(av.weekday).slice(0, 3)}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground text-center">
                              {teacherId ? 'Professor não tem disponibilidade configurada' : 'Carregando disponibilidade...'}
                            </span>
                          )}
                        </div>
                        {availability.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Use os botões acima para navegar para os dias disponíveis
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* Agendamentos Ativos */}
        <TabsContent value="agendados" className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Seus Agendamentos</h3>

          {confirmedAppointments.map((agendamento) => (
            <Card key={agendamento.id} className="card-gradient p-3 sm:p-4 border border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{agendamento.title ?? agendamento.type ?? 'Sessão'}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agendamento.status === 'confirmed' || agendamento.status === 'confirmado'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {agendamento.status === 'confirmed' || agendamento.status === 'confirmado' 
                        ? 'Confirmado' 
                        : 'Agendado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>{formatDate(agendamento.scheduled_time)} às {formatTime(agendamento.scheduled_time)}</span>
                  </div>

                  {/* Mostrar objetivo e observações se disponíveis */}
                  {(agendamento.student_objectives || agendamento.student_notes) && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      {agendamento.student_objectives && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Objetivo:</span> {agendamento.student_objectives}
                        </p>
                      )}
                      {agendamento.student_notes && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Observações:</span> {agendamento.student_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col gap-2 sm:gap-1 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                    disabled={isOptimistic(agendamento.id)}
                  >
                    {isOptimistic(agendamento.id) ? 'Processando...' : 'Editar'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleCancel(agendamento.id)}
                    disabled={isOptimistic(agendamento.id)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    {isOptimistic(agendamento.id) ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {confirmedAppointments.length === 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">Sem agendamentos confirmados.</p>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Histórico</h3>

          {historicalAppointments.map((item) => (
            <Card key={item.id} className="card-gradient p-3 sm:p-4 border border-border/50">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{item.title ?? item.type ?? 'Sessão'}</h4>
                      {item.status === 'cancelled' ? (
                        <XCircle size={16} className="text-destructive" />
                      ) : (
                        <CheckCircle size={16} className="text-success" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
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

                {/* Mostrar detalhes do agendamento */}
                <div className="space-y-2">
                  {/* Objetivo e observações do aluno */}
                  {(item.student_objectives || item.student_notes) && (
                    <div className="p-2 bg-muted/30 rounded-md">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Detalhes da Sessão:</p>
                      {item.student_objectives && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Objetivo:</span> {item.student_objectives}
                        </p>
                      )}
                      {item.student_notes && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Observações:</span> {item.student_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Motivo do cancelamento */}
                  {item.status === 'cancelled' && (item.cancellation_reason || item.notes) && (
                    <div className="p-2 bg-destructive/5 border border-destructive/20 rounded-md">
                      <p className="text-xs font-medium text-destructive mb-1">Motivo do Cancelamento:</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cancellation_reason || item.notes || 'Não informado'}
                      </p>
                      {item.cancelled_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Cancelado em: {formatDate(item.cancelled_at)} às {formatTime(item.cancelled_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notas do professor */}
                  {item.notes && item.status !== 'cancelled' && (
                    <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
                      <p className="text-xs font-medium text-primary mb-1">Observações do Professor:</p>
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {historicalAppointments.length === 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">Nada por aqui ainda.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Confirmation Dialog */}
      <BookingConfirmationDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        onConfirm={handleConfirmBooking}
        selectedSlot={selectedSlot}
        loading={slotsLoading}
      />
    </div>
  );
}
