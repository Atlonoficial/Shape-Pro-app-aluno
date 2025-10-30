import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * BUILD 35: Email System Debug Component
 * 
 * Componente para testar o sistema de emails do Supabase
 * Útil para diagnosticar problemas com templates de email
 */
export const EmailDebug = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testEmailTemplate = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "❌ Email inválido",
        description: "Por favor, insira um email válido para teste.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('[EmailDebug] 📧 Testando envio de email para:', email);
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        console.error('[EmailDebug] ❌ Erro ao enviar email:', error);
        setResult({ 
          success: false, 
          error: error.message,
          errorCode: error.status,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "❌ Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('[EmailDebug] ✅ Email enviado com sucesso:', data);
        setResult({ 
          success: true, 
          data,
          message: 'Email enviado com sucesso! Verifique a caixa de entrada.',
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "✅ Email enviado",
          description: "Verifique a caixa de entrada e spam.",
        });
      }
    } catch (err: any) {
      console.error('[EmailDebug] ❌ Exceção ao testar email:', err);
      setResult({ 
        success: false, 
        error: err.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "❌ Erro inesperado",
        description: err.message || 'Erro ao processar solicitação',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-background-secondary border-border-subtle">
      <div>
        <h3 className="font-bold text-lg mb-1">🔧 Email System Debug</h3>
        <p className="text-xs text-muted-foreground">
          Ferramenta para testar o envio de emails de verificação
        </p>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Email para teste
          </label>
          <Input
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="bg-background"
          />
        </div>
        
        <Button 
          onClick={testEmailTemplate}
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? '⏳ Enviando...' : '📧 Testar Envio de Email'}
        </Button>
      </div>
      
      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Resultado:</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              result.success 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {result.success ? '✅ Sucesso' : '❌ Erro'}
            </span>
          </div>
          
          <pre className="text-xs bg-black/50 p-3 rounded-lg overflow-auto max-h-[300px] font-mono border border-border-subtle">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {!result.success && result.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 font-medium mb-1">
                ⚠️ Possíveis causas:
              </p>
              <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
                <li>Template de email com erros (função <code>date</code> inválida)</li>
                <li>Rate limit excedido (muitas tentativas)</li>
                <li>Email não cadastrado no sistema</li>
                <li>Configuração de SMTP incorreta</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
