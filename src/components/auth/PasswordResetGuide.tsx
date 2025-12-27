import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export const PasswordResetGuide = () => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Configuração do Sistema de Email
        </CardTitle>
        <CardDescription>
          Para que o sistema de recuperação de senha funcione corretamente, configure as seguintes opções no Supabase:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">1. Site URL e Redirect URLs</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Configure no painel Authentication → URL Configuration:
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                <p>Site URL: https://seu-dominio.com</p>
                <p>Redirect URLs: https://seu-dominio.com/**</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">2. Membros Autorizados (Temporário)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Para teste, adicione o email em Settings → Team:
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                <p>wolffnataneric@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-semibold">3. SMTP Customizado (Recomendado)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Para produção, configure um provedor SMTP em Authentication → Settings → SMTP:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Resend.com (recomendado)</li>
                <li>• SendGrid</li>
                <li>• Mailgun</li>
                <li>• Amazon SES</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <a 
              href="https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Configurar URLs
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a 
              href="https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/team" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Gerenciar Team
            </a>
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Dica</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            O SMTP padrão do Supabase só envia emails para membros autorizados da equipe. 
            Para enviar emails para qualquer usuário, você precisa configurar um provedor SMTP customizado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};