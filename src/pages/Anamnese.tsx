import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Heart, Shield, Pill, Moon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAnamnese } from "@/hooks/useAnamnese";

interface AnamneseData {
  doencas: string[];
  outrasDoencas: string;
  alergias: string[];
  outrasAlergias: string;
  medicacoes: string[];
  horasSono: string;
  qualidadeSono: string;
  lesoes: string;
}

export const Anamnese = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { record, loading: loadingAnamnese, save } = useAnamnese(user?.id);
  const [saving, setSaving] = useState(false);

  const [openSections, setOpenSections] = useState<string[]>(["doencas"]);
  const [formData, setFormData] = useState<AnamneseData>({
    doencas: [],
    outrasDoencas: "",
    alergias: [],
    outrasAlergias: "",
    medicacoes: [],
    horasSono: "",
    qualidadeSono: "",
    lesoes: ""
  });

  // Popular formulário quando houver registro existente
  useEffect(() => {
    if (!record) return;
    setFormData({
      doencas: record.doencas || [],
      outrasDoencas: record.outras_doencas || "",
      alergias: record.alergias || [],
      outrasAlergias: record.outras_alergias || "",
      medicacoes: record.medicacoes || [],
      horasSono: record.horas_sono || "",
      qualidadeSono: record.qualidade_sono || "",
      lesoes: record.lesoes || ""
    });
  }, [record]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleDoencaChange = (doenca: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      doencas: checked 
        ? [...prev.doencas, doenca]
        : prev.doencas.filter(d => d !== doenca)
    }));
  };

  const handleAlergiaChange = (alergia: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      alergias: checked 
        ? [...prev.alergias, alergia]
        : prev.alergias.filter(a => a !== alergia)
    }));
  };

  const addMedicacao = () => {
    const medicacao = prompt("Digite o nome da medicação:");
    if (medicacao) {
      setFormData(prev => ({
        ...prev,
        medicacoes: [...prev.medicacoes, medicacao]
      }));
    }
  };

  const removeMedicacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medicacoes: prev.medicacoes.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Você precisa estar autenticado",
        description: "Faça login para salvar sua anamnese.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    console.log("[Anamnese] saving formData:", formData);

    try {
      await save({
        doencas: formData.doencas,
        outras_doencas: formData.outrasDoencas || null,
        alergias: formData.alergias,
        outras_alergias: formData.outrasAlergias || null,
        medicacoes: formData.medicacoes,
        horas_sono: formData.horasSono || null,
        qualidade_sono: formData.qualidadeSono || null,
        lesoes: formData.lesoes || null,
      });

      toast({
        title: "Anamnese salva!",
        description: "Todas as respostas foram compartilhadas com seu professor.",
      });
    } catch (err: any) {
      console.error("[Anamnese] save error:", err);
      toast({
        title: "Erro ao salvar",
        description: err?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const doencasOptions = [
    "Diabetes", "Hipertensão", "Cardiopatias", "Tireoide", "Artrite", "Osteoporose"
  ];

  const alergiasOptions = [
    "Lactose", "Glúten", "Amendoim", "Frutos do mar", "Medicamentos", "Pólen"
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Anamnese</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Doenças Pré-existentes */}
        <Collapsible open={openSections.includes("doencas")} onOpenChange={() => toggleSection("doencas")}>
          <Card className="bg-card/50 border-border/50">
            <CollapsibleTrigger className="w-full p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-destructive" />
                  <h3 className="text-lg font-semibold text-foreground">Doenças pré-existentes</h3>
                </div>
                {openSections.includes("doencas") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-3">
                {doencasOptions.map((doenca) => (
                  <div key={doenca} className="flex items-center space-x-2">
                    <Checkbox 
                      id={doenca}
                      checked={formData.doencas.includes(doenca)}
                      onCheckedChange={(checked) => handleDoencaChange(doenca, checked as boolean)}
                    />
                    <Label htmlFor={doenca} className="text-foreground">{doenca}</Label>
                  </div>
                ))}
                <div className="mt-3">
                  <Label htmlFor="outras-doencas" className="text-foreground">Outras (especifique):</Label>
                  <Input 
                    id="outras-doencas"
                    value={formData.outrasDoencas}
                    onChange={(e) => setFormData(prev => ({...prev, outrasDoencas: e.target.value}))}
                    placeholder="Digite outras doenças..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Alergias */}
        <Collapsible open={openSections.includes("alergias")} onOpenChange={() => toggleSection("alergias")}>
          <Card className="bg-card/50 border-border/50">
            <CollapsibleTrigger className="w-full p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-warning" />
                  <h3 className="text-lg font-semibold text-foreground">Alergias</h3>
                </div>
                {openSections.includes("alergias") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-3">
                {alergiasOptions.map((alergia) => (
                  <div key={alergia} className="flex items-center space-x-2">
                    <Checkbox 
                      id={alergia}
                      checked={formData.alergias.includes(alergia)}
                      onCheckedChange={(checked) => handleAlergiaChange(alergia, checked as boolean)}
                    />
                    <Label htmlFor={alergia} className="text-foreground">{alergia}</Label>
                  </div>
                ))}
                <div className="mt-3">
                  <Label htmlFor="outras-alergias" className="text-foreground">Outras alergias:</Label>
                  <Input 
                    id="outras-alergias"
                    value={formData.outrasAlergias}
                    onChange={(e) => setFormData(prev => ({...prev, outrasAlergias: e.target.value}))}
                    placeholder="Digite outras alergias..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Medicações */}
        <Collapsible open={openSections.includes("medicacoes")} onOpenChange={() => toggleSection("medicacoes")}>
          <Card className="bg-card/50 border-border/50">
            <CollapsibleTrigger className="w-full p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Medicações em uso</h3>
                </div>
                {openSections.includes("medicacoes") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-3">
                {formData.medicacoes.map((medicacao, index) => (
                  <div key={index} className="flex items-center justify-between bg-background/50 p-2 rounded">
                    <span className="text-foreground">{medicacao}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeMedicacao(index)}
                      className="text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={addMedicacao}
                  className="w-full"
                >
                  + Adicionar medicação
                </Button>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Hábitos de Sono */}
        <Collapsible open={openSections.includes("sono")} onOpenChange={() => toggleSection("sono")}>
          <Card className="bg-card/50 border-border/50">
            <CollapsibleTrigger className="w-full p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Hábitos de sono</h3>
                </div>
                {openSections.includes("sono") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground">Qualidade do sono</Label>
                  <Select value={formData.qualidadeSono} onValueChange={(value) => setFormData(prev => ({...prev, qualidadeSono: value}))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">Excelente</SelectItem>
                      <SelectItem value="boa">Boa</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="ruim">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="horas-sono" className="text-foreground">Horas médias de sono por noite</Label>
                  <Input 
                    id="horas-sono"
                    type="number"
                    value={formData.horasSono}
                    onChange={(e) => setFormData(prev => ({...prev, horasSono: e.target.value}))}
                    placeholder="8"
                    className="mt-1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Lesões ou Cirurgias */}
        <Collapsible open={openSections.includes("lesoes")} onOpenChange={() => toggleSection("lesoes")}>
          <Card className="bg-card/50 border-border/50">
            <CollapsibleTrigger className="w-full p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-semibold text-foreground">Lesões ou cirurgias</h3>
                </div>
                {openSections.includes("lesoes") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div>
                <Label htmlFor="lesoes" className="text-foreground">Descreva lesões anteriores, cirurgias ou limitações físicas</Label>
                <Textarea 
                  id="lesoes"
                  value={formData.lesoes}
                  onChange={(e) => setFormData(prev => ({...prev, lesoes: e.target.value}))}
                  placeholder="Descreva qualquer lesão, cirurgia ou limitação física relevante..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Footer Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-primary text-sm font-medium">
            Todas as respostas serão compartilhadas com seu professor.
          </p>
          {loadingAnamnese && (
            <p className="text-muted-foreground text-xs mt-2">Carregando suas respostas salvas...</p>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-4 left-4 right-4">
        <Button 
          onClick={handleSave}
          disabled={saving || loadingAnamnese}
          className="w-full h-12 rounded-full btn-accent text-background font-medium"
        >
          {saving ? "Salvando..." : "Salvar histórico"}
        </Button>
      </div>
    </div>
  );
};
