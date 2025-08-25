import { useState } from "react";
import { Clock, Calculator, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AddCustomMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionPlanId?: string;
  onMealAdded?: () => void;
}

export const AddCustomMealDialog = ({ open, onOpenChange, nutritionPlanId, onMealAdded }: AddCustomMealDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    time: "",
    meal_type: "meal",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    portion_amount: "100",
    portion_unit: "g"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !nutritionPlanId) {
      toast({
        title: "Erro",
        description: "Usuário ou plano nutricional não encontrado.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.calories) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e calorias são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Criar a refeição customizada
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          name: formData.name,
          time: formData.time || null,
          meal_type: formData.meal_type,
          calories: parseInt(formData.calories),
          protein: parseFloat(formData.protein) || 0,
          carbs: parseFloat(formData.carbs) || 0,
          fat: parseFloat(formData.fat) || 0,
          portion_amount: parseFloat(formData.portion_amount),
          portion_unit: formData.portion_unit,
          created_by: user.id,
          foods: []
        })
        .select()
        .single();

      if (mealError) {
        console.error('Error creating meal:', mealError);
        throw mealError;
      }

      // Buscar o plano nutricional atual para atualizar os meal_ids
      const { data: plan, error: planError } = await supabase
        .from('nutrition_plans')
        .select('meal_ids')
        .eq('id', nutritionPlanId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        throw planError;
      }

      // Adicionar o novo meal_id ao array existente
      const currentMealIds = (plan.meal_ids as string[]) || [];
      const updatedMealIds = [...currentMealIds, meal.id];

      // Atualizar o plano nutricional com o novo meal_id
      const { error: updateError } = await supabase
        .from('nutrition_plans')
        .update({ meal_ids: updatedMealIds })
        .eq('id', nutritionPlanId);

      if (updateError) {
        console.error('Error updating plan:', updateError);
        throw updateError;
      }

      toast({
        title: "Refeição adicionada!",
        description: `${formData.name} foi adicionada ao seu plano nutricional.`,
      });

      // Reset form
      setFormData({
        name: "",
        time: "",
        meal_type: "meal",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        portion_amount: "100",
        portion_unit: "g"
      });

      onOpenChange(false);
      onMealAdded?.();

    } catch (error) {
      console.error('Error adding custom meal:', error);
      toast({
        title: "Erro ao adicionar refeição",
        description: "Não foi possível adicionar a refeição. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCalories = parseFloat(formData.calories) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus size={20} />
            Nova Refeição
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da refeição */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da refeição *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Lanche da tarde"
              required
            />
          </div>

          {/* Horário e tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.meal_type} onValueChange={(value) => setFormData({ ...formData, meal_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meal">Refeição</SelectItem>
                  <SelectItem value="snack">Lanche</SelectItem>
                  <SelectItem value="breakfast">Café da manhã</SelectItem>
                  <SelectItem value="lunch">Almoço</SelectItem>
                  <SelectItem value="dinner">Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Informações nutricionais */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calculator size={16} />
              Informações Nutricionais
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="calories">Calorias (kcal) *</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="protein">Proteína (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbs">Carboidratos (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fat">Gordura (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={formData.fat}
                  onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Porção */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="portion_amount">Porção</Label>
              <Input
                id="portion_amount"
                type="number"
                value={formData.portion_amount}
                onChange={(e) => setFormData({ ...formData, portion_amount: e.target.value })}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={formData.portion_unit} onValueChange={(value) => setFormData({ ...formData, portion_unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">gramas (g)</SelectItem>
                  <SelectItem value="ml">mililitros (ml)</SelectItem>
                  <SelectItem value="unidade">unidade</SelectItem>
                  <SelectItem value="colher">colher</SelectItem>
                  <SelectItem value="xícara">xícara</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview da refeição */}
          {totalCalories > 0 && (
            <Card className="p-3 bg-accent/5 border-accent/20">
              <div className="text-sm">
                <div className="font-medium text-foreground mb-1">Preview:</div>
                <div className="text-muted-foreground">
                  {formData.name || "Nova refeição"} - {totalCalories} kcal
                  {formData.time && (
                    <span className="ml-2">às {formData.time}</span>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.calories}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};