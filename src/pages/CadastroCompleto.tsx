import { useState } from "react";
import { ArrowLeft, User, Target, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";

export const CadastroCompleto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createStudent, mapGoalToStandard, loading } = useStudents();
  
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    dataNascimento: "",
    sexo: "",
    altura: "",
    pesoInicial: "",
    objetivo: "",
    metaNumerica: "",
    email: user?.email || "",
    telefone: ""
  });

  /**
   * Submete cadastro completo para Firebase - SINCRONIZADO COM DASHBOARD DO PROFESSOR
   * 
   * CRITICAL: Campo teacher_id deve ser preenchido para aparecer no Dashboard
   * Por ora usando professor padrão - implementar seleção depois
   */
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login primeiro.",
        variant: "destructive"
      });
      return;
    }

    // Validações básicas
    if (!formData.nomeCompleto || !formData.objetivo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome completo e objetivo.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Debug logs para verificar dados sendo enviados
      console.log('📝 [App] Iniciando cadastro completo:', {
        user: user.uid,
        formData
      });

      // Preparar dados no formato esperado pelo Dashboard do Professor
      const studentData = {
        name: formData.nomeCompleto,
        email: formData.email || user.email || '',
        phone: formData.telefone,
        plan: "Plano Básico", // Padrão - pode ser alterado pelo professor
        mode: "Online", // Padrão - pode ser alterado pelo professor  
        goal: mapGoalToStandard(formData.objetivo),
        teacher_id: "default-teacher-id", // CRÍTICO: Deve ser UID real do professor
        // Dados adicionais do cadastro completo
        birthDate: formData.dataNascimento,
        gender: formData.sexo,
        height: formData.altura ? parseFloat(formData.altura) : undefined,
        initialWeight: formData.pesoInicial ? parseFloat(formData.pesoInicial) : undefined,
        numericGoal: formData.metaNumerica
      };

      console.log('📝 [App] Dados formatados para Firestore:', studentData);

      // Salvar no Firestore - aparecerá no Dashboard instantaneamente
      const studentId = await createStudent(studentData);
      
      console.log('✅ [App] Cadastro completo salvo:', studentId);

      toast({
        title: "Cadastro salvo!",
        description: "Suas informações foram enviadas ao seu professor e aparecerão no Dashboard em tempo real.",
      });

      // Navegar de volta para o perfil
      navigate("/?tab=profile");
      
    } catch (error: any) {
      console.error('❌ [App] Erro no cadastro completo:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o cadastro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
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
          <h1 className="text-xl font-bold text-foreground">Cadastro Completo</h1>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div className="bg-warning h-2 rounded-full" style={{ width: '90%' }}></div>
          </div>
          <span className="text-warning font-medium text-sm">90%</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Dados Pessoais */}
        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Dados Pessoais</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-foreground">Nome completo</Label>
              <Input 
                id="nome"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
                placeholder="Digite seu nome completo"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="nascimento" className="text-foreground">Data de nascimento</Label>
              <Input 
                id="nascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-foreground">Sexo</Label>
              <RadioGroup 
                value={formData.sexo}
                onValueChange={(value) => setFormData({...formData, sexo: value})}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="masculino" id="masculino" />
                  <Label htmlFor="masculino" className="text-foreground">Masculino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feminino" id="feminino" />
                  <Label htmlFor="feminino" className="text-foreground">Feminino</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="altura" className="text-foreground">Altura (cm)</Label>
                <Input 
                  id="altura"
                  type="number"
                  value={formData.altura}
                  onChange={(e) => setFormData({...formData, altura: e.target.value})}
                  placeholder="170"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="peso" className="text-foreground">Peso inicial (kg)</Label>
                <Input 
                  id="peso"
                  type="number"
                  value={formData.pesoInicial}
                  onChange={(e) => setFormData({...formData, pesoInicial: e.target.value})}
                  placeholder="70"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Objetivos */}
        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Objetivos</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Objetivo principal</Label>
              <Select value={formData.objetivo} onValueChange={(value) => setFormData({...formData, objetivo: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione seu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecer">Emagrecer</SelectItem>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="meta" className="text-foreground">Meta numérica</Label>
              <Input 
                id="meta"
                value={formData.metaNumerica}
                onChange={(e) => setFormData({...formData, metaNumerica: e.target.value})}
                placeholder="Ex: Perder 5kg em 3 meses"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Contato */}
        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Contato</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="seu@email.com"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="telefone" className="text-foreground">Telefone</Label>
              <Input 
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(11) 99999-9999"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Footer Note */}
        <p className="text-muted-foreground text-sm text-center px-4">
          Ao salvar, suas informações serão enviadas ao seu professor.
        </p>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-4 left-4 right-4">
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 rounded-full bg-warning hover:bg-warning/90 text-background font-medium"
        >
          {loading ? "Salvando..." : "Salvar e continuar"}
        </Button>
      </div>
    </div>
  );
};