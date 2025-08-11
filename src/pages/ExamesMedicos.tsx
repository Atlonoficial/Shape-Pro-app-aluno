import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Calendar, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MedicalExam {
  id: string;
  title: string;
  date: string;
  file_url?: string;
  notes?: string;
  created_at: string;
}

export const ExamesMedicos = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("medical_exams")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) throw error;
        setExams(data || []);
      } catch (error) {
        console.error("Erro ao buscar exames:", error);
        toast.error("Erro ao carregar exames médicos");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user?.id]);

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
          <h1 className="text-xl font-bold text-foreground">Exames Médicos</h1>
          <span className="ml-auto text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">
            {exams.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <Card className="mb-4 bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-primary text-sm">
              Seus exames estão sendo enviados em tempo real ao seu professor.
            </p>
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Button className="w-full mb-4" variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Adicionar Novo Exame
        </Button>

        {/* Exams List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando exames...
            </CardContent>
          </Card>
        ) : exams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum exame médico cadastrado.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione seus exames para compartilhar com seu professor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:bg-muted/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{exam.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(exam.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {exam.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{exam.notes}</p>
                        )}
                      </div>
                    </div>
                    {exam.file_url && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};