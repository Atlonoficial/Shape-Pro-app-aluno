import { MessageCircle, Zap } from "lucide-react";

interface CoachAICardProps {
  onCoachClick?: () => void;
}

export const CoachAICard = ({ onCoachClick }: CoachAICardProps) => {
  return (
    <div className="card-gradient p-6 mb-6 border border-accent/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center">
          <Zap size={24} className="text-accent-foreground" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">Coach IA</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-success font-medium">Online 24/7</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Seu assistente pessoal para treinos, dieta e dicas de performance.
          </p>
          
          <button 
            onClick={onCoachClick}
            className="btn-accent flex items-center gap-2 w-full justify-center"
          >
            <MessageCircle size={18} />
            <span>Conversar Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};