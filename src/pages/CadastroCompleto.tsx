import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { supabase } from "@/integrations/supabase/client";
import { updateUserProfile } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Save, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  weight: z.number().optional(),
  height: z.number().optional(),
  body_fat: z.number().optional(),
  muscle_mass: z.number().optional(),
  goals: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CadastroCompleto() {
  const { user, userProfile } = useAuthContext();
  const { student, updateProfile } = useStudentProfile();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userProfile?.name || "",
      email: userProfile?.email || "",
      weight: student?.weight || undefined,
      height: student?.height || undefined,
      body_fat: student?.body_fat || undefined,
      muscle_mass: student?.muscle_mass || undefined,
      goals: student?.goals || [],
    },
  });

  // Calcula % de completude do perfil
  const calculateCompleteness = () => {
    const fields = [
      userProfile?.name,
      userProfile?.email,
      userProfile?.avatar_url,
      student?.weight,
      student?.height,
      student?.goals?.length,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const path = `${user.id}/avatar.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

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

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Atualizar perfil geral
      await updateUserProfile(user.id, {
        name: data.name,
        email: data.email,
      });

      // Atualizar dados específicos do estudante
      if (student) {
        await updateProfile({
          weight: data.weight,
          height: data.height,
          body_fat: data.body_fat,
          muscle_mass: data.muscle_mass,
          goals: data.goals || [],
          measurements_updated_at: new Date().toISOString(),
        });
      }

      toast.success("Perfil atualizado com sucesso!");
      navigate("/?tab=profile");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pt-8 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/?tab=profile")}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Cadastro Completo</h1>
            <p className="text-sm text-muted-foreground">
              Complete suas informações pessoais
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completude do Perfil</span>
              <span className="text-sm text-muted-foreground">{calculateCompleteness()}%</span>
            </div>
            <Progress value={calculateCompleteness()} className="h-2" />
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
                    <AvatarFallback className="text-xl">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-9 h-9 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Clique no ícone da câmera para alterar sua foto
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Seu nome completo"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="seu@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medidas Corporais */}
          <Card>
            <CardHeader>
              <CardTitle>Medidas Corporais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...form.register("weight", { valueAsNumber: true })}
                    placeholder="70.5"
                  />
                </div>

                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    {...form.register("height", { valueAsNumber: true })}
                    placeholder="175"
                  />
                </div>

                <div>
                  <Label htmlFor="body_fat">% Gordura</Label>
                  <Input
                    id="body_fat"
                    type="number"
                    step="0.1"
                    {...form.register("body_fat", { valueAsNumber: true })}
                    placeholder="15.5"
                  />
                </div>

                <div>
                  <Label htmlFor="muscle_mass">Massa Muscular (kg)</Label>
                  <Input
                    id="muscle_mass"
                    type="number"
                    step="0.1"
                    {...form.register("muscle_mass", { valueAsNumber: true })}
                    placeholder="45.2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="goals">Seus Objetivos</Label>
                <Textarea
                  id="goals"
                  placeholder="Descreva seus objetivos fitness (ex: perder peso, ganhar massa muscular, melhorar condicionamento...)"
                  className="mt-1"
                  value={student?.goals?.join(", ") || ""}
                  onChange={(e) => {
                    const goals = e.target.value.split(",").map(g => g.trim()).filter(Boolean);
                    form.setValue("goals", goals);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/?tab=profile")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}