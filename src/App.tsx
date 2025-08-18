import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PushNotificationsWrapper } from "@/components/notifications/PushNotificationsWrapper";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
// Removed Firebase-dependent pages
// import Login from "./pages/login";
// import AlunoDashboard from "./pages/aluno/dashboard";
// import AlunoChat from "./pages/aluno/chat/[id]";
// import { CadastroCompleto } from "./pages/CadastroCompleto";
// import { ExamesMedicos } from "./pages/ExamesMedicos";
// import { FotosProgresso } from "./pages/FotosProgresso";
// import { AvaliacoesFisicas } from "./pages/AvaliacoesFisicas";
import NotFound from "./pages/NotFound";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PushNotificationsWrapper />
            <Routes>
              <Route path="/" element={<Index />} />
              {/* <Route path="/login" element={<Login />} /> */}
              {/* <Route path="/aluno/dashboard" element={<AlunoDashboard />} /> */}
              {/* <Route path="/aluno/chat/:id" element={<AlunoChat />} /> */}
              {/* <Route path="/cadastro-completo" element={<CadastroCompleto />} /> */}
              {/* <Route path="/exames-medicos" element={<ExamesMedicos />} /> */}
              {/* <Route path="/fotos-progresso" element={<FotosProgresso />} /> */}
              {/* <Route path="/avaliacoes-fisicas" element={<AvaliacoesFisicas />} /> */}
              <Route path="/cadastro-completo" element={<CadastroCompleto />} />
              <Route path="/anamnese" element={<Anamnese />} />
              <Route path="/exames-medicos" element={<ExamesMedicos />} />
              <Route path="/fotos-progresso" element={<FotosProgresso />} />
              <Route path="/avaliacoes-fisicas" element={<AvaliacoesFisicas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/conta-seguranca" element={<ContaSeguranca />} />
              <Route path="/assinaturas-planos" element={<AssinaturasPlanos />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/iniciar-treino" element={<IniciarTreino />} />
              <Route path="/registrar-refeicao" element={<RegistrarRefeicao />} />
              <Route path="/agenda" element={
                <AuthGuard>
                  <Agenda />
                </AuthGuard>
              } />
              <Route path="/metas" element={<Metas />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/verify" element={<AuthVerify />} />
              <Route path="/auth/verified" element={<AuthVerified />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
