import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import ApuracaoCBS from "./pages/ApuracaoCBS";
import ApuracaoDetalhe from "./pages/ApuracaoDetalhe";
import ApuracaoDere from "./pages/ApuracaoDere";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/apuracao-cbs" replace />} />
            <Route path="/apuracao-cbs" element={<ApuracaoCBS />} />
            <Route path="/apuracao-cbs/:id" element={<ApuracaoDetalhe />} />
            <Route path="/apuracao-ibs" element={<PlaceholderPage />} />
            <Route path="/apuracao-is" element={<PlaceholderPage />} />
            <Route path="/apuracao-dere" element={<ApuracaoDere />} />
            <Route path="/gestao-eventos" element={<PlaceholderPage />} />
            <Route path="/processos" element={<PlaceholderPage />} />
            <Route path="/financeiro" element={<PlaceholderPage />} />
            <Route
              path="/tributacao-integral"
              element={<PlaceholderPage />}
            />
            <Route
              path="/tributacao-personalizada"
              element={<PlaceholderPage />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
