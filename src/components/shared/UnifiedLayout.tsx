// ...existing code...
import { useContext, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../contexts/AuthContext";

interface RecentPage {
  title: string;
  icon: string;
  href: string;
  timestamp: number;
}

export default function UnifiedLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/login");
    }
  };

  // Rastreia páginas visitadas
  useEffect(() => {
    const effectiveHospitalId = user?.hospital?.id;

    if (!effectiveHospitalId) {
      return;
    }

    // Ignora apenas a rota home
    if (location.pathname.endsWith("/home")) {
      return;
    }

    const pageMap: Record<string, { title: string; icon: string }> = {
      dashboard: { title: "Dashboard", icon: "ChartBar" },
      setores: { title: "Setores", icon: "Building2" },
      "unidades-leitos": { title: "Unidades e Leitos", icon: "Bed" },
      baseline: { title: "Baseline", icon: "FileText" },
      usuarios: { title: "Usuários", icon: "Users" },
      pareto: { title: "Pareto", icon: "ClipboardList" },
      "gerir-setores": { title: "Gerir Setores", icon: "Settings" },
      cargos: { title: "Cargos", icon: "Users" },
    };

    const pathSegments = location.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (pageMap[lastSegment]) {
      const newPage: RecentPage = {
        ...pageMap[lastSegment],
        href: location.pathname,
        timestamp: Date.now(),
      };

      const storageKey = `recentPages_${effectiveHospitalId}`;
      const stored = localStorage.getItem(storageKey);
      let recent: RecentPage[] = [];

      if (stored) {
        try {
          recent = JSON.parse(stored);
        } catch (error) {
          // Ignora erro de parsing
        }
      }

      recent = recent.filter((p) => p.href !== newPage.href);
      recent.unshift(newPage);
      recent = recent.slice(0, 5);

      localStorage.setItem(storageKey, JSON.stringify(recent));

      window.dispatchEvent(
        new CustomEvent("recentPagesUpdated", {
          detail: { hospitalId: effectiveHospitalId, pages: recent },
        })
      );
    }
  }, [location.pathname, user]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end px-6 py-3 border-b bg-white">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 rounded bg-rose-600 text-white text-sm hover:bg-rose-700"
            title="Sair"
          >
            Sair
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
// ...existing code...
