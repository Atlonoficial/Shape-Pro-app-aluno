import { useState } from "react";
import { Plus, Scale, Ruler, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssessmentData {
  weight: string;
  height: string;
  body_fat: string;
  muscle_mass: string;
}

interface NewAssessmentDialogProps {
  onAssessmentCreated: () => void;
}

export const NewAssessmentDialog = ({ onAssessmentCreated }: NewAssessmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AssessmentData>({
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: ""
  });
  
  const { user } = useAuthContext();

  const handleInputChange = (field: keyof AssessmentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Verificar se pelo menos um campo foi preenchido
    const hasData = Object.values(formData).some(value => value.trim() !== "");
    if (!hasData) {
      toast.error("Preencha pelo menos uma medida");
      return;
    }

    setLoading(true);

    try {
      const currentDate = new Date();
      const assessmentDate = currentDate.toISOString();
      
      // Criar array de registros para inserir na tabela progress
      const progressRecords = [];

      if (formData.weight.trim()) {
        progressRecords.push({
          user_id: user.id,
          type: "physical_assessment",
          value: parseFloat(formData.weight),
          unit: "kg",
          date: assessmentDate,
          notes: "weight"
        });
      }

      if (formData.height.trim()) {
        progressRecords.push({
          user_id: user.id,
          type: "physical_assessment", 
          value: parseFloat(formData.height),
          unit: "cm",
          date: assessmentDate,
          notes: "height"
        });
      }

      if (formData.body_fat.trim()) {
        progressRecords.push({
          user_id: user.id,
          type: "physical_assessment",
          value: parseFloat(formData.body_fat),
          unit: "%",
          date: assessmentDate,
          notes: "body_fat"
        });
      }

      if (formData.muscle_mass.trim()) {
        progressRecords.push({
          user_id: user.id,
          type: "physical_assessment",
          value: parseFloat(formData.muscle_mass),
          unit: "kg", 
          date: assessmentDate,
          notes: "muscle"
        });
      }

      // Inserir todos os registros de uma vez
      const { error } = await supabase
        .from("progress")
        .insert(progressRecords);

      if (error) throw error;

      toast.success("Avaliação física registrada com sucesso!");
      
      // Reset form and close dialog
      setFormData({
        weight: "",
        height: "",
        body_fat: "",
        muscle_mass: ""
      });
      setOpen(false);
      onAssessmentCreated();

    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      toast.error("Erro ao registrar avaliação física");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Nova Avaliação
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Avaliação Física</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Peso (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 70.5"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-primary" />
                  Altura (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 175"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_fat" className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  % Gordura Corporal
                </Label>
                <Input
                  id="body_fat"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 15.2"
                  value={formData.body_fat}
                  onChange={(e) => handleInputChange("body_fat", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="muscle_mass" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Massa Magra (kg)
                </Label>
                <Input
                  id="muscle_mass"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 55.8"
                  value={formData.muscle_mass}
                  onChange={(e) => handleInputChange("muscle_mass", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};