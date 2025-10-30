import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Settings, Save, AlertCircle, CheckCircle, TestTube, BookOpen } from 'lucide-react';
import { useTeacherPaymentSettings } from '@/hooks/useTeacherPaymentSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const PaymentGatewayConfig = () => {
  const { settings, loading, updateSettings, hasActiveGateway } = useTeacherPaymentSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState<{
    gateway_type: 'mercadopago' | 'pagseguro' | 'asaas' | 'stripe' | '';
    is_active: boolean;
    credentials: Record<string, any>;
    pix_key: string;
    commission_rate: number;
  }>({
    gateway_type: settings?.gateway_type || '',
    is_active: settings?.is_active || false,
    credentials: settings?.credentials || {},
    pix_key: settings?.pix_key || '',
    commission_rate: settings?.commission_rate || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gateway_type) {
      toast({
        title: "Erro",
        description: "Selecione um gateway de pagamento.",
        variant: "destructive"
      });
      return;
    }

    // Validar campos obrigatórios
    if (formData.gateway_type === 'mercadopago') {
      if (!formData.credentials.api_key) {
        toast({
          title: "Erro",
          description: "API Key do Mercado Pago é obrigatória",
          variant: "destructive"
        });
        return;
      }
    } else if (formData.gateway_type === 'stripe') {
      if (!formData.credentials.secret_key) {
        toast({
          title: "Erro",
          description: "Secret Key do Stripe é obrigatória",
          variant: "destructive"
        });
        return;
      }
    }

    const success = await updateSettings({
      ...formData,
      gateway_type: formData.gateway_type as 'mercadopago' | 'pagseguro' | 'asaas' | 'stripe'
    });
    if (success) {
      setTestResult(null);
      toast({
        title: "Sucesso",
        description: "Gateway de pagamento configurado com sucesso!",
      });
    }
  };

  const handleTestCredentials = async () => {
    if (!formData.gateway_type) {
      toast({
        title: "Erro",
        description: "Selecione um gateway primeiro",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-gateway-credentials', {
        body: {
          gateway_type: formData.gateway_type,
          credentials: formData.credentials
        }
      });

      if (error) throw error;

      setTestResult(data);
      
      toast({
        title: data.valid ? "Sucesso" : "Erro",
        description: data.message,
        variant: data.valid ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error testing credentials:', error);
      toast({
        title: "Erro",
        description: "Erro ao testar credenciais",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const updateCredential = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  };

  const renderCredentialsFields = () => {
    switch (formData.gateway_type) {
      case 'mercadopago':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.credentials.api_key || ''}
                onChange={(e) => updateCredential('api_key', e.target.value)}
                placeholder="TEST-6471334101864522-..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public_key">Public Key</Label>
              <Input
                id="public_key"
                value={formData.credentials.public_key || ''}
                onChange={(e) => updateCredential('public_key', e.target.value)}
                placeholder="TEST-..."
              />
            </div>
            <div className="space-y-2">
              <Label>
                <input 
                  type="checkbox" 
                  checked={formData.credentials.is_sandbox || false}
                  onChange={(e) => updateCredential('is_sandbox', e.target.checked.toString())}
                  className="mr-2"
                />
                Ambiente de Teste (Sandbox)
              </Label>
            </div>
          </>
        );
      
      case 'stripe':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key</Label>
              <Input
                id="secret_key"
                type="password"
                value={formData.credentials.secret_key || ''}
                onChange={(e) => updateCredential('secret_key', e.target.value)}
                placeholder="sk_..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishable_key">Publishable Key</Label>
              <Input
                id="publishable_key"
                value={formData.credentials.publishable_key || ''}
                onChange={(e) => updateCredential('publishable_key', e.target.value)}
                placeholder="pk_..."
              />
            </div>
          </>
        );
      
      case 'pagseguro':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.credentials.email || ''}
                onChange={(e) => updateCredential('email', e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="password"
                value={formData.credentials.token || ''}
                onChange={(e) => updateCredential('token', e.target.value)}
                placeholder="Token do PagSeguro"
              />
            </div>
          </>
        );
      
      case 'asaas':
        return (
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.credentials.api_key || ''}
              onChange={(e) => updateCredential('api_key', e.target.value)}
              placeholder="API Key do Asaas"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Gateway de Pagamento</CardTitle>
              <CardDescription>
                Configure seu gateway para vendas automáticas de cursos
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/configuracoes-pagamentos-documentacao')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Documentação
            </Button>
            
            {hasActiveGateway ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo - {settings?.gateway_type?.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Inativo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gateway Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="gateway">Tipo de Gateway</Label>
            <Select 
              value={formData.gateway_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, gateway_type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="pagseguro">PagSeguro</SelectItem>
                <SelectItem value="asaas">Asaas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credentials Fields */}
          {formData.gateway_type && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Credenciais do Gateway</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestCredentials}
                  disabled={testing}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>
              {renderCredentialsFields()}
              
              {testResult && (
                <div className={`p-3 rounded-lg border ${
                  testResult.valid 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="text-sm font-medium">
                    {testResult.valid ? '✅ ' : '❌ '}{testResult.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PIX Key */}
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX (Opcional)</Label>
            <Input
              id="pix_key"
              value={formData.pix_key}
              onChange={(e) => setFormData(prev => ({ ...prev, pix_key: e.target.value }))}
              placeholder="Sua chave PIX"
            />
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commission">Taxa de Comissão (%)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.commission_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
            />
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Ativar Gateway</h4>
              <p className="text-sm text-muted-foreground">
                Permitir vendas automáticas através do gateway configurado
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
          
          {/* Status Information */}
          {hasActiveGateway && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Gateway Ativo</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Tipo: {settings?.gateway_type?.toUpperCase()}</p>
                <p>• Credenciais: Configuradas</p>
                {settings?.commission_rate && (
                  <p>• Taxa: {settings.commission_rate}%</p>
                )}
                {settings?.pix_key && (
                  <p>• PIX: Configurado</p>
                )}
                <p className="mt-2 font-medium">Vendas automáticas de cursos estão ativas!</p>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};