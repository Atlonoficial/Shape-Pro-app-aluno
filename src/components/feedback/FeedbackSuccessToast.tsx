import { CheckCircle2, Trophy, Star } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackSuccessToastProps {
  pointsAwarded: number;
  feedbackId: string;
  studentName?: string;
}

export const showFeedbackSuccessToast = ({ 
  pointsAwarded, 
  feedbackId, 
  studentName 
}: FeedbackSuccessToastProps) => {
  toast.custom((t) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-green-200 dark:border-green-800 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              Feedback Enviado!
            </h3>
            {pointsAwarded > 0 && (
              <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full">
                <Trophy className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  +{pointsAwarded} pts
                </span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Obrigado pelo seu feedback! {pointsAwarded > 0 && `Você ganhou ${pointsAwarded} pontos.`}
          </p>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>Feedback ID: {feedbackId.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  ), {
    duration: 5000,
    position: 'top-right',
  });
};