import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock } from "lucide-react";

interface RedemptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardTitle: string;
  pointsSpent: number;
}

export const RedemptionConfirmDialog = ({
  open,
  onOpenChange,
  rewardTitle,
  pointsSpent,
}: RedemptionConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Resgate Solicitado!
          </DialogTitle>
          <DialogDescription className="text-center space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-base font-medium text-foreground">
                {rewardTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {pointsSpent} pontos foram debitados
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Aguardando Aprovação</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Seu professor receberá a notificação e aprovará seu resgate em breve.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Você será notificado quando seu resgate for aprovado ou se houver algum problema.
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
