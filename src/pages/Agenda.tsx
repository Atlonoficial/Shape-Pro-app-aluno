import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, User, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export const Agenda = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  type Slot = { start: string; end: string };
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);

  type Appt = { id: string; scheduled_time: string; type: string | null; title: string | null; status: string | null };
  const [upcoming, setUpcoming] = useState<Appt[]>([]);
  const [history, setHistory] = useState<Appt[]>([]);

  const nextAppointment = useMemo(() => upcoming[0] ?? null, [upcoming]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) { setLoading(false); return; }
        setLoading(true);

        // 1) Descobre o professor do aluno
        const { data: studentRow, error: sErr } = await supabase
          .from('students')
          .select('teacher_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (sErr) throw sErr;
        const tId = studentRow?.teacher_id ?? null;
        setTeacherId(tId);

        // 2) Busca agendamentos do aluno
        const { data: appts, error: aErr } = await supabase
          .from('appointments')
          .select('id, scheduled_time, duration, type, title, status')
          .eq('student_id', user.id)
          .order('scheduled_time', { ascending: true });
        if (aErr) throw aErr;

        const now = new Date();
        const upcomingList = (appts ?? []).filter(a => new Date(a.scheduled_time) >= now);
        const historyList = (appts ?? []).filter(a => new Date(a.scheduled_time) < now).reverse();
        setUpcoming(upcomingList);
        setHistory(historyList);

        // 3) Lista horários disponíveis do professor para a data
        if (tId) {
          const dateStr = selectedDate.toISOString().slice(0, 10);
          const { data: slots, error: lErr } = await supabase.rpc('list_available_slots', {
            p_teacher_id: tId,
            p_date: dateStr,
            p_slot_minutes: 60,
          });
          if (lErr) throw lErr;
          const mapped: Slot[] = (slots ?? []).map((s: any) => ({ start: s.slot_start, end: s.slot_end }));
          setAvailableSlots(mapped);
        } else {
          setAvailableSlots([]);
        }
      } catch (err: any) {
        console.error('Agenda load error', err);
        toast({ title: 'Erro', description: err.message ?? 'Falha ao carregar agenda', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, selectedDate]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const handleBook = async (slot: Slot) => {
    try {
      if (!teacherId) return;
      const { error } = await supabase.rpc('book_appointment', {
        p_teacher_id: teacherId,
        p_scheduled_time: slot.start,
        p_type: 'class',
        p_duration: 60,
      });
      if (error) throw error;
      toast({ title: 'Agendado', description: 'Agendamento criado com sucesso!' });

      // Atualiza listas
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, scheduled_time, duration, type, title, status')
        .eq('student_id', user!.id)
        .order('scheduled_time', { ascending: true });
      const now = new Date();
      const upcomingList = (appts ?? []).filter(a => new Date(a.scheduled_time) >= now);
      const historyList = (appts ?? []).filter(a => new Date(a.scheduled_time) < now).reverse();
      setUpcoming(upcomingList);
      setHistory(historyList);
      setAvailableSlots(prev => prev.filter(s => s.start !== slot.start));
    } catch (err: any) {
      console.error('Book error', err);
      toast({ title: 'Erro', description: err.message ?? 'Falha ao agendar', variant: 'destructive' });
    }
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
          ) : !teacherId ? (
            <p className="text-sm text-muted-foreground">Você ainda não está vinculado a um professor.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
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
                        {formatTime(slot.start)}
                      </span>
                    </div>
                    <span className={`text-xs text-success`}>Disponível</span>
                  </div>
                </Card>
              ))}
              {availableSlots.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground">Sem horários disponíveis para esta data.</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Agendamentos Ativos */}
        <TabsContent value="agendados" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Seus Agendamentos</h3>

          {upcoming.map((agendamento) => (
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
                  <Button size="sm" variant="destructive">
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem agendamentos futuros.</p>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Histórico</h3>

          {history.map((item) => (
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

          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
