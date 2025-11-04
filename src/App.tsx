import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TermsGuard } from "@/components/auth/TermsGuard";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { GamificationIntegrator } from "@/components/gamification/GamificationIntegrator";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { NativeIntegration } from "@/components/native/NativeIntegration";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
// Core application imports ready for production
import NotFound from "./pages/NotFound";
import { AuthConfirm } from "./pages/auth/AuthConfirm";
import { AuthRecovery } from "./pages/auth/AuthRecovery";
import { AuthInvite } from "./pages/auth/AuthInvite";
import { AuthMagicLink } from "./pages/auth/AuthMagicLink";
import { AuthChangeEmail } from "./pages/auth/AuthChangeEmail";
import { AuthError } from "./pages/auth/AuthError";
import { AcceptTerms } from "./pages/AcceptTerms";
import { Anamnese } from "./pages/Anamnese";
import { LoadingScreen } from "@/components/auth/LoadingScreen";
import Configuracoes from "./pages/Configuracoes";
import ContaSeguranca from "./pages/ContaSeguranca";
import AssinaturasPlanos from "./pages/AssinaturasPlanos";
import { LazySettings } from "./pages/lazy/LazySettings";
import { LazyAIChat } from "./pages/lazy/LazyAIChat";
import { LazyTeacherStudentChat } from "./pages/lazy/LazyTeacherStudentChat";
import { LazyAgenda } from "./pages/lazy/LazyAgenda";
import { LazyMetas } from "./pages/lazy/LazyMetas";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import ConfiguracoesPagamentosDocumentacao from "./pages/ConfiguracoesPagamentosDocumentacao";
import { IniciarTreino } from "./pages/IniciarTreino";
import { RegistrarRefeicao } from "./pages/RegistrarRefeicao";
import Agenda from "./pages/Agenda";
import { Metas } from "./pages/Metas";

import { ExamesMedicos } from "./pages/ExamesMedicos";
import { FotosProgresso } from "./pages/FotosProgresso";
import { AvaliacoesFisicas } from "./pages/AvaliacoesFisicas";
import { AuthVerify } from "./pages/AuthVerify";
import { AuthVerified } from "./pages/AuthVerified";
import CadastroCompleto from "./pages/CadastroCompleto";
import Recompensas from "./pages/Recompensas";
import { EditProfile } from "./pages/teacher/EditProfile";
import DashboardProfessor from "./pages/DashboardProfessor";
import StravaCallback from "./pages/StravaCallback";
import StravaDebug from "./pages/StravaDebug";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes (era cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false, // CRITICAL: Prevent duplicate queries during boot
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

// Componente auxiliar para redirecionar para /auth/confirm preservando query e hash
const RedirectToAuthConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Preservar query params e hash
    const newPath = `/auth/confirm${location.search}${location.hash}`;
    navigate(newPath, { replace: true });
  }, [location, navigate]);
  
  return null; // Não renderiza nada durante o redirect
};

// ✅ BUILD 32.1: AuthenticatedApp - Garante que AuthProvider está pronto antes de GamificationProvider
const AuthenticatedApp = () => {
  return (
    <GamificationProvider>
      <GamificationIntegrator>
        <Routes>
          {/* Public routes (no AuthGuard, no TermsGuard) */}
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/accept-terms" element={<AcceptTerms />} />
          
          {/* Authentication Routes */}
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          
          {/* ✅ Aliases de compatibilidade (redireciona para /auth/confirm) */}
          <Route path="/email/confirm" element={<RedirectToAuthConfirm />} />
          <Route path="/auth/app/confirm.html" element={<RedirectToAuthConfirm />} />
          
          <Route path="/auth/recovery" element={<AuthRecovery />} />
          <Route path="/auth/invite" element={<AuthInvite />} />
          <Route path="/auth/magic-link" element={<AuthMagicLink />} />
          <Route path="/auth/change-email" element={<AuthChangeEmail />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/auth/verify" element={<AuthVerify />} />
          <Route path="/auth/verified" element={<AuthVerified />} />
          
          {/* ✅ BUILD 37: Fallback para variações de URL de confirmação */}
          <Route path="/auth/callback" element={<AuthConfirm />} />
          
          {/* Protected routes (with TermsGuard) */}
          <Route path="/" element={<TermsGuard><Index /></TermsGuard>} />
          <Route path="/cadastro-completo" element={<AuthGuard><TermsGuard><CadastroCompleto /></TermsGuard></AuthGuard>} />
          <Route path="/anamnese" element={<AuthGuard><TermsGuard><Anamnese /></TermsGuard></AuthGuard>} />
          <Route path="/exames-medicos" element={<AuthGuard><TermsGuard><ExamesMedicos /></TermsGuard></AuthGuard>} />
          <Route path="/fotos-progresso" element={<AuthGuard><TermsGuard><FotosProgresso /></TermsGuard></AuthGuard>} />
          <Route path="/avaliacoes-fisicas" element={<AuthGuard><TermsGuard><AvaliacoesFisicas /></TermsGuard></AuthGuard>} />
          <Route path="/configuracoes" element={<AuthGuard><TermsGuard><LazySettings /></TermsGuard></AuthGuard>} />
          <Route path="/configuracoes-pagamentos-documentacao" element={<AuthGuard><TermsGuard><ConfiguracoesPagamentosDocumentacao /></TermsGuard></AuthGuard>} />
          <Route path="/conta-seguranca" element={<AuthGuard><TermsGuard><ContaSeguranca /></TermsGuard></AuthGuard>} />
          <Route path="/assinaturas-planos" element={<AuthGuard><TermsGuard><AssinaturasPlanos /></TermsGuard></AuthGuard>} />
          <Route path="/iniciar-treino" element={<AuthGuard><TermsGuard><IniciarTreino /></TermsGuard></AuthGuard>} />
          <Route path="/registrar-refeicao" element={<AuthGuard><TermsGuard><RegistrarRefeicao /></TermsGuard></AuthGuard>} />
          <Route path="/agenda" element={<AuthGuard><TermsGuard><LazyAgenda /></TermsGuard></AuthGuard>} />
          <Route path="/metas" element={<AuthGuard><TermsGuard><LazyMetas /></TermsGuard></AuthGuard>} />
          <Route path="/recompensas" element={<AuthGuard><TermsGuard><Recompensas /></TermsGuard></AuthGuard>} />
          <Route path="/chat" element={<AuthGuard><TermsGuard><LazyAIChat /></TermsGuard></AuthGuard>} />
          <Route path="/teacher-chat" element={<AuthGuard><TermsGuard><LazyTeacherStudentChat /></TermsGuard></AuthGuard>} />
          <Route path="/dashboard-professor" element={<AuthGuard><TermsGuard><DashboardProfessor /></TermsGuard></AuthGuard>} />
          <Route path="/teacher/edit-profile" element={<AuthGuard><TermsGuard><EditProfile /></TermsGuard></AuthGuard>} />
          <Route path="/strava-callback" element={<StravaCallback />} />
          {import.meta.env.DEV && <Route path="/strava-debug" element={<AuthGuard><StravaDebug /></AuthGuard>} />}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GamificationIntegrator>
    </GamificationProvider>
  );
};

const App = () => {
  return (
  <ErrorBoundary>
    <Suspense fallback={<LoadingScreen />}>
      <SecurityProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <NativeIntegration />
                  <NetworkStatus />
                  <AuthenticatedApp />
                </AuthProvider>
              </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </SecurityProvider>
    </Suspense>
  </ErrorBoundary>
  );
};

export default App;