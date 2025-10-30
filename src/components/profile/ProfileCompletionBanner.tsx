import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

interface TeacherProfile {
  bio?: string;
  phone?: string;
  whatsapp_url?: string;
  specialties?: string | string[];
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  avatar_url?: string;
  user_type?: string;
}

export const ProfileCompletionBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProfileCompletionStatus | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!profile || profile.user_type !== 'teacher') return;

    const missingFields: string[] = [];
    let completedFields = 0;
    const totalFields = 7;

    // Check required fields
    if (!profile.bio) missingFields.push('Biografia');
    else completedFields++;

    if (!profile.phone && !profile.whatsapp_url) missingFields.push('Telefone/WhatsApp');
    else completedFields++;

    if (!Array.isArray(profile.specialties) || profile.specialties.length === 0) {
      missingFields.push('Especialidades');
    } else {
      completedFields++;
    }

    if (!profile.instagram_url && !profile.facebook_url && !profile.youtube_url) {
      missingFields.push('Redes Sociais');
    } else {
      completedFields++;
    }

    if (!profile.avatar_url) missingFields.push('Foto de Perfil');
    else completedFields++;

    // Always count name and email as completed
    completedFields += 2;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    const isComplete = completionPercentage >= 80;

    setStatus({
      isComplete,
      missingFields,
      completionPercentage,
    });
  }, [profile]);

  if (!status || status.isComplete || !profile || profile.user_type !== 'teacher') {
    return null;
  }

  return (
    <Card className="border-warning/50 bg-warning/5 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Complete seu perfil ({status.completionPercentage}%)
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Um perfil completo gera mais confiança nos alunos e melhora sua visibilidade.
            </p>
            
            {status.missingFields.length > 0 && (
              <div className="space-y-1 mb-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Campos faltantes:
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {status.missingFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              size="sm"
              onClick={() => navigate('/teacher/edit-profile')}
              className="w-full sm:w-auto"
            >
              Completar Perfil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
