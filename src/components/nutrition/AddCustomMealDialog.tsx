import { useState, useEffect, useRef } from "react";
import { Clock, Calculator, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMyNutrition } from "@/hooks/useMyNutrition";
import { Loader2 } from "lucide-react";
import { useKeyboardState } from "@/hooks/useKeyboardState";

interface AddCustomMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionPlanId?: string;
  onMealAdded?: () => void;
}

export const AddCustomMealDialog = ({ open, onOpenChange, nutritionPlanId, onMealAdded }: AddCustomMealDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addCustomMeal } = useMyNutrition();
  const { isVisible: keyboardVisible } = useKeyboardState();
  const formRef = useRef<HTMLFormElement>(null);
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

  // Reset form when closing
  useEffect(() => {
    if (!open) {
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
    }
  }, [open]);

  // Scroll to focused input when keyboard opens
  useEffect(() => {
    if (keyboardVisible && formRef.current) {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && formRef.current.contains(activeElement)) {
        setTimeout(() => {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [keyboardVisible]);

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
      const success = await addCustomMeal(formData, nutritionPlanId);

      if (success) {
        toast({
          title: "Refeição adicionada!",
          description: `${formData.name} foi adicionada ao seu plano.`,
        });
        onOpenChange(false);
        onMealAdded?.();
      } else {
        throw new Error("Falha ao adicionar refeição");
      }

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

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal - Bottom sheet style on mobile */}
      <div
        className={`
          fixed z-50 bg-background border-t border-border rounded-t-3xl shadow-2xl
          left-0 right-0 bottom-0
          max-h-[90vh]
          animate-in slide-in-from-bottom duration-300
          ${keyboardVisible ? 'max-h-[60vh]' : 'max-h-[90vh]'}
        `}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Nova Refeição</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto overscroll-contain px-5 py-4"
          style={{ maxHeight: keyboardVisible ? 'calc(60vh - 120px)' : 'calc(90vh - 180px)' }}
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Nome da refeição */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome da refeição *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Lanche da tarde"
                className="h-12 text-base"
                required
              />
            </div>

            {/* Horário e tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium">Horário</Label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <Select value={formData.meal_type} onValueChange={(value) => setFormData({ ...formData, meal_type: value })}>
                  <SelectTrigger className="h-12 text-base">
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
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calculator size={16} className="text-primary" />
                Informações Nutricionais
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories" className="text-xs text-muted-foreground">Calorias (kcal) *</Label>
                  <Input
                    id="calories"
                    type="number"
                    inputMode="numeric"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    placeholder="0"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protein" className="text-xs text-muted-foreground">Proteína (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    placeholder="0"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbs" className="text-xs text-muted-foreground">Carboidratos (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    placeholder="0"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat" className="text-xs text-muted-foreground">Gordura (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={formData.fat}
                    onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                    placeholder="0"
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Porção */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="portion_amount" className="text-xs text-muted-foreground">Porção</Label>
                <Input
                  id="portion_amount"
                  type="number"
                  inputMode="numeric"
                  value={formData.portion_amount}
                  onChange={(e) => setFormData({ ...formData, portion_amount: e.target.value })}
                  placeholder="100"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Unidade</Label>
                <Select value={formData.portion_unit} onValueChange={(value) => setFormData({ ...formData, portion_unit: value })}>
                  <SelectTrigger className="h-12 text-base">
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
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="text-sm">
                  <div className="font-medium text-foreground mb-1">📋 Preview:</div>
                  <div className="text-muted-foreground">
                    {formData.name || "Nova refeição"} - <span className="text-primary font-semibold">{totalCalories} kcal</span>
                    {formData.time && (
                      <span className="ml-2">às {formData.time}</span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Spacer for buttons */}
            <div className="h-4" />
          </form>
        </div>

        {/* Footer Buttons - Fixed at bottom */}
        <div className="flex gap-3 px-5 py-4 border-t border-border/50 bg-background pb-safe">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 h-12 text-base"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.calories}
            className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-primary/80"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                Adicionar
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};