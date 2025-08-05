
import { useState, useRef } from "react";
import { User, Trophy, Settings, FileText, Camera, Activity, Calendar, Shield, CreditCard, Edit2, Loader2, Upload, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useMyWorkouts } from "@/hooks/useMyWorkouts";
import { useMyNutrition } from "@/hooks/useMyNutrition";
import { signOutUser, updateUserProfile } from "@/lib/auth";
import { uploadUserAvatar } from "@/lib/firebase-storage";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { icon: CreditCard, title: "Assinaturas & Planos", subtitle: "Gerencie sua assinatura", path: "/assinaturas-planos" },
  { icon: FileText, title: "Cadastro Completo", subtitle: "Informações pessoais", path: "/cadastro-completo" },
  { icon: Activity, title: "Exames Médicos", subtitle: "Últimos resultados", path: "/exames-medicos" },
  { icon: Camera, title: "Fotos de Progresso", subtitle: "Evolução visual", path: "/fotos-progresso" },
  { icon: FileText, title: "Avaliações Físicas", subtitle: "Medidas e composição", path: "/avaliacoes-fisicas" },
  { icon: User, title: "Anamnese", subtitle: "Histórico de saúde", path: "/anamnese" },
  { icon: Settings, title: "Configurações", subtitle: "Preferências do app", path: "/configuracoes" },
];

export const Profile = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { student, loading: studentLoading, updateProfile } = useStudentProfile();
  const { getWorkoutStats } = useMyWorkouts();
  const { getWeeklyAdherence } = useMyNutrition();
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    weight: student?.measurements?.weight || 0,
    height: student?.measurements?.height || 0,
    goals: student?.goals?.join(', ') || ''
  });

  const workoutStats = getWorkoutStats();
  const nutritionAdherence = getWeeklyAdherence();
  
  const handleRewardsClick = () => {
    navigate('/?tab=rewards');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair da conta.",
        variant: "destructive"
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!student) return;
    
    try {
      await updateProfile({
        measurements: {
          ...student.measurements,
          weight: editData.weight,
          height: editData.height,
          lastUpdated: student.measurements.lastUpdated
        },
        goals: editData.goals.split(',').map(g => g.trim()).filter(g => g)
      });
      
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Upload to Firebase Storage
      const uploadResult = await uploadUserAvatar(user.uid, file);
      
      // Update user profile with new photo URL
      await updateUserProfile(user.uid, {
        photoURL: uploadResult.url
      });
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi alterada com sucesso!"
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar sua foto de perfil.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  if (studentLoading) {
    return (
      <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  // Calculate real profile stats from Firebase data
  const profileStats = [
    { 
      label: "Treinos Concluídos", 
      value: workoutStats.totalWorkouts.toString(), 
      icon: Activity 
    },
    { 
      label: "Tempo Total", 
      value: `${Math.round(workoutStats.totalTime)}min`, 
      icon: Calendar 
    },
    { 
      label: "Aderência Dieta", 
      value: `${Math.round(nutritionAdherence)}%`, 
      icon: Trophy 
    },
  ];

  const getMembershipTime = () => {
    if (!student?.createdAt) return "Novo membro";
    const created = student.createdAt.toDate();
    const now = new Date();
    const months = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (months === 0) return "Novo membro";
    if (months === 1) return "Membro há 1 mês";
    return `Membro há ${months} meses`;
  };

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        <div className="relative inline-block mb-4">
          {/* Profile Photo or User Icon */}
          <div 
            className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handlePhotoClick}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>
          
          {/* Upload Button */}
          <div 
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={handlePhotoClick}
          >
            {uploadingPhoto ? (
              <Loader2 className="w-4 h-4 text-background animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-background" />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-xl font-bold text-foreground">
            {userProfile?.name || user?.displayName || user?.email?.split('@')[0] || "Usuário"}
          </h1>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <p className="text-muted-foreground">{getMembershipTime()}</p>
        
        {/* Profile Edit Form */}
        {isEditing && (
          <Card className="mt-4 p-4 text-left">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={editData.weight}
                    onChange={(e) => setEditData({...editData, weight: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={editData.height}
                    onChange={(e) => setEditData({...editData, height: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="goals">Objetivos (separados por vírgula)</Label>
                <Input
                  id="goals"
                  value={editData.goals}
                  onChange={(e) => setEditData({...editData, goals: e.target.value})}
                  placeholder="Ex: Perder peso, Ganhar massa muscular, Melhorar condicionamento"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} size="sm">
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Current measurements display */}
        {!isEditing && student?.measurements && (
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
            {student.measurements.weight > 0 && (
              <span>{student.measurements.weight}kg</span>
            )}
            {student.measurements.height > 0 && (
              <span>{student.measurements.height}cm</span>
            )}
            {student.measurements.weight > 0 && student.measurements.height > 0 && (
              <span>IMC: {((student.measurements.weight / ((student.measurements.height/100) ** 2))).toFixed(1)}</span>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {profileStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-gradient">
              <CardContent className="p-3 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Goals Display */}
      {student?.goals && student.goals.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Seus Objetivos</h3>
            <div className="flex flex-wrap gap-2">
              {student.goals.map((goal, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/20 text-primary">
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Button */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground mb-1">Loja de Recompensas</h3>
          <p className="text-sm text-muted-foreground mb-3">Troque seus pontos por prêmios</p>
          <button 
            className="btn-primary"
            onClick={handleRewardsClick}
          >
            Acessar Loja
          </button>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground mb-4">Dados e Configurações</h3>
        
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className="card-gradient hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Teacher Info */}
      {student?.teacherId && (
        <Card className="mt-6 bg-secondary/10 border-secondary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Seu Professor</h3>
            <p className="text-sm text-muted-foreground">
              Conectado ao professor ID: {student.teacherId}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Status: {student.membershipStatus === 'active' ? 'Ativo' : 'Inativo'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="mt-6 bg-destructive/10 border-destructive/20">
        <CardContent className="p-4 text-center">
          <button 
            className="text-destructive font-medium"
            onClick={handleLogout}
          >
            Sair da Conta
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
