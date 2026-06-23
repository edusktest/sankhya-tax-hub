import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Home from "./pages/Home";
import ApuracaoCBS from "./pages/ApuracaoCBS";
import ApuracaoDetalhe from "./pages/ApuracaoDetalhe";
import ApuracaoDere from "./pages/ApuracaoDere";
import ConfigEmpresasPage from "./pages/ConfigEmpresasPage";
import TributacaoIntegralPage from "./pages/TributacaoIntegralPage";
import TributacaoPersonalizadaWizard from "./pages/TributacaoPersonalizadaWizard";
import TabelaOficialPage from "./pages/TabelaOficialPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import AssistenteExcecoesPage from "./pages/AssistenteExcecoesPage";
import MovimentacoesReceitasMovimento from "./pages/MovimentacoesReceitasMovimento";
import MovimentacoesReceitasMultaJuros from "./pages/MovimentacoesReceitasMultaJuros";
import MovimentacoesDespedasMovimento from "./pages/MovimentacoesDespedasMovimento";
import MovimentacoesDocumentosMovimento from "./pages/MovimentacoesDocumentosMovimento";
import ConciliacaoFiscal from "./pages/ConciliacaoFiscal";
import NotFound from "./pages/NotFound";
import { ERoutes } from "@/routes/interface";

// Para integrar ao Sankhya, substituir BrowserRouter por createMemoryRouter e
// envolver o conteúdo com SnkApplication:
//
// import { useRef, useState } from "react";
// import { setSnkApp } from "@/utils/getSnkApp";
//
// const appRef = useRef();
// <SnkApplication ref={appRef} onApplicationLoaded={() => setSnkApp(appRef.current)}>
//   ...
// </SnkApplication>

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path={ERoutes.INDEX} element={<Navigate to={ERoutes.HOME} replace />} />
            <Route path={ERoutes.HOME} element={<Home />} />
            <Route path={ERoutes.APURACAO_CBS} element={<ApuracaoCBS />} />
            <Route path={ERoutes.APURACAO_CBS_DETALHE} element={<ApuracaoDetalhe />} />
            <Route path={ERoutes.APURACAO_IBS} element={<PlaceholderPage />} />
            <Route path={ERoutes.APURACAO_IS} element={<PlaceholderPage />} />
            <Route path={ERoutes.APURACAO_DERE} element={<ApuracaoDere />} />
            <Route path={ERoutes.APURACAO_DERE_PLANO_REF} element={<ApuracaoDere initialScreen="plano-ref" />} />
            <Route path={ERoutes.APURACAO_DERE_D1001} element={<ApuracaoDere initialScreen="d1001-list" />} />
            <Route path={ERoutes.APURACAO_DERE_D1011} element={<ApuracaoDere initialScreen="d1011-list" />} />
            <Route path={ERoutes.APURACAO_DERE_HISTORICO} element={<ApuracaoDere initialScreen="historico" />} />
            <Route path={ERoutes.GESTAO_EVENTOS} element={<PlaceholderPage />} />
            <Route path={ERoutes.PROCESSOS} element={<PlaceholderPage />} />
            <Route path={ERoutes.FINANCEIRO} element={<PlaceholderPage />} />
            <Route path={ERoutes.TRIBUTACAO_INTEGRAL} element={<TributacaoIntegralPage />} />
            <Route path={ERoutes.TRIBUTACAO_PERSONALIZADA} element={<TributacaoPersonalizadaWizard />} />
            <Route path={ERoutes.CONFIG_ASSISTENTE_EXCECOES} element={<AssistenteExcecoesPage />} />
            <Route path={ERoutes.CONFIG_EMPRESAS} element={<ConfigEmpresasPage />} />
            <Route path={ERoutes.CONFIG_ALIQUOTAS_CBS} element={<PlaceholderPage />} />
            <Route path={ERoutes.CONFIG_ALIQUOTAS_IBS} element={<PlaceholderPage />} />
            <Route path={ERoutes.CONFIG_ALIQUOTAS_IS} element={<PlaceholderPage />} />
            <Route path={ERoutes.CONFIG_TABELAS_CLASSIFICACAO} element={<TabelaOficialPage />} />
            <Route path={ERoutes.CONFIG_TABELAS_CREDITO_PRESUMIDO} element={<TabelaOficialPage />} />
            <Route path={ERoutes.CONFIG_TABELAS_ANEXOS} element={<TabelaOficialPage />} />
            <Route path={ERoutes.CONFIG_TABELAS_INDICADORES} element={<TabelaOficialPage />} />
            <Route path={ERoutes.DIGITAL_WORKERS_CONFIG_GLOBAL} element={<PlaceholderPage />} />
            <Route path={ERoutes.DIGITAL_WORKERS_CONFIG_WORKER} element={<PlaceholderPage />} />
            <Route path={ERoutes.MOVIMENTACOES_RECEITAS_MOVIMENTO} element={<MovimentacoesReceitasMovimento />} />
            <Route path={ERoutes.MOVIMENTACOES_RECEITAS_MULTA_JUROS} element={<MovimentacoesReceitasMultaJuros />} />
            <Route path={ERoutes.MOVIMENTACOES_DESPESAS_MOVIMENTO} element={<MovimentacoesDespedasMovimento />} />
            <Route path={ERoutes.MOVIMENTACOES_DOCUMENTOS_MOVIMENTO} element={<MovimentacoesDocumentosMovimento />} />
            <Route path={ERoutes.APURACAO_CONCILIACAO_FISCAL} element={<ConciliacaoFiscal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
