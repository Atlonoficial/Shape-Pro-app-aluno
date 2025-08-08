import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Calendar, FileText, Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { addMedicalExam, getMedicalExamsByUser, MedicalExam } from "@/lib/firestore";
import { uploadDocument } from "@/lib/firebase-storage";
import { Timestamp } from "firebase/firestore";

export const ExamesMedicos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [unidade, setUnidade] = useState("");
  const [data, setData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = getMedicalExamsByUser(user.uid, (list) => setExams(list));
    return () => unsubscribe();
  }, [user?.uid]);

  const filteredExams = exams.filter((exame) =>
    exame.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNovoExame = () => setShowForm((s) => !s);

  const handleSalvarExame = async () => {
    if (!user?.uid) return;
    if (!tipo || !valor || !unidade || !data) {
      toast({ title: "Campos obrigatórios", description: "Preencha tipo, valor, unidade e data.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      let fileUrl: string | undefined = undefined;
      if (file) {
        const upload = await uploadDocument(user.uid, file, 'exam');
        fileUrl = upload.url;
      }
      await addMedicalExam({
        userId: user.uid,
        type: tipo,
        value: valor,
        unit: unidade,
        date: Timestamp.fromDate(new Date(data)),
        fileUrl,
      });
      toast({ title: "Exame salvo", description: "Seu exame foi enviado e compartilhado com o professor." });
      setShowForm(false);
      setTipo(""); setValor(""); setUnidade(""); setData(""); setFile(null);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
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
          <h1 className="text-xl font-bold text-foreground">Exames Médicos</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {exams.length}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exame..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info Message */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-primary text-sm font-medium">
            Resultados enviados ao seu professor automaticamente.
          </p>
        </div>

        {/* New Exam Form */}
        {showForm && (
          <Card className="p-4 bg-card/50 border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tipo (ex: Glicemia)" value={tipo} onChange={(e) => setTipo(e.target.value)} />
              <div className="flex gap-2">
                <Input placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
                <Input placeholder="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} />
              </div>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSalvarExame} disabled={saving}>{saving ? 'Salvando...' : 'Salvar exame'}</Button>
            </div>
          </Card>
        )}

        {/* Exams List */}
        <div className="space-y-3">
          {filteredExams.map((exame) => (
            <Card key={exame.id} className="p-4 bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{exame.type}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{exame.date.toDate().toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {exame.value} <span className="text-muted-foreground text-sm">{exame.unit}</span>
                    </p>
                  </div>
                  {exame.fileUrl && (
                    <a href={exame.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm">Ver</a>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {filteredExams.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum exame encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleNovoExame}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full btn-accent shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};