import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Key, Shield, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConfiguracoesPagamentosDocumentacao() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/configuracoes?tab=pagamentos')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Configurações
      </Button>

      <div>
        <h1 className="text-3xl font-bold mb-2">Documentação - Sistema de Pagamentos</h1>
        <p className="text-muted-foreground">
          Guia completo para configurar seu gateway de pagamento e começar a vender cursos
        </p>
      </div>

      {/* Mercado Pago */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Mercado Pago</CardTitle>
              <CardDescription>Como obter suas credenciais do Mercado Pago</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Passo a Passo</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Acesse o Painel de Desenvolvedores do Mercado Pago</li>
              <li>Faça login com sua conta Mercado Pago</li>
              <li>No menu lateral, clique em "Suas integrações"</li>
              <li>Crie uma nova aplicação ou selecione uma existente</li>
              <li>Clique em "Credenciais de produção" ou "Credenciais de teste"</li>
              <li>Copie sua "Access Token" (API Key)</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Key className="w-4 h-4" />
              Credenciais Necessárias
            </h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">api_key</span>
                <span className="text-sm text-muted-foreground">
                  - Token de acesso (começa com TEST- ou APP-)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">public_key</span>
                <span className="text-sm text-muted-foreground">
                  - Chave pública (opcional, para checkout transparente)
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Ambiente de Teste vs Produção
            </h4>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                <strong>Teste:</strong> Use credenciais que começam com "TEST-" para testar sem cobranças reais.
              </p>
              <p>
                <strong>Produção:</strong> Use credenciais que começam com "APP-" para processar pagamentos reais.
              </p>
              <p className="mt-2">
                ⚠️ Sempre teste primeiro com credenciais de teste antes de ativar em produção!
              </p>
            </div>
          </div>

          <Button asChild className="w-full">
            <a 
              href="https://www.mercadopago.com.br/developers/panel" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Acessar Painel do Mercado Pago
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Stripe</CardTitle>
              <CardDescription>Como obter suas credenciais do Stripe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Passo a Passo</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Acesse o Dashboard do Stripe</li>
              <li>Faça login com sua conta Stripe</li>
              <li>No menu superior direito, ative o "Modo de teste" ou "Modo de produção"</li>
              <li>Clique em "Developers" no menu superior</li>
              <li>Clique em "API keys"</li>
              <li>Copie sua "Secret key" e "Publishable key"</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Key className="w-4 h-4" />
              Credenciais Necessárias
            </h4>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">secret_key</span>
                <span className="text-sm text-muted-foreground">
                  - Chave secreta (sk_test_... ou sk_live_...)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">publishable_key</span>
                <span className="text-sm text-muted-foreground">
                  - Chave pública (pk_test_... ou pk_live_...)
                </span>
              </li>
            </ul>
          </div>

          <Button asChild className="w-full">
            <a 
              href="https://dashboard.stripe.com/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Acessar Dashboard do Stripe
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle>Segurança das Credenciais</CardTitle>
              <CardDescription>Boas práticas para proteger suas informações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm">✅ <strong>Faça:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Use sempre o botão "Testar Conexão" antes de salvar</li>
              <li>Mantenha suas credenciais em local seguro</li>
              <li>Use credenciais de teste durante desenvolvimento</li>
              <li>Ative autenticação de dois fatores nas contas dos gateways</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm">❌ <strong>Não Faça:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Compartilhe suas credenciais com terceiros</li>
              <li>Use credenciais de produção em ambientes de teste</li>
              <li>Salve credenciais em arquivos não criptografados</li>
              <li>Deixe credenciais expostas em repositórios públicos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Como sei se minhas credenciais estão corretas?</h4>
            <p className="text-sm text-muted-foreground">
              Use o botão "Testar Conexão" na página de configurações. Ele validará suas credenciais diretamente com o gateway.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Posso usar múltiplos gateways ao mesmo tempo?</h4>
            <p className="text-sm text-muted-foreground">
              Atualmente, apenas um gateway pode estar ativo por vez. Você pode alternar entre eles a qualquer momento.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">O que acontece se minhas credenciais expirarem?</h4>
            <p className="text-sm text-muted-foreground">
              As vendas serão interrompidas automaticamente. Você receberá uma notificação e precisará atualizar as credenciais.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Como funciona a taxa de comissão?</h4>
            <p className="text-sm text-muted-foreground">
              A taxa configurada é apenas informativa para seu controle. As taxas oficiais dos gateways são cobradas separadamente por cada plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
