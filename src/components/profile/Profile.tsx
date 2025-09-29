import { useRef, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { getUserProfile } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Camera, Calendar, Activity, Target, CalendarDays, CreditCard, ClipboardList, Stethoscope, Images, Ruler, Shield, Cog } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PointsWidget } from "@/components/gamification/PointsWidget";
import { TeacherCard } from "./TeacherCard";
import { DynamicBadge } from "@/components/ui/DynamicBadge";
import { useViewedItems } from "@/hooks/useViewedItems";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useAnamneseCompletion } from "@/hooks/useAnamneseCompletion";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useOptimizedAvatar } from "@/hooks/useOptimizedAvatar";
import { ProfileStats } from "./ProfileStats";

export const Profile = () => {
  const { user, userProfile } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Optimized hooks
  const { markAsViewed } = useViewedItems(user?.id);
  const profileCompletion = useProfileCompletion();
  const anamneseCompletion = useAnamneseCompletion();
  const { points, sessionsCount, activeDays, examCount, photoCount, assessmentCount, loading: statsLoading } = useProfileStats();
  const { avatarUrl, memberSince, displayName, avatarFallback } = useOptimizedAvatar();

  // Statistics are now handled by useProfileStats hook

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      // Use unique filename with timestamp for cache busting
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const path = `${user.id}/${fileName}`;

      // Upload para bucket público "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { 
          contentType: file.type, 
          upsert: true 
        });
      if (uploadError) throw uploadError;

      // Public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      // Atualiza perfil na database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;

      // Force refresh user profile to trigger real-time sync
      try {
        const updatedProfile = await getUserProfile(user.id);
        if (updatedProfile) {
          console.log('Profile updated successfully, real-time will sync');
        }
      } catch (refreshError) {
        console.error('Error refreshing profile:', refreshError);
      }

      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao atualizar foto de perfil");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleCardClick = (path: string, category?: 'profile' | 'anamnese' | 'exams' | 'photos' | 'assessments') => {
    if (category) {
      markAsViewed(path, category);
    }
    navigate(path);
  };

  const goToRewards = () => {
    navigate("/recompensas");
  };

  const goToGamification = () => {
    navigate({ pathname: "/", search: "?tab=gamification" });
  };

  return (
    <div className="p-4 pt-8 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarUrl ?? undefined} alt="Avatar do usuário" />
            <AvatarFallback className="text-xl">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 -right-2 rounded-full w-9 h-9 p-0"
            onClick={triggerFileSelect}
            disabled={uploading}
            aria-label="Alterar foto de perfil"
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

        <h1 className="text-2xl font-bold text-foreground">
          {displayName}
        </h1>
        {memberSince && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> Membro desde {memberSince}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          <span className="font-semibold text-foreground">{points.toLocaleString("pt-BR")} pontos</span>
        </div>
      </div>

      {/* Stats */}
      <ProfileStats 
        points={points}
        sessionsCount={sessionsCount}
        activeDays={activeDays}
        loading={statsLoading}
      />

      {/* Teacher Profile */}
      <TeacherCard />

      {/* Teacher Dashboard Access */}
      {userProfile?.user_type === 'teacher' && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Cog className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Dashboard Professor</h3>
                  <p className="text-sm text-muted-foreground">Gerencie cursos, produtos e alunos</p>
                </div>
              </div>
              <Button onClick={() => navigate("/dashboard-professor")}>Acessar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards CTA */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Loja de Recompensas</h3>
                <p className="text-sm text-muted-foreground">Troque seus pontos por prêmios</p>
              </div>
            </div>
            <Button onClick={goToRewards}>Acessar Loja</Button>
          </div>
        </CardContent>
      </Card>

      {/* Points Widget - Moved from Dashboard */}
      <div className="mb-6">
        <PointsWidget onClick={goToGamification} />
      </div>

      {/* Meus Dados */}
      <h2 className="text-lg font-semibold mb-3 mt-6">Meus Dados</h2>
      <div className="space-y-3">
        <Card role="button" onClick={() => handleCardClick("/cadastro-completo", 'profile')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Cadastro Completo</p>
              <p className="text-sm text-muted-foreground">Complete suas informações pessoais</p>
            </div>
            <DynamicBadge 
              percentage={profileCompletion.percentage}
              show={!profileCompletion.isComplete}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dados e Configurações */}
      <h2 className="text-lg font-semibold mb-3 mt-6">Dados e Configurações</h2>
      <div className="space-y-3">
        <Card role="button" onClick={() => handleCardClick("/anamnese", 'anamnese')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Anamnese</p>
              <p className="text-sm text-muted-foreground">Histórico médico e questionário de saúde</p>
            </div>
            <DynamicBadge 
              percentage={anamneseCompletion.hasAnamnese ? anamneseCompletion.percentage : undefined}
              status={!anamneseCompletion.hasAnamnese ? 'new' : undefined}
              show={!anamneseCompletion.isComplete}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/assinaturas-planos")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Assinaturas & Planos</p>
              <p className="text-sm text-muted-foreground">Gerencie sua assinatura</p>
            </div>
          </CardContent>
        </Card>

        <Card role="button" onClick={() => handleCardClick("/exames-medicos", 'exams')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Exames Médicos</p>
              <p className="text-sm text-muted-foreground">Últimos resultados</p>
            </div>
            <DynamicBadge 
              count={examCount}
              show={examCount > 0}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => handleCardClick("/fotos-progresso", 'photos')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Images className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Fotos de Progresso</p>
              <p className="text-sm text-muted-foreground">Evolução visual</p>
            </div>
            <DynamicBadge 
              count={photoCount}
              show={photoCount > 0}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => handleCardClick("/avaliacoes-fisicas", 'assessments')} className="hover:bg-muted/40 transition-colors relative">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Ruler className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Avaliações Físicas</p>
              <p className="text-sm text-muted-foreground">Medidas e composição</p>
            </div>
            <DynamicBadge 
              count={assessmentCount}
              show={assessmentCount > 0}
            />
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/configuracoes")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Cog className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Configurações</p>
              <p className="text-sm text-muted-foreground">Preferências do aplicativo</p>
            </div>
          </CardContent>
        </Card>

        <Card role="button" onClick={() => navigate("/conta-seguranca")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Conta & Segurança</p>
              <p className="text-sm text-muted-foreground">Alterar senha e sessão</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
