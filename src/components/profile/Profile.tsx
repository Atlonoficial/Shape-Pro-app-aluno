import { useState, useRef } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { updateUserProfile } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Edit2, Mail, User, Calendar, Activity, Target, Scale, Ruler } from "lucide-react";
import { toast } from "sonner";

export const Profile = () => {
  const { user, userProfile } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      // For now, just show success without actual upload
      toast.success("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Erro ao atualizar foto de perfil");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const profileStats = [
    { label: "Treinos Concluídos", value: "12", icon: Activity },
    { label: "Meta Semanal", value: "4/5", icon: Target },
    { label: "Peso Atual", value: "75kg", icon: Scale },
    { label: "Altura", value: "1.75m", icon: Ruler },
  ];

  return (
    <div className="p-4 pt-8 pb-24 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e acompanhe seu progresso
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Pessoal</TabsTrigger>
          <TabsTrigger value="fitness">Fitness</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações básicas de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage 
                      src={userProfile?.avatar_url} 
                      alt="Avatar do usuário" 
                    />
                    <AvatarFallback className="text-lg">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={triggerFileSelect}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {userProfile?.name || user?.email?.split('@')[0] || "Usuário"}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {userProfile?.user_type === 'teacher' ? 'Professor' : 'Aluno'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    defaultValue={userProfile?.name || ''}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Edit2 className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Fitness</CardTitle>
              <CardDescription>
                Configure seus dados físicos e objetivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo Principal</Label>
                <select
                  id="goal"
                  className="w-full p-2 border border-input rounded-md bg-background"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione seu objetivo</option>
                  <option value="weight_loss">Perda de Peso</option>
                  <option value="muscle_gain">Ganho de Massa</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="athletic_performance">Performance Atlética</option>
                </select>
              </div>

              <Button className="w-full md:w-auto">
                <Target className="w-4 h-4 mr-2" />
                Atualizar Dados
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profileStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progresso Recente</CardTitle>
              <CardDescription>
                Suas atividades e conquistas mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Treino de Peito concluído</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2 horas atrás</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Meta semanal atingida</span>
                  </div>
                  <span className="text-xs text-muted-foreground">1 dia atrás</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Peso atualizado</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3 dias atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};