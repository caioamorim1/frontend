import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getHospitalById, Hospital } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { HospitalHeader } from "@/components/shared/HospitalHeader";
import {
  Building2,
  Users,
  ChartBar,
  FileText,
  Settings,
  Bed,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentPage {
  title: string;
  icon: string; // nome do ícone
  href: string;
  timestamp: number;
}

export default function HospitalHomePage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // Determina qual ID de hospital usar: da URL ou do token do usuário
  const effectiveHospitalId = hospitalId || user?.hospital?.id;
  // Define o prefixo da rota baseado no tipo de usuário
  const routePrefix = hospitalId ? `/hospital/${hospitalId}` : "/meu-hospital";

  useEffect(() => {
    const fetchHospital = async () => {
      if (!effectiveHospitalId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getHospitalById(effectiveHospitalId);
        setHospital(data);
      } catch (error) {
        console.error("Erro ao carregar hospital:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [effectiveHospitalId]);

  // Carrega as páginas recentes do localStorage ou define páginas padrão
  useEffect(() => {
    if (!effectiveHospitalId) return;

    const loadRecentPages = () => {
      const storageKey = `recentPages_${effectiveHospitalId}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentPages(parsed);
        } catch (error) {
          // Se houver erro, define páginas padrão
          const defaultPages: RecentPage[] = [
            {
              title: "Dashboard",
              icon: "ChartBar",
              href: `${routePrefix}/dashboard`,
              timestamp: Date.now(),
            },
            {
              title: "Setores",
              icon: "Building2",
              href: `${routePrefix}/setores`,
              timestamp: Date.now() - 1000,
            },
            {
              title: "Unidades e Leitos",
              icon: "Bed",
              href: `${routePrefix}/unidades-leitos`,
              timestamp: Date.now() - 2000,
            },
            {
              title: "Baseline",
              icon: "FileText",
              href: `${routePrefix}/baseline`,
              timestamp: Date.now() - 3000,
            },
            {
              title: "Pareto",
              icon: "ClipboardList",
              href: `${routePrefix}/pareto`,
              timestamp: Date.now() - 4000,
            },
          ];
          console.log(
            "⚠️ [HospitalHomePage] Usando páginas padrão (erro):",
            defaultPages
          );
          setRecentPages(defaultPages);
          localStorage.setItem(storageKey, JSON.stringify(defaultPages));
        }
      } else {
        // Páginas padrão sugeridas
        const defaultPages: RecentPage[] = [
          {
            title: "Dashboard",
            icon: "ChartBar",
            href: `${routePrefix}/dashboard`,
            timestamp: Date.now(),
          },
          {
            title: "Setores",
            icon: "Building2",
            href: `${routePrefix}/setores`,
            timestamp: Date.now() - 1000,
          },
          {
            title: "Unidades e Leitos",
            icon: "Bed",
            href: `${routePrefix}/unidades-leitos`,
            timestamp: Date.now() - 2000,
          },
          {
            title: "Baseline",
            icon: "FileText",
            href: `${routePrefix}/baseline`,
            timestamp: Date.now() - 3000,
          },
          {
            title: "Pareto",
            icon: "ClipboardList",
            href: `${routePrefix}/pareto`,
            timestamp: Date.now() - 4000,
          },
        ];
        setRecentPages(defaultPages);
        localStorage.setItem(storageKey, JSON.stringify(defaultPages));
      }
    };

    // Carrega inicialmente
    loadRecentPages();

    // Escuta evento de atualização do HospitalLayout
    const handleRecentPagesUpdate = (event: any) => {
      if (event.detail.hospitalId === effectiveHospitalId) {
        setRecentPages(event.detail.pages);
      }
    };

    window.addEventListener("recentPagesUpdated", handleRecentPagesUpdate);

    return () => {
      window.removeEventListener("recentPagesUpdated", handleRecentPagesUpdate);
    };
  }, [effectiveHospitalId, routePrefix]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <HospitalHeader
        hospitalName={hospital?.nome}
        hospitalPhoto={hospital?.foto}
        userName={user?.nome}
      />

      {/* Recentes Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Páginas Recentes:
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentPages.map((page, index) => {
            const iconMap: Record<string, React.ReactNode> = {
              ChartBar: <ChartBar className="h-6 w-6" />,
              Building2: <Building2 className="h-6 w-6" />,
              Bed: <Bed className="h-6 w-6" />,
              FileText: <FileText className="h-6 w-6" />,
              ClipboardList: <ClipboardList className="h-6 w-6" />,
              Users: <Users className="h-6 w-6" />,
              Settings: <Settings className="h-6 w-6" />,
            };
            return (
              <Link key={index} to={page.href}>
                <Card className="aspect-square hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center h-full p-4 gap-3">
                    <div className="text-primary">{iconMap[page.icon]}</div>
                    <div className="text-center text-sm font-medium text-gray-700">
                      {page.title}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
