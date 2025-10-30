import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Edit3 } from "lucide-react";
import { UserGoal, useGoals } from "@/hooks/useGoals";

interface UpdateProgressDialogProps {
  goal: UserGoal;
  trigger?: React.ReactNode;
}

export const UpdateProgressDialog = ({ goal, trigger }: UpdateProgressDialogProps) => {
  const { updateGoalProgress } = useGoals();
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(goal.current_value.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newValue = parseFloat(currentValue);
    if (isNaN(newValue) || newValue < 0) return;

    const success = await updateGoalProgress(goal.id, newValue);
    if (success) {
      setOpen(false);
    }
  };

  const progressPercentage = goal.target_value > 0 
    ? Math.min(100, (parseFloat(currentValue) / goal.target_value) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="btn-primary">
            <Edit3 size={16} className="mr-1" />
            Atualizar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{goal.title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso Atual</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{parseFloat(currentValue) || 0} {goal.target_unit}</span>
              <span>{goal.target_value} {goal.target_unit}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="currentValue">Valor Atual</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="currentValue"
                type="number"
                step="0.1"
                min="0"
                max={goal.target_value * 1.5} // Permite ultrapassar a meta
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                {goal.target_unit}
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <div className="text-sm font-medium">Meta: {goal.target_value} {goal.target_unit}</div>
            {goal.description && (
              <div className="text-xs text-muted-foreground">{goal.description}</div>
            )}
            {goal.target_date && (
              <div className="text-xs text-muted-foreground">
                Prazo: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary">
              Salvar Progresso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};