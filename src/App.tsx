import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Layouts e Páginas
import UnifiedLayout from "./components/shared/UnifiedLayout";
import HospitalAdminLayout from "./features/admin-hospital/components/HospitalAdminLayout";
import HospitaisPage from "./features/admin-global/pages/HospitaisPage";
import RedesPage from "./features/admin-global/pages/RedesPage";
import GruposPage from "./features/admin-global/pages/GruposPage";
import RegioesPage from "./features/admin-global/pages/RegioesPage";
import ScpMetodosPage from "./features/admin-global/pages/ScpMetodosPage";
import SetoresPage from "./features/admin-hospital/pages/SetoresPage";
import SetoresCardPage from "./features/admin-hospital/pages/SetoresCardPage";
import SetorDetailPage from "./features/admin-hospital/pages/SetorDetailPage";
import UsuariosPage from "./features/admin-hospital/pages/UsuariosPage";
import CargosPage from "./features/admin-hospital/pages/CargosPage";
import ParetoPage from "./features/admin-hospital/pages/ParetoPage";
import BaselinePage from "./features/admin-hospital/pages/BaselinePage";
import MinhasUnidadesPage from "./features/colab/pages/MinhasUnidadesPage";
import VisaoLeitosPage from "./features/colab/pages/VisaoLeitosPage";
import AvaliacaoScpPage from "./features/colab/pages/AvaliacaoScpPage";
import LeitosAdminPage from "./features/admin-hospital/pages/LeitosAdminPage";
import ParametrosPage from "./features/admin-hospital/pages/ParametrosPage";
import HistoricoColetasPage from "./features/admin-hospital/pages/HistoricoColetasPage";
import AdminsPage from "./features/admin-global/pages/AdminsPage";
import HospitalDashboardPage from "./features/colab/pages/DashboardPage";
import GlobalDashboardPage from "./features/admin-global/pages/GlobalDashboardPage";

// NOVOS IMPORTS PARA COLETA
import ColetasPage from "./features/colab/pages/ColetasPage";
import QualitativoPage from "./features/qualitativo/qualitativoPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Todas as rotas daqui para baixo exigem que o utilizador esteja logado */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Rotas do Admin Global */}
        <Route path="/admin" element={<UnifiedLayout />}>
          <Route path="dashboard" element={<GlobalDashboardPage />} />
          <Route path="hospitais" element={<HospitaisPage />} />
          <Route path="redes" element={<RedesPage />} />
          <Route path="grupos" element={<GruposPage />} />
          <Route path="regioes" element={<RegioesPage />} />
          <Route path="scp-metodos" element={<ScpMetodosPage />} />
          <Route path="questionarios" element={<QualitativoPage />} />
          <Route path="admins" element={<AdminsPage />} />
        </Route>

        {/* Rotas de Admin de Hospital */}
        <Route path="/hospital/:hospitalId" element={<HospitalAdminLayout />}>
          <Route path="dashboard" element={<HospitalDashboardPage />} />
          <Route path="unidades-leitos" element={<MinhasUnidadesPage />} />
          <Route path="setores" element={<SetoresCardPage />} />
          <Route path="gerir-setores" element={<SetoresPage />} />
          <Route path="gerir-setores/:setorId" element={<SetorDetailPage />} />
          <Route path="gerir-setores/:setorId/leitos" element={<LeitosAdminPage />} />
          <Route
            path="gerir-setores/:setorId/parametros"
            element={<ParametrosPage />}
          />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="cargos" element={<CargosPage />} />
          <Route path="pareto" element={<ParetoPage />} />
          <Route path="baseline" element={<BaselinePage />} />
          <Route path="coletas" element={<HistoricoColetasPage />} />
        </Route>

        {/* Rotas de Colaborador / Gestor (AGORA DENTRO DO LAYOUT PADRÃO) */}
        <Route element={<UnifiedLayout />}>
          <Route path="/meu-hospital" element={<MinhasUnidadesPage />} />
          <Route
            path="/unidade/:unidadeId/leitos"
            element={<VisaoLeitosPage />}
          />
          <Route
            path="/unidade/:unidadeId/sessao/avaliar"
            element={<AvaliacaoScpPage />}
          />

          {/* ✅ NOVAS ROTAS PARA COLETA DE DADOS */}
          <Route path="/coletas" element={<ColetasPage />} />
        </Route>

        {/* Redirecionamento principal: se logado, vai para o painel de admin */}
        <Route path="/" element={<Navigate to="/admin/hospitais" />} />
      </Route>
    </Routes>
  );
}

export default App;
