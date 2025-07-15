import { useState } from "react";
import { ArrowLeft, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Foto {
  id: number;
  data: string;
  url: string;
}

const fotosData: Foto[] = [
  {
    id: 1,
    data: "15/01/2024",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 2,
    data: "10/01/2024", 
    url: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 3,
    data: "05/01/2024",
    url: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 4,
    data: "01/01/2024",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 5,
    data: "28/12/2023",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 6,
    data: "25/12/2023",
    url: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 7,
    data: "20/12/2023",
    url: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 8,
    data: "15/12/2023",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400"
  }
];

export const FotosProgresso = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("todos");
  const [fotos] = useState<Foto[]>(fotosData);

  const handleAdicionarFoto = () => {
    toast({
      title: "Nova foto",
      description: "Funcionalidade de adicionar foto em desenvolvimento.",
    });
  };

  const filteredFotos = fotos.filter(foto => {
    if (filtro === "todos") return true;
    
    const dataFoto = new Date(foto.data.split('/').reverse().join('-'));
    const hoje = new Date();
    const diffTime = hoje.getTime() - dataFoto.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (filtro === "7dias") return diffDays <= 7;
    if (filtro === "30dias") return diffDays <= 30;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Fotos de Progresso</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {fotos.length}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filter Dropdown */}
        <div className="flex justify-end">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">30 dias</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info Message */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-primary text-sm font-medium">
            Todas as fotos serão compartilhadas com seu professor.
          </p>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredFotos.map((foto) => (
            <Card key={foto.id} className="relative overflow-hidden bg-card/50 border-border/50 hover:bg-card/70 transition-colors">
              <div className="aspect-square relative">
                <img 
                  src={foto.url}
                  alt={`Progresso ${foto.data}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {foto.data}
                </div>
              </div>
            </Card>
          ))}

          {filteredFotos.length === 0 && (
            <div className="col-span-2 text-center py-8">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma foto encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleAdicionarFoto}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full btn-accent shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};