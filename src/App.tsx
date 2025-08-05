import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PushNotificationsWrapper } from "@/components/notifications/PushNotificationsWrapper";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CadastroCompleto } from "./pages/CadastroCompleto";
import { ExamesMedicos } from "./pages/ExamesMedicos";
import { FotosProgresso } from "./pages/FotosProgresso";
import { AvaliacoesFisicas } from "./pages/AvaliacoesFisicas";
import { Anamnese } from "./pages/Anamnese";
import Configuracoes from "./pages/Configuracoes";
import ContaSeguranca from "./pages/ContaSeguranca";
import AssinaturasPlanos from "./pages/AssinaturasPlanos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import { IniciarTreino } from "./pages/IniciarTreino";
import { RegistrarRefeicao } from "./pages/RegistrarRefeicao";
import { Agenda } from "./pages/Agenda";
import { Metas } from "./pages/Metas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <PushNotificationsWrapper />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cadastro-completo" element={<CadastroCompleto />} />
            <Route path="/exames-medicos" element={<ExamesMedicos />} />
            <Route path="/fotos-progresso" element={<FotosProgresso />} />
            <Route path="/avaliacoes-fisicas" element={<AvaliacoesFisicas />} />
            <Route path="/anamnese" element={<Anamnese />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/conta-seguranca" element={<ContaSeguranca />} />
            <Route path="/assinaturas-planos" element={<AssinaturasPlanos />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/iniciar-treino" element={<IniciarTreino />} />
            <Route path="/registrar-refeicao" element={<RegistrarRefeicao />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/metas" element={<Metas />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
