import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Agenda = () => {
  const horariosDisponiveis = [
    { horario: "08:00", disponivel: true },
    { horario: "09:00", disponivel: false },
    { horario: "10:00", disponivel: true },
    { horario: "11:00", disponivel: true },
    { horario: "14:00", disponivel: false },
    { horario: "15:00", disponivel: true },
    { horario: "16:00", disponivel: true },
    { horario: "17:00", disponivel: false },
  ];

  const agendamentosAtivos = [
    {
      data: "Hoje",
      horario: "09:00",
      tipo: "Treino Personalizado",
      professor: "Prof. Carlos",
      status: "confirmado"
    },
    {
      data: "Amanhã",
      horario: "15:00",
      tipo: "Avaliação Física",
      professor: "Prof. Ana",
      status: "pendente"
    },
    {
      data: "Sex, 20/12",
      horario: "10:00",
      tipo: "Treino Funcional",
      professor: "Prof. Ricardo",
      status: "confirmado"
    }
  ];

  const historico = [
    {
      data: "Ontem",
      horario: "16:00",
      tipo: "Treino Personalizado",
      professor: "Prof. Carlos",
      status: "concluido",
      nota: 5
    },
    {
      data: "Seg, 16/12",
      horario: "08:00",
      tipo: "Avaliação Física",
      professor: "Prof. Ana",
      status: "concluido",
      nota: 5
    },
    {
      data: "Sex, 13/12",
      horario: "15:00",
      tipo: "Treino Funcional",
      professor: "Prof. Ricardo",
      status: "cancelado",
      nota: null
    }
  ];

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Agenda</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus treinos e consultas</p>
      </div>

      {/* Próximo Agendamento */}
      <Card className="card-gradient p-6 mb-6 border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
            <Calendar size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Próximo Treino</h3>
            <p className="text-sm text-muted-foreground">Hoje às 09:00 - Treino Personalizado</p>
            <p className="text-xs text-muted-foreground mt-1">com Prof. Carlos</p>
          </div>
          <Button size="sm" className="btn-primary">
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
            <h3 className="text-lg font-semibold text-foreground">Horários para Hoje</h3>
            <Button variant="outline" size="sm">
              <Calendar size={16} className="mr-1" />
              Mudar Data
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {horariosDisponiveis.map((slot, index) => (
              <Card 
                key={index} 
                className={`p-4 border transition-all cursor-pointer ${
                  slot.disponivel 
                    ? 'card-gradient border-border/50 hover:border-primary/50' 
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock size={16} className={slot.disponivel ? "text-primary" : "text-muted-foreground"} />
                    <span className={`font-medium ${slot.disponivel ? "text-foreground" : "text-muted-foreground"}`}>
                      {slot.horario}
                    </span>
                  </div>
                  <span className={`text-xs ${slot.disponivel ? "text-success" : "text-destructive"}`}>
                    {slot.disponivel ? "Disponível" : "Ocupado"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Agendamentos Ativos */}
        <TabsContent value="agendados" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Seus Agendamentos</h3>
          
          {agendamentosAtivos.map((agendamento, index) => (
            <Card key={index} className="card-gradient p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{agendamento.tipo}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agendamento.status === "confirmado" 
                        ? "bg-success/10 text-success" 
                        : "bg-warning/10 text-warning"
                    }`}>
                      {agendamento.status === "confirmado" ? "Confirmado" : "Pendente"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{agendamento.data} às {agendamento.horario}</span>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{agendamento.professor}</span>
                    </div>
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
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Histórico de Treinos</h3>
          
          {historico.map((item, index) => (
            <Card key={index} className="card-gradient p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{item.tipo}</h4>
                    {item.status === "concluido" && (
                      <CheckCircle size={16} className="text-success" />
                    )}
                    {item.status === "cancelado" && (
                      <XCircle size={16} className="text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{item.data} às {item.horario}</span>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{item.professor}</span>
                    </div>
                  </div>
                  
                  {item.nota && (
                    <div className="mt-2">
                      <span className="text-xs text-warning">
                        {"⭐".repeat(item.nota)} Avaliação: {item.nota}/5
                      </span>
                    </div>
                  )}
                </div>
                
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.status === "concluido" 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {item.status === "concluido" ? "Concluído" : "Cancelado"}
                </span>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};