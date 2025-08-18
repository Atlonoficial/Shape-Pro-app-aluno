import { useState } from "react";
import { Plus, Scale, Ruler, Activity, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssessmentData {
  // Medidas básicas
  weight: string;
  height: string;
  body_fat: string;
  muscle_mass: string;
  
  // Membros superiores
  relaxed_right_arm: string;
  relaxed_left_arm: string;
  contracted_right_arm: string;
  contracted_left_arm: string;
  right_forearm: string;
  left_forearm: string;
  
  // Tronco
  neck: string;
  shoulder: string;
  chest: string;
  waist: string;
  abdomen: string;
  hip: string;
  
  // Membros inferiores  
  right_calf: string;
  left_calf: string;
  right_thigh: string;
  left_thigh: string;
  right_proximal_thigh: string;
  left_proximal_thigh: string;
  
  // Protocolo de dobras cutâneas
  skinfold_protocol: string;
}

interface NewAssessmentDialogProps {
  onAssessmentCreated: () => void;
}

export const NewAssessmentDialog = ({ onAssessmentCreated }: NewAssessmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AssessmentData>({
    // Medidas básicas
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: "",
    
    // Membros superiores
    relaxed_right_arm: "",
    relaxed_left_arm: "",
    contracted_right_arm: "",
    contracted_left_arm: "",
    right_forearm: "",
    left_forearm: "",
    
    // Tronco
    neck: "",
    shoulder: "",
    chest: "",
    waist: "",
    abdomen: "",
    hip: "",
    
    // Membros inferiores  
    right_calf: "",
    left_calf: "",
    right_thigh: "",
    left_thigh: "",
    right_proximal_thigh: "",
    left_proximal_thigh: "",
    
    // Protocolo de dobras cutâneas
    skinfold_protocol: ""
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

      // Medidas básicas
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

      // Membros superiores
      const upperLimbFields = {
        relaxed_right_arm: "Braço relaxado direito",
        relaxed_left_arm: "Braço relaxado esquerdo", 
        contracted_right_arm: "Braço contraído direito",
        contracted_left_arm: "Braço contraído esquerdo",
        right_forearm: "Antebraço direito",
        left_forearm: "Antebraço esquerdo"
      };

      Object.entries(upperLimbFields).forEach(([key, label]) => {
        const value = formData[key as keyof AssessmentData];
        if (value.trim()) {
          progressRecords.push({
            user_id: user.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "cm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      // Tronco
      const torsoFields = {
        neck: "Pescoço",
        shoulder: "Ombro",
        chest: "Peitoral", 
        waist: "Cintura",
        abdomen: "Abdômen",
        hip: "Quadril"
      };

      Object.entries(torsoFields).forEach(([key, label]) => {
        const value = formData[key as keyof AssessmentData];
        if (value.trim()) {
          progressRecords.push({
            user_id: user.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "cm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      // Membros inferiores
      const lowerLimbFields = {
        right_calf: "Panturrilha direita",
        left_calf: "Panturrilha esquerda",
        right_thigh: "Coxa direita", 
        left_thigh: "Coxa esquerda",
        right_proximal_thigh: "Coxa proximal direita",
        left_proximal_thigh: "Coxa proximal esquerda"
      };

      Object.entries(lowerLimbFields).forEach(([key, label]) => {
        const value = formData[key as keyof AssessmentData];
        if (value.trim()) {
          progressRecords.push({
            user_id: user.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "cm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      // Protocolo de dobras cutâneas
      if (formData.skinfold_protocol.trim()) {
        progressRecords.push({
          user_id: user.id,
          type: "physical_assessment",
          value: 1, // Valor simbólico
          unit: "protocolo",
          date: assessmentDate,
          notes: `Protocolo: ${formData.skinfold_protocol}`
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
        // Medidas básicas
        weight: "",
        height: "",
        body_fat: "",
        muscle_mass: "",
        
        // Membros superiores
        relaxed_right_arm: "",
        relaxed_left_arm: "",
        contracted_right_arm: "",
        contracted_left_arm: "",
        right_forearm: "",
        left_forearm: "",
        
        // Tronco
        neck: "",
        shoulder: "",
        chest: "",
        waist: "",
        abdomen: "",
        hip: "",
        
        // Membros inferiores  
        right_calf: "",
        left_calf: "",
        right_thigh: "",
        left_thigh: "",
        right_proximal_thigh: "",
        left_proximal_thigh: "",
        
        // Protocolo de dobras cutâneas
        skinfold_protocol: ""
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
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação Física</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medidas Básicas */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="font-medium">Peso</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Peso</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em kg..."
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>% Gordura Corporal</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em %..."
                        value={formData.body_fat}
                        onChange={(e) => handleInputChange("body_fat", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Massa Magra</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em kg..."
                        value={formData.muscle_mass}
                        onChange={(e) => handleInputChange("muscle_mass", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Membros Superiores */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      <span className="font-medium">Membros superiores</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Braço relaxado direito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.relaxed_right_arm}
                        onChange={(e) => handleInputChange("relaxed_right_arm", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Braço relaxado esquerdo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.relaxed_left_arm}
                        onChange={(e) => handleInputChange("relaxed_left_arm", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Braço contraído direito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.contracted_right_arm}
                        onChange={(e) => handleInputChange("contracted_right_arm", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Braço contraído esquerdo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.contracted_left_arm}
                        onChange={(e) => handleInputChange("contracted_left_arm", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Antebraço direito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.right_forearm}
                        onChange={(e) => handleInputChange("right_forearm", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Antebraço esquerdo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.left_forearm}
                        onChange={(e) => handleInputChange("left_forearm", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Tronco */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      <span className="font-medium">Tronco</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Pescoço</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.neck}
                        onChange={(e) => handleInputChange("neck", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ombro</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.shoulder}
                        onChange={(e) => handleInputChange("shoulder", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peitoral</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.chest}
                        onChange={(e) => handleInputChange("chest", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cintura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.waist}
                        onChange={(e) => handleInputChange("waist", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Abdômen</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.abdomen}
                        onChange={(e) => handleInputChange("abdomen", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quadril</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.hip}
                        onChange={(e) => handleInputChange("hip", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Membros Inferiores */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      <span className="font-medium">Membros inferiores</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Panturrilha direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.right_calf}
                        onChange={(e) => handleInputChange("right_calf", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Panturrilha esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.left_calf}
                        onChange={(e) => handleInputChange("left_calf", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coxa direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.right_thigh}
                        onChange={(e) => handleInputChange("right_thigh", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coxa esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.left_thigh}
                        onChange={(e) => handleInputChange("left_thigh", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coxa proximal direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.right_proximal_thigh}
                        onChange={(e) => handleInputChange("right_proximal_thigh", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coxa proximal esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Digite em cm..."
                        value={formData.left_proximal_thigh}
                        onChange={(e) => handleInputChange("left_proximal_thigh", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Dobras Cutâneas */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      <span className="font-medium">Dobras cutâneas</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Selecione um protocolo</Label>
                    <Select 
                      value={formData.skinfold_protocol} 
                      onValueChange={(value) => handleInputChange("skinfold_protocol", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um protocolo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-dobras-guedes">3 Dobras - Guedes</SelectItem>
                        <SelectItem value="3-dobras-jackson-pollock">3 Dobras - Jackson & Pollock</SelectItem>
                        <SelectItem value="4-dobras-durnin-womersley">4 Dobras - Durnin & Womersley</SelectItem>
                        <SelectItem value="4-dobras-faulkner">4 Dobras - Faulkner</SelectItem>
                        <SelectItem value="4-dobras-petroski">4 Dobras - Petroski</SelectItem>
                        <SelectItem value="7-dobras-jackson-pollock-ward">7 Dobras - Jackson, Pollock & Ward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2 pt-4">
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