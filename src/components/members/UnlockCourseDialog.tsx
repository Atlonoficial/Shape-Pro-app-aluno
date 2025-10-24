import { useState } from 'react';
import { Lock, Crown, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoursePaymentSync } from '@/hooks/useCoursePaymentSync';
import { useTeacherGatewayStatus } from '@/hooks/useTeacherGatewayStatus';
import { useCheckout } from '@/hooks/useCheckout';
import { toast } from 'sonner';
import { openExternalLink } from '@/utils/openExternalLink';

interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  instructor: string;
  total_lessons?: number;
}

interface UnlockCourseDialogProps {
  course: Course | null;
  onClose: () => void;
}

export const UnlockCourseDialog = ({ course, onClose }: UnlockCourseDialogProps) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Fetch synchronized course and payment data
  const { courseData } = useCoursePaymentSync(course?.id || '');
  
  // Get real-time gateway status from teacher
  const { gatewayStatus, canProcessPayments } = useTeacherGatewayStatus(course?.instructor || '');
  
  // Use checkout hook for payment processing
  const { createCheckout } = useCheckout();

  // Debug logs
  console.log('[UnlockCourseDialog] Course:', course);
  console.log('[UnlockCourseDialog] Course data from hook:', courseData);
  console.log('[UnlockCourseDialog] Gateway status:', gatewayStatus);
  console.log('[UnlockCourseDialog] Can process payments:', canProcessPayments);
  console.log('[UnlockCourseDialog] Can purchase conditions:', {
    courseDataExists: !!courseData,
    courseDataCanPurchase: courseData?.canPurchase,
    canProcessPayments,
    finalCondition: courseData?.canPurchase && canProcessPayments
  });

  if (!course) return null;

  const handlePurchaseCourse = async () => {
    if (!courseData?.canPurchase || !courseData?.price) return;
    
    setIsProcessingPayment(true);
    
    try {
      const checkoutData = await createCheckout([{
        type: 'course',
        id: course.id,
        course_id: course.id,
        title: course.title,
        price: course.price || 0,
        quantity: 1
      }]);

      if (checkoutData?.checkout_url) {
        openExternalLink(checkoutData.checkout_url);
        toast.success("Redirecionando para pagamento...");
        onClose();
      } else {
        throw new Error('URL de checkout não encontrada');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Dialog open={!!course} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Curso Premium - Compra Automática
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Cover */}
          <div 
            className="aspect-video rounded-lg bg-cover bg-center relative overflow-hidden"
            style={{ 
              backgroundImage: course.thumbnail 
                ? `url(${course.thumbnail})` 
                : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium">Conteúdo Premium</p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground text-lg">{course.title}</h3>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Premium
              </Badge>
            </div>
            
            {course.description && (
              <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {course.total_lessons && (
                <span>{course.total_lessons} aulas</span>
              )}
              {course.price && (
                <span className="font-medium text-primary">
                  R$ {course.price.toFixed(2)}
                </span>
              )}
              {gatewayStatus.gateway_type && canProcessPayments && (
                <span className="text-green-600 font-medium">
                  {gatewayStatus.gateway_type === 'mercadopago' && 'Mercado Pago'}
                  {gatewayStatus.gateway_type === 'stripe' && 'Stripe'}
                  {gatewayStatus.gateway_type === 'pagseguro' && 'PagSeguro'}
                  {gatewayStatus.gateway_type === 'asaas' && 'Asaas'}
                </span>
              )}
            </div>
          </div>

          {/* Purchase System */}
          {courseData?.canPurchase && canProcessPayments ? (
            <>
              {/* Purchase Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Acesso Imediato</h4>
                </div>
                <p className="text-sm text-green-700">
                  Compre agora e tenha acesso <strong>instantâneo</strong> ao curso completo. Sistema 100% automático!
                </p>
              </div>

              {/* Purchase Button */}
              <Button 
                onClick={handlePurchaseCourse}
                disabled={isProcessingPayment}
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-base font-semibold shadow-lg"
              >
                {isProcessingPayment ? (
                  "Processando Pagamento..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-3" />
                    Comprar Agora - R$ {courseData?.price?.toFixed(2)}
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">Compra Indisponível</h4>
              </div>
              <p className="text-sm text-amber-700">
                O sistema de pagamento não está configurado pelo instrutor. Entre em contato para mais informações.
              </p>
            </div>
          )}

          {/* Close Button */}
          <Button 
            onClick={onClose}
            variant="outline" 
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};