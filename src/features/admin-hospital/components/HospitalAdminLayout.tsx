import { Outlet, useLocation, useParams } from "react-router-dom";
import HospitalAdminSidebar from "./HospitalAdminSidebar";
import { useEffect } from "react";

interface RecentPage {
  title: string;
  icon: string;
  href: string;
  timestamp: number;
}

export default function HospitalAdminLayout() {
  const location = useLocation();
  const { hospitalId } = useParams<{ hospitalId: string }>();

  // Rastreia páginas visitadas
  useEffect(() => {
    if (!hospitalId) {
      return;
    }

    if (
      location.pathname.endsWith("/home") ||
      location.pathname === `/hospital/${hospitalId}`
    ) {
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

      const storageKey = `recentPages_${hospitalId}`;
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
          detail: { hospitalId, pages: recent },
        })
      );
    }
  }, [location.pathname, hospitalId]);

  return (
    <div className="flex h-screen bg-slate-50">
      <HospitalAdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
