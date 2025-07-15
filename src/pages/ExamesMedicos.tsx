import { useState } from "react";
import { ArrowLeft, Search, Plus, Calendar, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Exame {
  id: number;
  data: string;
  tipo: string;
  valor: string;
  unidade: string;
}

const examesData: Exame[] = [
  {
    id: 1,
    data: "15/01/2024",
    tipo: "Colesterol Total",
    valor: "180",
    unidade: "mg/dL"
  },
  {
    id: 2,
    data: "10/01/2024",
    tipo: "Glicemia",
    valor: "85",
    unidade: "mg/dL"
  }
];

export const ExamesMedicos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [exames] = useState<Exame[]>(examesData);

  const filteredExames = exames.filter(exame => 
    exame.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNovoExame = () => {
    toast({
      title: "Novo exame",
      description: "Funcionalidade de adicionar exame em desenvolvimento.",
    });
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
            {exames.length}
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

        {/* Exames List */}
        <div className="space-y-3">
          {filteredExames.map((exame) => (
            <Card key={exame.id} className="p-4 bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{exame.tipo}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{exame.data}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {exame.valor} <span className="text-muted-foreground text-sm">{exame.unidade}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredExames.length === 0 && (
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