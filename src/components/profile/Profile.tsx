import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { updateUserProfile } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, Camera, Calendar, Activity, Target, CalendarDays, CreditCard, ClipboardList, Stethoscope, Images, Ruler, Shield, Cog, TrophyIcon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
  const { user, userProfile } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const [points, setPoints] = useState<number>(0);
  const [sessionsCount, setSessionsCount] = useState<number>(0);
  const [activeDays, setActiveDays] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Sincroniza avatar local quando o perfil carregar/atualizar
  useEffect(() => {
    setAvatarUrl(userProfile?.avatar_url || null);
  }, [userProfile?.avatar_url]);

  const memberSince = useMemo(() => {
    const created = userProfile?.created_at ? new Date(userProfile.created_at) : null;
    return created
      ? created.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : "";
  }, [userProfile?.created_at]);

  useEffect(() => {
    if (!user?.id) return;

    // Pontos do usuário
    supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar pontos:", error);
          return;
        }
        setPoints(data?.total_points ?? 0);
      });

    // Quantidade de sessões concluídas
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count, error }) => {
        if (error) {
          console.error("Erro ao contar sessões:", error);
          return;
        }
        setSessionsCount(count ?? 0);
      });

    // Dias ativos distintos
    supabase
      .from("workout_sessions")
      .select("start_time")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar dias ativos:", error);
          return;
        }
        const days = new Set(
          (data ?? [])
            .map((s: any) => s.start_time)
            .filter(Boolean)
            .map((iso: string) => new Date(iso).toISOString().slice(0, 10))
        );
        setActiveDays(days.size);
      });
  }, [user?.id]);

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const path = `${user.id}/avatar.jpg`;

      // Upload para bucket público "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      // Public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      // Atualiza perfil e estado local para refletir imediatamente
      await updateUserProfile(user.id, { avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
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

  const goToRewards = () => {
    navigate({ pathname: "/rewards", search: "?tab=rewards" });
  };

  return (
    <div className="p-4 pt-8 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarUrl ?? undefined} alt="Avatar do usuário" />
            <AvatarFallback className="text-xl">
              {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
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
          {userProfile?.name || user?.email?.split("@")[0] || "Usuário"}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Treinos Concluídos</p>
              <p className="text-lg font-semibold text-foreground">{sessionsCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrophyIcon className="w-5 h-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Pontos Totais</p>
              <p className="text-lg font-semibold text-foreground">{points.toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Dias Ativos</p>
              <p className="text-lg font-semibold text-foreground">{activeDays}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Dados e Configurações */}
      <h2 className="text-lg font-semibold mb-3">Dados e Configurações</h2>
      <div className="space-y-3">
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

        <Card role="button" onClick={() => navigate("/anamnese")} className="hover:bg-muted/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Cadastro Completo</p>
              <p className="text-sm text-muted-foreground">Informações pessoais</p>
            </div>
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
