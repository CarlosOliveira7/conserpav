import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import PageTransition from "./components/PageTransition";
import ToastStack from "./components/ToastStack";
import BackToTop from "./components/BackToTop";
import { LoadingScreen, ErrorScreen } from "./components/StatusScreen";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ObrasPage from "./pages/ObrasPage";
import ChamadaPage from "./pages/ChamadaPage";
import EquipePage from "./pages/EquipePage";
import RelatoriosPage from "./pages/RelatoriosPage";
import GastosPage from "./pages/GastosPage";
import TemaPage from "./pages/TemaPage";

// ALTERAÇÃO: App.jsx foi reescrito por completo. Antes era uma página única
// com tudo empilhado verticalmente (Header + ManagementPanel + SummaryCards
// + AttendanceTable + ReportPanel, tudo junto). Agora o app é dividido em
// 5 páginas de verdade (rotas), com uma barra de navegação fixa embaixo
// (BottomNav) — assim o usuário pula direto pro que precisa, sem rolar uma
// tela gigante no celular procurando a seção certa.
export default function App() {
  const { initialLoading, loadError } = useApp();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Se está carregando a autenticação, mostra tela de carregamento
  if (authLoading) {
    return (
      <div className="app-shell">
        <LoadingScreen />
      </div>
    );
  }

  // Se não está autenticado, mostra login
  if (!isAuthenticated) {
    const isRecoverPage = new URLSearchParams(window.location.search).get("recover") === "true";
    if (isRecoverPage) {
      return <ForgotPasswordPage />;
    }
    return <LoginPage />;
  }

  // Usuário está autenticado, verifica se o app está carregando os dados
  if (initialLoading) {
    return (
      <div className="app-shell">
        <AppHeader />
        <LoadingScreen />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <AppHeader />
        <ErrorScreen message={loadError} />
      </div>
    );
  }

  return (
    <>
      <div className="app-shell">
        {/* ALTERAÇÃO: barra de topo nova, com a logo da Conserpav — ver
            components/AppHeader.jsx. Fica visível em qualquer tela. */}
        <AppHeader />
        <main className="app-main">
          <div className="scroll-top-sentinel" aria-hidden="true" />
          <Routes>
            {/* ALTERAÇÃO: PageTransition é usado como rota "layout" (elemento
                pai) — ela chama useOutlet() por dentro para pegar a página
                filha que casou com a URL e renderizá-la com transição de
                fade/slide, em vez de trocar a tela seca. Ver
                components/PageTransition.jsx. */}
            <Route element={<PageTransition />}>
              {/* Obras is the app's entry page, matching the reference V2. */}
              <Route path="/" element={<Navigate to="/obras" replace />} />
              <Route path="/obras" element={<ObrasPage />} />
              <Route path="/chamada" element={<ChamadaPage />} />
              <Route path="/equipe" element={<EquipePage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/gastos" element={<GastosPage />} />
              <Route path="/tema" element={<TemaPage />} />
              <Route path="/login" element={<Navigate to="/obras" replace />} />
              <Route path="*" element={<Navigate to="/obras" replace />} />
            </Route>
          </Routes>
        </main>
      </div>

      <BottomNav />
      <BackToTop />
      <ToastStack />
    </>
  );
}
