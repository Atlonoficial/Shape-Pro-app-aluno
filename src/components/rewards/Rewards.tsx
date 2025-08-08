
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Rewards = () => {
  return (
    <div className="p-4 pt-8 pb-24 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-card/60 border-border/50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Loja de Recompensas</h1>
          <p className="text-muted-foreground">
            Esta seção aparecerá quando seu professor liberar a loja e cadastrar os prêmios.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            No momento, nenhum item está disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
