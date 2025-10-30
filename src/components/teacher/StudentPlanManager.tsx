import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Settings, Crown, Star, Diamond, Trophy, Gem } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentPlanManagerProps {
  studentId: string;
  studentName: string;
  currentPlan?: string;
  teacherId: string;
}

interface PlanCatalog {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: any;
  icon?: string;
}

const PLAN_ICONS = {
  crown: { icon: Crown, color: 'text-yellow-500' },
  star: { icon: Star, color: 'text-blue-500' },
  diamond: { icon: Diamond, color: 'text-purple-500' },
  trophy: { icon: Trophy, color: 'text-orange-500' },
  gem: { icon: Gem, color: 'text-emerald-500' }
};

export const StudentPlanManager = ({ 
  studentId, 
  studentName, 
  currentPlan,
  teacherId 
}: StudentPlanManagerProps) => {
  const [plans, setPlans] = useState<PlanCatalog[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [membershipStatus, setMembershipStatus] = useState<string>('active');
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeacherPlans();
    }
  }, [isOpen, teacherId]);

  const loadTeacherPlans = async () => {
    try {
      const { data: plansData, error } = await supabase
        .from('plan_catalog')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) {
      toast({
        title: "Erro",
        description: "Selecione um plano",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('teacher_update_student_plan', {
        p_student_user_id: studentId,
        p_plan_id: selectedPlan,
        p_membership_status: membershipStatus,
        p_end_date: endDate?.toISOString()
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Plano do estudante ${studentName} foi atualizado`,
      });
      
      setIsOpen(false);
      setSelectedPlan('');
      setEndDate(undefined);
    } catch (error: any) {
      console.error('Error updating student plan:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o plano",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (iconKey?: string) => {
    const iconData = PLAN_ICONS[iconKey as keyof typeof PLAN_ICONS] || PLAN_ICONS.crown;
    return iconData;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Gerenciar Plano
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Plano - {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plano Atual */}
          {currentPlan && (
            <Card className="p-4 bg-muted/30">
              <h3 className="font-medium text-foreground mb-2">Plano Atual:</h3>
              <Badge variant="secondary">{currentPlan}</Badge>
            </Card>
          )}

          {/* Selecionar Novo Plano */}
          <div className="space-y-4">
            <Label>Selecionar Plano:</Label>
            <div className="grid gap-3">
              {plans.map((plan) => {
                const iconData = getPlanIcon(plan.icon);
                const IconComponent = iconData.icon;
                
                return (
                  <Card 
                    key={plan.id}
                    className={`p-4 cursor-pointer border transition-all ${
                      selectedPlan === plan.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className={`w-5 h-5 ${iconData.color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: plan.currency 
                            }).format(plan.price)} / {plan.interval === 'monthly' ? 'mês' : 'ano'}
                          </p>
                        </div>
                      </div>
                      {selectedPlan === plan.id && (
                        <Badge variant="default">Selecionado</Badge>
                      )}
                    </div>
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {feature}
                          </p>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Status da Assinatura */}
          <div className="space-y-2">
            <Label>Status da Assinatura:</Label>
            <Select value={membershipStatus} onValueChange={setMembershipStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data de Expiração */}
          <div className="space-y-2">
            <Label>Data de Expiração:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: pt }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpdatePlan}
              disabled={!selectedPlan || loading}
              className="flex-1"
            >
              {loading ? "Atualizando..." : "Atualizar Plano"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};