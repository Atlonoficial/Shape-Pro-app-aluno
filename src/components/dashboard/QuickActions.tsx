import { Play, Apple, Calendar, Target } from "lucide-react";

const quickActions = [
  {
    id: 'start-workout',
    title: 'Iniciar Treino',
    subtitle: 'Treino do dia',
    icon: Play,
    color: 'primary'
  },
  {
    id: 'log-meal',
    title: 'Registrar Refeição',
    subtitle: 'Controle nutricional',
    icon: Apple,
    color: 'accent'
  },
  {
    id: 'schedule',
    title: 'Agenda',
    subtitle: 'Próximos treinos',
    icon: Calendar,
    color: 'secondary'
  },
  {
    id: 'goals',
    title: 'Metas',
    subtitle: 'Acompanhar progresso',
    icon: Target,
    color: 'primary'
  }
];

export const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {quickActions.map((action) => {
        const Icon = action.icon;
        
        return (
          <button
            key={action.id}
            className="card-gradient p-4 text-left hover:scale-105 transition-all duration-300 group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
              action.color === 'primary' ? 'bg-primary/10' :
              action.color === 'accent' ? 'bg-accent/10' : 'bg-secondary/10'
            }`}>
              <Icon 
                size={20} 
                className={`${
                  action.color === 'primary' ? 'text-primary' :
                  action.color === 'accent' ? 'text-accent' : 'text-secondary'
                }`}
              />
            </div>
            
            <h4 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
              {action.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {action.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
};