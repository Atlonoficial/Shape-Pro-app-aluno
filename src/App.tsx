import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { GamificationIntegrator } from "@/components/gamification/GamificationIntegrator";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
// Core application imports ready for production
import NotFound from "./pages/NotFound";
import { AuthConfirm } from "./pages/auth/AuthConfirm";
import { AuthRecovery } from "./pages/auth/AuthRecovery";
import { AuthInvite } from "./pages/auth/AuthInvite";
import { AuthMagicLink } from "./pages/auth/AuthMagicLink";
import { AuthChangeEmail } from "./pages/auth/AuthChangeEmail";
import { AuthError } from "./pages/auth/AuthError";
import { Anamnese } from "./pages/Anamnese";
import Configuracoes from "./pages/Configuracoes";
import ContaSeguranca from "./pages/ContaSeguranca";
import AssinaturasPlanos from "./pages/AssinaturasPlanos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import { IniciarTreino } from "./pages/IniciarTreino";
import { RegistrarRefeicao } from "./pages/RegistrarRefeicao";
import Agenda from "./pages/Agenda";
import { Metas } from "./pages/Metas";
import { ResetPassword } from "./pages/ResetPassword";
import { ExamesMedicos } from "./pages/ExamesMedicos";
import { FotosProgresso } from "./pages/FotosProgresso";
import { AvaliacoesFisicas } from "./pages/AvaliacoesFisicas";
import { AuthVerify } from "./pages/AuthVerify";
import { AuthVerified } from "./pages/AuthVerified";
import CadastroCompleto from "./pages/CadastroCompleto";
import Recompensas from "./pages/Recompensas";
import Chat from "./pages/Chat";
import DashboardProfessor from "./pages/DashboardProfessor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes (era cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <GamificationProvider>
                <GamificationIntegrator>
                  <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cadastro-completo" element={<AuthGuard><CadastroCompleto /></AuthGuard>} />
                <Route path="/anamnese" element={<AuthGuard><Anamnese /></AuthGuard>} />
                <Route path="/exames-medicos" element={<AuthGuard><ExamesMedicos /></AuthGuard>} />
                <Route path="/fotos-progresso" element={<AuthGuard><FotosProgresso /></AuthGuard>} />
                <Route path="/avaliacoes-fisicas" element={<AuthGuard><AvaliacoesFisicas /></AuthGuard>} />
                <Route path="/configuracoes" element={<AuthGuard><Configuracoes /></AuthGuard>} />
                <Route path="/conta-seguranca" element={<AuthGuard><ContaSeguranca /></AuthGuard>} />
                <Route path="/assinaturas-planos" element={<AuthGuard><AssinaturasPlanos /></AuthGuard>} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/iniciar-treino" element={<AuthGuard><IniciarTreino /></AuthGuard>} />
                <Route path="/registrar-refeicao" element={<AuthGuard><RegistrarRefeicao /></AuthGuard>} />
                <Route path="/agenda" element={<AuthGuard><Agenda /></AuthGuard>} />
                <Route path="/metas" element={<AuthGuard><Metas /></AuthGuard>} />
                <Route path="/recompensas" element={<AuthGuard><Recompensas /></AuthGuard>} />
                <Route path="/chat" element={<AuthGuard><Chat /></AuthGuard>} />
                <Route path="/dashboard-professor" element={<AuthGuard><DashboardProfessor /></AuthGuard>} />
                
                {/* Authentication Routes */}
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/auth/recovery" element={<AuthRecovery />} />
                <Route path="/auth/invite" element={<AuthInvite />} />
                <Route path="/auth/magic-link" element={<AuthMagicLink />} />
                <Route path="/auth/change-email" element={<AuthChangeEmail />} />
                <Route path="/auth/error" element={<AuthError />} />
                <Route path="/auth/verify" element={<AuthVerify />} />
                <Route path="/auth/verified" element={<AuthVerified />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                <Route path="*" element={<NotFound />} />
                  </Routes>
                </GamificationIntegrator>
              </GamificationProvider>
            </AuthProvider>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;